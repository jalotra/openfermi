import { Pool, type PoolClient } from "pg";
import type { ArtifactRecord, MessageRecord, PartRecord } from "./types.js";

export class PostgresStore {
  private readonly pool: Pool | undefined;

  constructor(databaseUrl: string | undefined) {
    this.pool = databaseUrl
      ? new Pool({
          connectionString: databaseUrl,
          max: 4,
        })
      : undefined;
  }

  get enabled(): boolean {
    return this.pool !== undefined;
  }

  async close(): Promise<void> {
    await this.pool?.end();
  }

  async touchSession(productSessionId: string, workerSessionId: string, bundleUri: string | null): Promise<void> {
    await this.withClient(async (client) => {
      await client.query(
        `
          update agent_sessions
          set opencode_session_id = $2,
              updated_at = now(),
              cost = coalesce(cost, 0),
              token_usage = coalesce(token_usage, 0)
          where id = $1::uuid
        `,
        [productSessionId, workerSessionId],
      );

      if (bundleUri) {
        await client.query(
          `
            insert into agent_artifacts (
              id,
              product_session_id,
              message_id,
              part_id,
              storage_key,
              mime,
              bytes,
              sha256,
              created_at
            ) values (
              $1,
              $2,
              null,
              null,
              $3,
              'application/x-ndjson',
              null,
              null,
              now()
            )
            on conflict (id) do update
            set storage_key = excluded.storage_key,
                mime = excluded.mime,
                created_at = excluded.created_at
          `,
          [`bundle:${productSessionId}`, productSessionId, bundleUri],
        );
      }
    });
  }

  async upsertMessage(record: MessageRecord): Promise<void> {
    const errorJson = record.error ? JSON.stringify({ message: record.error }) : null;
    await this.withClient(async (client) => {
      await client.query(
        `
          insert into agent_messages (
            id,
            product_session_id,
            opencode_session_id,
            role,
            agent,
            model_id,
            provider_id,
            cost,
            tokens_input,
            tokens_output,
            tokens_reasoning,
            error,
            created_at,
            completed_at,
            synced_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14, now()
          )
          on conflict (id) do update set
            role = excluded.role,
            agent = excluded.agent,
            model_id = excluded.model_id,
            provider_id = excluded.provider_id,
            cost = excluded.cost,
            tokens_input = excluded.tokens_input,
            tokens_output = excluded.tokens_output,
            tokens_reasoning = excluded.tokens_reasoning,
            error = excluded.error,
            created_at = excluded.created_at,
            completed_at = excluded.completed_at,
            synced_at = now()
        `,
        [
          record.id,
          record.productSessionId,
          record.workerSessionId,
          record.role,
          record.agent,
          record.modelId,
          record.providerId,
          record.cost,
          record.tokensInput,
          record.tokensOutput,
          record.tokensReasoning,
          errorJson,
          record.createdAt,
          record.completedAt,
        ],
      );
    });
  }

  async upsertPart(record: PartRecord): Promise<void> {
    await this.withClient(async (client) => {
      await client.query(
        `
          insert into agent_parts (
            id,
            message_id,
            product_session_id,
            opencode_session_id,
            type,
            tool_name,
            tool_call_id,
            tool_status,
            data,
            synced_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10
          )
          on conflict (id) do update set
            message_id = excluded.message_id,
            type = excluded.type,
            tool_name = excluded.tool_name,
            tool_call_id = excluded.tool_call_id,
            tool_status = excluded.tool_status,
            data = excluded.data,
            synced_at = excluded.synced_at
        `,
        [
          record.id,
          record.messageId,
          record.productSessionId,
          record.workerSessionId,
          record.type,
          record.toolName,
          record.toolCallId,
          record.toolStatus,
          record.data,
          record.syncedAt,
        ],
      );
    });
  }

  async upsertArtifact(record: ArtifactRecord): Promise<void> {
    await this.withClient(async (client) => {
      await client.query(
        `
          insert into agent_artifacts (
            id,
            product_session_id,
            message_id,
            part_id,
            storage_key,
            mime,
            bytes,
            sha256,
            created_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
          )
          on conflict (id) do update set
            product_session_id = excluded.product_session_id,
            message_id = excluded.message_id,
            part_id = excluded.part_id,
            storage_key = excluded.storage_key,
            mime = excluded.mime,
            bytes = excluded.bytes,
            sha256 = excluded.sha256,
            created_at = excluded.created_at
        `,
        [
          record.id,
          record.productSessionId,
          record.messageId,
          record.partId,
          record.storageKey,
          record.mime,
          record.bytes,
          record.sha256,
          record.createdAt,
        ],
      );
    });
  }

  async updateSessionUsage(productSessionId: string, tokenUsage: number, cost: number): Promise<void> {
    await this.withClient(async (client) => {
      await client.query(
        `
          update agent_sessions
          set token_usage = $2,
              cost = $3,
              updated_at = now()
          where id = $1::uuid
        `,
        [productSessionId, tokenUsage, cost],
      );
    });
  }

  async markSessionFailed(productSessionId: string): Promise<void> {
    await this.withClient(async (client) => {
      await client.query(
        `
          update agent_sessions
          set state = 'FAILED',
              previous_state = coalesce(previous_state, state),
              updated_at = now()
          where id = $1::uuid
        `,
        [productSessionId],
      );
    });
  }

  async markSessionTerminated(productSessionId: string): Promise<void> {
    await this.withClient(async (client) => {
      await client.query(
        `
          update agent_sessions
          set state = 'TERMINATED',
              previous_state = coalesce(previous_state, state),
              updated_at = now()
          where id = $1::uuid
        `,
        [productSessionId],
      );
    });
  }

  private async withClient(fn: (client: PoolClient) => Promise<void>): Promise<void> {
    if (!this.pool) {
      return;
    }
    const client = await this.pool.connect();
    try {
      await fn(client);
    } finally {
      client.release();
    }
  }
}
