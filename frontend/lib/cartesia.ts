import { CartesiaClient } from "@cartesia/cartesia-js";
import { WaveFile } from "wavefile";

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

function pcmToWav(rawPcm: Buffer, sampleRate: number): Buffer {
  const samples = new Int16Array(
    rawPcm.buffer,
    rawPcm.byteOffset,
    rawPcm.length / 2,
  );
  const wav = new WaveFile();
  wav.fromScratch(1, sampleRate, "16", samples);
  return Buffer.from(wav.toBuffer());
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
      const ts = (event as any).wordTimestamps as WordTimestamps | undefined;
      if (ts) {
        allWords.push(...ts.words);
        allStarts.push(...ts.start);
        allEnds.push(...ts.end);
      }
    }
  }

  const rawPcm = Buffer.concat(audioChunks);
  const wavBuffer = pcmToWav(rawPcm, 44100);

  return {
    audioBuffer: wavBuffer,
    wordTimestamps: {
      words: allWords,
      start: allStarts,
      end: allEnds,
    },
  };
}
