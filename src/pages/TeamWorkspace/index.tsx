import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Copy,
  Edit3,
  Grid2X2,
  Info,
  MapPin,
  MessageSquareText,
  Route,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { BrandMark } from "../../components/BrandMark";
import avatar from "../../../assets/common/app-header-user-avatar.svg";
import teamCover from "../../../assets/login-register/login-register-hero-approved.webp";
import "./index.less";

const navItems = [
  { label: "团队工作台", icon: Grid2X2, active: true, path: "/teams/hangzhou-2025/workspace" },
  { label: "行程规划", icon: CalendarCheck, path: "/teams/hangzhou-2025/itinerary" },
  { label: "最终行程单", icon: ClipboardCheck, externalPath: "/final-itinerary/TT-HZ-1024" },
  { label: "团队设置", icon: Settings },
];

const readinessItems = [
  { title: "Trip-BTI 测试", desc: "已完成 · 供参考", status: "已完成", icon: CheckCircle2 },
  { title: "可出行时间", desc: "已填写 2 段时间", status: "已填写", icon: CalendarDays },
  { title: "我的备注", desc: "希望节奏轻松一点，晚上不要安排太满~", icon: MessageSquareText },
];

const aiCards = [
  { icon: Users, title: "本团整体偏向", text: "人文、美食、轻松节奏" },
  { icon: MessageSquareText, title: "成员备注提炼", text: "偏好慢游、喜欢拍照，有人想吃本地菜，有人不太能吃辣。" },
  { icon: Info, title: "出行建议", text: "安排城市漫游 + 展馆 + 特色餐厅；每天保留一段自由活动时间。" },
  { icon: Route, title: "主要分歧", text: "体力强度分歧较大，预算舒适度有中等差异。" },
  { icon: CheckCircle2, title: "建议安排", text: "1 天轻松慢游，1 天重点打卡，餐饮保留不同选择。" },
];

const preferenceRows = [
  { label: "游览方式", value: 64 },
  { label: "自然景观", value: 78 },
  { label: "人文历史", value: 88 },
  { label: "美食探索", value: 88 },
  { label: "购物逛街", value: 38 },
  { label: "拍照打卡", value: 78 },
  { label: "夜生活体验", value: 62 },
  { label: "冒险挑战", value: 30 },
];

const keywords = ["慢游", "拍照", "本地美食", "咖啡馆", "展览", "轻松节奏", "自由时间", "不太能吃辣", "博物馆", "特色小店"];

const calendarDays = [
  { day: "29", tone: "muted" },
  { day: "30", tone: "muted" },
  { day: "1", tone: "all" },
  { day: "2", tone: "all" },
  { day: "3", tone: "all" },
  { day: "4", tone: "most" },
  { day: "5", tone: "most" },
  { day: "6", tone: "most" },
  { day: "7", tone: "" },
  { day: "8", tone: "" },
  { day: "9", tone: "few" },
  { day: "10", tone: "" },
  { day: "11", tone: "few" },
  { day: "12", tone: "few" },
];

const workspaceInviteCode = "TT-HZ-1024";

