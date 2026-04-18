import express, { type NextFunction, type Request, type Response } from "express";
import type { AppConfig } from "./types.js";
import type { WorkerSessionManager } from "./worker-session.js";
import type { CreateSessionRequest, PromptRequest } from "./types.js";

function authHeaderMatches(header: string | undefined, username: string, password: string): boolean {
  if (!header || !header.startsWith("Basic ")) {
    return false;
  }
  const encoded = header.slice("Basic ".length);
  const expected = Buffer.from(`${username}:${password}`, "utf8").toString("base64");
  return encoded === expected;
}

function requireBasicAuth(config: AppConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!config.basicAuthPassword) {
      next();
      return;
    }

    const username = config.basicAuthUsername ?? "opencode";
    const authorized = authHeaderMatches(req.header("authorization"), username, config.basicAuthPassword);
    if (!authorized) {
      res.setHeader("WWW-Authenticate", 'Basic realm="agent-worker"');
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  };
}

function parseCreateSessionRequest(body: unknown): CreateSessionRequest {
  if (typeof body !== "object" || body === null) {
    return { productSessionId: undefined };
  }
  const record = body as Record<string, unknown>;
  const productSessionId = typeof record.productSessionId === "string" ? record.productSessionId : undefined;
  return { productSessionId };
}

function parsePromptRequest(body: unknown): PromptRequest {
  if (typeof body !== "object" || body === null) {
    throw new Error("Request body must be an object");
  }
  const record = body as Record<string, unknown>;
  const text = typeof record.text === "string" ? record.text.trim() : "";
  if (!text) {
    throw new Error("text is required");
  }

  const parts = Array.isArray(record.parts)
    ? record.parts
        .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item) => ({
          type: typeof item.type === "string" ? item.type : "",
          mime: typeof item.mime === "string" ? item.mime : undefined,
          filename: typeof item.filename === "string" ? item.filename : undefined,
          url: typeof item.url === "string" ? item.url : undefined,
        }))
    : [];

  return { text, parts };
}

export function createServer(config: AppConfig, worker: WorkerSessionManager) {
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use(requireBasicAuth(config));

  app.get(["/", "/health"], (_req, res) => {
    res.json({ ok: true, status: worker.getStatus() });
  });

  app.post("/session", async (req, res, next) => {
    try {
      const created = await worker.createSession(parseCreateSessionRequest(req.body));
      res.json(created);
    } catch (error) {
      next(error);
    }
  });

  app.post("/session/:id/message", async (req, res, next) => {
    try {
      const status = worker.getStatus();
      if (status.id !== req.params.id) {
        res.status(404).json({ error: "Unknown session" });
        return;
      }
      await worker.enqueuePrompt(parsePromptRequest(req.body));
      res.json({ accepted: true });
    } catch (error) {
      next(error);
    }
  });

  app.get("/session/:id/status", (req, res) => {
    const status = worker.getStatus();
    if (status.id !== req.params.id) {
      res.status(404).json({ error: "Unknown session" });
      return;
    }
    res.json(status);
  });

  app.post("/session/:id/terminate", async (req, res, next) => {
    try {
      const status = worker.getStatus();
      if (status.id !== req.params.id) {
        res.status(404).json({ error: "Unknown session" });
        return;
      }
      await worker.terminate();
      res.json({ terminated: true });
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  });

  return app;
}
