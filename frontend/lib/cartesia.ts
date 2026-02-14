import { CartesiaClient } from "@cartesia/cartesia-js";

const client = new CartesiaClient({
  apiKey: process.env.CARTESIA_API_KEY || "",
});

export async function synthesizeSpeech(
  voiceId: string,
  text: string,
): Promise<Buffer> {
  const readable = await client.tts.bytes({
    modelId: "sonic",
    transcript: text,
    voice: { mode: "id", id: voiceId },
    outputFormat: {
      container: "mp3",
      sampleRate: 44100,
      bitRate: 128000,
    },
  });

  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
