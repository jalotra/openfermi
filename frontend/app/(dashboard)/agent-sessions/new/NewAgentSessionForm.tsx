"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { AgentSessionController } from "@/lib/backend/sdk.gen";
import { backendClient } from "@/lib/backend-client";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Bot } from "lucide-react";

interface NewAgentSessionFormProps {
  userId: string;
}

export function NewAgentSessionForm({ userId }: NewAgentSessionFormProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(message: PromptInputMessage) {
    const text = message.text.trim();
    if (!text) {
      setError("Please enter a prompt before starting the session.");
      return;
    }
    setIsCreating(true);
    setError(null);

    try {
      const response = await AgentSessionController.create({
        client: backendClient,
        body: {
          userId,
          sessionTokenCap: 100000,
          sessionCostCap: 5.0,
        },
      });

      const session = response.data?.data;
      if (session?.id) {
        await backendClient.post({
          url: "/api/agent-sessions/{id}/prompt",
          path: { id: session.id },
          body: { text, parts: [] },
        });
        router.push(`/agent-sessions/${session.id}`);
      } else {
        setError("Session created but no ID returned.");
        setIsCreating(false);
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to create agent session",
        );
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to create agent session",
        );
      }
      setIsCreating(false);
    }
  }

  if (isCreating) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Bot className="h-10 w-10 text-primary animate-pulse" />
        <Shimmer duration={2}>Spinning up your AI agent...</Shimmer>
        <p className="text-sm text-muted-foreground">
          This may take a moment while the ECS task starts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <PromptInput onSubmit={handleSubmit}>
        <PromptInputTextarea placeholder="Describe what you need help with..." />
        <PromptInputFooter>
          <div />
          <PromptInputSubmit />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
