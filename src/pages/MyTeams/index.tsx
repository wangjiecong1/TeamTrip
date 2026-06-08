import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, BorderBeam, Button, Card, Dropdown, Form, Input, message, Modal, Skeleton } from "antd";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCopy,
  Compass,
  Copy,
  Lightbulb,
  Lock,
  Map,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { AppHeader } from "../../components/AppHeader";
import { StatusTag, StatusTagVariant } from "../../components/StatusTag";
import {
  ApiError,
  authService,
  authTokenStorage,
  connectTeamRealtime,
  MyTeamsOverviewResponse,
  teamsService,
  TeamCardResponse,
} from "../../services";
import avatar from "../../../assets/common/app-header-user-avatar.svg";
import lakeCover from "../../../assets/my-teams/my-teams-card-cover-lake.svg";
import cityCover from "../../../assets/my-teams/my-teams-card-cover-city.svg";
import trainCover from "../../../assets/my-teams/my-teams-card-cover-train.svg";
import emptySignpost from "../../../assets/travel-bti-test/travel-bti-test-side-signpost.png";
import "./index.less";

type ModalType = "create" | "join" | "edit";
type TeamCard = {
  id: string;
  name: string;
  destination: string;
  members: number;
  role: string;
  roleVariant: StatusTagVariant;
  status: string;
  statusVariant: StatusTagVariant;
  cover: string;
  inviteCode: string;
};

type ActionModalValues = {
  name?: string;
  destination?: string;
  inviteCode?: string;
};

type ActionModalProps = {
  type: ModalType;
  initialValues?: ActionModalValues;
  onClose: () => void;
  onDone: (payload: { name: string; destination?: string; inviteCode?: string }) => Promise<void>;
  isSubmitting: boolean;
};

const coverFallbacks = [lakeCover, cityCover, trainCover];

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "请求失败，请稍后重试";
};

const getStatusVariant = (team: TeamCardResponse): StatusTagVariant => {
  if (team.locked || team.teamStatus === 1) {
    return "locked";
  }

  const statusText = team.statusTag || team.teamStatusText || "";

  if (statusText.includes("过期")) {
    return "expired";
  }

  if (statusText.includes("完成")) {
    return "completed";
  }

  if (statusText.includes("进行")) {
    return "active";
  }

  if (statusText.includes("待")) {
    return "pending";
  }

  if (statusText.includes("规划") || statusText.includes("准备")) {
    return "planning";
  }

  return "neutral";
};

const getRoleVariant = (role?: string): StatusTagVariant => {
  if (role === "owner") {
    return "owner";
  }

  if (role === "admin") {
    return "admin";
  }

  return "member";
};

const getRoleText = (role?: string, roleText?: string) => {
  if (role === "owner") {
    return "Owner";
  }

  if (role === "admin") {
    return roleText || "管理员";
  }

  return roleText || "成员";
};

const mapTeamCard = (team: TeamCardResponse, index: number): TeamCard => ({
  id: String(team.teamId),
  name: team.name || "未命名旅行小队",
  destination: team.destination || "待确认地点",
  members: team.memberCount ?? 1,
  role: getRoleText(team.role, team.roleText),
  roleVariant: getRoleVariant(team.role),
  status: team.statusTag || team.teamStatusText || (team.locked ? "已锁定行程" : "行程规划中"),
  statusVariant: getStatusVariant(team),
  cover: team.avatar || coverFallbacks[index % coverFallbacks.length],
  inviteCode: team.inviteCode || String(team.teamId),
});

