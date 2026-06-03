import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { ApiError, toApiError } from "./errors";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const AUTH_TOKEN_STORAGE_KEY = "teamtrip-auth-token";
const AUTH_REFRESH_TOKEN_STORAGE_KEY = "teamtrip-refresh-token";
const AUTH_USER_STORAGE_KEY = "teamtrip-auth-user";
const TOKEN_EXPIRY_SKEW_SECONDS = 30;

type ApiResponse<T> = {
  code?: number;
  message?: string;
  data?: T;
};

type LoginResponseLike = {
  user?: unknown;
  token?: string;
  accessToken?: string;
  refreshToken?: string | null;
  tokenType?: string;
  expiresIn?: number;
};

type AuthRetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshRequestPromise: Promise<LoginResponseLike> | null = null;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

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

const clearAuthSession = () => {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_REFRESH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
};

const getJwtPayload = (token: string) => {
  try {
    const [, payload] = token.split(".");

    if (!payload) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4), "=");

    return JSON.parse(window.atob(paddedPayload)) as { exp?: number };
  } catch {
    return null;
  }
};

const isAccessTokenValid = () => {
  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  if (!token) {
    return false;
  }

  const payload = getJwtPayload(token);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp > Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SKEW_SECONDS;
};

const redirectToLogin = () => {
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
};

const isAuthRefreshRequest = (url?: string) => url?.includes("/api/v1/auth/refresh");
const isPublicAuthRequest = (url?: string) => url?.includes("/api/v1/auth/login") || url?.includes("/api/v1/auth/register");

const persistLoginResponse = (loginResponse: LoginResponseLike) => {
  const token = loginResponse.accessToken || loginResponse.token;

  if (!token) {
    throw new ApiError("续期成功但未返回 accessToken", { status: 401 });
  }

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);

  if (loginResponse.refreshToken) {
    window.localStorage.setItem(AUTH_REFRESH_TOKEN_STORAGE_KEY, loginResponse.refreshToken);
  }

  if (loginResponse.user) {
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(loginResponse.user));
  }
};

const refreshAccessToken = async () => {
  const refreshToken = window.localStorage.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY);

  if (!refreshToken) {
    throw new ApiError("登录状态已过期，请重新登录", { status: 401 });
  }

  if (!refreshRequestPromise) {
    refreshRequestPromise = axios
      .request<LoginResponseLike | ApiResponse<LoginResponseLike>>({
        baseURL: API_BASE_URL,
        url: "/api/v1/auth/refresh",
        method: "post",
        params: { refreshToken },
        timeout: 12000,
        withCredentials: true,
      })
      .then((response) => {
        const loginResponse = unwrapApiResponse(response.data);
        persistLoginResponse(loginResponse);
        return loginResponse;
      })
      .finally(() => {
        refreshRequestPromise = null;
      });
  }

  return refreshRequestPromise;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalConfig = error.config as AuthRetryConfig | undefined;

    if (
      status === 401 &&
      originalConfig &&
      !originalConfig._retry &&
      !isAuthRefreshRequest(originalConfig.url) &&
      !isPublicAuthRequest(originalConfig.url)
    ) {
      originalConfig._retry = true;

      try {
        await refreshAccessToken();
        const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

        if (token) {
          originalConfig.headers.Authorization = `Bearer ${token}`;
        }

        return apiClient.request(originalConfig);
      } catch (refreshError) {
        const refreshStatus =
          refreshError instanceof ApiError ? refreshError.status : (refreshError as AxiosError | undefined)?.response?.status;

        if (refreshStatus === 401 || refreshStatus === 404) {
          clearAuthSession();
          redirectToLogin();
        }

        return Promise.reject(toApiError(refreshError));
      }
    }

    return Promise.reject(toApiError(error));
  },
);

export const authTokenStorage = {
  key: AUTH_TOKEN_STORAGE_KEY,
  refreshKey: AUTH_REFRESH_TOKEN_STORAGE_KEY,
  get: () => window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
  getRefresh: () => window.localStorage.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY),
  isAccessTokenValid,
  set: (token: string) => window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token),
  setRefresh: (token: string) => window.localStorage.setItem(AUTH_REFRESH_TOKEN_STORAGE_KEY, token),
  clearRefresh: () => window.localStorage.removeItem(AUTH_REFRESH_TOKEN_STORAGE_KEY),
  clear: clearAuthSession,
};
