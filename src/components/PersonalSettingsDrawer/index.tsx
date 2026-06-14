import React, { useEffect, useState } from "react";
import { Avatar, Button, Drawer, Form, Input, Skeleton, Tabs, message } from "antd";
import { Lock, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { ApiError, authService, getUserAvatarUrl, UserResponse } from "../../services";
import { StatusTag, StatusTagVariant } from "../StatusTag";
import defaultAvatar from "../../../assets/common/app-header-user-avatar.svg";
import "./index.less";

type PersonalSettingsDrawerProps = {
  open: boolean;
  onClose: () => void;
};

type ProfileFormValues = {
  nickname: string;
  email?: string;
  phone?: string;
};

type PasswordFormValues = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const AUTH_USER_STORAGE_KEY = "teamtrip-auth-user";
const PHONE_PATTERN = /^1[3-9]\d{9}$/;

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "请求失败，请稍后重试";
};

const getProfileStatusVariant = (statusText?: string | null): StatusTagVariant => {
  if (!statusText) {
    return "neutral";
  }

  if (statusText.includes("过期")) {
    return "expired";
  }

  if (statusText.includes("完成") || statusText.includes("正常") || statusText.includes("启用")) {
    return "completed";
  }

  if (statusText.includes("待") || statusText.includes("未")) {
    return "pending";
  }

  return "neutral";
};

const normalizeOptionalValue = (value?: string) => {
  const trimmed = value?.trim();

  return trimmed || undefined;
};

export function PersonalSettingsDrawer({ open, onClose }: PersonalSettingsDrawerProps) {
  const [messageApi, contextHolder] = message.useMessage();
  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isMounted = true;

    const loadUserInfo = async () => {
      try {
        setIsLoadingUser(true);

        const response = await authService.getUserInfo();

        if (!isMounted) {
          return;
        }

        setUser(response);
        profileForm.setFieldsValue({
          nickname: response.nickname || response.username || "",
          email: response.email || undefined,
          phone: response.phone || undefined,
        });
      } catch (error) {
        if (isMounted) {
          messageApi.error(getErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoadingUser(false);
        }
      }
    };

    loadUserInfo();

    return () => {
      isMounted = false;
    };
  }, [messageApi, open, profileForm]);

  const handleSaveProfile = async (values: ProfileFormValues) => {
    try {
      setIsSavingProfile(true);

      const updatedUser = await authService.updateProfile({
        nickname: values.nickname.trim(),
        email: normalizeOptionalValue(values.email),
        phone: normalizeOptionalValue(values.phone),
      });

      setUser(updatedUser);
      profileForm.setFieldsValue({
        nickname: updatedUser.nickname || updatedUser.username || "",
        email: updatedUser.email || undefined,
        phone: updatedUser.phone || undefined,
      });
      window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(updatedUser));
      messageApi.success("个人资料已保存");
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (values: PasswordFormValues) => {
    try {
      setIsChangingPassword(true);

      await authService.changePassword(values);
      passwordForm.resetFields();
      messageApi.success("密码已修改");
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const profileContent = (
    <Form
      className="personal-settings-form"
      form={profileForm}
      layout="vertical"
      requiredMark={false}
      onFinish={handleSaveProfile}
    >
      <Form.Item label="昵称" name="nickname" rules={[{ required: true, message: "请输入昵称" }, { max: 50, message: "昵称不能超过 50 个字符" }]}>
        <Input prefix={<User size={17} />} placeholder="请输入昵称" />
      </Form.Item>

      <Form.Item label="邮箱" name="email" rules={[{ type: "email", message: "邮箱格式不正确" }]}>
        <Input prefix={<Mail size={17} />} placeholder="邮箱（选填）" />
      </Form.Item>

      <Form.Item label="手机号" name="phone" rules={[{ pattern: PHONE_PATTERN, message: "手机号格式不正确" }]}>
        <Input prefix={<Phone size={17} />} placeholder="手机号（选填）" />
      </Form.Item>

      <Button block htmlType="submit" loading={isSavingProfile} type="primary">
        保存资料
      </Button>
    </Form>
  );

  const securityContent = (
    <Form
      className="personal-settings-form"
      form={passwordForm}
      layout="vertical"
      requiredMark={false}
      onFinish={handleChangePassword}
    >
      <Form.Item label="当前密码" name="oldPassword" rules={[{ required: true, message: "请输入当前密码" }]}>
        <Input.Password prefix={<Lock size={17} />} placeholder="请输入当前密码" autoComplete="current-password" />
      </Form.Item>

      <Form.Item label="新密码" name="newPassword" rules={[{ required: true, message: "请输入新密码" }, { min: 6, message: "新密码至少 6 位" }]}>
        <Input.Password prefix={<Lock size={17} />} placeholder="请输入新密码" autoComplete="new-password" />
      </Form.Item>

      <Form.Item
        label="确认新密码"
        name="confirmPassword"
        dependencies={["newPassword"]}
        rules={[
          { required: true, message: "请再次输入新密码" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("newPassword") === value) {
                return Promise.resolve();
              }

              return Promise.reject(new Error("两次新密码输入不一致"));
            },
          }),
        ]}
      >
        <Input.Password prefix={<Lock size={17} />} placeholder="请再次输入新密码" autoComplete="new-password" />
      </Form.Item>

      <Button block htmlType="submit" loading={isChangingPassword} type="primary">
        修改密码
      </Button>
    </Form>
  );

  return (
    <Drawer
      className="personal-settings-drawer"
      destroyOnHidden
      open={open}
      placement="right"
      size={440}
      title="个人设置"
      onClose={onClose}
    >
      {contextHolder}
      {isLoadingUser ? (
        <Skeleton active avatar paragraph={{ rows: 6 }} />
      ) : (
        <>
          <section className="personal-settings-profile">
            <Avatar size={72} src={getUserAvatarUrl(user) || defaultAvatar} />
            <div>
              <h2>{user?.nickname || user?.username || "旅行者"}</h2>
              <p>{user?.username || "当前登录账号"}</p>
              <div className="personal-settings-profile__tags">
                {user?.statusText && <StatusTag variant={getProfileStatusVariant(user.statusText)}>{user.statusText}</StatusTag>}
                {user?.tripProfileStatusText && (
                  <StatusTag variant={getProfileStatusVariant(user.tripProfileStatusText)}>{user.tripProfileStatusText}</StatusTag>
                )}
              </div>
            </div>
          </section>

          <div className="personal-settings-trip">
            <ShieldCheck size={18} />
            <span>Trip-BTI 画像状态</span>
            <strong>{user?.tripProfileStatusText || "未开始"}</strong>
          </div>

          <Tabs
            className="personal-settings-tabs"
            items={[
              { key: "profile", label: "基础资料", children: profileContent },
              { key: "security", label: "账号安全", children: securityContent },
            ]}
          />
        </>
      )}
    </Drawer>
  );
}
