import { AxiosError } from "axios";

export type ApiErrorPayload = {
  code?: string;
  message?: string;
  details?: unknown;
};

export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;

  constructor(message: string, options: { status?: number; code?: string; details?: unknown } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

export const toApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  const axiosError = error as AxiosError<ApiErrorPayload>;

  if (axiosError.isAxiosError) {
    const payload = axiosError.response?.data;
    const message = payload?.message || axiosError.message || "请求失败，请稍后重试";

    return new ApiError(message, {
      status: axiosError.response?.status,
      code: payload?.code,
      details: payload?.details,
    });
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError("请求失败，请稍后重试");
};
