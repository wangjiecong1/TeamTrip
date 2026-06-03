import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  Heart,
  Home,
  Map,
  Mountain,
  RefreshCw,
  Route,
  ShieldCheck,
  Users,
  UsersRound,
  Wallet,
  Zap,
} from "lucide-react";
import { AppHeader } from "../../components/AppHeader";
import { TravelBtiPageShell } from "../../components/TravelBtiPageShell";
import { authService, authTokenStorage } from "../../services";
import personaAvatar from "../../../assets/travel-bti-result/travel-bti-result-persona-avatar.png";
import personaBanner from "../../../assets/travel-bti-result/travel-bti-result-persona-banner.png";
import "./index.less";

const dimensions = [
  { label: "行程节奏", score: 85, icon: Route, tone: "blue" },
  { label: "自然人文", score: 80, icon: Mountain, tone: "green" },
  { label: "随意规划", score: 65, icon: Map, tone: "blue" },
  { label: "体力强度", score: 40, icon: Zap, tone: "orange" },
  { label: "环境舒适", score: 75, icon: Home, tone: "green" },
  { label: "吃喝偏好", score: 80, icon: Heart, tone: "rose" },
  { label: "拍照风格", score: 70, icon: Camera, tone: "blue" },
  { label: "社交倾向", score: 50, icon: UsersRound, tone: "green" },
  { label: "花费倾向", score: 55, icon: Wallet, tone: "yellow" },
  { label: "探索程度", score: 75, icon: Compass, tone: "blue" },
];

const keywords = ["慢游", "人文", "规划", "在地体验", "细节控"];

const travelTips = [
  "安排半天到一天的深度城市漫游",
  "预留自由探索时间，发现隐藏的宝藏小店",
  "选择具有人文气息的住宿与节奏路线",
  "行前做好功课，规划动线与体验清单",
];

export function TestResultPage() {
  const navigate = useNavigate();

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

  return (
    <TravelBtiPageShell
      compact
      header={
        <AppHeader
          title="Travel-BTI 结果"
          actions={[
            {
              label: "重新测试",
              icon: RefreshCw,
              onClick: () => navigate("/travel-bti"),
              variant: "outline",
            },
            {
              label: "返回我的团队",
              icon: Users,
              onClick: () => navigate("/teams"),
              variant: "primary",
            },
          ]}
          onLogout={handleLogout}
        />
      }
    >
      <section className="travel-bti-result-card" aria-label="Travel-BTI 测试结果">
        <div className="result-main-column">
          <div className="result-status">
            <CheckCircle2 size={30} fill="currentColor" />
            <span>测试完成</span>
          </div>

          <h1>你的旅行人格结果</h1>
          <p className="result-lead">基于你的回答生成的旅行人格画像，将帮助团队更懂彼此，一起规划更合拍的旅行。</p>

          <section className="persona-panel" aria-label="旅行人格">
            <div className="persona-summary">
              <img src={personaAvatar} alt="" />
              <div>
                <h2>街巷收藏家</h2>
                <p className="persona-tags">慢游 · 人文 · 规划</p>
                <p className="persona-description">
                  你喜欢在城市的街巷间漫步，发现独特的在地故事与人文景致。行前乐于规划动线与体验，行程中保持从容节奏，享受细节与氛围带来的愉悦与共鸣。
                </p>
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
              {dimensions.map(({ label, score, icon: Icon, tone }) => (
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
              ))}
            </div>
          </section>

          <div className="result-bottom-row">
            <p>
              <ShieldCheck size={22} />
              结果将应用于团队画像聚合，帮助大家更合拍地规划旅行。
            </p>
            <div className="result-actions">
              <button className="result-secondary-button" type="button" onClick={() => navigate("/travel-bti")}>
                <RefreshCw size={20} />
                重新测试
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

          <section className="result-side-card team-role-card">
            <div className="team-role-icon">
              <UsersRound size={36} />
            </div>
            <div>
              <h2>在团队中的角色</h2>
              <h3>城市策展人</h3>
              <p>擅长挖掘目的地点，为团队带来有故事、有温度的旅行体验。</p>
            </div>
          </section>
        </aside>
      </section>
    </TravelBtiPageShell>
  );
}
