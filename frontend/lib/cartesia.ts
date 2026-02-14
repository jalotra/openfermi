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

export interface WordTimestamps {
  words: string[];
  start: number[];
  end: number[];
}

export interface SpeechWithTimestamps {
  audioBuffer: Buffer;
  wordTimestamps: WordTimestamps;
}

function writeWavHeader(
  pcmData: Buffer,
  sampleRate: number,
  numChannels: number,
  bitsPerSample: number,
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // format = PCM integer
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 30);
  header.writeUInt16LE(bitsPerSample, 32);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

export async function synthesizeSpeechWithTimestamps(
  voiceId: string,
  text: string,
): Promise<SpeechWithTimestamps> {
  const stream = await client.tts.sse({
    modelId: "sonic",
    transcript: text,
    voice: { mode: "id", id: voiceId },
    outputFormat: {
      container: "raw",
      encoding: "pcm_s16le",
      sampleRate: 44100,
    },
    addTimestamps: true,
  });

  const audioChunks: Buffer[] = [];
  const allWords: string[] = [];
  const allStarts: number[] = [];
  const allEnds: number[] = [];

  for await (const event of stream) {
    if (event.type === "chunk") {
      const pcmBase64 = (event as any).data as string;
      if (pcmBase64) {
        audioChunks.push(Buffer.from(pcmBase64, "base64"));
      }
    } else if (event.type === "timestamps") {
      const ts = (event as any).wordTimestamps as
        | WordTimestamps
        | undefined;
      if (ts) {
        allWords.push(...ts.words);
        allStarts.push(...ts.start);
        allEnds.push(...ts.end);
      }
    }
  }

  const rawPcm = Buffer.concat(audioChunks);
  const wavBuffer = writeWavHeader(rawPcm, 44100, 1, 16);

  return {
    audioBuffer: wavBuffer,
    wordTimestamps: {
      words: allWords,
      start: allStarts,
      end: allEnds,
    },
  };
}
