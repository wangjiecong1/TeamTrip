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
  ShareLinkResponse,
  TeamCalendarResponse,
  TeamCardResponse,
  TeamDetailResponse,
  TeamInviteResponse,
  TeamMembersResponse,
  TeamPortraitResponse,
  UpdateTeamRequest,
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

const normalizeMember = (member: TeamMembersResponse["items"][number]): TeamMembersResponse["items"][number] => ({
  ...member,
  avatar: member.tbtiAvatarUrl || member.avatarUrl || member.avatar,
  roleText: member.role === "owner" ? "Owner" : member.roleText || "成员",
  tripProfileCompleted: member.tripProfileCompleted ?? Boolean(member.tbtiCompleted),
  availabilitySubmitted: member.availabilitySubmitted ?? Boolean(member.availabilityCompleted),
});

const normalizeMembersResponse = (
  membersResponse: TeamMembersResponse | { total?: number; members: TeamMembersResponse["items"] } | TeamMembersResponse["items"],
): TeamMembersResponse => {
  if (Array.isArray(membersResponse)) {
    return {
      total: membersResponse.length,
      items: membersResponse.map(normalizeMember),
    };
  }

  if ("members" in membersResponse) {
    return {
      total: membersResponse.total ?? membersResponse.members.length,
      items: membersResponse.members.map(normalizeMember),
    };
  }

  return {
    ...membersResponse,
    items: membersResponse.items.map(normalizeMember),
  };
};

type TeamRoleSource = {
  currentUserRole?: "owner" | "member" | string;
  role?: "owner" | "member" | string;
  myRole?: "owner" | "member" | string;
};

const getTeamRole = (team: TeamRoleSource) => team.currentUserRole || team.role || team.myRole || "member";

const getDisplayCoverUrl = (team: Pick<TeamCardResponse, "avatar" | "coverUrl">) => team.coverUrl || team.avatar || null;

const normalizeTeamCard = (team: TeamCardResponse): TeamCardResponse => {
  const role = getTeamRole(team);

  return {
    ...team,
    currentUserRole: role,
    role,
    displayCoverUrl: getDisplayCoverUrl(team),
  };
};

const normalizeTeamDetail = (team: TeamDetailResponse | TeamCardResponse): TeamDetailResponse => {
  const role = getTeamRole(team);
  const dateLocked =
    team.dateLocked === true ||
    Number(team.dateLocked) === 1 ||
    Boolean(team.finalStartDate && team.finalEndDate);
  const memberCount = team.memberCount ?? ("totalMemberCount" in team ? team.totalMemberCount : undefined) ?? 0;

  return {
    ...team,
    displayCoverUrl: getDisplayCoverUrl(team),
    dateLocked,
    locked: Boolean(team.locked),
    totalMemberCount: "totalMemberCount" in team ? team.totalMemberCount ?? memberCount : memberCount,
    memberCount,
    myRole: role,
    currentUserRole: role,
    canLockDates: role === "owner" && !dateLocked,
    canUnlockDates: role === "owner" && dateLocked,
  };
};

export const teamsService = {
  getOverview: async (): Promise<MyTeamsOverviewResponse> => {
    const response = await apiClient.get<MyTeamsOverviewResponse | ApiResponse<MyTeamsOverviewResponse>>("/api/v1/teams/overview");

    const overview = unwrapApiResponse(response.data);

    return {
      ...overview,
      teams: (overview.teams || []).map(normalizeTeamCard),
      user: {
        ...overview.user,
        avatar: overview.user.tbtiAvatarUrl || overview.user.avatarUrl || overview.user.avatar,
      },
    };
  },

  createTeam: async (request: CreateTeamRequest): Promise<TeamCardResponse> => {
    const response = await apiClient.post<TeamCardResponse | ApiResponse<TeamCardResponse>>("/api/v1/teams", request);

    return normalizeTeamCard(unwrapApiResponse(response.data));
  },

  leaveTeam: async (teamId: string | number): Promise<void> => {
    const response = await apiClient.post<ApiResponse<unknown> | unknown>(`/api/v1/teams/${teamId}/leave`);

    unwrapApiResponse(response.data);
  },

  joinTeam: async (request: JoinTeamRequest): Promise<JoinTeamResponse> => {
    const response = await apiClient.post<JoinTeamResponse | ApiResponse<JoinTeamResponse>>("/api/v1/teams/join", request);

    const joined = unwrapApiResponse(response.data);

    return {
      ...joined,
      team: normalizeTeamCard(joined.team),
    };
  },

  createShareLink: async (teamId: string | number): Promise<ShareLinkResponse> => {
    const response = await apiClient.post<ShareLinkResponse | ApiResponse<ShareLinkResponse>>(`/api/v1/teams/${teamId}/share`);

    return unwrapApiResponse(response.data);
  },

  getDetail: async (teamId: string | number): Promise<TeamDetailResponse> => {
    const response = await apiClient.get<
      TeamDetailResponse | TeamCardResponse | ApiResponse<TeamDetailResponse | TeamCardResponse>
    >(`/api/v1/teams/${teamId}`);

    return normalizeTeamDetail(unwrapApiResponse(response.data));
  },

  getMembers: async (teamId: string | number): Promise<TeamMembersResponse> => {
    const response = await apiClient.get<
      | TeamMembersResponse
      | { total: number; members: TeamMembersResponse["items"] }
      | ApiResponse<TeamMembersResponse | { total: number; members: TeamMembersResponse["items"] }>
    >(`/api/v1/teams/${teamId}/workbench/members`);
    const membersResponse = unwrapApiResponse(response.data);

    return normalizeMembersResponse(membersResponse);
  },

  getManagementMembers: async (teamId: string | number): Promise<TeamMembersResponse> => {
    return teamsService.getMembers(teamId);
  },

  getInvite: async (teamId: string | number): Promise<TeamInviteResponse> => {
    const response = await apiClient.get<TeamInviteResponse | ApiResponse<TeamInviteResponse>>(`/api/v1/teams/${teamId}/invite`);

    return unwrapApiResponse(response.data);
  },

  updateTeam: async (teamId: string | number, request: UpdateTeamRequest): Promise<TeamDetailResponse> => {
    const response = await apiClient.patch<
      TeamDetailResponse | TeamCardResponse | ApiResponse<TeamDetailResponse | TeamCardResponse>
    >(`/api/v1/teams/${teamId}`, request);

    return normalizeTeamDetail(unwrapApiResponse(response.data));
  },

  removeMember: async (teamId: string | number, userId: string | number): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<unknown> | unknown>(`/api/v1/teams/${teamId}/members/${userId}`);

    unwrapApiResponse(response.data);
  },

  transferOwner: async (teamId: string | number, targetUserId: string | number): Promise<void> => {
    const response = await apiClient.post<ApiResponse<unknown> | unknown>(`/api/v1/teams/${teamId}/transfer-owner`, {
      targetUserId,
    });

    unwrapApiResponse(response.data);
  },

  getPortrait: async (teamId: string | number): Promise<TeamPortraitResponse> => {
    const response = await apiClient.get<TeamPortraitResponse | ApiResponse<TeamPortraitResponse>>(
      `/api/v1/teams/${teamId}/workbench/portrait`,
    );
    const portrait = unwrapApiResponse(response.data);

    return {
      ...portrait,
      ...portrait.aiSummary,
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
