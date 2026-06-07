import { apiClient } from "../http/client";
import { ApiError } from "../http/errors";
import { SubmitFeedbackRequest, UserFeedbackResponse } from "./types";

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

export const feedbacksService = {
  submitFeedback: async (request: SubmitFeedbackRequest): Promise<UserFeedbackResponse> => {
    const response = await apiClient.post<UserFeedbackResponse | ApiResponse<UserFeedbackResponse>>("/api/v1/feedbacks", request);

    return unwrapApiResponse(response.data);
  },
};