function ActionModal({ type, initialValues, onClose, onDone, isSubmitting }: ActionModalProps) {
  const isCreate = type === "create";
  const isEdit = type === "edit";
  const [form] = Form.useForm<ActionModalValues>();

  const submitModal = async (values: ActionModalValues) => {
    await onDone({
      name: values.name?.trim() || "",
      destination: values.destination?.trim(),
      inviteCode: values.inviteCode?.trim(),
    });
  };

  return (
    <Modal
      centered
      className="my-teams-modal"
      confirmLoading={isSubmitting}
      destroyOnHidden
      okText={isSubmitting ? "处理中" : isEdit ? "保存修改" : isCreate ? "创建团队" : "加入团队"}
      open
      title={null}
      width={460}
      onCancel={onClose}
      onOk={() => form.submit()}
    >
      <div className="my-teams-modal__content">
        <div className="my-teams-modal__icon">{isEdit ? <Pencil size={26} /> : isCreate ? <Users size={26} /> : <UserPlus size={26} />}</div>
        <h2>{isEdit ? "修改团队信息" : isCreate ? "创建团队" : "加入团队"}</h2>
        <p>{isEdit ? "更新团队名称和目的地，帮助伙伴快速识别这段旅程。" : isCreate ? "给下一段旅程起个名字，稍后邀请伙伴一起完善计划。" : "输入邀请码或邀请链接，加入伙伴正在规划的旅程。"}</p>

        <Form form={form} initialValues={initialValues} layout="vertical" requiredMark={false} onFinish={submitModal}>
          {isCreate || isEdit ? (
            <>
              <Form.Item label="团队名称" name="name" rules={[{ required: true, min: 2, message: "请输入至少 2 个字符的团队名称" }]}>
                <Input placeholder="例如：端午青岛轻旅行" />
              </Form.Item>

              <Form.Item label="地点" name="destination" rules={[{ required: true, message: "请输入目的地或大致方向" }]}>
                <Input placeholder="可以模糊填写，例如：江南、海边城市、日本关西" />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              label="邀请码 / 邀请链接"
              name="inviteCode"
              rules={[{ required: true, min: 4, message: "请输入有效的邀请码或邀请链接" }]}
            >
              <Input placeholder="例如：CV7A3Y" />
            </Form.Item>
          )}
        </Form>
      </div>
    </Modal>
  );
}

