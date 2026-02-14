import type { StoreSetter, StoreGetter } from "../types";
import type {
  LearnStore,
  TutorSummary,
  QuestionDto,
  Segment,
  WordTimestamps,
  PlayerAction,
} from "./types";

export class PlayerActionImpl {
  readonly #set: StoreSetter<LearnStore>;
  readonly #get: StoreGetter<LearnStore>;

  constructor(
    set: StoreSetter<LearnStore>,
    get: StoreGetter<LearnStore>,
    _api?: unknown,
  ) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  loadSession = (data: {
    tutor: TutorSummary;
    question: QuestionDto;
    audioUrl: string;
    segments: Segment[];
    wordTimestamps: WordTimestamps | null;
  }) => {
    this.#set({
      tutor: data.tutor,
      question: data.question,
      audioUrl: data.audioUrl,
      segments: data.segments,
      wordTimestamps: data.wordTimestamps,
      isPlaying: false,
      activeSegmentIdx: -1,
      activeWordIdx: -1,
    });
  };

  setPlaying = (val: boolean) => {
    this.#set({ isPlaying: val });
  };

  seekToSegment = (idx: number) => {
    const { segments } = this.#get();
    if (idx < 0 || idx >= segments.length) return;
    this.#set({ activeSegmentIdx: idx });
  };

  syncTick = (currentTime: number) => {
    const { wordTimestamps, segments } = this.#get();
    if (!wordTimestamps || wordTimestamps.start.length === 0) return;

    let lo = 0;
    let hi = wordTimestamps.start.length - 1;
    let wordIdx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (wordTimestamps.start[mid] <= currentTime) {
        wordIdx = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if (
      wordIdx >= 0 &&
      wordIdx < wordTimestamps.end.length &&
      currentTime > wordTimestamps.end[wordIdx]
    ) {
      // between words -- keep last known
    }

    let segIdx = -1;
    for (let i = 0; i < segments.length; i++) {
      if (
        wordIdx >= segments[i].wordStartIdx &&
        wordIdx <= segments[i].wordEndIdx
      ) {
        segIdx = i;
        break;
      }
    }

    this.#set({ activeWordIdx: wordIdx, activeSegmentIdx: segIdx });
  };
}

export type { PlayerAction };