export function TeamWorkspacePage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard?.writeText(workspaceInviteCode);
      showToast("邀请码已复制");
    } catch {
      showToast(`邀请码：${workspaceInviteCode}`);
    }
  };

  return (
    <main className="team-workspace-page">
      <aside className="workspace-sidebar" aria-label="团队导航">
        <div className="workspace-sidebar__brand">
          <BrandMark />
          <span>TeamTrip</span>
        </div>

        <button className="workspace-back-button" type="button" onClick={() => navigate("/teams")}>
          <ArrowLeft size={18} />
          返回我的团队
        </button>

        <section className="workspace-team-mini" aria-label="当前团队">
          <img src={teamCover} alt="" />
          <div>
            <strong>国庆杭州旅行</strong>
            <span>杭州 · 8 人</span>
            <em>行程准备中</em>
          </div>
        </section>

        <nav className="workspace-nav">
          {navItems.map(({ label, icon: Icon, active, path, externalPath }) => (
            <button
              className={`workspace-nav__item ${active ? "active" : ""}`}
              key={label}
              type="button"
              onClick={() => {
                if (externalPath) {
                  window.open(externalPath, "_blank", "noopener,noreferrer");
                  return;
                }

                if (path) {
                  navigate(path);
                }
              }}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </nav>

        <div className="workspace-sidebar__user">
          <img src={avatar} alt="Laow" />
          <div>
            <strong>Laow</strong>
            <span>Owner</span>
          </div>
          <ChevronDown size={18} />
        </div>
      </aside>

      <section className="workspace-main">
        <header className="workspace-topbar">
          <div>
            <h1>团队工作台</h1>
            <p>补齐团队信息，找到大家都合适的旅行时间</p>
          </div>
          <div className="workspace-topbar__actions">
            <button className="workspace-primary-button" type="button" onClick={copyInviteCode}>
              <Copy size={18} />
              复制邀请码
            </button>
          </div>
        </header>

        <section className="workspace-hero-card">
          <img className="workspace-hero-card__cover" src={teamCover} alt="" />
          <div className="workspace-hero-card__body">
            <div className="workspace-title-row">
              <h2>国庆杭州旅行</h2>
              <button type="button" aria-label="编辑团队名称">
                <Edit3 size={18} />
              </button>
            </div>
            <p>杭州 · 8 人 · <strong>行程准备中</strong></p>
            <div className="workspace-team-stats">
              <div>
                <span>团队创建者</span>
                <strong>
                  <img src={avatar} alt="" />
                  Laow
                </strong>
              </div>
              <div>
                <span>已完成 Trip-BTI</span>
                <strong>7 / 8 人</strong>
              </div>
              <div>
                <span>已填写可出行时间</span>
                <strong>5 / 8 人</strong>
              </div>
              <div>
                <span>最晚出行日期</span>
                <strong>待锁定</strong>
              </div>
            </div>
          </div>
          <div className="workspace-hero-card__cta">
            <button className="workspace-primary-button" type="button" onClick={() => navigate("/teams/hangzhou-2025/itinerary")}>
              <Route size={18} />
              进入行程规划
            </button>
            <small>仍有成员未填写时间，可先开始规划</small>
          </div>
        </section>

        <div className="workspace-grid">
          <section className="workspace-left-column">
            <article className="workspace-card">
              <h3>
                <CheckCircle2 size={20} />
                我的准备
              </h3>
              <div className="readiness-list">
                {readinessItems.map(({ title, desc, status, icon: Icon }) => (
                  <button className="readiness-item" key={title} type="button">
                    <span className="readiness-item__icon">
                      <Icon size={20} />
                    </span>
                    <span>
                      <strong>{title}</strong>
                      <small>{desc}</small>
                    </span>
                    {status && <em>{status}</em>}
                    <ChevronRight size={19} />
                  </button>
                ))}
              </div>
            </article>

            <article className="workspace-card calendar-card">
              <h3>
                可出行时间汇总
                <Info size={18} />
              </h3>
              <div className="calendar-legend">
                <span className="all">全员可出行</span>
                <span className="most">多数可出行</span>
                <span className="few">少数时段</span>
                <span className="none">不可出行</span>
              </div>
              <div className="calendar-month">
                <button type="button">‹</button>
                <strong>2025年10月</strong>
                <button type="button">›</button>
              </div>
              <div className="calendar-week">
                {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              <div className="calendar-days">
                {calendarDays.map((item, index) => (
                  <span className={item.tone} key={`${item.day}-${index}`}>
                    {item.day}
                  </span>
                ))}
              </div>
            </article>
          </section>

          <section className="workspace-card workspace-insight-card">
            <h3>
              团队旅行画像
              <Info size={18} />
            </h3>
            <div className="workspace-insight-grid">
              <div className="ai-summary-panel">
                <h4>
                  <Sparkles size={20} />
                  AI 团队总结
                </h4>
                {aiCards.map(({ icon: Icon, title, text }) => (
                  <article className="ai-summary-item" key={title}>
                    <Icon size={20} />
                    <div>
                      <strong>{title}</strong>
                      <p>{text}</p>
                    </div>
                  </article>
                ))}
                <div className="ai-note">
                  <strong>AI 小贴士</strong>
                  <p>根据成员偏好，优先考虑步行友好的景点与交通便利的区域，并在餐饮安排中兼顾口味差异。</p>
                </div>
              </div>

              <div className="preference-panel">
                <article className="preference-card">
                  <div className="preference-card__heading">
                    <h4>偏好维度对比</h4>
                    <span>偏好强度　低　中　高</span>
                  </div>
                  <div className="preference-list">
                    {preferenceRows.map((row) => (
                      <div className="preference-row" key={row.label}>
                        <span>{row.label}</span>
                        <i>
                          <b style={{ left: `${row.value}%` }} />
                        </i>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="preference-card keywords-card">
                  <h4>成员偏好关键词 <span>Top 词云</span></h4>
                  <div className="keyword-cloud">
                    {keywords.map((keyword) => (
                      <span key={keyword}>{keyword}</span>
                    ))}
                  </div>
                  <button type="button">
                    查看完整偏好详情
                    <ChevronRight size={17} />
                  </button>
                </article>
              </div>
            </div>
          </section>
        </div>
      </section>

      {toast && <div className="workspace-toast" role="status">{toast}</div>}
    </main>
  );
}
