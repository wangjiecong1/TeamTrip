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
  avatarUrl?: string | null;
  tbtiAvatarUrl?: string | null;
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
  displayCoverUrl?: string | null;
  coverUrl?: string | null;
  currentUserRole?: "owner" | "member" | string;
  ownerId?: number;
  destination?: string;
  memberCount: number;
  role: "owner" | "member" | string;
  roleText?: string;
  teamStatus?: number;
  teamStatusText?: string;
  dateLocked?: boolean | number;
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

export type ShareLinkResponse = {
  token: string;
  url: string;
  teamId: number;
  createTime?: string;
};

export type UpdateTeamRequest = {
  name?: string;
  coverFileId?: number;
};

export type TeamInviteResponse = {
  inviteCode: string;
  teamName: string;
  inviteText: string;
  inviteUrl?: string | null;
};

export type TeamDetailResponse = {
  teamId: number;
  name: string;
  destination?: string;
  avatar?: string;
  displayCoverUrl?: string | null;
  coverUrl?: string | null;
  cityThumbnail?: string;
  inviteCode?: string;
  ownerId?: number;
  ownerNickname?: string;
  totalMemberCount: number;
  memberCount?: number;
  tripProfileDoneCount?: number;
  availabilityDoneCount?: number;
  teamStatus?: number;
  teamStatusText?: string;
  dateLocked: boolean;
  locked: boolean;
  finalStartDate?: string | null;
  finalEndDate?: string | null;
  myRole: "owner" | "member" | string;
  currentUserRole?: "owner" | "member" | string;
  canLockDates?: boolean;
  canUnlockDates?: boolean;
  statusTag?: string;
};

export type TeamMemberResponse = {
  userId: number;
  nickname: string;
  avatar?: string;
  avatarUrl?: string | null;
  tbtiAvatarUrl?: string | null;
  tbtiCompleted?: boolean;
  tbtiTypeName?: string | null;
  availabilityCompleted?: boolean;
  joinedAt?: string;
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

export type TeamPortraitAiSummary = {
  teamStyle?: string | null;
  teamStyleDesc?: string | null;
  planningAdvice?: string[] | string | null;
  riskLevel?: "low" | "medium" | "high" | string | null;
  riskDesc?: string | null;
  schedulingRules?: string[] | string | null;
  source?: string | null;
  generatedAt?: string | null;
  llmProvider?: string | null;
};

export type TeamPortraitResponse = TeamPortraitAiSummary & {
  memberCount: number;
  summaryText?: string;
  aiSummary?: TeamPortraitAiSummary | null;
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
