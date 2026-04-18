import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import type { AgentMessage, ThinkingLevel } from "@mariozechner/pi-agent-core";
import { getModel, type ImageContent } from "@mariozechner/pi-ai";
import {
  createAgentSession,
  createCodingTools,
  SessionManager,
  type AgentSession,
  type AgentSessionEvent,
} from "@mariozechner/pi-coding-agent";
import { lookup as lookupMimeType } from "mime-types";
import type {
  AppConfig,
  ArtifactRecord,
  CreateSessionRequest,
  CreateSessionResponse,
  MessageRecord,
  PartRecord,
  PromptFilePart,
  PromptRequest,
  SavedArtifact,
  SessionBundleLocation,
  WorkerLifecycleState,
  WorkerStatusResponse,
} from "./types.js";
import { resolveBundleLocation } from "./config.js";
import { PostgresStore } from "./postgres-store.js";
import { S3BundleStore } from "./s3-bundle-store.js";
import { createCustomTools } from "./tools.js";

interface ActiveMessageState {
  id: string;
  createdAt: Date;
}

interface PendingToolState {
  messageId: string;
  toolName: string;
  args: unknown;
  startedAt: Date;
}

interface PreparedPrompt {
  text: string;
  images: ImageContent[];
}

interface UsageTotals {
  input: number;
  output: number;
  reasoning: number;
  cost: number;
}

interface AssistantUsage {
  input: number;
  output: number;
  reasoning: number;
  cost: number;
}

interface ContentTextPart {
  type: "text";
  text: string;
}

interface ContentThinkingPart {
  type: "thinking";
  thinking: string;
}

interface ContentImageSource {
  type: string;
  mediaType?: string;
  mimeType?: string;
  data?: string;
}

interface ContentImagePart {
  type: "image";
  source?: ContentImageSource;
  mimeType?: string;
  data?: string;
}

interface ToolResultContentPart {
  type?: string;
  text?: string;
  data?: string;
  mimeType?: string;
  source?: ContentImageSource;
}

interface ToolResultEnvelope {
  content?: ToolResultContentPart[];
}

