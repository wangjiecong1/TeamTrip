import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, DatePicker, Layout, message, Modal, Popover, Tooltip } from "antd";
import calendarZhCN from "antd/es/calendar/locale/zh_CN";
import datePickerZhCN from "antd/es/date-picker/locale/zh_CN";
import dayjs, { Dayjs } from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCheck,
  Copy,
  Edit3,
  Grid2X2,
  Info,
  LockKeyhole,
  MessageSquareText,
  Route,
  Settings,
  Sparkles,
  UnlockKeyhole,
  Users,
} from "lucide-react";
import { BrandMark } from "../../components/BrandMark";
import { StatusTag, StatusTagVariant } from "../../components/StatusTag";
import { UserAccountMenu } from "../../components/UserAccountMenu";
import {
  ApiError,
  authService,
  authTokenStorage,
  DateRange,
  TeamCalendarDay,
  TeamDetailResponse,
  TeamMemberResponse,
  teamsService,
} from "../../services";
import avatar from "../../../assets/common/app-header-user-avatar.svg";
import teamCover from "../../../assets/login-register/login-register-hero-approved.webp";
import { TeamWorkspaceSkeleton } from "./Skeleton";
import "./index.less";

const { RangePicker } = DatePicker;
const { Sider, Content } = Layout;
type AvailabilityRangeValue = [Dayjs | null, Dayjs | null] | null;
type CalendarCellInfo = {
  originNode: React.ReactElement;
  type: string;
};

const queryKey = {
  detail: (teamId: string) => ["wb", teamId, "detail"] as const,
  members: (teamId: string) => ["wb", teamId, "members"] as const,
  portrait: (teamId: string) => ["wb", teamId, "portrait"] as const,
  preparation: (teamId: string) => ["wb", teamId, "preparation"] as const,
  calendar: (teamId: string, yearMonth?: string) =>
    yearMonth ? (["wb", teamId, "cal", yearMonth] as const) : (["wb", teamId, "cal"] as const),
};

const getCurrentYearMonth = () => new Date().toISOString().slice(0, 7);

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return "请求失败，请稍后重试";
};

