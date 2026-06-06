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

export type TeamDetailResponse = {
  teamId: number;
  name: string;
  destination?: string;
  avatar?: string;
  cityThumbnail?: string;
  inviteCode?: string;
  ownerNickname?: string;
  totalMemberCount: number;
  memberCount?: number;
  tripProfileDoneCount?: number;
  availabilityDoneCount?: number;
  teamStatus?: number;
  teamStatusText?: string;
  locked: boolean;
  finalStartDate?: string | null;
  finalEndDate?: string | null;
  myRole: "owner" | "member" | string;
  canLockDates?: boolean;
  canUnlockDates?: boolean;
  statusTag?: string;
};

export type TeamMemberResponse = {
  userId: number;
  nickname: string;
  avatar?: string;
  role: "owner" | "member" | string;
  roleText?: string;
  tripProfileCompleted: boolean;
  availabilitySubmitted: boolean;
};

export type TeamMembersResponse = {
  total: number;
  items: TeamMemberResponse[];
};

export type TeamPortraitDimension = {
  dimension: string;
  key?: string;
  label: string;
  left?: string;
  right?: string;
  leftPolarity?: string;
  rightPolarity?: string;
  averageScore: number;
  score?: number;
  polarity?: "L" | "R" | "X" | string;
  order?: number;
  diffScore?: number;
  extremeLeftCount?: number;
  extremeRightCount?: number;
  riskLevel?: "low" | "medium" | "high" | string;
  suggestionText?: string;
};

export type TeamPortraitArchetype = {
  code?: string;
  name: string;
  count: number;
  ratio: number;
};

export type TeamPortraitResponse = {
  memberCount: number;
  summaryText?: string;
  keywords: string[];
  archetypeDistribution?: TeamPortraitArchetype[];
  dimensions: TeamPortraitDimension[];
  computedAt?: string;
  cacheTtlSeconds?: number;
};

export type DateRange = {
  startDate: string;
  endDate: string;
};

export type MyAvailabilityResponse = {
  dateRanges: DateRange[];
};

export type WorkbenchPreparationResponse = {
  tripProfileCompleted: boolean;
  tripProfileStatusText?: string;
  availabilitySubmitted: boolean;
  availabilityRangeCount: number;
  myDateRanges: DateRange[];
};

export type TeamCalendarLevel = "all" | "most" | "some" | "none" | "unknown" | string;

export type TeamCalendarDay = {
  date: string;
  availableCount: number;
  level: TeamCalendarLevel;
};

export type TeamCalendarResponse = {
  yearMonth: string;
  totalMembers: number;
  submittedCount?: number;
  days: TeamCalendarDay[];
  goldenDates: DateRange[];
  hasGoldenDates: boolean;
  finalDates?: DateRange[];
};

export type SaveAvailabilityRequest = {
  dateRanges: DateRange[];
};

export type LockDatesRequest = DateRange;
