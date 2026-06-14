import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { AppHeader } from "../../components/AppHeader";
import { StatusTag } from "../../components/StatusTag";
import { TravelBtiPageShell } from "../../components/TravelBtiPageShell";
import {
  ApiError,
  ArchetypeCandidate,
  authService,
  authTokenStorage,
  tripBtiService,
  TripBtiProfile,
} from "../../services";
import personaAvatar from "../../../assets/travel-bti-result/travel-bti-result-persona-avatar.png";
import personaBanner from "../../../assets/travel-bti-result/travel-bti-result-persona-banner.png";
import { TestResultSkeleton } from "./Skeleton";
import "./index.less";

const legacyDimensions = [
  { key: "schedule", label: "行程节奏" },
  { key: "interest", label: "自然人文" },
  { key: "planning", label: "计划程度" },
  { key: "physical", label: "体力强度" },
  { key: "environment", label: "环境偏好" },
  { key: "food", label: "吃喝偏好" },
  { key: "photo", label: "拍照风格" },
  { key: "social", label: "社交倾向" },
  { key: "budget", label: "花费倾向" },
  { key: "exploration", label: "探索程度" },
] as const;

const preferenceSideSegments = Array.from({ length: 4 });
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

const toPercentage = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.round(Math.min(1, Math.max(0, value)) * 100);
};

const getDimensions = (profile: TripBtiProfile | null) => {
  if (profile?.dimensions?.length) {
    return [...profile.dimensions]
      .sort((left, right) => (left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER))
      .map((dimension) => ({
        key: dimension.key,
        label: dimension.label,
        leftPolarity: dimension.leftPolarity || "左侧偏好",
        rightPolarity: dimension.rightPolarity || "右侧偏好",
        score: toPercentage(dimension.score),
      }));
  }

  return legacyDimensions.map((dimension) => ({
    ...dimension,
    leftPolarity: "低",
    rightPolarity: "高",
    score: toPercentage(profile?.[dimension.key]),
  }));
};

const getPrimaryCandidate = (profile: TripBtiProfile | null): ArchetypeCandidate | null => profile?.archetypeCandidates?.[0] ?? null;

const getKeywords = (profile: TripBtiProfile | null) => {
  if (profile?.keywords?.length) {
    return profile.keywords;
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
    profile?.archetypeDescription ||
    primaryCandidate?.description ||
    profile?.prompt ||
    "基于你的回答生成的旅行人格画像，将帮助团队更懂彼此，一起规划更合拍的旅行。";
  const keywords = getKeywords(profile);
  const travelTips = getTips(profile);
  const dimensions = getDimensions(profile);

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
              <h3>{dimensions.length} 维旅行偏好画像</h3>
              <span>悬停查看具体倾向</span>
            </div>

            <div className="dimension-grid">
              {dimensions.map(({ key, label, leftPolarity, rightPolarity, score }) => {
                const direction = score < 46 ? "left" : score > 54 ? "right" : "neutral";
                const valueLabel =
                  direction === "neutral"
                    ? "均衡"
                    : `${direction === "left" ? leftPolarity : rightPolarity} ${Math.abs(score - 50) * 2}%`;
                const activeSegmentCount =
                  direction === "neutral" ? 0 : Math.max(1, Math.ceil((Math.abs(score - 50) / 50) * 4));

                return (
                  <div className="dimension-row" key={key} aria-label={`${label}：${valueLabel}`}>
                    <strong>{label}</strong>
                    <span className="dimension-pole dimension-pole--left">{leftPolarity}</span>
                    <div className="dimension-axis">
                      {preferenceSideSegments.map((_, index) => (
                        <i
                          className={`dimension-axis__segment dimension-axis__segment--left dimension-axis__segment--level-${
                            4 - index
                          } ${direction === "left" && index >= 4 - activeSegmentCount ? "is-active" : ""}`}
                          key={`left-${index}`}
                        />
                      ))}
                      <i
                        className={`dimension-axis__segment dimension-axis__segment--neutral ${
                          direction === "neutral" ? "is-active" : ""
                        }`}
                      />
                      {preferenceSideSegments.map((_, index) => (
                        <i
                          className={`dimension-axis__segment dimension-axis__segment--right dimension-axis__segment--level-${
                            index + 1
                          } ${direction === "right" && index < activeSegmentCount ? "is-active" : ""}`}
                          key={`right-${index}`}
                        />
                      ))}
                      <b
                        className={`dimension-axis__point is-${direction} dimension-axis__point--level-${activeSegmentCount}`}
                        style={{ left: `${score}%` }}
                      >
                        <span>{valueLabel}</span>
                      </b>
                    </div>
                    <span className="dimension-pole dimension-pole--right">{rightPolarity}</span>
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
