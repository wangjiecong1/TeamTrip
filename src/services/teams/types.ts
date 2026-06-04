export type ArchetypeSection = {
  code?: string;
  name?: string;
  tagline?: string;
  calcAt?: string;
};

export type MyTeamsUserSection = {
  userId: number;
  nickname: string;
  avatar?: string;
  tripProfileCompleted: boolean;
  tripProfileStatusText?: string;
  styleTags: string[];
  archetype?: ArchetypeSection | null;
};

export type MyTeamsStatsSection = {
  totalJoined: number;
  pendingAvailability: number;
  planningCount: number;
};

export type TeamCardResponse = {
  teamId: number;
  name: string;
  avatar?: string;
  destination?: string;
  memberCount: number;
  role: "owner" | "member" | string;
  roleText?: string;
  teamStatus?: number;
  teamStatusText?: string;
  locked?: boolean;
  inviteCode?: string;
  finalStartDate?: string;
  finalEndDate?: string;
  statusTag?: string;
};

export type MyTeamsOverviewResponse = {
  user: MyTeamsUserSection;
  stats: MyTeamsStatsSection;
  teams: TeamCardResponse[];
};

export type CreateTeamRequest = {
  name: string;
  destination?: string;
  description?: string;
};

export type JoinTeamRequest = {
  inviteCode: string;
};

export type JoinTeamResponse = {
  team: TeamCardResponse;
  needTripProfile: boolean;
};
