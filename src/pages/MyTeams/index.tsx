import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCopy,
  Copy,
  Lightbulb,
  Lock,
  Map,
  MapPin,
  MoreHorizontal,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AppHeader } from "../../components/AppHeader";
import { Loading } from "../../components/Loading";
import { authService, authTokenStorage } from "../../services";
import avatar from "../../../assets/common/app-header-user-avatar.svg";
import lakeCover from "../../../assets/my-teams/my-teams-card-cover-lake.svg";
import cityCover from "../../../assets/my-teams/my-teams-card-cover-city.svg";
import trainCover from "../../../assets/my-teams/my-teams-card-cover-train.svg";
import emptySignpost from "../../../assets/travel-bti-test/travel-bti-test-side-signpost.png";
import "./index.less";

type ModalType = "create" | "join";
type TeamCard = {
  id: string;
  name: string;
  destination: string;
  members: number;
  role: "Owner" | "Member";
  status: string;
  statusTone: "blue" | "orange" | "green" | "slate";
  cover: string;
  inviteCode: string;
};

type ActionModalProps = {
  type: ModalType;
  onClose: () => void;
  onDone: (payload: { name: string; destination?: string; inviteCode?: string; cover?: string }) => void;
};

const mockTeamCards: TeamCard[] = [
  {
    id: "hangzhou",
    name: "国庆杭州旅行",
    destination: "杭州",
    members: 8,
    role: "Owner",
    status: "行程规划中",
    statusTone: "blue",
    cover: lakeCover,
    inviteCode: "TT-HZ-1024",
  },
  {
    id: "shanghai-citywalk",
    name: "上海 Citywalk 小队",
    destination: "上海",
    members: 5,
    role: "Member",
    status: "待填写日期",
    statusTone: "orange",
    cover: cityCover,
    inviteCode: "TT-SH-2026",
  },
  {
    id: "osaka",
    name: "大阪赏樱计划",
    destination: "大阪",
    members: 6,
    role: "Member",
    status: "已锁定行程",
    statusTone: "green",
    cover: lakeCover,
    inviteCode: "TT-OSA-0412",
  },
  {
    id: "kamakura",
    name: "镰仓・江之电一日游",
    destination: "日本・镰仓",
    members: 4,
    role: "Member",
    status: "行程讨论中",
    statusTone: "slate",
    cover: trainCover,
    inviteCode: "TT-KMK-0701",
  },
];

function ActionModal({ type, onClose, onDone }: ActionModalProps) {
  const isCreate = type === "create";
  const [teamName, setTeamName] = useState("");
  const [destination, setDestination] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [error, setError] = useState("");

  const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setCoverPreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("请上传图片文件");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCoverPreview(typeof reader.result === "string" ? reader.result : "");
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const submitModal = () => {
    const normalizedName = teamName.trim();
    const normalizedDestination = destination.trim();
    const normalizedInviteCode = inviteCode.trim();

    if (isCreate && normalizedName.length < 2) {
      setError("请输入至少 2 个字符的团队名称");
      return;
    }

    if (isCreate && normalizedDestination.length < 1) {
      setError("请输入目的地或大致方向");
      return;
    }

    if (!isCreate && normalizedInviteCode.length < 4) {
      setError("请输入有效的邀请码或邀请链接");
      return;
    }

    onDone({
      name: normalizedName,
      destination: normalizedDestination,
      inviteCode: normalizedInviteCode,
      cover: coverPreview,
    });
  };

  return (
    <div className="my-teams-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="my-teams-modal"
        role="dialog"
        aria-modal="true"
        aria-label={isCreate ? "创建团队" : "加入团队"}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="my-teams-modal__close" type="button" aria-label="关闭" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="my-teams-modal__icon">{isCreate ? <Users size={26} /> : <UserPlus size={26} />}</div>
        <h2>{isCreate ? "创建团队" : "加入团队"}</h2>
        <p>{isCreate ? "给下一段旅程起个名字，稍后邀请伙伴一起完善计划。" : "输入邀请码或邀请链接，加入伙伴正在规划的旅程。"}</p>

        <label>
          <span>{isCreate ? "团队名称" : "邀请码 / 邀请链接"}</span>
          <input
            value={isCreate ? teamName : inviteCode}
            placeholder={isCreate ? "例如：端午青岛轻旅行" : "例如：TT-HZ-1024"}
            onChange={(event) => {
              if (isCreate) {
                setTeamName(event.target.value);
              } else {
                setInviteCode(event.target.value);
              }
              setError("");
            }}
          />
        </label>
        {isCreate && (
          <>
            <label>
              <span>地点</span>
              <input
                value={destination}
                placeholder="可以模糊填写，例如：江南、海边城市、日本关西"
                onChange={(event) => {
                  setDestination(event.target.value);
                  setError("");
                }}
              />
            </label>

            <label>
              <span>团队图片</span>
              <input accept="image/*" type="file" onChange={handleCoverChange} />
            </label>

            {coverPreview && (
              <div className="my-teams-modal__cover-preview" aria-label="团队图片预览">
                <img src={coverPreview} alt="" />
              </div>
            )}
          </>
        )}

        {error && (
          <p className="my-teams-modal__error" role="alert">
            {error}
          </p>
        )}

        <div className="my-teams-modal__actions">
          <button className="my-teams-secondary-button" type="button" onClick={onClose}>
            取消
          </button>
          <button className="my-teams-primary-button" type="button" onClick={submitModal}>
            {isCreate ? "创建团队" : "加入团队"}
          </button>
        </div>
      </section>
    </div>
  );
}

