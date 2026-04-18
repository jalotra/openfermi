import type { ThinkingLevel } from "@mariozechner/pi-agent-core";

export interface PromptFilePart {
  type: string;
  mime: string | undefined;
  filename: string | undefined;
  url: string | undefined;
}

export interface PromptRequest {
  text: string;
  parts?: PromptFilePart[];
}

export interface CreateSessionRequest {
  productSessionId: string | undefined;
}

export interface CreateSessionResponse {
  id: string;
  projectID: string | null;
}

export interface WorkerStatusResponse {
  id: string | null;
  productSessionId: string | null;
  state: WorkerLifecycleState;
  isStreaming: boolean;
  queuedPrompts: number;
  currentRunId: string | null;
  sessionFile: string | null;
  bundleUri: string | null;
  lastError: string | null;
  lastActivityAt: string | null;
}

export type WorkerLifecycleState = "idle" | "running" | "failed" | "terminating" | "terminated";

export interface AppConfig {
  port: number;
  workspaceDir: string;
  agentDir: string;
  bundledSkillsDir: string;
  basicAuthUsername: string | undefined;
  basicAuthPassword: string | undefined;
  databaseUrl: string | undefined;
  productSessionId: string | undefined;
  modelProvider: string;
  modelId: string;
  thinkingLevel: ThinkingLevel;
  s3BundlePrefix: string | undefined;
  awsRegion: string | undefined;
}

export interface MessageRecord {
  id: string;
  productSessionId: string;
  workerSessionId: string;
  role: string;
  agent: string | null;
  modelId: string | null;
  providerId: string | null;
  cost: number;
  tokensInput: number;
  tokensOutput: number;
  tokensReasoning: number;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface PartRecord {
  id: string;
  messageId: string;
  productSessionId: string;
  workerSessionId: string;
  type: string;
  toolName: string | null;
  toolCallId: string | null;
  toolStatus: string | null;
  data: string;
  syncedAt: Date;
}

export interface ArtifactRecord {
  id: string;
  productSessionId: string;
  messageId: string | null;
  partId: string | null;
  storageKey: string;
  mime: string;
  bytes: number | null;
  sha256: string | null;
  createdAt: Date;
}

export interface SessionBundleLocation {
  bucket: string;
  keyPrefix: string;
}

export interface SavedArtifact {
  storageKey: string;
  mime: string;
  bytes: number | null;
  sha256: string | null;
}