const getStatusVariant = (status = ""): StatusTagVariant => {
  if (status.includes("过期") || status.includes("归档")) {
    return "expired";
  }

  if (status.includes("完成") || status.includes("填写")) {
    return "completed";
  }

  if (status.includes("锁定")) {
    return "locked";
  }

  if (status.includes("待")) {
    return "pending";
  }

  if (status.includes("进行")) {
    return "active";
  }

  if (status.includes("准备") || status.includes("规划")) {
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

const getRoleText = (member?: TeamMemberResponse, detail?: TeamDetailResponse) => {
  if (member?.role === "owner" || detail?.myRole === "owner") {
    return "Owner";
  }

  return member?.roleText || "成员";
};

const getStoredUserId = () => {
  try {
    const user = JSON.parse(window.localStorage.getItem("teamtrip-auth-user") || "null") as { id?: string | number; userId?: string | number };

    return user?.id ?? user?.userId;
  } catch {
    return undefined;
  }
};

const formatRange = (range?: DateRange | null) => {
  if (!range) {
    return "待锁定";
  }

  const start = range.startDate.slice(5).replace("-", "月");
  const end = range.endDate.slice(5).replace("-", "月");

  return range.startDate === range.endDate ? `${start}日` : `${start}日 - ${end}日`;
};

const getCalendarLevelClassName = (day?: TeamCalendarDay) => {
  if (!day?.level) {
    return "unknown";
  }

  return day.level === "some" ? "few" : day.level;
};

const getCalendarLevelText = (day?: TeamCalendarDay) => {
  if (!day) {
    return "暂无提交";
  }

  if (day.level === "all") {
    return "全员可出行";
  }

  if (day.level === "most") {
    return "多数可出行";
  }

  if (day.level === "some") {
    return "部分可出行";
  }

  if (day.level === "none") {
    return "无人可出行";
  }

  return "暂无提交";
};

const clampPreferenceScore = (score?: number) => Math.min(1, Math.max(0, score ?? 0.5));
const preferenceSideSegments = Array.from({ length: 4 });

const getPreferenceExplanation = (leftLabel: string, rightLabel: string, score?: number) => {
  const normalizedScore = clampPreferenceScore(score);
  const distanceFromCenter = Math.abs(normalizedScore - 0.5) * 2;

  if (distanceFromCenter < 0.12) {
    return `团队在${leftLabel}与${rightLabel}之间较为均衡。`;
  }

  const preferredLabel = normalizedScore < 0.5 ? leftLabel : rightLabel;

  if (distanceFromCenter < 0.6) {
    return `团队整体更偏向${preferredLabel}，但并不极端。`;
  }

  return `团队明显更偏向${preferredLabel}，规划时可以优先考虑这一倾向。`;
};

export function TeamWorkspacePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const { teamId = "" } = useParams();
  const [yearMonth, setYearMonth] = useState(getCurrentYearMonth);
  const [availabilityRange, setAvailabilityRange] = useState<AvailabilityRangeValue>(null);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [siderCollapsed, setSiderCollapsed] = useState(false);

  const detailQuery = useQuery({
    queryKey: queryKey.detail(teamId),
    queryFn: () => teamsService.getDetail(teamId),
    enabled: Boolean(teamId),
    staleTime: 30_000,
  });

  const membersQuery = useQuery({
    queryKey: queryKey.members(teamId),
    queryFn: () => teamsService.getMembers(teamId),
    enabled: Boolean(teamId),
    staleTime: 30_000,
  });

  const portraitQuery = useQuery({
    queryKey: queryKey.portrait(teamId),
    queryFn: () => teamsService.getPortrait(teamId),
    enabled: Boolean(teamId),
    staleTime: 1_800_000,
  });

  const preparationQuery = useQuery({
    queryKey: queryKey.preparation(teamId),
    queryFn: () => teamsService.getPreparation(teamId),
    enabled: Boolean(teamId),
  });

  const calendarQuery = useQuery({
    queryKey: queryKey.calendar(teamId, yearMonth),
    queryFn: () => teamsService.getCalendar(teamId, yearMonth),
    enabled: Boolean(teamId),
  });

  const detail = detailQuery.data;
  const members = membersQuery.data?.items || [];
  const portrait = portraitQuery.data;
  const calendar = calendarQuery.data;
  const preparation = preparationQuery.data;
  const storedUserId = getStoredUserId();
  const currentMember =
    members.find((member) => String(member.userId) === String(storedUserId)) ||
    (detail?.myRole === "owner" ? members.find((member) => member.role === "owner") : undefined);
  const coverImage = detail?.cityThumbnail || detail?.avatar || teamCover;
  const ownerName = detail?.ownerNickname || members.find((member) => member.role === "owner")?.nickname || "团队创建者";
  const tripProfilePendingMembers = members.filter((member) => !member.tripProfileCompleted);
  const availabilityPendingMembers = members.filter((member) => !member.availabilitySubmitted);
  const statusText = detail?.statusTag || detail?.teamStatusText || (detail?.locked ? "已锁定行程" : "行程准备中");
  const finalDateRange =
    calendar?.finalDates?.[0] ||
    (detail?.finalStartDate && detail?.finalEndDate ? { startDate: detail.finalStartDate, endDate: detail.finalEndDate } : null);
  const hasFinalTravelDates = Boolean(detail?.locked && detail.finalStartDate && detail.finalEndDate);
  const lockCandidate = calendar?.goldenDates?.[0] || preparation?.myDateRanges?.[0];
  const isPageLoading =
    detailQuery.isLoading ||
    membersQuery.isLoading ||
    portraitQuery.isLoading ||
    preparationQuery.isLoading ||
    calendarQuery.isLoading;
  const pageError = [detailQuery.error, membersQuery.error, portraitQuery.error, preparationQuery.error, calendarQuery.error].find(Boolean);

  const navItems = [
    { label: "团队工作台", icon: Grid2X2, active: true, path: `/teams/${teamId}/workspace` },
    { label: "行程规划", icon: CalendarCheck, path: `/teams/${teamId}/itinerary`, requiresFinalDates: true },
    { label: "最终行程单", icon: ClipboardCheck, externalPath: `/final-itinerary/${detail?.inviteCode || teamId}` },
    { label: "团队设置", icon: Settings },
  ];

  const riskyDimensions = useMemo(
    () => portrait?.dimensions?.filter((dimension) => dimension.riskLevel === "high" || dimension.riskLevel === "medium") || [],
    [portrait?.dimensions],
  );
  const calendarValue = useMemo(() => dayjs(`${yearMonth}-01`), [yearMonth]);
  const calendarDayByDate = useMemo(() => new Map((calendar?.days || []).map((day) => [day.date, day])), [calendar?.days]);
  const selectedRanges = useMemo<DateRange[]>(() => {
    const [startDate, endDate] = availabilityRange || [];

    if (!startDate || !endDate) {
      return [];
    }

    return [{ startDate: startDate.format("YYYY-MM-DD"), endDate: endDate.format("YYYY-MM-DD") }];
  }, [availabilityRange]);

  useEffect(() => {
    const firstRange = preparation?.myDateRanges?.[0];

    if (firstRange) {
      setAvailabilityRange([dayjs(firstRange.startDate), dayjs(firstRange.endDate)]);
    }
  }, [preparation]);

  useEffect(() => {
    const status = pageError instanceof ApiError ? pageError.status : undefined;

    if (status === 403) {
      messageApi.warning("你不在该团队中");
      navigate("/teams", { replace: true });
    }
  }, [messageApi, navigate, pageError]);

  const invalidateCalendarScope = () => queryClient.invalidateQueries({ queryKey: queryKey.calendar(teamId) });

  const saveAvailabilityMutation = useMutation({
    mutationFn: (dateRanges: DateRange[]) => teamsService.saveAvailability(teamId, { dateRanges }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKey.preparation(teamId) }),
        invalidateCalendarScope(),
        queryClient.invalidateQueries({ queryKey: queryKey.members(teamId) }),
      ]);
      messageApi.success("可出行时间已保存");
      setAvailabilityModalOpen(false);
    },
    onError: (error) => messageApi.error(getErrorMessage(error)),
  });

  const lockDatesMutation = useMutation({
    mutationFn: () => {
      if (detail?.canUnlockDates) {
        return teamsService.unlockDates(teamId);
      }

      if (!lockCandidate) {
        throw new Error("暂无可锁定日期");
      }

      return teamsService.lockDates(teamId, lockCandidate);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKey.detail(teamId) }),
        invalidateCalendarScope(),
        detail?.canUnlockDates ? queryClient.invalidateQueries({ queryKey: queryKey.portrait(teamId) }) : Promise.resolve(),
      ]);
      messageApi.success(detail?.canUnlockDates ? "已解锁行程日期" : "已锁定行程日期");
    },
    onError: (error) => messageApi.error(getErrorMessage(error)),
  });

  const copyInviteCode = async () => {
    const inviteCode = detail?.inviteCode || String(detail?.teamId || teamId);

    try {
      await navigator.clipboard?.writeText(inviteCode);
      messageApi.success("邀请码已复制");
    } catch {
      messageApi.info(`邀请码：${inviteCode}`);
    }
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

  const canToggleLock = Boolean(detail?.canUnlockDates || (detail?.canLockDates && lockCandidate)) && !lockDatesMutation.isPending;

  const updateAvailabilityRange = (dates: AvailabilityRangeValue) => {
    setAvailabilityRange(dates);

    if (dates?.[0]) {
      setYearMonth(dates[0].format("YYYY-MM"));
    }

    const [startDate, endDate] = dates || [];

    if (startDate && endDate && !detail?.locked) {
      saveAvailabilityMutation.mutate([
        {
          startDate: startDate.format("YYYY-MM-DD"),
          endDate: endDate.format("YYYY-MM-DD"),
        },
      ]);
    }
  };

  const changeCalendarMonth = (date: Dayjs) => {
    setYearMonth(date.format("YYYY-MM"));
  };

  const renderTeamCalendarCell = (currentDate: Dayjs, info: CalendarCellInfo) => {
    if (info.type !== "date") {
      return info.originNode;
    }

    const date = currentDate.format("YYYY-MM-DD");
    const isCurrentMonth = currentDate.format("YYYY-MM") === yearMonth;
    const day = calendarDayByDate.get(date);
    const levelClassName = getCalendarLevelClassName(day);

    return (
      <div
        className={`team-availability-cell is-${levelClassName} ${isCurrentMonth ? "" : "is-outside"}`}
        title={`${date} · ${getCalendarLevelText(day)} · ${day?.availableCount ?? 0} 人可出行`}
      >
        <span>{currentDate.date()}</span>
        <i aria-hidden="true" />
      </div>
    );
  };

  const renderPendingMemberTooltip = (label: string, pendingMembers: TeamMemberResponse[], content: React.ReactNode) => {
    if (!pendingMembers.length) {
      return content;
    }

    return (
      <Popover
        classNames={{ container: "workspace-pending-popover__container" }}
        placement="bottom"
        content={
          <div className="workspace-pending-popover__members">
            {pendingMembers.map((member) => (
              <span key={member.userId}>{member.nickname}</span>
            ))}
          </div>
        }
        title={label}
        trigger="hover"
      >
        <span className="workspace-stat-tooltip-trigger">{content}</span>
      </Popover>
    );
  };

  return (
    <Layout hasSider className="team-workspace-page" aria-busy={isPageLoading}>
      {contextHolder}
      {isPageLoading ? (
        <TeamWorkspaceSkeleton />
      ) : (
        <>
        <Sider
          aria-label="团队导航"
          breakpoint="lg"
          className="workspace-sidebar"
          collapsed={siderCollapsed}
          collapsedWidth={80}
          theme="light"
          trigger={null}
          width={252}
          onBreakpoint={setSiderCollapsed}
        >
        <div className="workspace-sidebar__brand">
          <button
            aria-label="返回首页"
            className="workspace-sidebar__brand-button"
            title="返回首页"
            type="button"
            onClick={() => navigate("/teams")}
          >
            <BrandMark />
            <span>TeamTrip</span>
          </button>
        </div>

        <nav className="workspace-nav">
          {navItems.map(({ label, icon: Icon, active, path, externalPath, requiresFinalDates }) => (
            <button
              className={`workspace-nav__item ${active ? "active" : ""} ${requiresFinalDates && !hasFinalTravelDates ? "disabled" : ""}`}
              key={label}
              type="button"
              onClick={() => {
                if (requiresFinalDates && !hasFinalTravelDates) {
                  messageApi.warning("请先锁定最终出行日期");
                  return;
                }

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
              <span className="workspace-nav__item-label">{label}</span>
            </button>
          ))}
        </nav>

        <UserAccountMenu placement="topRight" onLogout={handleLogout}>
          <button aria-label="打开个人菜单" className="workspace-sidebar__user" type="button">
            <img src={currentMember?.avatar || avatar} alt={currentMember?.nickname || "我"} />
            <span className="workspace-sidebar__user-info">
              <strong>{currentMember?.nickname || "我"}</strong>
              <StatusTag variant={getRoleVariant(currentMember?.role || detail?.myRole)}>{getRoleText(currentMember, detail)}</StatusTag>
            </span>
            <ChevronDown size={18} />
          </button>
        </UserAccountMenu>
      </Sider>

      <Layout className="workspace-main-layout">
        <Content className="workspace-main">
        {pageError && !detail ? (
          <section className="workspace-card workspace-error-state">
            <AlertCircle size={24} />
            <strong>{getErrorMessage(pageError)}</strong>
            <button className="workspace-primary-button" type="button" onClick={() => navigate("/teams")}>
              返回我的团队
            </button>
          </section>
        ) : (
          <>
            <section className="workspace-hero-card">
              <img className="workspace-hero-card__cover" src={coverImage} alt="" />
              <Tooltip title="复制邀请码">
                <button
                  aria-label="复制邀请码"
                  className="workspace-invite-copy-button"
                  disabled={!detail}
                  type="button"
                  onClick={copyInviteCode}
                >
                  <Copy size={15} />
                  <span>邀请码</span>
                  <strong>{detail?.inviteCode || String(detail?.teamId || teamId)}</strong>
                </button>
              </Tooltip>
              <div className="workspace-hero-card__body">
                <div className="workspace-title-row">
                  <h2>{detail?.name || (isPageLoading ? "团队信息加载中" : "团队旅行")}</h2>
                  <button type="button" aria-label="编辑团队名称">
                    <Edit3 size={18} />
                  </button>
                </div>
                <p>
                  {detail?.destination || "待确认地点"} · {detail?.totalMemberCount ?? members.length} 人 ·{" "}
                  <StatusTag variant={getStatusVariant(statusText)}>{statusText}</StatusTag>
                </p>
                <div className="workspace-team-stats">
                  <div>
                    <span>团队创建者</span>
                    <strong>
                      <img src={members.find((member) => member.role === "owner")?.avatar || avatar} alt="" />
                      {ownerName}
                    </strong>
                  </div>
                  <div>
                    <span>已完成 Trip-BTI</span>
                    {renderPendingMemberTooltip(
                      "未完成测试",
                      tripProfilePendingMembers,
                      <strong>
                        {detail?.tripProfileDoneCount ?? members.filter((member) => member.tripProfileCompleted).length} /{" "}
                        {detail?.totalMemberCount ?? members.length} 人
                      </strong>,
                    )}
                  </div>
                  <div>
                    <span>已填写可出行时间</span>
                    {renderPendingMemberTooltip(
                      "未填写可出行时间",
                      availabilityPendingMembers,
                      <strong>
                        {detail?.availabilityDoneCount ?? members.filter((member) => member.availabilitySubmitted).length} /{" "}
                        {detail?.totalMemberCount ?? members.length} 人
                      </strong>,
                    )}
                  </div>
                  <div className="workspace-final-date-stat">
                    <span>最终出行日期</span>
                    <div className="workspace-final-date-row">
                      <strong>{formatRange(finalDateRange)}</strong>
                      {detail?.myRole === "owner" && (
                        <Tooltip title={detail?.canUnlockDates ? "解锁最终日期" : lockCandidate ? "锁定最终日期" : "暂无可锁定日期"}>
                          <button
                            aria-label={detail?.canUnlockDates ? "解锁最终日期" : "锁定最终日期"}
                            className="workspace-date-lock-button"
                            disabled={!canToggleLock}
                            type="button"
                            onClick={() => lockDatesMutation.mutate()}
                          >
                            {detail?.canUnlockDates ? <UnlockKeyhole size={17} /> : <LockKeyhole size={17} />}
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="workspace-hero-card__cta">
                <button
                  className="workspace-primary-button"
                  disabled={!hasFinalTravelDates}
                  type="button"
                  onClick={() => {
                    if (hasFinalTravelDates) {
                      navigate(`/teams/${teamId}/itinerary`);
                    }
                  }}
                >
                  <Route size={18} />
                  进入行程规划
                </button>
                <small>{hasFinalTravelDates ? "最终日期已锁定，可以开始规划" : "锁定最终出行日期后即可进入规划"}</small>
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
                    <button className="readiness-item" type="button" onClick={() => navigate("/travel-bti")}>
                      <span className="readiness-item__icon">
                        <CheckCircle2 size={20} />
                      </span>
                      <span>
                        <strong>Trip-BTI 测试</strong>
                        <small>{preparation?.tripProfileStatusText || (preparation?.tripProfileCompleted ? "已完成 · 供团队画像参考" : "待完成 · 完成后画像会刷新")}</small>
                      </span>
                      <StatusTag variant={preparation?.tripProfileCompleted ? "completed" : "pending"}>
                        {preparation?.tripProfileCompleted ? "已完成" : "待填写"}
                      </StatusTag>
                      <ChevronRight size={19} />
                    </button>
                    <button
                      className="readiness-item"
                      type="button"
                      onClick={() => setAvailabilityModalOpen(true)}
                    >
                      <span className="readiness-item__icon">
                        <CalendarDays size={20} />
                      </span>
                      <span>
                        <strong>可出行时间</strong>
                        <small>
                          {selectedRanges.length ? `已选择 ${selectedRanges.length} 段时间` : "选择时间段后自动保存"}
                        </small>
                      </span>
                      <StatusTag variant={preparation?.availabilitySubmitted ? "completed" : "pending"}>
                        {preparation?.availabilitySubmitted ? "已填写" : "待填写"}
                      </StatusTag>
                      <ChevronRight size={19} />
                    </button>
                  </div>
                </article>

                <article className="workspace-card calendar-card">
                  <h3>
                    可出行时间汇总
                    <Info size={18} />
                  </h3>
                  <div className="calendar-actions">
                    <div className={`team-availability-calendar ${calendarQuery.isFetching ? "is-loading" : ""}`}>
                      <Calendar
                        fullscreen={false}
                        fullCellRender={renderTeamCalendarCell}
                        headerRender={({ value }) => (
                          <div className="team-calendar-header">
                            <div className="team-calendar-header__nav">
                              <button aria-label="上一年" type="button" onClick={() => changeCalendarMonth(value.subtract(1, "year"))}>
                                <ChevronsLeft size={16} />
                              </button>
                              <button aria-label="上个月" type="button" onClick={() => changeCalendarMonth(value.subtract(1, "month"))}>
                                <ChevronLeft size={16} />
                              </button>
                            </div>
                            <strong>{value.format("YYYY年M月")}</strong>
                            <div className="team-calendar-header__nav">
                              <button aria-label="下个月" type="button" onClick={() => changeCalendarMonth(value.add(1, "month"))}>
                                <ChevronRight size={16} />
                              </button>
                              <button aria-label="下一年" type="button" onClick={() => changeCalendarMonth(value.add(1, "year"))}>
                                <ChevronsRight size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                        locale={calendarZhCN}
                        mode="month"
                        onPanelChange={changeCalendarMonth}
                        value={calendarValue}
                      />
                    </div>
                    <div className="calendar-legend" aria-label="团队可出行图例">
                      <span className="all">全员</span>
                      <span className="most">多数</span>
                      <span className="few">部分</span>
                    </div>
                  </div>
                </article>
              </section>

              <section className="workspace-card workspace-insight-card">
                <h3>
                  团队旅行画像
                </h3>
                <div className="workspace-insight-grid">
                  <div className="ai-summary-panel">
                    <h4>
                      <Sparkles size={20} />
                      AI 团队总结
                    </h4>
                    <article className="ai-summary-item">
                      <Users size={20} />
                      <div>
                        <strong>本团整体偏向</strong>
                        <p>{portrait?.summaryText || "成员完成 Trip-BTI 后会生成团队旅行画像。"}</p>
                      </div>
                    </article>
                    <article className="ai-summary-item">
                      <MessageSquareText size={20} />
                      <div>
                        <strong>人格分布</strong>
                        <p>
                          {portrait?.archetypeDistribution?.length
                            ? portrait.archetypeDistribution
                                .slice(0, 3)
                                .map((item) => `${item.name} ${item.count} 人`)
                                .join("，")
                            : "暂无足够成员数据"}
                        </p>
                      </div>
                    </article>
                    <article className="ai-summary-item">
                      <AlertCircle size={20} />
                      <div>
                        <strong>分歧提示</strong>
                        <p>
                          {riskyDimensions[0]?.suggestionText ||
                            (riskyDimensions.length ? `${riskyDimensions.length} 个维度存在差异，建议保留自由活动时间。` : "当前暂无明显分歧。")}
                        </p>
                      </div>
                    </article>
                    <div className="ai-note" role="note">
                      <strong>画像更新时间</strong>
                      <p>
                        {portrait?.computedAt
                          ? `${portrait.computedAt.replace("T", " ").slice(0, 16)} 更新，短时间内沿用本次分析结果。`
                          : "成员偏好发生变化后，团队画像会自动更新。"}
                      </p>
                    </div>
                  </div>

                  <div className="preference-panel">
                    <article className="preference-card">
                      <div className="preference-card__heading">
                        <h4>偏好维度对比</h4>
                        <span>悬停查看团队倾向说明</span>
                      </div>
                      <div className="preference-list">
                        {(portrait?.dimensions || []).slice(0, 10).map((row) => {
                          const leftLabel = row.left || "左侧偏好";
                          const rightLabel = row.right || "右侧偏好";
                          const preferencePosition = Math.round(clampPreferenceScore(row.averageScore) * 100);
                          const preferenceDirection =
                            preferencePosition < 46 ? "left" : preferencePosition > 54 ? "right" : "neutral";
                          const preferenceValueLabel =
                            preferenceDirection === "neutral"
                              ? "均衡"
                              : `${preferenceDirection === "left" ? leftLabel : rightLabel} ${Math.abs(preferencePosition - 50) * 2}%`;
                          const activeSegmentCount =
                            preferenceDirection === "neutral"
                              ? 0
                              : Math.max(1, Math.ceil((Math.abs(preferencePosition - 50) / 50) * 4));

                          return (
                            <Tooltip
                              classNames={{ container: "workspace-preference-tooltip__container" }}
                              key={row.dimension}
                              title={getPreferenceExplanation(leftLabel, rightLabel, row.averageScore)}
                            >
                              <div
                                className="preference-row"
                                aria-label={`${row.label}：${preferenceValueLabel}`}
                              >
                                <strong>{row.label}</strong>
                                <span className="preference-pole preference-pole--left">{leftLabel}</span>
                                <div className="preference-axis">
                                  {preferenceSideSegments.map((_, index) => (
                                    <i
                                      className={`preference-axis__segment preference-axis__segment--left ${
                                        preferenceDirection === "left" && index >= 4 - activeSegmentCount ? "is-active" : ""
                                      }`}
                                      key={`left-${index}`}
                                    />
                                  ))}
                                  <i
                                    className={`preference-axis__segment preference-axis__segment--neutral ${
                                      preferenceDirection === "neutral" ? "is-active" : ""
                                    }`}
                                  />
                                  {preferenceSideSegments.map((_, index) => (
                                    <i
                                      className={`preference-axis__segment preference-axis__segment--right ${
                                        preferenceDirection === "right" && index < activeSegmentCount ? "is-active" : ""
                                      }`}
                                      key={`right-${index}`}
                                    />
                                  ))}
                                  <b
                                    className={`preference-axis__point is-${preferenceDirection}`}
                                    style={{ left: `${preferencePosition}%` }}
                                  >
                                    <span>{preferenceValueLabel}</span>
                                  </b>
                                </div>
                                <span className="preference-pole preference-pole--right">{rightLabel}</span>
                              </div>
                            </Tooltip>
                          );
                        })}
                        {!portrait?.dimensions?.length && <p className="workspace-empty-text">暂无画像维度数据</p>}
                      </div>
                    </article>

                    <article className="preference-card keywords-card">
                      <h4>
                        成员偏好关键词 <span>Top 词云</span>
                      </h4>
                      <div className="keyword-cloud">
                        {(portrait?.keywords?.length ? portrait.keywords : ["等待成员完成测试"]).map((keyword) => (
                          <span key={keyword}>{keyword}</span>
                        ))}
                      </div>
                    </article>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </Content>
      </Layout>
        </>
      )}

      <Modal
        centered
        className="workspace-availability-modal"
        destroyOnHidden
        footer={null}
        mask={{ enabled: true, blur: true, closable: !saveAvailabilityMutation.isPending }}
        open={availabilityModalOpen}
        title={
          <span className="workspace-availability-modal__title">
            <CalendarDays size={20} />
            填写可出行时间
          </span>
        }
        width={480}
        onCancel={() => {
          if (!saveAvailabilityMutation.isPending) {
            setAvailabilityModalOpen(false);
          }
        }}
      >
        <div className="workspace-availability-modal__content">
          <p>{detail?.locked ? "最终日期已锁定，当前不可修改。" : "选择完整的开始和结束日期后将自动保存。"}</p>
          <RangePicker
            allowClear
            className="calendar-range-picker"
            disabled={detail?.locked || saveAvailabilityMutation.isPending}
            format="YYYY-MM-DD"
            locale={datePickerZhCN}
            placeholder={["开始日期", "结束日期"]}
            value={availabilityRange}
            onChange={(dates) => updateAvailabilityRange(dates)}
          />
          {saveAvailabilityMutation.isPending && <small>正在保存可出行时间...</small>}
        </div>
      </Modal>

    </Layout>
  );
}
