export interface TutorDto {
  id: string;
  name: string;
  title: string;
  description: string;
  avatarUrl: string;
  voiceId: string;
  personaPrompt: string;
  active: boolean;
}

export interface TutorSummary {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
}

export interface QuestionDto {
  id?: string;
  questionText?: string;
  latexQuestionText?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  options?: string[];
  imageUrls?: string[];
}

export interface Segment {
  stepNumber: number;
  stepTitle: string;
  solutionContent: string;
  spokenText: string;
  startTime: number;
  endTime: number;
  wordStartIdx: number;
  wordEndIdx: number;
}

export interface WordTimestamps {
  words: string[];
  start: number[];
  end: number[];
}

export type Step = "pick-tutor" | "pick-question" | "loading";

export interface LearnState {
  step: Step;
  selectedTutor: TutorDto | null;
  selectedQuestion: QuestionDto | null;
  searchQuery: string;
  error: string | null;
  tutor: TutorSummary | null;
  question: QuestionDto | null;
  audioUrl: string | null;
  segments: Segment[];
  wordTimestamps: WordTimestamps | null;
  isPlaying: boolean;
  activeSegmentIdx: number;
  activeWordIdx: number;
}

export interface SessionAction {
  selectTutor: (tutor: TutorDto) => void;
  setSearchQuery: (query: string) => void;
  generateSession: (question: QuestionDto) => Promise<string | null>;
  goBack: () => void;
  resetWizard: () => void;
}

export interface PlayerAction {
  loadSession: (data: {
    tutor: TutorSummary;
    question: QuestionDto;
    audioUrl: string;
    segments: Segment[];
    wordTimestamps: WordTimestamps | null;
  }) => void;
  setPlaying: (val: boolean) => void;
  seekToSegment: (idx: number) => void;
  syncTick: (currentTime: number) => void;
}

export type LearnStore = LearnState & SessionAction & PlayerAction;
