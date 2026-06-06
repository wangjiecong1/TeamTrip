import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Check,
  ChevronRight,
  Compass,
  Heart,
  Home,
  Map,
  Mountain,
  RefreshCw,
  Route,
  ShieldCheck,
  UsersRound,
  Wallet,
  Zap,
} from "lucide-react";
import { AppHeader } from "../../components/AppHeader";
import { StatusTag } from "../../components/StatusTag";
import { TravelBtiPageShell } from "../../components/TravelBtiPageShell";
import { ApiError, ArchetypeCandidate, authService, authTokenStorage, tripBtiService, TripBtiProfile } from "../../services";
import personaAvatar from "../../../assets/travel-bti-result/travel-bti-result-persona-avatar.png";
import personaBanner from "../../../assets/travel-bti-result/travel-bti-result-persona-banner.png";
import { TestResultSkeleton } from "./Skeleton";
import "./index.less";

const dimensions = [
  { key: "schedule", label: "行程节奏", icon: Route, tone: "blue" },
  { key: "interest", label: "自然人文", icon: Mountain, tone: "green" },
  { key: "planning", label: "计划程度", icon: Map, tone: "blue" },
  { key: "physical", label: "体力强度", icon: Zap, tone: "orange" },
  { key: "environment", label: "环境偏好", icon: Home, tone: "green" },
  { key: "food", label: "吃喝偏好", icon: Heart, tone: "rose" },
  { key: "photo", label: "拍照风格", icon: Camera, tone: "blue" },
  { key: "social", label: "社交倾向", icon: UsersRound, tone: "green" },
  { key: "budget", label: "花费倾向", icon: Wallet, tone: "yellow" },
  { key: "exploration", label: "探索程度", icon: Compass, tone: "blue" },
] as const;

const fallbackKeywords = ["轻旅行", "协作", "偏好画像"];
const fallbackTips = ["把这份画像同步到团队工作台", "和队友对齐行程节奏、预算与探索偏好", "规划时优先处理差异较大的维度"];

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "请求失败，请稍后重试";
};

const getDimensionScore = (profile: TripBtiProfile | null, key: (typeof dimensions)[number]["key"]) => {
  const value = profile?.[key];

  if (typeof value !== "number") {
    return 0;
  }

  return Math.round(Math.min(1, Math.max(0, value)) * 100);
};

const getPrimaryCandidate = (profile: TripBtiProfile | null): ArchetypeCandidate | null => profile?.archetypeCandidates?.[0] ?? null;

const getKeywords = (profile: TripBtiProfile | null) => {
  const candidate = getPrimaryCandidate(profile);

  if (candidate?.traits?.length) {
    return candidate.traits;
  }

  if (profile?.typeCode) {
    return profile.typeCode.split("·").filter(Boolean).slice(0, 5);
  }

  return fallbackKeywords;
};

const getTips = (profile: TripBtiProfile | null) => {
  const candidate = getPrimaryCandidate(profile);

  return candidate?.tips?.length ? candidate.tips : fallbackTips;
};

export function TestResultPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<TripBtiProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isRetesting, setIsRetesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const primaryCandidate = getPrimaryCandidate(profile);
  const personaName = profile?.archetypeName || primaryCandidate?.name || "旅行画像生成中";
  const personaTagline = profile?.archetypeTagline || primaryCandidate?.tagline || profile?.typeCode || "等待生成你的旅行画像";
  const personaDescription =
    primaryCandidate?.description ||
    profile?.prompt ||
    "基于你的回答生成的旅行人格画像，将帮助团队更懂彼此，一起规划更合拍的旅行。";
  const keywords = getKeywords(profile);
  const travelTips = getTips(profile);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setIsLoadingProfile(true);
        setErrorMessage("");
        window.localStorage.removeItem("teamtrip-travel-bti-answers");
        window.localStorage.removeItem("teamtrip-travel-bti-profile");

        const response = await tripBtiService.getMyProfile();

        if (!isMounted) {
          return;
        }

        setProfile(response);
      } catch (error) {
        if (isMounted && !profile) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      authTokenStorage.clear();
      window.localStorage.removeItem("teamtrip-auth-user");
      navigate("/login");
    } catch {
      // Keep the current login state when the logout API fails.
    }
  };

  const handleRetest = async () => {
    try {
      setIsRetesting(true);
      await tripBtiService.retest(profile?.lastQuestionnaireVersionId);
      navigate("/travel-bti");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setIsRetesting(false);
    }
  };

  return (
    <TravelBtiPageShell
      compact
      header={
        <AppHeader title="Trip-BTI 结果" actions={[]} onLogout={handleLogout} />
      }
    >
      <section className="travel-bti-result-card" aria-busy={isLoadingProfile} aria-label="Trip-BTI 测试结果">
        {isLoadingProfile ? (
          <TestResultSkeleton />
        ) : (
        <>
        <div className="result-main-column">
          <StatusTag className="result-status" variant="completed">{profile?.tripProfileStatusText || "测试完成"}</StatusTag>

          <h1>你的旅行人格结果</h1>
          <p className="result-lead">基于你的回答生成的旅行人格画像，将帮助团队更懂彼此，一起规划更合拍的旅行。</p>
          {errorMessage && <p className="result-error-message">{errorMessage}</p>}

          <section className="persona-panel" aria-label="旅行人格">
            <div className="persona-summary">
              <img src={personaAvatar} alt="" />
              <div>
                <h2>{personaName}</h2>
                <p className="persona-tags">{personaTagline}</p>
                <p className="persona-description">{personaDescription}</p>
              </div>
            </div>

            <div className="dimension-heading">
              <h3>10 维旅行偏好画像</h3>
              <span>
                偏好程度
                <small>低</small>
                <i />
                <small>高</small>
              </span>
            </div>

            <div className="dimension-grid">
              {dimensions.map(({ key, label, icon: Icon, tone }) => {
                const score = getDimensionScore(profile, key);

                return (
                  <div className="dimension-row" key={label}>
                    <span className={`dimension-icon ${tone}`}>
                      <Icon size={18} />
                    </span>
                    <strong>{label}</strong>
                    <div className="dimension-track">
                      <span style={{ width: `${score}%` }} />
                    </div>
                    <em>{score}</em>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="result-bottom-row">
            <p>
              <ShieldCheck size={22} />
              结果将应用于团队画像聚合，帮助大家更合拍地规划旅行。
            </p>
            <div className="result-actions">
              <button className="result-secondary-button" type="button" onClick={handleRetest} disabled={isRetesting}>
                <RefreshCw size={20} />
                {isRetesting ? "正在重测" : "重新测试"}
              </button>
              <button className="result-primary-button" type="button" onClick={() => navigate("/teams")}>
                返回我的团队
                <ChevronRight size={22} />
              </button>
            </div>
          </div>
        </div>

        <aside className="result-side-column" aria-label="旅行结果说明">
          <section className="result-side-card persona-image-card">
            <h2>你的旅行形象</h2>
            <img src={personaBanner} alt="" />
          </section>

          <section className="result-side-card">
            <h2>你的旅行关键词</h2>
            <div className="keyword-list">
              {keywords.map((keyword) => (
                <span key={keyword}>{keyword}</span>
              ))}
            </div>
          </section>

          <section className="result-side-card">
            <h2>适合你的旅行方式</h2>
            <ul className="travel-tip-list">
              {travelTips.map((tip) => (
                <li key={tip}>
                  <Check size={17} />
                  {tip}
                </li>
              ))}
            </ul>
          </section>

        </aside>
        </>
        )}
      </section>
    </TravelBtiPageShell>
  );
}
