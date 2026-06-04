import { apiClient } from "../http/client";
import { ApiError } from "../http/errors";
import {
  AnswerRecordDetail,
  AnswerRecordSummary,
  ArchetypeCandidate,
  ConfirmArchetypeRequest,
  SubmitTripBtiAnswersRequest,
  TripBtiProfile,
  TripBtiQuestionsResponse,
} from "./types";

type ApiResponse<T> = {
  code?: number;
  message?: string;
  data?: T;
};

const isWrappedApiResponse = <T>(response: T | ApiResponse<T>): response is ApiResponse<T> =>
  Boolean(response && typeof response === "object" && ("code" in response || "data" in response || "message" in response));

const unwrapApiResponse = <T>(response: T | ApiResponse<T>): T => {
  if (isWrappedApiResponse(response)) {
    const isSuccess = response.code === undefined || response.code === 200;

    if (!isSuccess) {
      throw new ApiError(response.message || "请求失败，请稍后重试", { status: response.code, code: String(response.code) });
    }

    if (response.data !== undefined && response.data !== null) {
      return response.data;
    }
  }

  return response as T;
};

export const tripBtiService = {
  getQuestions: async (): Promise<TripBtiQuestionsResponse> => {
    const response = await apiClient.get<TripBtiQuestionsResponse | ApiResponse<TripBtiQuestionsResponse>>(
      "/api/v1/trip-profile/questions",
    );

    return unwrapApiResponse(response.data);
  },

  submitAnswers: async (request: SubmitTripBtiAnswersRequest): Promise<TripBtiProfile> => {
    const response = await apiClient.post<TripBtiProfile | ApiResponse<TripBtiProfile>>("/api/v1/trip-profile/submit", request);

    return unwrapApiResponse(response.data);
  },

  getMyProfile: async (): Promise<TripBtiProfile> => {
    const response = await apiClient.get<TripBtiProfile | ApiResponse<TripBtiProfile>>("/api/v1/trip-profile/my");

    return unwrapApiResponse(response.data);
  },

  confirmArchetype: async (request: ConfirmArchetypeRequest): Promise<TripBtiProfile> => {
    const response = await apiClient.post<TripBtiProfile | ApiResponse<TripBtiProfile>>(
      "/api/v1/trip-profile/archetype/confirm",
      request,
    );

    return unwrapApiResponse(response.data);
  },

  getCandidates: async (): Promise<ArchetypeCandidate[]> => {
    const response = await apiClient.get<ArchetypeCandidate[] | ApiResponse<ArchetypeCandidate[]>>(
      "/api/v1/trip-profile/archetype/candidates",
    );

    return unwrapApiResponse(response.data);
  },

  listHistory: async (): Promise<AnswerRecordSummary[]> => {
    const response = await apiClient.get<AnswerRecordSummary[] | ApiResponse<AnswerRecordSummary[]>>("/api/v1/trip-profile/history");

    return unwrapApiResponse(response.data);
  },

  getHistoryDetail: async (recordId: number): Promise<AnswerRecordDetail> => {
    const response = await apiClient.get<AnswerRecordDetail | ApiResponse<AnswerRecordDetail>>(
      `/api/v1/trip-profile/history/${recordId}`,
    );

    return unwrapApiResponse(response.data);
  },

  saveProgress: async (): Promise<void> => {
    await apiClient.post("/api/v1/trip-profile/progress");
  },

  retest: async (versionId?: number): Promise<void> => {
    await apiClient.post("/api/v1/trip-profile/retest", null, {
      params: versionId ? { versionId } : undefined,
    });
  },
};