export function MyTeamsPage() {
  const navigate = useNavigate();
  const toastTimerRef = useRef<number | null>(null);
  const loadingTimerRef = useRef<number | null>(null);
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [teamCards, setTeamCards] = useState<TeamCard[]>(mockTeamCards);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [toast, setToast] = useState("");
  const hasTeams = teamCards.length > 0;

  const planningCount = teamCards.filter((team) => team.status === "行程规划中" || team.status === "行程讨论中").length;
  const pendingDateCount = teamCards.filter((team) => team.status === "待填写日期").length;

  useEffect(() => {
    loadingTimerRef.current = window.setTimeout(() => {
      setIsPageLoading(false);
    }, 1400);

    return () => {
      if (loadingTimerRef.current) {
        window.clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToast(""), 1800);
  };

  const handleInvite = async (inviteCode: string) => {
    const inviteText = `TeamTrip 邀请码：${inviteCode}`;

    try {
      await navigator.clipboard?.writeText(inviteText);
      showToast("邀请码已复制");
    } catch {
      showToast(`邀请码：${inviteCode}`);
    }
  };

  const enterTeam = (teamId: string) => {
    navigate(`/teams/${teamId}/workspace`);
    showToast("正在进入团队空间");
  };

  const closeModal = () => setModalType(null);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // The local session should be cleared even if the server logout endpoint is unavailable.
    } finally {
      authTokenStorage.clear();
      window.localStorage.removeItem("teamtrip-auth-user");
      navigate("/login");
    }
  };

  const completeModal = ({ name, destination, inviteCode, cover }: { name: string; destination?: string; inviteCode?: string; cover?: string }) => {
    if (modalType === "create") {
      const teamId = `team-${Date.now()}`;
      setTeamCards((current) => [
        {
          id: teamId,
          name,
          destination: destination || "待确认地点",
          members: 1,
          role: "Owner",
          status: "待填写日期",
          statusTone: "orange",
          cover: cover || (current.length % 2 === 0 ? cityCover : trainCover),
          inviteCode: `TT-${teamId.slice(-6).toUpperCase()}`,
        },
        ...current,
      ]);
      showToast("团队已创建");
    } else {
      const joinedCode = inviteCode || `TT-${Date.now()}`;
      setTeamCards((current) => [
        {
          id: `joined-${Date.now()}`,
          name: name || "新加入的旅行小队",
          destination: "待确认地点",
          members: 3,
          role: "Member",
          status: "待填写日期",
          statusTone: "orange",
          cover: current.length % 2 === 0 ? trainCover : lakeCover,
          inviteCode: joinedCode,
        },
        ...current,
      ]);
      showToast("已加入团队");
    }
    closeModal();
  };

  return (
    <main className="my-teams-page">
      <AppHeader
        title="我的团队"
        onCreateTeam={() => setModalType("create")}
        onJoinTeam={() => setModalType("join")}
        onLogout={handleLogout}
      />

      <div className="my-teams-page__content">
        <section className="my-teams-overview" aria-label="个人与团队状态">
          <article className="welcome-card">
            <div className="welcome-card__avatar">
              <img src={avatar} alt="Laow" />
              <button type="button" aria-label="更换头像">
                <Camera size={22} />
              </button>
            </div>

            <div className="welcome-card__body">
              <div className="welcome-card__plane" aria-hidden="true" />
              <h2>Hi，Laow，欢迎回来</h2>
              <p>继续你的团队旅行规划，遇见更多美好风景</p>

              <button className="travel-bti-row" type="button" onClick={() => navigate("/travel-bti/result")}>
                <CheckCircle2 size={30} />
                <span>
                  <small>Travel-BTI 旅行性格测试</small>
                  <strong>已完成测试</strong>
                </span>
                <ChevronRight size={24} />
              </button>

              <div className="persona-row">
                <span className="persona-row__icon" aria-hidden="true">
                  <Map size={21} />
                </span>
                <strong>街巷收藏家</strong>
                <em>慢游</em>
                <em>人文</em>
                <em>规划</em>
              </div>
            </div>
          </article>

          <article className="status-card">
            <h2>我的团队状态</h2>
            <div className="status-card__stats">
              <div className="status-stat status-stat--green">
                <Users size={46} />
                <strong>{teamCards.length} <small>个</small></strong>
                <span>已加入团队</span>
              </div>
              <div className="status-stat status-stat--blue">
                <CalendarDays size={46} />
                <strong>{pendingDateCount} <small>个</small></strong>
                <span>待填写日期</span>
              </div>
              <div className="status-stat status-stat--orange">
                <ClipboardCopy size={46} />
                <strong>{planningCount} <small>个</small></strong>
                <span>规划中</span>
              </div>
            </div>
            <p>
              <Lightbulb size={21} />
              完善行程信息，让旅程更顺利
            </p>
          </article>
        </section>

        <section className="teams-panel" aria-label="我的团队">
          <header className="teams-panel__header">
            <div>
              <h2>我的团队</h2>
              <p>与你的伙伴一起规划行程，开启下一段旅程</p>
            </div>
          </header>

          {hasTeams ? (
            <div className="teams-panel__grid">
              {teamCards.map((team) => {
                return (
                  <article className="team-card" key={team.id}>
                    <img className="team-card__cover" src={team.cover} alt="" />
                    <div className="team-card__main">
                      <div className="team-card__title-row">
                        <h3>{team.name}</h3>
                        <button type="button" aria-label="更多团队操作">
                          <MoreHorizontal size={24} />
                        </button>
                      </div>
                      <p className="team-card__meta">
                        <MapPin size={18} />
                        {team.destination}
                      </p>
                      <p className="team-card__meta">
                        <Users size={18} />
                        {team.members} 人
                      </p>
                      <div className="team-card__actions">
                        <button className="my-teams-secondary-button" type="button" onClick={() => handleInvite(team.inviteCode)}>
                          <Copy size={18} />
                          复制邀请码
                        </button>
                        <button className="my-teams-primary-button" type="button" onClick={() => enterTeam(team.id)}>
                          进入团队
                        </button>
                      </div>
                    </div>
                    <div className="team-card__badges">
                      <span className={`role-badge ${team.role === "Owner" ? "owner" : ""}`}>{team.role}</span>
                      <span className={`status-badge ${team.statusTone}`}>{team.status}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <section className="teams-empty-state" aria-label="暂无团队">
              <img src={emptySignpost} alt="" />
              <h3>你还没有进入任何团队</h3>
              <p>创建一个团队，或通过邀请码加入朋友团队，一起走起。</p>
              <div className="teams-empty-state__actions">
                <button className="my-teams-primary-button" type="button" onClick={() => setModalType("create")}>
                  <Users size={18} />
                  创建团队
                </button>
                <button className="my-teams-secondary-button" type="button" onClick={() => setModalType("join")}>
                  <UserPlus size={18} />
                  加入朋友团队
                </button>
              </div>
            </section>
          )}

          <footer className="teams-panel__privacy">
            <Lock size={22} />
            所有团队数据仅对团队成员可见，保障你的隐私安全
          </footer>
        </section>
      </div>

      {isPageLoading && <Loading fullscreen text="LOADING" size={128} />}
      {toast && <div className="my-teams-toast" role="status">{toast}</div>}
      {modalType && <ActionModal type={modalType} onClose={closeModal} onDone={completeModal} />}
    </main>
  );
}
