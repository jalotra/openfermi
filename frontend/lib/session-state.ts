import { backendClient } from "@/lib/backend-client";
import { AxiosError } from "axios";
import { SessionStateController } from "./backend/sdk.gen";
import {
  SessionStateDto,
  SessionstateGetStateResponse,
  SessionstateUpsertStateData,
  SessionstateUpsertStateResponse,
} from "./backend/types.gen";

type GenericResponse<T> = {
  data?: T;
  message?: string;
};

export async function fetchSessionState(
  sessionId: string,
  questionId: string,
): Promise<SessionstateGetStateResponse | null> {
  try {
    const response = await SessionStateController.sessionstateGetState({
      client: backendClient,
      query: { sessionId, questionId },
    });
    return response.data ?? null;
  } catch (err) {
    if (err instanceof AxiosError && err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function upsertSessionState(
  payload: SessionStateDto,
): Promise<SessionstateUpsertStateResponse | null> {
  try {
    const response = await SessionStateController.sessionstateUpsertState({
      client: backendClient,
      body: payload,
    });
    return response.data ?? null;
  } catch (err) {
    throw err;
  }
}
