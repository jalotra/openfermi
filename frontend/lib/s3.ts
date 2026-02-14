import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { createHash } from "crypto";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET = process.env.S3_BUCKET_NAME || "";
const PREFIX = process.env.S3_AUDIO_PREFIX || "learning-audio";

function getPublicBaseUrl(): string {
  if (process.env.S3_PUBLIC_BASE_URL) {
    return process.env.S3_PUBLIC_BASE_URL.replace(/\/+$/, "");
  }
  const region = process.env.AWS_REGION || "ap-south-1";
  return `https://${BUCKET}.s3.${region}.amazonaws.com`;
}

export async function uploadAudioToS3(audioBuffer: Buffer): Promise<string> {
  const hash = createHash("sha256").update(audioBuffer).digest("hex");
  const key = `${PREFIX}/${hash.slice(0, 2)}/${hash}.wav`;
  const publicUrl = `${getPublicBaseUrl()}/${key}`;

  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return publicUrl;
  } catch {
    // Object doesn't exist, upload it
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: audioBuffer,
      ContentType: "audio/wav",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return publicUrl;
}
