import { backendClient } from "@/lib/backend-client";
import { AxiosError } from "axios";

export type SessionStateDto = {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  sessionId?: string;
  questionId?: string;
  tldrawSnapshot?: unknown;
};

type GenericResponse<T> = {
  data?: T;
  message?: string;
};

export async function fetchSessionState(
  sessionId: string,
  questionId: string,
): Promise<SessionStateDto | null> {
  try {
    const response = await backendClient.get<GenericResponse<SessionStateDto>>({
      url: "/session-states",
      query: { sessionId, questionId },
      throwOnError: true,
    });
    return response.data?.data ?? null;
  } catch (err) {
    if (err instanceof AxiosError && err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function upsertSessionState(
  payload: SessionStateDto,
): Promise<SessionStateDto> {
  const response = await backendClient.put<GenericResponse<SessionStateDto>>({
    url: "/session-states",
    body: payload,
    throwOnError: true,
  });
  return response.data?.data ?? payload;
}
