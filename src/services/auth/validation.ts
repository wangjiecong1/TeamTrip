import { ApiError } from "../http/errors";
import { RegisterRequest } from "./types";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^1[3-9]\d{9}$/;

export const normalizeRegisterRequest = (request: RegisterRequest): RegisterRequest => ({
  username: request.username.trim(),
  password: request.password,
  confirmPassword: request.confirmPassword,
  nickname: request.nickname.trim(),
  email: request.email?.trim() || undefined,
  phone: request.phone?.trim() || undefined,
});

export const validateRegisterRequest = (request: RegisterRequest) => {
  const normalized = normalizeRegisterRequest(request);

  if (normalized.username.length < 3 || normalized.username.length > 50) {
    throw new ApiError("用户名长度在3-50个字符之间", { status: 400, code: "VALIDATION_ERROR" });
  }

  if (!USERNAME_PATTERN.test(normalized.username)) {
    throw new ApiError("用户名只能包含字母、数字和下划线", { status: 400, code: "VALIDATION_ERROR" });
  }

  if (!normalized.nickname) {
    throw new ApiError("请输入昵称", { status: 400, code: "VALIDATION_ERROR" });
  }

  if (normalized.password.length < 6 || normalized.password.length > 100) {
    throw new ApiError("密码长度在6-100个字符之间", { status: 400, code: "VALIDATION_ERROR" });
  }

  if (normalized.confirmPassword !== normalized.password) {
    throw new ApiError("两次密码输入不一致", { status: 400, code: "VALIDATION_ERROR" });
  }

  if (normalized.nickname.length > 50) {
    throw new ApiError("昵称长度不能超过50个字符", { status: 400, code: "VALIDATION_ERROR" });
  }

  if (normalized.email && !EMAIL_PATTERN.test(normalized.email)) {
    throw new ApiError("邮箱格式不正确", { status: 400, code: "VALIDATION_ERROR" });
  }

  if (normalized.phone && !PHONE_PATTERN.test(normalized.phone)) {
    throw new ApiError("手机号格式不正确", { status: 400, code: "VALIDATION_ERROR" });
  }

  return normalized;
};
