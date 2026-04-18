import { readConfig } from "./config.js";
import { PostgresStore } from "./postgres-store.js";
import { createServer } from "./server.js";
import { S3BundleStore } from "./s3-bundle-store.js";
import { WorkerSessionManager } from "./worker-session.js";

const config = readConfig();
const store = new PostgresStore(config.databaseUrl);
const bundles = new S3BundleStore(config.awsRegion);
const worker = new WorkerSessionManager(config, store, bundles);
const app = createServer(config, worker);

const server = app.listen(config.port, () => {
  console.log(`agent worker listening on :${config.port}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`received ${signal}, shutting down`);
  server.close();
  await worker.close();
  await store.close();
  process.exit(0);
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
