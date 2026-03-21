import type { StoreSetter, StoreGetter } from "../types";
import type { LearnStore, TutorDto, QuestionDto, SessionAction } from "./types";
import { initialLearnState } from "./initialState";
import { SolutionController } from "@/lib/backend/sdk.gen";
import { backendClient } from "@/lib/backend-client";

export class SessionActionImpl {
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

  selectTutor = (tutor: TutorDto) => {
    this.#set({ selectedTutor: tutor, step: "pick-question", error: null });
  };

  setSearchQuery = (query: string) => {
    this.#set({ searchQuery: query });
  };

  generateSession = async (question: QuestionDto): Promise<string | null> => {
    const { selectedTutor } = this.#get();
    if (!selectedTutor) return null;

    this.#set({ selectedQuestion: question, step: "loading", error: null });

    try {
      if (question.id) {
        let solutionExists = false;
        try {
          const solutionRes = await SolutionController.solutionGetByQuestionId({
            client: backendClient,
            path: { questionId: question.id },
          });
          solutionExists = !!solutionRes.data?.data;
        } catch {
          solutionExists = false;
        }

        if (!solutionExists) {
          try {
            await fetch("/api/solutions/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                questionId: question.id,
                questionText: question.questionText,
                latexQuestionText: question.latexQuestionText,
                imageUrls: question.imageUrls,
              }),
            });
          } catch (solErr) {
            console.warn(
              "Solution generation failed, proceeding to TTS:",
              solErr,
            );
          }
        }
      }

      const response = await fetch("/api/tts/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: selectedTutor.voiceId,
          personaPrompt: selectedTutor.personaPrompt,
          questionText: question.questionText,
          latexQuestionText: question.latexQuestionText,
          questionId: question.id,
          tutorId: selectedTutor.id,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate explanation");
      }

      const data = await response.json();

      if (!data.learningSessionId) {
        throw new Error("No session ID returned from server");
      }

      this.#set({
        audioUrl: data.audioUrl || null,
        segments: data.segments || [],
        wordTimestamps: data.wordTimestamps || null,
        tutor: selectedTutor,
        question,
      });

      try {
        if (data.wordTimestamps) {
          sessionStorage.setItem(
            `learn-timestamps-${data.learningSessionId}`,
            JSON.stringify(data.wordTimestamps),
          );
        }
      } catch {
        // sessionStorage not available
      }

      return data.learningSessionId as string;
    } catch (err) {
      this.#set({
        error:
          err instanceof Error ? err.message : "Failed to generate explanation",
        step: "pick-question",
      });
      return null;
    }
  };

  goBack = () => {
    const { step } = this.#get();
    if (step === "pick-question") {
      this.#set({
        selectedTutor: null,
        searchQuery: "",
        step: "pick-tutor",
      });
    }
  };

  resetWizard = () => {
    this.#set({
      step: initialLearnState.step,
      selectedTutor: initialLearnState.selectedTutor,
      selectedQuestion: initialLearnState.selectedQuestion,
      searchQuery: initialLearnState.searchQuery,
      error: initialLearnState.error,
    });
  };
}

export type { SessionAction };
