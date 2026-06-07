export type FeedbackType = 0 | 1;

export type SubmitFeedbackRequest = {
  feedbackType: FeedbackType;
  content?: string;
  contact?: string;
  appVersion?: string;
  platform?: string;
};

export type UserFeedbackResponse = {
  id: number;
  userId: number;
  username?: string;
  nickname?: string;
  avatar?: string;
  feedbackType: FeedbackType;
  feedbackTypeText?: string;
  content?: string;
  contact?: string;
  appVersion?: string;
  platform?: string;
  handledStatus?: number;
  handledStatusText?: string;
  adminRemark?: string;
  handlerId?: number;
  handlerNickname?: string;
  handledTime?: string;
  createTime?: string;
  updateTime?: string;
};
