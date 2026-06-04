import { apiClient } from "../http/client";
import { ApiError } from "../http/errors";
import { ApiResponse, ChangePasswordRequest, LoginRequest, LoginResponse, RegisterRequest, UpdateProfileRequest, UserResponse } from "./types";
import { normalizeRegisterRequest } from "./validation";

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

export const authService = {
  register: async (request: RegisterRequest): Promise<UserResponse> => {
    const payload = normalizeRegisterRequest(request);
    const response = await apiClient.post<UserResponse | ApiResponse<UserResponse>>("/api/v1/auth/register", payload);

    return unwrapApiResponse(response.data);
  },

  login: async (request: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse | ApiResponse<LoginResponse>>("/api/v1/auth/login", {
      username: request.username.trim(),
      password: request.password,
      rememberMe: request.rememberMe ?? false,
    });

    return unwrapApiResponse(response.data);
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/api/v1/auth/logout");
  },

  getUserInfo: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse | ApiResponse<UserResponse>>("/api/v1/auth/userinfo");

    return unwrapApiResponse(response.data);
  },

  updateProfile: async (request: UpdateProfileRequest): Promise<UserResponse> => {
    const response = await apiClient.put<UserResponse | ApiResponse<UserResponse>>("/api/v1/users/me/profile", request);

    return unwrapApiResponse(response.data);
  },

  changePassword: async (request: ChangePasswordRequest): Promise<void> => {
    const response = await apiClient.put<void | ApiResponse<void>>("/api/v1/users/me/password", request);

    unwrapApiResponse(response.data);
  },
};
