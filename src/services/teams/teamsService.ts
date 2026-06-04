import { apiClient } from "../http/client";
import { ApiError } from "../http/errors";
import { CreateTeamRequest, JoinTeamRequest, JoinTeamResponse, MyTeamsOverviewResponse, TeamCardResponse } from "./types";

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

export const teamsService = {
  getOverview: async (): Promise<MyTeamsOverviewResponse> => {
    const response = await apiClient.get<MyTeamsOverviewResponse | ApiResponse<MyTeamsOverviewResponse>>("/api/v1/teams/overview");

    return unwrapApiResponse(response.data);
  },

  createTeam: async (request: CreateTeamRequest): Promise<TeamCardResponse> => {
    const response = await apiClient.post<TeamCardResponse | ApiResponse<TeamCardResponse>>("/api/v1/teams", request);

    return unwrapApiResponse(response.data);
  },

  joinTeam: async (request: JoinTeamRequest): Promise<JoinTeamResponse> => {
    const response = await apiClient.post<JoinTeamResponse | ApiResponse<JoinTeamResponse>>("/api/v1/teams/join", request);

    return unwrapApiResponse(response.data);
  },
};
