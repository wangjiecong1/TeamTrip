export type RegisterRequest = {
  username: string;
  password: string;
  confirmPassword: string;
  nickname: string;
  email?: string;
  phone?: string;
};

export type LoginRequest = {
  username: string;
  password: string;
  rememberMe?: boolean | null;
};

export type UserResponse = {
  id: string | number;
  username: string;
  nickname: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  avatarUrl?: string | null;
  status?: number;
  statusText?: string | null;
  userType?: number;
  userTypeText?: string | null;
  hasTripProfile?: number;
  tripProfileStatus?: number;
  tripProfileStatusText?: string | null;
  isAdmin?: number;
  lastLoginTime?: string | null;
  createTime?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiResponse<T> = {
  code?: number;
  message?: string;
  data?: T;
};

export type LoginResponse = {
  user?: UserResponse;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
};

export type UpdateProfileRequest = {
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
};

export type ChangePasswordRequest = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};
