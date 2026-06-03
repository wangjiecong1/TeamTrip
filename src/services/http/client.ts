import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toApiError } from "./errors";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const AUTH_TOKEN_STORAGE_KEY = "teamtrip-auth-token";

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

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(toApiError(error)),
);

export const authTokenStorage = {
  key: AUTH_TOKEN_STORAGE_KEY,
  get: () => window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
  set: (token: string) => window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token),
  clear: () => window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY),
};