function MyTeamsSkeleton() {
  return (
    <>
      <section className="my-teams-overview" aria-label="团队页加载中">
        <Card className="welcome-card my-teams-skeleton-card" variant="outlined">
          <div className="welcome-card__avatar">
            <Skeleton.Avatar active size={156} />
          </div>

          <div className="welcome-card__body my-teams-skeleton-card__body">
            <Skeleton active title={{ width: "68%" }} paragraph={{ rows: 1, width: ["52%"] }} />
            <Skeleton.Input active className="my-teams-skeleton-card__test" />
            <div className="my-teams-skeleton-card__tags">
              <Skeleton.Button active shape="round" />
              <Skeleton.Button active shape="round" />
              <Skeleton.Button active shape="round" />
            </div>
          </div>
        </Card>

        <Card className="status-card my-teams-skeleton-card" variant="outlined">
          <Skeleton active title={{ width: 180 }} paragraph={false} />
          <div className="my-teams-skeleton-card__stats">
            {[0, 1, 2].map((item) => (
              <div className="my-teams-skeleton-stat" key={item}>
                <Skeleton.Avatar active shape="square" size={46} />
                <Skeleton.Input active size="small" />
                <Skeleton.Button active shape="round" size="small" />
              </div>
            ))}
          </div>
          <Skeleton.Input active className="my-teams-skeleton-card__hint" />
        </Card>
      </section>

      <Card className="teams-panel my-teams-skeleton-card" variant="outlined" aria-label="我的团队加载中">
        <header className="teams-panel__header">
          <div>
            <Skeleton active title={{ width: 150 }} paragraph={{ rows: 1, width: [280] }} />
          </div>
        </header>

        <div className="teams-panel__grid">
          {[0, 1].map((item) => (
            <Card className="team-card-skeleton my-teams-skeleton-card" key={item} variant="outlined">
              <Skeleton.Input active className="my-teams-skeleton-card__cover" />
              <div className="my-teams-skeleton-card__team">
                <Skeleton active title={{ width: "45%" }} paragraph={{ rows: 2, width: ["38%", "30%"] }} />
                <div className="team-card-skeleton__actions">
                  <Skeleton.Button active block />
                  <Skeleton.Button active block />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </>
  );
}

export function MyTeamsPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [editingTeam, setEditingTeam] = useState<TeamCard | null>(null);
  const [overview, setOverview] = useState<MyTeamsOverviewResponse | null>(null);
  const [teamCards, setTeamCards] = useState<TeamCard[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);
  const [modalApi, modalContextHolder] = Modal.useModal();
  const [overviewError, setOverviewError] = useState("");
  const hasTeams = teamCards.length > 0;
  const user = overview?.user;
  const stats = overview?.stats;
  const planningCount = stats?.planningCount ?? 0;
  const pendingDateCount = stats?.pendingAvailability ?? 0;
  const totalJoined = stats?.totalJoined ?? teamCards.length;
  const nickname = user?.nickname || "旅行者";
  const isTripProfileCompleted = Boolean(user?.tripProfileCompleted);
  const tripProfileText = user?.tripProfileStatusText || (isTripProfileCompleted ? "已完成测试" : "测试进行中");
  const travelBtiPath = isTripProfileCompleted ? "/travel-bti/result" : "/travel-bti";
  const archetypeName = user?.archetype?.name;
  const styleTags = user?.styleTags?.length ? user.styleTags : ["旅行画像"];
  const travelBtiRow = (
    <div
      className={`travel-bti-row ${isTripProfileCompleted ? "" : "is-active"}`}
      role="button"
      tabIndex={0}
      onClick={() => navigate(travelBtiPath)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(travelBtiPath);
        }
      }}
    >
      {isTripProfileCompleted ? <CheckCircle2 size={30} /> : <Compass size={30} />}
      <span>
        <small>Trip-BTI 旅行性格测试</small>
        <strong>{tripProfileText}</strong>
      </span>
      <ChevronRight size={24} />
    </div>
  );

  const loadOverview = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setIsPageLoading(true);
      }
      setOverviewError("");

      const response = await teamsService.getOverview();

      setOverview(response);
      setTeamCards(response.teams.map(mapTeamCard));
    } catch (error) {
      setOverviewError(getErrorMessage(error));
      setTeamCards([]);
    } finally {
      if (!silent) {
        setIsPageLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    let disconnect: (() => void) | undefined;
    let disposed = false;

    connectTeamRealtime(() => loadOverview(true))
      .then((cleanup) => {
        if (disposed) {
          cleanup();
        } else {
          disconnect = cleanup;
        }
      })
      .catch(() => {
        // REST 仍可正常使用，实时连接失败时等待下一次进入页面重连。
      });

    return () => {
      disposed = true;
      disconnect?.();
    };
  }, [loadOverview]);

  const handleInvite = async (inviteCode: string) => {
    try {
      await navigator.clipboard?.writeText(inviteCode);
      messageApi.success("邀请码已复制");
    } catch {
      messageApi.info(`邀请码：${inviteCode}`);
    }
  };

  const enterTeam = (teamId: string) => {
    navigate(`/teams/${teamId}/workspace`);
    messageApi.info("正在进入团队空间");
  };

  const closeModal = () => {
    setModalType(null);
    setEditingTeam(null);
  };

  const openEditModal = (team: TeamCard) => {
    setEditingTeam(team);
    setModalType("edit");
  };

  const handleDeleteTeam = (team: TeamCard) => {
    modalApi.confirm({
      centered: true,
      className: "my-teams-delete-modal",
      title: `删除“${team.name}”？`,
      content: "团队成员、日期和行程数据都将被删除，此操作无法在页面中撤销。",
      okText: "确认删除",
      okType: "danger",
      cancelText: "取消",
      async onOk() {
        try {
          await teamsService.deleteTeam(team.id);
          messageApi.success("团队已删除");
          await loadOverview(true);
        } catch (error) {
          messageApi.error(getErrorMessage(error));
          throw error;
        }
      },
    });
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      authTokenStorage.clear();
      window.localStorage.removeItem("teamtrip-auth-user");
      navigate("/login");
    } catch {
      messageApi.error("退出登录失败，请稍后重试");
    }
  };

  const completeModal = async ({ name, destination, inviteCode }: { name: string; destination?: string; inviteCode?: string; cover?: string }) => {
    try {
      setIsModalSubmitting(true);

      if (modalType === "create") {
        await teamsService.createTeam({
          name,
          destination: destination || undefined,
        });
        messageApi.success("团队已创建");
      } else if (modalType === "edit" && editingTeam) {
        await teamsService.updateTeam(editingTeam.id, {
          name,
          destination: destination || undefined,
        });
        messageApi.success("团队信息已更新");
      } else {
        const joined = await teamsService.joinTeam({
          inviteCode: (inviteCode || "").trim().toUpperCase(),
        });

        messageApi.success(joined.needTripProfile ? "已加入团队，请先完成 Trip-BTI" : "已加入团队");
      }

      closeModal();
      await loadOverview(true);
    } catch (error) {
      messageApi.error(getErrorMessage(error));
    } finally {
      setIsModalSubmitting(false);
    }
  };

  return (
    <main className="my-teams-page">
      {contextHolder}
      {modalContextHolder}
      <AppHeader
        title="我的团队"
        onCreateTeam={() => setModalType("create")}
        onJoinTeam={() => setModalType("join")}
        onLogout={handleLogout}
      />

      <div className="my-teams-page__content">
        {isPageLoading ? (
          <MyTeamsSkeleton />
        ) : (
          <>
            <section className="my-teams-overview" aria-label="个人与团队状态">
              <Card className="welcome-card" variant="outlined">
                <div className="welcome-card__avatar">
                  <Avatar alt={nickname} size={156} src={avatar} />
                </div>

                <div className="welcome-card__body">
                  <div aria-hidden="true" />
                  <h2>Hi，{nickname}，欢迎回来</h2>
                  <p>继续你的团队旅行规划，遇见更多美好风景</p>

                  {isTripProfileCompleted ? (
                    travelBtiRow
                  ) : (
                    <BorderBeam color="#F97316" outset={2}>
                      {travelBtiRow}
                    </BorderBeam>
                  )}

                  {isTripProfileCompleted && (
                    <div className="persona-row">
                      <div className="persona-row__title">
                        <span className="persona-row__icon" aria-hidden="true">
                          <Map size={21} />
                        </span>
                        <strong>{archetypeName || "旅行风格"}</strong>
                      </div>
                      <div className="persona-row__tags">
                        {styleTags.slice(0, 3).map((tag) => (
                          <StatusTag className="persona-tag" key={tag} variant="neutral">
                            {tag}
                          </StatusTag>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="status-card" variant="outlined">
                <h2>我的团队状态</h2>
                <div className="status-card__stats">
                  <div className="status-stat status-stat--green">
                    <Users size={46} />
                    <strong>{totalJoined} <small>个</small></strong>
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
                <p className="status-card__hint">
                  <Lightbulb size={21} />
                  完善行程信息，让旅程更顺利
                </p>
              </Card>
            </section>

            <Card className="teams-panel" variant="outlined" aria-label="我的团队">
              <header className="teams-panel__header">
                <div>
                  <h2>我的团队</h2>
                  <p>{overviewError || "与你的伙伴一起规划行程，开启下一段旅程"}</p>
                </div>
              </header>

              {hasTeams ? (
                <div className="teams-panel__grid">
                  {teamCards.map((team) => {
                    return (
                      <Card className="team-card" key={team.id} variant="outlined">
                        <img className="team-card__cover" src={team.cover} alt="" />
                        <div className="team-card__main">
                          <div className="team-card__title-row">
                            <h3>{team.name}</h3>
                            {team.roleVariant === "owner" && (
                              <Dropdown
                                menu={{
                                  items: [
                                    { key: "edit", icon: <Pencil size={17} />, label: "修改团队信息" },
                                    { type: "divider" },
                                    { key: "delete", danger: true, icon: <Trash2 size={17} />, label: "删除团队" },
                                  ],
                                  onClick: ({ key }) => {
                                    if (key === "edit") {
                                      openEditModal(team);
                                    } else {
                                      handleDeleteTeam(team);
                                    }
                                  },
                                }}
                                overlayClassName="team-card-actions-menu"
                                placement="bottomRight"
                                trigger={["click"]}
                              >
                                <Button
                                  aria-label="更多团队操作"
                                  className="team-card__more-button"
                                  icon={<MoreHorizontal size={24} />}
                                  type="text"
                                />
                              </Dropdown>
                            )}
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
                            <Button block icon={<Copy size={18} />} onClick={() => handleInvite(team.inviteCode)}>
                              复制邀请码
                            </Button>
                            <Button block type="primary" onClick={() => enterTeam(team.id)}>
                              进入团队
                            </Button>
                          </div>
                        </div>
                        <div className="team-card__badges">
                          <StatusTag className="role-badge" variant={team.roleVariant}>
                            {team.role}
                          </StatusTag>
                          <StatusTag className="status-badge" variant={team.statusVariant}>
                            {team.status}
                          </StatusTag>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <section className="teams-empty-state" aria-label="暂无团队">
                  <img src={emptySignpost} alt="" />
                  <h3>你还没有进入任何团队</h3>
                  <p>创建一个团队，或通过邀请码加入朋友团队，一起走起。</p>
                  <div className="teams-empty-state__actions">
                    <Button icon={<Users size={18} />} type="primary" onClick={() => setModalType("create")}>
                      创建团队
                    </Button>
                    <Button icon={<UserPlus size={18} />} onClick={() => setModalType("join")}>
                      加入朋友团队
                    </Button>
                  </div>
                </section>
              )}

              <footer className="teams-panel__privacy">
                <Lock size={22} />
                所有团队数据仅对团队成员可见，保障你的隐私安全
              </footer>
            </Card>
          </>
        )}
      </div>

      {modalType && (
        <ActionModal
          type={modalType}
          initialValues={editingTeam ? { name: editingTeam.name, destination: editingTeam.destination } : undefined}
          onClose={closeModal}
          onDone={completeModal}
          isSubmitting={isModalSubmitting}
        />
      )}
    </main>
  );
}
