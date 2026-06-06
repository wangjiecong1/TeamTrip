import { apiClient } from "../http/client";
import { ApiError } from "../http/errors";
import {
  CreateTeamRequest,
  JoinTeamRequest,
  JoinTeamResponse,
  LockDatesRequest,
  MyAvailabilityResponse,
  MyTeamsOverviewResponse,
  SaveAvailabilityRequest,
  TeamCalendarResponse,
  TeamCardResponse,
  TeamDetailResponse,
  TeamMembersResponse,
  TeamPortraitResponse,
  WorkbenchPreparationResponse,
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

  getDetail: async (teamId: string | number): Promise<TeamDetailResponse> => {
    const response = await apiClient.get<TeamCardResponse | ApiResponse<TeamCardResponse>>(`/api/v1/teams/${teamId}`);
    const team = unwrapApiResponse(response.data);

    return {
      ...team,
      locked: Boolean(team.locked),
      totalMemberCount: team.memberCount,
      memberCount: team.memberCount,
      myRole: team.role,
      canLockDates: team.role === "owner" && !team.locked,
      canUnlockDates: team.role === "owner" && Boolean(team.locked),
    };
  },

  getMembers: async (teamId: string | number): Promise<TeamMembersResponse> => {
    const response = await apiClient.get<
      | TeamMembersResponse
      | { total: number; members: TeamMembersResponse["items"] }
      | ApiResponse<TeamMembersResponse | { total: number; members: TeamMembersResponse["items"] }>
    >(`/api/v1/teams/${teamId}/workbench/members`);
    const membersResponse = unwrapApiResponse(response.data);

    if ("members" in membersResponse) {
      return {
        total: membersResponse.total,
        items: membersResponse.members.map((member) => ({
          ...member,
          roleText: member.role === "owner" ? "Owner" : "成员",
        })),
      };
    }

    return membersResponse;
  },

  getPortrait: async (teamId: string | number): Promise<TeamPortraitResponse> => {
    const response = await apiClient.get<TeamPortraitResponse | ApiResponse<TeamPortraitResponse>>(
      `/api/v1/teams/${teamId}/workbench/portrait`,
    );
    const portrait = unwrapApiResponse(response.data);

    return {
      ...portrait,
      keywords: portrait.keywords || [],
      dimensions: (portrait.dimensions || []).map((dimension) => ({
        ...dimension,
        dimension: dimension.dimension || dimension.key || dimension.label,
        left: dimension.left || dimension.leftPolarity,
        right: dimension.right || dimension.rightPolarity,
        averageScore: dimension.averageScore ?? dimension.score ?? 0.5,
      })),
    };
  },

  getPreparation: async (teamId: string | number): Promise<WorkbenchPreparationResponse> => {
    const response = await apiClient.get<WorkbenchPreparationResponse | ApiResponse<WorkbenchPreparationResponse>>(
      `/api/v1/teams/${teamId}/workbench/preparation`,
    );
    const preparation = unwrapApiResponse(response.data);

    return {
      ...preparation,
      availabilityRangeCount: preparation.availabilityRangeCount ?? preparation.myDateRanges?.length ?? 0,
      myDateRanges: preparation.myDateRanges || [],
    };
  },

  getMyAvailability: async (teamId: string | number): Promise<MyAvailabilityResponse> => {
    const preparation = await teamsService.getPreparation(teamId);

    return { dateRanges: preparation.myDateRanges };
  },

  getCalendar: async (teamId: string | number, yearMonth: string): Promise<TeamCalendarResponse> => {
    const response = await apiClient.get<TeamCalendarResponse | ApiResponse<TeamCalendarResponse>>(
      `/api/v1/teams/${teamId}/workbench/calendar`,
      {
        params: { yearMonth },
      },
    );

    return unwrapApiResponse(response.data);
  },

  saveAvailability: async (teamId: string | number, request: SaveAvailabilityRequest): Promise<void> => {
    const response = await apiClient.put<ApiResponse<unknown> | unknown>(`/api/v1/teams/${teamId}/availability`, request);

    unwrapApiResponse(response.data);
  },

  lockDates: async (teamId: string | number, request: LockDatesRequest): Promise<void> => {
    const response = await apiClient.post<ApiResponse<unknown> | unknown>(`/api/v1/teams/${teamId}/lock-dates`, request);

    unwrapApiResponse(response.data);
  },

  unlockDates: async (teamId: string | number): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<unknown> | unknown>(`/api/v1/teams/${teamId}/lock-dates`);

    unwrapApiResponse(response.data);
  },
};
