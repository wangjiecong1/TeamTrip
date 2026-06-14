import { apiClient } from "../http/client";
import { ApiError } from "../http/errors";
import { UploadBizType, UploadFileResponse } from "./types";

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

export const uploadService = {
  uploadFile: async (file: File, bizType: UploadBizType): Promise<UploadFileResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bizType", bizType);

    const response = await apiClient.post<UploadFileResponse | ApiResponse<UploadFileResponse>>("/api/v1/files/upload", formData, {
      headers: {
        "Content-Type": undefined,
      },
    });

    return unwrapApiResponse(response.data);
  },
};
