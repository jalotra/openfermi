import type { LearnState } from "./types";

export const initialLearnState: LearnState = {
  step: "pick-tutor",
  selectedTutor: null,
  selectedQuestion: null,
  searchQuery: "",
  error: null,

  tutor: null,
  question: null,
  audioUrl: null,
  segments: [],
  wordTimestamps: null,
  isPlaying: false,
  activeSegmentIdx: -1,
  activeWordIdx: -1,
};
