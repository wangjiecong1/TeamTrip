export type TripBtiQuestion = {
  questionNo: number;
  dimension: string;
  dimensionLabel: string;
  leftLabel: string;
  rightLabel: string;
  leftText: string;
  rightText: string;
  scoreValues: number[];
};

export type TripBtiQuestionsResponse = {
  questionnaireId: number;
  versionId: number;
  versionNo: string;
  total: number;
  questions: TripBtiQuestion[];
};

export type TripBtiAnswerItem = {
  questionNo: number;
  score: number;
};

export type SubmitTripBtiAnswersRequest = {
  versionId?: number;
  durationSec?: number;
  answers: TripBtiAnswerItem[];
};

export type ArchetypeCandidate = {
  code: string;
  name: string;
  tagline?: string;
  description?: string;
  traits?: string[];
  tips?: string[];
  matchScore?: number;
  matchType?: string;
};

export type TripBtiProfile = {
  userId?: number;
  hasTripProfile: boolean;
  tripProfileStatus?: number;
  tripProfileStatusText?: string;
  prompt?: string;
  schedule?: number;
  interest?: number;
  planning?: number;
  physical?: number;
  environment?: number;
  food?: number;
  photo?: number;
  social?: number;
  budget?: number;
  exploration?: number;
  typeCode?: string;
  archetypeCode?: string | null;
  archetypeName?: string | null;
  archetypeTagline?: string | null;
  archetypeCalcAt?: string;
  archetypeCandidates?: ArchetypeCandidate[];
  updatedAt?: string;
  lastAnswerRecordId?: number;
  lastQuestionnaireVersionId?: number;
  lastVersionNo?: string;
};

export type ConfirmArchetypeRequest = {
  archetypeCode: string;
};

export type AnswerRecordSummary = {
  id: number;
  questionnaireId?: number;
  questionnaireVersionId?: number;
  versionNo?: string;
  typeCode?: string;
  submittedAt?: string;
  isCurrent?: number;
};

export type AnswerRecordDetail = AnswerRecordSummary & {
  rawAnswers?: string;
  dimensionSnapshot?: string;
  durationSec?: number;
  schedule?: number;
  interest?: number;
  planning?: number;
  physical?: number;
  environment?: number;
  food?: number;
  photo?: number;
  social?: number;
  budget?: number;
  exploration?: number;
};
