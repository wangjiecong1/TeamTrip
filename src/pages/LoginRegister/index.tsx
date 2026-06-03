import React, { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronDown,
  Globe2,
  Headphones,
  MapPin,
  SmilePlus,
  UserPlus,
} from "lucide-react";
import { Button, Checkbox, Form, Input } from "antd";
import { LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import loginHeroApproved from "../../../assets/login-register/login-register-hero-approved.webp";
import { BrandMark } from "../../components/BrandMark";
import { FeatureItem } from "../../components/FeatureItem";
import { ApiError, authService, authTokenStorage, LoginRequest, LoginResponse, RegisterRequest } from "../../services";
import "./index.less";

type AuthMode = "login" | "register";

type FormValues = {
  nickname?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  email?: string;
  phone?: string;
  agreement?: boolean;
};

const getLoginToken = (response: LoginResponse) => response.accessToken || response.token || "";

export function LoginRegisterPage() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [message, setMessage] = useState("");
  const [formInstance] = Form.useForm<FormValues>();
  const hasValidAccessToken = authTokenStorage.isAccessTokenValid();
  const hasRefreshToken = Boolean(authTokenStorage.getRefresh());
  const shouldRedirectAuthenticatedUser = hasValidAccessToken || hasRefreshToken;
  const shouldClearExpiredSession = !shouldRedirectAuthenticatedUser && Boolean(authTokenStorage.get());

  useEffect(() => {
    if (shouldClearExpiredSession) {
      authTokenStorage.clear();
    }
  }, [shouldClearExpiredSession]);

  if (shouldRedirectAuthenticatedUser) {
    return <Navigate to="/teams" replace />;
  }

  const handleLoginSuccess = (loginResponse: LoginResponse, fallbackUser: { username: string; nickname?: string }) => {
    const token = getLoginToken(loginResponse);

    if (!token) {
      setMessage("登录成功但未返回 token，请检查 LoginResponse 结构");
      return;
    }

    authTokenStorage.set(token);
    if (loginResponse.refreshToken) {
      authTokenStorage.setRefresh(loginResponse.refreshToken);
    } else {
      authTokenStorage.clearRefresh();
    }
    window.localStorage.setItem(
      "teamtrip-auth-user",
      JSON.stringify(loginResponse.user ?? { username: fallbackUser.username.trim(), nickname: fallbackUser.nickname?.trim() || fallbackUser.username.trim() }),
    );
    navigate("/teams");
  };

  const loginMutation = useMutation({
    mutationFn: (request: LoginRequest) => authService.login(request),
    onSuccess: (loginResponse) => {
      const values = formInstance.getFieldsValue();
      handleLoginSuccess(loginResponse, { username: values.username ?? "" });
    },
    onError: (error) => {
      setMessage(error instanceof ApiError ? error.message : "登录失败，请稍后重试");
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (request: RegisterRequest) => {
      await authService.register(request);

      return authService.login({
        username: request.username,
        password: request.password,
        rememberMe: false,
      });
    },
    onSuccess: (loginResponse) => {
      const values = formInstance.getFieldsValue();
      handleLoginSuccess(loginResponse, { username: values.username ?? "", nickname: values.nickname });
    },
    onError: (error) => {
      setMessage(error instanceof ApiError ? error.message : "注册失败，请稍后重试");
    },
  });

  const isRegisterMode = authMode === "register";
  const isSubmitting = registerMutation.isPending || loginMutation.isPending;

  const switchMode = (nextMode: AuthMode) => {
    setAuthMode(nextMode);
    formInstance.resetFields();
    setMessage("");
  };

  const handleFinish = (values: FormValues) => {
    setMessage("");

    if (isRegisterMode) {
      registerMutation.mutate({
        username: values.username ?? "",
        password: values.password ?? "",
        confirmPassword: values.confirmPassword ?? "",
        nickname: values.nickname ?? "",
        email: values.email,
        phone: values.phone,
      });
      return;
    }

    loginMutation.mutate({
      username: values.username ?? "",
      password: values.password ?? "",
      rememberMe: false,
    });
  };

  return (
    <main className="login-page">
      <section className="hero-panel" aria-label="TeamTrip">
        <header className="brand">
          <BrandMark />
          <span className="brand-name">TeamTrip</span>
        </header>

        <div className="hero-copy">
          <h1>
            和朋友一起，
            <br />
            把<span>旅行计划</span>变简单
          </h1>
          <p>测出团队旅行偏好 · 对齐可出行日期 · 协同编辑行程 · 一键分享</p>
        </div>

        <div className="reference-scene" aria-hidden="true">
          <img src={loginHeroApproved} alt="" />
        </div>

        <div className="feature-strip" aria-label="TeamTrip 功能">
          <FeatureItem tone="green" icon={<SmilePlus size={24} />} title="测出团队旅行偏好">
            通过 Travel-BTI 测试
            <br />
            了解彼此的旅行风格
          </FeatureItem>
          <FeatureItem tone="blue" icon={<CalendarDays size={24} />} title="对齐可出行日期">
            快速收集时间偏好
            <br />
            找出大家都能出行的日子
          </FeatureItem>
          <FeatureItem tone="violet" icon={<MapPin size={24} />} title="协同编辑行程">
            一起规划每一天的行程
            <br />
            实时同步，高效协作
          </FeatureItem>
        </div>

        <a className="copyright icp-link" href="https://beian.miit.gov.cn/" target="_blank" rel="nofollow noreferrer">
          浙ICP备2026027290号-1
        </a>
      </section>

      <section className="auth-panel" aria-label={`${isRegisterMode ? "注册" : "登录"} TeamTrip`}>
        <Form<FormValues>
          className="login-card"
          form={formInstance}
          layout="vertical"
          requiredMark={false}
          initialValues={{ agreement: true }}
          onValuesChange={() => setMessage("")}
          onFinish={handleFinish}
        >
          <div className="card-heading">
            <h2>{isRegisterMode ? "创建账号" : "欢迎回来"}</h2>
            <p>{isRegisterMode ? "注册 TeamTrip，和伙伴开始规划旅程" : "登录 TeamTrip，继续你的旅行计划"}</p>
          </div>

          <div className="tabs" role="tablist" aria-label="登录方式">
            <button className="tab active" type="button" role="tab" aria-selected="true">
              账号密码登录
            </button>
            {/*
            <button className="tab" type="button" role="tab" aria-selected="false">
              邮箱登录
            </button>
            */}
          </div>

          {isRegisterMode && (
            <Form.Item
              name="nickname"
              rules={[{ required: true, message: "请输入昵称" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入昵称" autoComplete="nickname" aria-label="昵称" />
            </Form.Item>
          )}

          <Form.Item
            name="username"
            rules={[
              { required: true, message: isRegisterMode ? "请输入用户名" : "请输入账号" },
              { min: 3, message: "账号至少 3 位" },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={isRegisterMode ? "请输入用户名" : "请输入账号"}
              autoComplete="username"
              aria-label={isRegisterMode ? "用户名" : "账号"}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 6, message: "密码至少 6 位" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              autoComplete={isRegisterMode ? "new-password" : "current-password"}
              aria-label="密码"
            />
          </Form.Item>

          {isRegisterMode && (
            <Form.Item
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "请再次输入密码" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("两次输入的密码不一致"));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请再次输入密码"
                autoComplete="new-password"
                aria-label="确认密码"
              />
            </Form.Item>
          )}

          {isRegisterMode && (
            <Form.Item name="email">
              <Input prefix={<MailOutlined />} type="email" placeholder="邮箱（选填）" autoComplete="email" aria-label="邮箱" />
            </Form.Item>
          )}

          {isRegisterMode && (
            <Form.Item name="phone">
              <Input prefix={<PhoneOutlined />} type="tel" placeholder="手机号（选填）" autoComplete="tel" aria-label="手机号" />
            </Form.Item>
          )}

          <Form.Item
            name="agreement"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value: boolean) =>
                  value ? Promise.resolve() : Promise.reject(new Error("请先同意用户协议")),
              },
            ]}
          >
            <Checkbox>
              我已阅读并同意 <a href="#">《用户协议》</a> 和 <a href="#">《隐私政策》</a>
            </Checkbox>
          </Form.Item>

          {message && (
            <p className="auth-message" role="alert">
              {message}
            </p>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={isSubmitting}>
              {isRegisterMode ? "注册并进入" : "登录"}
            </Button>
          </Form.Item>

          <div className="divider">
            <span>或</span>
          </div>

          <Button
            block
            size="large"
            icon={<UserPlus size={19} />}
            onClick={() => switchMode(isRegisterMode ? "login" : "register")}
          >
            {isRegisterMode ? "已有账号，去登录" : "立即注册"}
          </Button>
        </Form>

        <footer className="page-footer">
          <a href="#">
            <Headphones size={18} />
            帮助中心
          </a>
          <span className="footer-divider" />
          <a href="#">
            <Globe2 size={18} />
            简体中文
            <ChevronDown className="chevron" size={16} />
          </a>
        </footer>
      </section>
    </main>
  );
}
