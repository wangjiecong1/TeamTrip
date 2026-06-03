import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Globe2,
  Headphones,
  LockKeyhole,
  MapPin,
  SmilePlus,
  User,
  UserPlus,
} from "lucide-react";
import loginHeroApproved from "../../../assets/login-register/login-register-hero-approved.webp";
import { BrandMark } from "../../components/BrandMark";
import { FeatureItem } from "../../components/FeatureItem";
import { ApiError, authService, authTokenStorage, LoginRequest, LoginResponse, RegisterRequest } from "../../services";
import "./index.less";

type AuthMode = "login" | "register";

const initialForm = {
  nickname: "",
  username: "",
  password: "",
  confirmPassword: "",
  email: "",
  phone: "",
};

const getLoginToken = (response: LoginResponse) => response.accessToken || response.token || "";

export function LoginRegisterPage() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [form, setForm] = useState(initialForm);
  const [isAgreementChecked, setIsAgreementChecked] = useState(true);
  const [message, setMessage] = useState("");

  const handleLoginSuccess = (loginResponse: LoginResponse, fallbackUser: { username: string; nickname?: string }) => {
    const token = getLoginToken(loginResponse);

    if (!token) {
      setMessage("登录成功但未返回 token，请检查 LoginResponse 结构");
      return;
    }

    authTokenStorage.set(token);
    window.localStorage.setItem(
      "teamtrip-auth-user",
      JSON.stringify(loginResponse.user ?? { username: fallbackUser.username.trim(), nickname: fallbackUser.nickname?.trim() || fallbackUser.username.trim() }),
    );
    navigate("/teams");
  };

  const loginMutation = useMutation({
    mutationFn: (request: LoginRequest) => authService.login(request),
    onSuccess: (loginResponse) => {
      handleLoginSuccess(loginResponse, { username: form.username });
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
      handleLoginSuccess(loginResponse, { username: form.username, nickname: form.nickname });
    },
    onError: (error) => {
      setMessage(error instanceof ApiError ? error.message : "注册失败，请稍后重试");
    },
  });

  const isRegisterMode = authMode === "register";
  const isSubmitting = registerMutation.isPending || loginMutation.isPending;

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
  };

  const switchMode = (nextMode: AuthMode) => {
    setAuthMode(nextMode);
    setForm(initialForm);
    setIsAgreementChecked(true);
    setMessage("");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isRegisterMode) {
      if (isSubmitting) {
        return;
      }

      registerMutation.mutate({
        username: form.username,
        password: form.password,
        confirmPassword: form.confirmPassword,
        nickname: form.nickname,
        email: form.email,
        phone: form.phone,
      });
      return;
    }

    if (isSubmitting) {
      return;
    }

    loginMutation.mutate({
      username: form.username,
      password: form.password,
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
        <form className="login-card" onSubmit={handleSubmit}>
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
            <label className="input-row">
              <UserPlus className="input-icon" size={19} aria-hidden="true" />
              <input
                type="text"
                placeholder="请输入昵称"
                aria-label="昵称"
                autoComplete="nickname"
                value={form.nickname}
                onChange={(event) => updateField("nickname", event.target.value)}
              />
            </label>
          )}

          <label className={`input-row ${isRegisterMode ? "compact-row" : ""}`}>
            <User className="input-icon" size={19} aria-hidden="true" />
            <input
              type="text"
              placeholder={isRegisterMode ? "请输入用户名" : "请输入账号"}
              aria-label={isRegisterMode ? "用户名" : "账号"}
              autoComplete="username"
              value={form.username}
              onChange={(event) => updateField("username", event.target.value)}
            />
          </label>

          <label className="input-row password-row">
            <LockKeyhole className="input-icon" size={19} aria-hidden="true" />
            <input
              type="password"
              placeholder="请输入密码"
              aria-label="密码"
              autoComplete={isRegisterMode ? "new-password" : "current-password"}
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
            />
          </label>

          {isRegisterMode && (
            <label className="input-row password-row">
              <LockKeyhole className="input-icon" size={19} aria-hidden="true" />
              <input
                type="password"
                placeholder="请再次输入密码"
                aria-label="确认密码"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) => updateField("confirmPassword", event.target.value)}
              />
            </label>
          )}

          {isRegisterMode && (
            <>
              <label className="input-row compact-row">
                <User className="input-icon" size={19} aria-hidden="true" />
                <input
                  type="email"
                  placeholder="邮箱（选填）"
                  aria-label="邮箱"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </label>

              <label className="input-row password-row">
                <User className="input-icon" size={19} aria-hidden="true" />
                <input
                  type="tel"
                  placeholder="手机号（选填）"
                  aria-label="手机号"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
              </label>
            </>
          )}

          <label className="agreement">
            <input
              type="checkbox"
              checked={isAgreementChecked}
              onChange={(event) => {
                setIsAgreementChecked(event.target.checked);
                setMessage("");
              }}
            />
            <span className="checkmark" aria-hidden="true">
              <Check size={14} strokeWidth={3} />
            </span>
            <span>
              我已阅读并同意 <a href="#">《用户协议》</a> 和 <a href="#">《隐私政策》</a>
            </span>
          </label>

          {message && (
            <p className="auth-message" role="alert">
              {message}
            </p>
          )}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isRegisterMode ? (isSubmitting ? "注册并登录中..." : "注册并进入") : isSubmitting ? "登录中..." : "登录"}
          </button>

          <div className="divider">
            <span>或</span>
          </div>

          <button className="secondary-button" type="button" onClick={() => switchMode(isRegisterMode ? "login" : "register")}>
            <UserPlus size={19} />
            {isRegisterMode ? "已有账号，去登录" : "立即注册"}
          </button>
        </form>

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
