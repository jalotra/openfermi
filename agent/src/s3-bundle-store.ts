import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { SavedArtifact, SessionBundleLocation } from "./types.js";

export class S3BundleStore {
  private readonly client: S3Client | undefined;

  constructor(region: string | undefined) {
    this.client = region ? new S3Client({ region }) : undefined;
  }

  get enabled(): boolean {
    return this.client !== undefined;
  }

  async uploadSessionFile(location: SessionBundleLocation | undefined, filePath: string): Promise<string | null> {
    if (!location || !this.client) return null;
    const body = await readFile(filePath);
    const key = `${location.keyPrefix}/${basename(filePath)}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: location.bucket,
        Key: key,
        Body: body,
        ContentType: "application/x-ndjson",
      }),
    );
    return `s3://${location.bucket}/${key}`;
  }

  async uploadArtifact(
    location: SessionBundleLocation | undefined,
    artifactId: string,
    mime: string,
    bytes: Uint8Array,
  ): Promise<SavedArtifact | null> {
    if (!location || !this.client) return null;
    const extension = mime.includes("/") ? mime.split("/")[1] : "bin";
    const key = `${location.keyPrefix}/artifacts/${artifactId}.${extension}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: location.bucket,
        Key: key,
        Body: bytes,
        ContentType: mime,
      }),
    );
    return {
      storageKey: `s3://${location.bucket}/${key}`,
      mime,
      bytes: bytes.byteLength,
      sha256: null,
    };
  }
}