function toJsonString(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isTextPart(value: unknown): value is ContentTextPart {
  return asRecord(value)?.type === "text" && typeof asRecord(value)?.text === "string";
}

function isThinkingPart(value: unknown): value is ContentThinkingPart {
  return asRecord(value)?.type === "thinking" && typeof asRecord(value)?.thinking === "string";
}

function isImagePart(value: unknown): value is ContentImagePart {
  return asRecord(value)?.type === "image";
}

function hasContent(message: AgentMessage): message is AgentMessage & { content: unknown } {
  return "content" in message;
}

function extractTextFromMessage(message: AgentMessage): string {
  if (!hasContent(message)) {
    return "";
  }
  if (typeof message.content === "string") {
    return message.content;
  }
  if (!Array.isArray(message.content)) {
    return "";
  }
  return message.content.filter(isTextPart).map((part) => part.text).join("\n");
}

function extractTextBlocks(message: AgentMessage): string[] {
  if (!hasContent(message)) {
    return [];
  }
  if (typeof message.content === "string") {
    return [message.content];
  }
  if (!Array.isArray(message.content)) {
    return [];
  }
  return message.content.filter((part: unknown): part is ContentTextPart => isTextPart(part)).map((part) => part.text);
}

function extractThinkingBlocks(message: AgentMessage): string[] {
  if (!hasContent(message) || !Array.isArray(message.content)) {
    return [];
  }
  return message.content
    .filter((part: unknown): part is ContentThinkingPart => isThinkingPart(part))
    .map((part) => part.thinking);
}

function extractUsage(message: AgentMessage): AssistantUsage {
  const usage = asRecord(asRecord(message)?.usage);
  const cost = asRecord(usage?.cost);
  return {
    input: asNumber(usage?.input) ?? 0,
    output: asNumber(usage?.output) ?? 0,
    reasoning: asNumber(usage?.reasoning) ?? 0,
    cost: asNumber(cost?.total) ?? 0,
  };
}

function messageTimestamp(message: AgentMessage): Date {
  const timestamp = asNumber(asRecord(message)?.timestamp);
  return timestamp ? new Date(timestamp) : new Date();
}

function inferredMime(part: PromptFilePart): string {
  const explicit = part.mime?.trim();
  if (explicit) return explicit;
  const candidate = part.filename ?? part.url;
  if (!candidate) return "application/octet-stream";
  const lookedUp = lookupMimeType(candidate);
  return typeof lookedUp === "string" ? lookedUp : "application/octet-stream";
}

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

async function downloadToFile(url: string, targetPath: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  await ensureDir(dirname(targetPath));
  await writeFile(targetPath, bytes);
  return bytes;
}

async function copyBundledSkills(sourceDir: string, agentDir: string): Promise<void> {
  await ensureDir(agentDir);
  const targetRoot = join(agentDir, "skills");
  await ensureDir(targetRoot);
  const marker = join(targetRoot, ".bundled-skills-copied");
  try {
    await readFile(marker);
    return;
  } catch {
    // Continue.
  }

  const readmePath = join(sourceDir, "README.md");
  try {
    const content = await readFile(readmePath, "utf8");
    await writeFile(join(targetRoot, "README.md"), content, "utf8");
  } catch {
    // No bundled skills.
  }

  await writeFile(marker, "ok\n", "utf8");
}

export class WorkerSessionManager {
  private readonly config: AppConfig;
  private readonly store: PostgresStore;
  private readonly bundles: S3BundleStore;
  private session?: AgentSession;
  private workerSessionId: string | null = null;
  private productSessionId: string | null = null;
  private sessionFile: string | null = null;
  private state: WorkerLifecycleState = "idle";
  private queuedPrompts = 0;
  private queueChain: Promise<void> = Promise.resolve();
  private currentRunId: string | null = null;
  private lastError: string | null = null;
  private lastActivityAt: Date | null = null;
  private bundleUri: string | null = null;
  private bundleLocation: SessionBundleLocation | undefined;
  private activeAssistant: ActiveMessageState | undefined;
  private lastAssistantMessageId: string | null = null;
  private readonly pendingTools = new Map<string, PendingToolState>();
  private usageTotals: UsageTotals = { input: 0, output: 0, reasoning: 0, cost: 0 };

  constructor(config: AppConfig, store: PostgresStore, bundles: S3BundleStore) {
    this.config = config;
    this.store = store;
    this.bundles = bundles;
  }

  async createSession(request?: CreateSessionRequest): Promise<CreateSessionResponse> {
    if (this.session && this.workerSessionId) {
      return { id: this.workerSessionId, projectID: null };
    }

    this.productSessionId = request?.productSessionId ?? this.config.productSessionId ?? randomUUID();
    this.bundleLocation = resolveBundleLocation(this.config.s3BundlePrefix, this.productSessionId);

    await ensureDir(this.config.workspaceDir);
    await ensureDir(this.config.agentDir);
    await ensureDir(join(this.config.workspaceDir, "uploads"));
    await ensureDir(join(this.config.workspaceDir, "sessions"));
    await copyBundledSkills(this.config.bundledSkillsDir, this.config.agentDir);

    this.sessionFile = join(this.config.workspaceDir, "sessions", `${this.productSessionId}.jsonl`);
    const sessionManager = SessionManager.open(this.sessionFile, dirname(this.sessionFile), this.config.workspaceDir);

    const { session } = await createAgentSession({
      cwd: this.config.workspaceDir,
      agentDir: this.config.agentDir,
      sessionManager,
      model: getModel(this.config.modelProvider as never, this.config.modelId as never),
      thinkingLevel: this.config.thinkingLevel,
      tools: createCodingTools(this.config.workspaceDir),
      customTools: createCustomTools(),
    });

    session.subscribe(async (event) => {
      await this.handleEvent(event);
    });

    this.session = session;
    this.workerSessionId = session.sessionId;
    this.state = "idle";
    this.lastActivityAt = new Date();

    await this.syncBundle();
    await this.touchSession();

    return {
      id: session.sessionId,
      projectID: null,
    };
  }

  async enqueuePrompt(input: PromptRequest): Promise<void> {
    if (!this.session || !this.workerSessionId) {
      throw new Error("Session has not been created");
    }
    if (this.state === "terminating" || this.state === "terminated") {
      throw new Error("Worker is terminating");
    }

    this.queuedPrompts += 1;
    this.queueChain = this.queueChain
      .then(async () => {
        this.queuedPrompts -= 1;
        await this.runPrompt(input);
      })
      .catch((error: unknown) => {
        this.queuedPrompts = Math.max(0, this.queuedPrompts - 1);
        this.lastError = error instanceof Error ? error.message : String(error);
        this.state = "idle";
      });
  }

  getStatus(): WorkerStatusResponse {
    return {
      id: this.workerSessionId,
      productSessionId: this.productSessionId,
      state: this.state,
      isStreaming: this.session?.isStreaming ?? false,
      queuedPrompts: this.queuedPrompts,
      currentRunId: this.currentRunId,
      sessionFile: this.sessionFile,
      bundleUri: this.bundleUri,
      lastError: this.lastError,
      lastActivityAt: this.lastActivityAt?.toISOString() ?? null,
    };
  }

  async terminate(): Promise<void> {
    this.state = "terminating";
    this.lastActivityAt = new Date();
    await this.session?.abort();
    await this.syncBundle();
    if (this.productSessionId) {
      await this.store.markSessionTerminated(this.productSessionId);
    }
    this.state = "terminated";
  }

  async close(): Promise<void> {
    if (this.state !== "terminated") {
      await this.syncBundle();
    }
  }

  private async runPrompt(input: PromptRequest): Promise<void> {
    if (!this.session) {
      throw new Error("Session has not been created");
    }

    this.state = "running";
    this.currentRunId = randomUUID();
    this.lastError = null;
    this.lastActivityAt = new Date();

    const prepared = await this.preparePrompt(input);

    try {
      await this.session.prompt(prepared.text, { images: prepared.images });
      this.state = "idle";
    } catch (error: unknown) {
      this.lastError = error instanceof Error ? error.message : String(error);
      this.state = "idle";
    } finally {
      this.currentRunId = null;
      this.lastActivityAt = new Date();
      await this.syncBundle();
      await this.updateSessionUsage();
    }
  }

  private async preparePrompt(input: PromptRequest): Promise<PreparedPrompt> {
    const uploadsDir = join(this.config.workspaceDir, "uploads", this.workerSessionId ?? "default");
    await ensureDir(uploadsDir);

    const images: ImageContent[] = [];
    const localFileNotes: string[] = [];
    const parts = input.parts ?? [];

    for (const part of parts) {
      if (part.type !== "file" || !part.url) {
        continue;
      }

      const extension = extname(part.filename ?? part.url) || "";
      const targetName = `${Date.now()}-${randomUUID()}${extension}`;
      const targetPath = join(uploadsDir, targetName);
      const bytes = await downloadToFile(part.url, targetPath);
      const mime = inferredMime(part);
      const localPath = targetPath;

      if (mime.startsWith("image/")) {
        images.push({
          type: "image",
          mimeType: mime,
          data: Buffer.from(bytes).toString("base64"),
        });
      }

      localFileNotes.push(`${part.filename ?? targetName} -> ${localPath} (${mime})`);
    }

    let text = input.text;
    if (localFileNotes.length > 0) {
      text += `\n\nAttached files downloaded to local paths:\n${localFileNotes.map((item) => `- ${item}`).join("\n")}`;
    }

    return { text, images };
  }

  private async handleEvent(event: AgentSessionEvent): Promise<void> {
    if (!this.workerSessionId || !this.productSessionId) {
      return;
    }

    this.lastActivityAt = new Date();

    switch (event.type) {
      case "message_start":
        await this.onMessageStart(event.message);
        break;
      case "message_update":
        await this.onMessageUpdate(event.message);
        break;
      case "message_end":
        await this.onMessageEnd(event.message);
        break;
      case "tool_execution_start":
        await this.onToolExecutionStart(event.toolCallId, event.toolName, event.args);
        break;
      case "tool_execution_end":
        await this.onToolExecutionEnd(event.toolCallId, event.result, event.isError);
        break;
      default:
        break;
    }
  }

  private async onMessageStart(message: AgentMessage): Promise<void> {
    if (message.role === "toolResult") {
      return;
    }

    const messageId = randomUUID();
    const createdAt = messageTimestamp(message);
    const baseRecord: MessageRecord = {
      id: messageId,
      productSessionId: this.productSessionId!,
      workerSessionId: this.workerSessionId!,
      role: message.role,
      agent: "pi",
      modelId: this.config.modelId,
      providerId: this.config.modelProvider,
      cost: 0,
      tokensInput: 0,
      tokensOutput: 0,
      tokensReasoning: 0,
      error: null,
      createdAt,
      completedAt: null,
    };

    await this.store.upsertMessage(baseRecord);

    if (message.role === "assistant") {
      this.activeAssistant = { id: messageId, createdAt };
      this.lastAssistantMessageId = messageId;
      await this.persistAssistantParts(messageId, message);
      return;
    }

    const text = extractTextFromMessage(message);
    await this.store.upsertPart({
      id: `${messageId}:text:0`,
      messageId,
      productSessionId: this.productSessionId!,
      workerSessionId: this.workerSessionId!,
      type: "text",
      toolName: null,
      toolCallId: null,
      toolStatus: null,
      data: toJsonString({ text }),
      syncedAt: new Date(),
    });
  }

  private async onMessageUpdate(message: AgentMessage): Promise<void> {
    if (message.role !== "assistant" || !this.activeAssistant) {
      return;
    }
    await this.persistAssistantParts(this.activeAssistant.id, message);
  }

  private async onMessageEnd(message: AgentMessage): Promise<void> {
    if (message.role !== "assistant" || !this.activeAssistant) {
      return;
    }

    const usage = extractUsage(message);
    this.usageTotals.input += usage.input;
    this.usageTotals.output += usage.output;
    this.usageTotals.reasoning += usage.reasoning;
    this.usageTotals.cost += usage.cost;

    await this.store.upsertMessage({
      id: this.activeAssistant.id,
      productSessionId: this.productSessionId!,
      workerSessionId: this.workerSessionId!,
      role: message.role,
      agent: "pi",
      modelId: this.config.modelId,
      providerId: this.config.modelProvider,
      cost: usage.cost,
      tokensInput: usage.input,
      tokensOutput: usage.output,
      tokensReasoning: usage.reasoning,
      error: null,
      createdAt: this.activeAssistant.createdAt,
      completedAt: new Date(),
    });

    await this.persistAssistantParts(this.activeAssistant.id, message);
    this.lastAssistantMessageId = this.activeAssistant.id;
    this.activeAssistant = undefined;
  }

  private async onToolExecutionStart(toolCallId: string, toolName: string, args: unknown): Promise<void> {
    if (!this.lastAssistantMessageId) {
      return;
    }

    this.pendingTools.set(toolCallId, {
      messageId: this.lastAssistantMessageId,
      toolName,
      args,
      startedAt: new Date(),
    });

    await this.store.upsertPart({
      id: `${this.lastAssistantMessageId}:tool:${toolCallId}`,
      messageId: this.lastAssistantMessageId,
      productSessionId: this.productSessionId!,
      workerSessionId: this.workerSessionId!,
      type: "tool-invocation",
      toolName,
      toolCallId,
      toolStatus: "running",
      data: toJsonString({ input: args, output: null, error: null, attachments: [] }),
      syncedAt: new Date(),
    });
  }

  private async onToolExecutionEnd(toolCallId: string, result: unknown, isError: boolean): Promise<void> {
    const pending = this.pendingTools.get(toolCallId);
    if (!pending) {
      return;
    }
    this.pendingTools.delete(toolCallId);

    const artifacts = await this.extractArtifacts(`${pending.messageId}:tool:${toolCallId}`, result);
    const outputText = this.extractToolResultText(result);

    await this.store.upsertPart({
      id: `${pending.messageId}:tool:${toolCallId}`,
      messageId: pending.messageId,
      productSessionId: this.productSessionId!,
      workerSessionId: this.workerSessionId!,
      type: "tool-invocation",
      toolName: pending.toolName,
      toolCallId,
      toolStatus: isError ? "error" : "completed",
      data: toJsonString({
        input: pending.args,
        output: outputText,
        error: isError ? outputText : null,
        attachments: artifacts.map((artifact) => ({
          url: artifact.storageKey,
          mime: artifact.mime,
          bytes: artifact.bytes,
          sha256: artifact.sha256,
        })),
      }),
      syncedAt: new Date(),
    });

    for (const artifact of artifacts) {
      const record: ArtifactRecord = {
        id: `${toolCallId}:${artifact.storageKey}`,
        productSessionId: this.productSessionId!,
        messageId: pending.messageId,
        partId: `${pending.messageId}:tool:${toolCallId}`,
        storageKey: artifact.storageKey,
        mime: artifact.mime,
        bytes: artifact.bytes,
        sha256: artifact.sha256,
        createdAt: pending.startedAt,
      };
      await this.store.upsertArtifact(record);
    }
  }

  private async persistAssistantParts(messageId: string, message: AgentMessage): Promise<void> {
    const textBlocks = extractTextBlocks(message);
    const thinkingBlocks = extractThinkingBlocks(message);

    for (const [index, block] of textBlocks.entries()) {
      await this.store.upsertPart({
        id: `${messageId}:text:${index}`,
        messageId,
        productSessionId: this.productSessionId!,
        workerSessionId: this.workerSessionId!,
        type: "text",
        toolName: null,
        toolCallId: null,
        toolStatus: null,
        data: toJsonString({ text: block }),
        syncedAt: new Date(),
      });
    }

    for (const [index, block] of thinkingBlocks.entries()) {
      await this.store.upsertPart({
        id: `${messageId}:thinking:${index}`,
        messageId,
        productSessionId: this.productSessionId!,
        workerSessionId: this.workerSessionId!,
        type: "thinking",
        toolName: null,
        toolCallId: null,
        toolStatus: null,
        data: toJsonString({ text: block }),
        syncedAt: new Date(),
      });
    }
  }

  private extractToolResultText(result: unknown): string {
    if (typeof result === "string") {
      return result;
    }

    const record = asRecord(result) as ToolResultEnvelope | undefined;
    if (!record?.content || !Array.isArray(record.content)) {
      return JSON.stringify(result);
    }

    const text = record.content
      .map((item) => item.text)
      .filter((value): value is string => typeof value === "string")
      .join("\n");
    return text || JSON.stringify(result);
  }

  private async extractArtifacts(partId: string, result: unknown): Promise<SavedArtifact[]> {
    const record = asRecord(result) as ToolResultEnvelope | undefined;
    if (!record?.content || !Array.isArray(record.content)) {
      return [];
    }

    const output: SavedArtifact[] = [];
    for (const [index, item] of record.content.entries()) {
      const artifact = await this.extractImageArtifact(partId, index, item);
      if (artifact) {
        output.push(artifact);
      }
    }
    return output;
  }

  private async extractImageArtifact(
    partId: string,
    index: number,
    item: ToolResultContentPart,
  ): Promise<SavedArtifact | null> {
    const directMime = item.mimeType;
    const directData = item.data;
    if (directMime && directData) {
      return await this.persistArtifactBytes(`${partId}:${index}`, directMime, Buffer.from(directData, "base64"));
    }

    if (!item.source) {
      return null;
    }

    const mediaType = item.source.mediaType ?? item.source.mimeType;
    const data = item.source.data;
    if (!mediaType || !data) {
      return null;
    }

    return await this.persistArtifactBytes(`${partId}:${index}`, mediaType, Buffer.from(data, "base64"));
  }

  private async persistArtifactBytes(
    artifactId: string,
    mime: string,
    bytes: Uint8Array,
  ): Promise<SavedArtifact | null> {
    const uploaded = await this.bundles.uploadArtifact(this.bundleLocation, artifactId, mime, bytes);
    if (uploaded) {
      return uploaded;
    }

    const extension = mime.startsWith("image/") ? `.${mime.slice("image/".length)}` : ".bin";
    const targetPath = join(this.config.workspaceDir, "uploads", `${artifactId}${extension}`);
    await ensureDir(dirname(targetPath));
    await writeFile(targetPath, bytes);
    return {
      storageKey: targetPath,
      mime,
      bytes: bytes.byteLength,
      sha256: null,
    };
  }

  private async syncBundle(): Promise<void> {
    if (!this.sessionFile) {
      return;
    }
    this.bundleUri = await this.bundles.uploadSessionFile(this.bundleLocation, this.sessionFile);
    await this.touchSession();
  }

  private async touchSession(): Promise<void> {
    if (!this.productSessionId || !this.workerSessionId) {
      return;
    }
    await this.store.touchSession(this.productSessionId, this.workerSessionId, this.bundleUri);
  }

  private async updateSessionUsage(): Promise<void> {
    if (!this.productSessionId) {
      return;
    }
    const totalTokens = this.usageTotals.input + this.usageTotals.output + this.usageTotals.reasoning;
    await this.store.updateSessionUsage(this.productSessionId, totalTokens, this.usageTotals.cost);
  }
}
