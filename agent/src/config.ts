import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { ThinkingLevel } from "@mariozechner/pi-agent-core";
import type { AppConfig, SessionBundleLocation } from "./types.js";

const THINKING_LEVELS = new Set<ThinkingLevel>(["off", "minimal", "low", "medium", "high", "xhigh"]);

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function parsePort(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function parseThinkingLevel(raw: string | undefined): ThinkingLevel {
  if (raw && THINKING_LEVELS.has(raw as ThinkingLevel)) {
    return raw as ThinkingLevel;
  }
  return "off";
}

export function readConfig(): AppConfig {
  const workspaceDir = resolve(readEnv("PI_WORKSPACE_DIR") ?? "/workspace");
  const agentDir = resolve(readEnv("PI_AGENT_DIR") ?? `${workspaceDir}/.pi/agent`);
  const bundledSkillsDir = resolve(readEnv("PI_BUNDLED_SKILLS_DIR") ?? `${process.cwd()}/bundled-skills`);

  return {
    port: parsePort(readEnv("OPENCODE_PORT"), 8080),
    workspaceDir,
    agentDir,
    bundledSkillsDir,
    basicAuthUsername: readEnv("WORKER_BASIC_AUTH_USERNAME"),
    basicAuthPassword: readEnv("WORKER_BASIC_AUTH_PASSWORD"),
    databaseUrl: readEnv("DATABASE_URL"),
    productSessionId: readEnv("PRODUCT_SESSION_ID"),
    modelProvider: readEnv("PI_MODEL_PROVIDER") ?? "anthropic",
    modelId: readEnv("PI_MODEL_ID") ?? "claude-sonnet-4-5",
    thinkingLevel: parseThinkingLevel(readEnv("PI_THINKING_LEVEL")),
    s3BundlePrefix: readEnv("S3_BUNDLE_PREFIX"),
    awsRegion: readEnv("AWS_REGION"),
  };
}

export function resolveBundleLocation(raw: string | undefined, productSessionId: string): SessionBundleLocation | undefined {
  if (!raw) return undefined;
  if (!raw.startsWith("s3://")) {
    throw new Error(`S3_BUNDLE_PREFIX must start with s3://, received: ${raw}`);
  }

  const withoutScheme = raw.slice("s3://".length);
  const firstSlash = withoutScheme.indexOf("/");
  const bucket = firstSlash === -1 ? withoutScheme : withoutScheme.slice(0, firstSlash);
  const basePrefix = firstSlash === -1 ? "" : withoutScheme.slice(firstSlash + 1);
  const normalizedPrefix = basePrefix.endsWith("/") || basePrefix.length === 0 ? basePrefix : `${basePrefix}/`;

  return {
    bucket,
    keyPrefix: `${normalizedPrefix}${productSessionId}`,
  };
}

export function bundledSkillsExist(path: string): boolean {
  return existsSync(path);
}
