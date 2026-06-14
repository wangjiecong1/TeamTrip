import { UserResponse } from "./types";

export const getUserAvatarUrl = (user?: Pick<UserResponse, "tbtiAvatarUrl" | "avatar" | "avatarUrl"> | null) =>
  user?.tbtiAvatarUrl || user?.avatar || user?.avatarUrl || undefined;

