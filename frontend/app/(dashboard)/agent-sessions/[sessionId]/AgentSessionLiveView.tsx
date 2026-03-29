"use client";

import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { AgentSessionController } from "@/lib/backend/sdk.gen";
import { backendClient } from "@/lib/backend-client";
import type {
  AgentSessionDto,
  AgentMessageDto,
  AgentArtifactDto,
} from "@/lib/backend/types.gen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactActions,
  ArtifactAction,
    ArtifactContent,
} from "@/components/ai-elements/artifact";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Bot,
  DollarSign,
  Download,
  StopCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface AgentSessionLiveViewProps {
  initialSession: AgentSessionDto;
}

const TERMINAL_STATES = ["COMPLETED", "FAILED", "TERMINATED"];
type Snapshot = {
  session?: AgentSessionDto;
  messages?: AgentMessageDto[];
  artifacts?: AgentArtifactDto[];
};

export function AgentSessionLiveView({
  initialSession,
}: AgentSessionLiveViewProps) {
  const [session, setSession] = useState(initialSession);
  const [messages, setMessages] = useState<AgentMessageDto[]>([]);
  const [artifacts, setArtifacts] = useState<AgentArtifactDto[]>([]);
  const [isTerminating, setIsTerminating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = !TERMINAL_STATES.includes(session.state || "");
  const id = session.id || "";

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      const [status, msg, files] = await Promise.all([
        AgentSessionController.status({
          client: backendClient,
          path: { id },
        }),
        AgentSessionController.messages({
          client: backendClient,
          path: { id },
        }),
        AgentSessionController.artifacts({
          client: backendClient,
          path: { id },
        }),
      ]);
      const data = status.data?.data;
      if (data) {
        setSession((prev) => ({
          ...prev,
          state: data.state as string,
          tokenUsage: data.tokenUsage as number,
          cost: data.cost as number,
        }));
      }
      setMessages(msg.data?.data || []);
      setArtifacts(files.data?.data || []);
    } catch {
      // ignore refresh errors
    }
  }, [id]);

  const apply = useCallback((next: Snapshot | null) => {
    if (!next) return;
    if (next.session) setSession(next.session);
    if (next.messages) setMessages(next.messages);
    if (next.artifacts) setArtifacts(next.artifacts);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!id || !isActive) return;
    const ctrl = new AbortController();
    const headers = backendClient.getConfig().headers as
      | Record<string, string>
      | undefined;
    void (async () => {
      try {
        const stream = await backendClient.sse.get({
          url: "/api/agent-sessions/{id}/events",
          path: { id },
          headers,
          signal: ctrl.signal,
          onSseEvent: (event) => {
            if (event.event === "snapshot") apply(asSnapshot(event.data));
          },
          onSseError: () => {
            void refresh();
          },
        });
        for await (const data of stream.stream) {
          const next = asSnapshot(data);
          if (next) apply(next);
        }
      } catch {
        void refresh();
      }
    })();
    return () => {
      ctrl.abort();
    };
  }, [id, isActive, apply, refresh]);

  async function handleSubmit(message: PromptInputMessage) {
    const text = message.text.trim();
    if (!text || !id) return;
    setIsSending(true);
    setError(null);
    try {
      await backendClient.post({
        url: "/api/agent-sessions/{id}/prompt",
        path: { id },
        body: { text, parts: [] },
      });
      await refresh();
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message || err.message || "Failed to send prompt",
        );
      } else {
        setError(err instanceof Error ? err.message : "Failed to send prompt");
      }
    } finally {
      setIsSending(false);
    }
  }

  async function handleTerminate() {
    setIsTerminating(true);
    try {
      const response = await AgentSessionController.terminate({
        client: backendClient,
        path: { id: session.id || "" },
      });
      const updated = response.data?.data;
      if (updated) setSession(updated);
    } catch (err) {
      if (err instanceof AxiosError) {
        console.error("Terminate failed:", err.response?.data?.message);
      }
    } finally {
      setIsTerminating(false);
    }
  }

  async function handleDownloadArtifact(artifactId: string) {
    try {
      const response = await AgentSessionController.downloadArtifact({
        client: backendClient,
        path: { id: session.id || "", artifactId },
      });
      const url = response.data?.data?.url;
      if (url) {
        window.open(url, "_blank");
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        console.error("Download failed:", err.response?.data?.message);
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/agent-sessions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Agent Session</h1>
              <Badge
                variant={
                  session.state === "RUNNING"
                    ? "default"
                    : session.state === "COMPLETED"
                      ? "secondary"
                      : session.state === "FAILED" ||
                          session.state === "TERMINATED"
                        ? "destructive"
                        : "outline"
                }
              >
                {session.state}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {session.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" />
              {(session.tokenUsage || 0).toLocaleString()} tokens
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {(session.cost || 0).toFixed(4)}
            </span>
          </div>
          {isActive && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleTerminate}
              disabled={isTerminating}
            >
              <StopCircle className="mr-2 h-4 w-4" />
              {isTerminating ? "Terminating..." : "Terminate"}
            </Button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Messages panel */}
        <div className="flex-1 flex flex-col min-h-0">
          <Conversation className="flex-1">
            {messages.length === 0 ? (
              <ConversationEmptyState
                title={
                  isActive ? "Agent is starting..." : "No messages recorded"
                }
                description={
                  isActive
                    ? "Messages will appear here as the agent works."
                    : "This session has no messages."
                }
                icon={<Bot className="h-8 w-8" />}
              />
            ) : (
              <ConversationContent>
                {messages.map((msg) => (
                  <Message
                    key={msg.id}
                    from={msg.role === "user" ? "user" : "assistant"}
                  >
                    <MessageContent>
                      {msg.parts?.map((part) => {
                        if (part.type === "text") {
                          const textData = safeParseJson(part.data);
                          const text = String(textData?.text ?? "");
                          return (
                            <MessageResponse key={part.id}>
                              {text}
                            </MessageResponse>
                          );
                        }

                        if (part.type === "tool-invocation") {
                          const toolData = safeParseJson(part.data);
                          const toolInput = toolData?.input as
                            | Record<string, unknown>
                            | undefined;
                          const toolOutput = toolData?.output as
                            | Record<string, unknown>
                            | string
                            | undefined;
                          const toolError = toolData?.error as
                            | string
                            | undefined;
                          return (
                            <Tool key={part.id}>
                              <ToolHeader
                                type="dynamic-tool"
                                state={mapToolStatus(part.toolStatus)}
                                toolName={part.toolName || "tool"}
                              />
                              <ToolContent>
                                {toolInput && (
                                  <ToolInput input={toolInput} />
                                )}
                                {toolOutput && (
                                  <ToolOutput
                                    output={toolOutput}
                                    errorText={toolError}
                                  />
                                )}
                              </ToolContent>
                            </Tool>
                          );
                        }

                        if (part.type === "step-start") {
                          return (
                            <div
                              key={part.id}
                              className="text-xs text-muted-foreground border-l-2 border-primary/20 pl-3 py-1"
                            >
                              Step started
                            </div>
                          );
                        }

                        return null;
                      })}
                    </MessageContent>
                  </Message>
                ))}
                {isActive && (
                  <div className="flex items-center gap-2 px-2">
                    <Shimmer duration={2}>Agent is thinking...</Shimmer>
                  </div>
                )}
              </ConversationContent>
            )}
            <ConversationScrollButton />
          </Conversation>
          <div className="border-t p-4 space-y-3">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputTextarea
                placeholder="Send a message to the agent..."
                disabled={!isActive || isSending}
              />
              <PromptInputFooter>
                <div />
                <PromptInputSubmit disabled={!isActive || isSending} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>

        {/* Artifacts sidebar */}
        {artifacts.length > 0 && (
          <div className="w-80 border-l overflow-y-auto p-4 space-y-3 shrink-0">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Artifacts ({artifacts.length})
            </h2>
            {artifacts.map((artifact) => (
              <Artifact key={artifact.id}>
                <ArtifactHeader>
                  <ArtifactTitle>
                    {artifact.storageKey?.split("/").pop() || "Artifact"}
                  </ArtifactTitle>
                  <ArtifactActions>
                    <ArtifactAction
                      tooltip="Download"
                      icon={Download}
                      onClick={() =>
                        artifact.id && handleDownloadArtifact(artifact.id)
                      }
                    />
                  </ArtifactActions>
                </ArtifactHeader>
                <ArtifactContent>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{artifact.mime}</p>
                    {artifact.bytes != null && (
                      <p>{formatBytes(artifact.bytes)}</p>
                    )}
                  </div>
                </ArtifactContent>
              </Artifact>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function safeParseJson(data?: string): Record<string, unknown> | null {
  if (!data) return null;
  try {
    const parsed: unknown = JSON.parse(data);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
    return { text: String(parsed) };
  } catch {
    return { text: data };
  }
}

function asSnapshot(data: unknown): Snapshot | null {
  if (!data || typeof data !== "object") return null;
  const next = data as Record<string, unknown>;
  return {
    session: isRecord(next.session) ? (next.session as AgentSessionDto) : undefined,
    messages: Array.isArray(next.messages)
      ? (next.messages as AgentMessageDto[])
      : undefined,
    artifacts: Array.isArray(next.artifacts)
      ? (next.artifacts as AgentArtifactDto[])
      : undefined,
  };
}

function isRecord(data: unknown): data is Record<string, unknown> {
  return typeof data === "object" && data !== null;
}

function mapToolStatus(
  status?: string,
): "input-streaming" | "input-available" | "output-available" | "output-error" {
  switch (status) {
    case "completed":
      return "output-available";
    case "error":
      return "output-error";
    case "running":
      return "input-available";
    default:
      return "input-streaming";
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
