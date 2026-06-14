import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, Input, Layout, message, Modal, Upload } from "antd";
import type { UploadProps } from "antd";
import {
  AlertCircle,
  Camera,
  Copy,
  Crown,
  Edit3,
  Route,
  Settings2,
  Sparkles,
  Trash2,
  UploadCloud,
  UserCog,
  UserRound,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { StatusTag, StatusTagVariant } from "../../components/StatusTag";
import { TeamSidebar } from "../../components/TeamSidebar";
import { ApiError, authService, authTokenStorage, TeamMemberResponse, teamsService, uploadService } from "../../services";
import avatarFallback from "../../../assets/common/app-header-user-avatar.svg";
import teamCoverFallback from "../../../assets/login-register/login-register-hero-approved.webp";
import "./index.less";

const { Content } = Layout;

type RenameFormValues = {
  name: string;
};

const queryKey = {
  detail: (teamId: string) => ["team-management", teamId, "detail"] as const,
  members: (teamId: string) => ["team-management", teamId, "members"] as const,
  invite: (teamId: string) => ["team-management", teamId, "invite"] as const,
};

const getStoredUserId = () => {
  try {
    const user = JSON.parse(window.localStorage.getItem("teamtrip-auth-user") || "null") as {
      id?: string | number;
      userId?: string | number;
    };

    return user?.id ?? user?.userId;
  } catch {
    return undefined;
  }
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return "请求失败，请稍后重试";
};

const getShareErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return "请先锁定最终行程后再分享";
    }

    if (error.status === 403) {
      return "暂无查看最终行程单权限";
    }
  }

  return getErrorMessage(error);
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

const getRoleText = (member?: Pick<TeamMemberResponse, "role" | "roleText">) => {
  if (member?.role === "owner") {
    return "Owner";
  }

  return member?.roleText || "成员";
};

const getMemberAvatar = (member?: TeamMemberResponse) => member?.tbtiAvatarUrl || member?.avatarUrl || member?.avatar || avatarFallback;

const getStatusVariant = (status = ""): StatusTagVariant => {
  if (status.includes("过期") || status.includes("归档")) {
    return "expired";
  }

  if (status.includes("完成") || status.includes("填写")) {
    return "completed";
  }

  if (status.includes("规划") || status.includes("进行")) {
    return "planning";
  }

  return "active";
};

const getDateSummary = (startDate?: string | null, endDate?: string | null) => {
  if (!startDate || !endDate) {
    return "待锁定";
  }

  return startDate === endDate ? startDate : `${startDate} 至 ${endDate}`;
};

const isTripProfileDone = (member: TeamMemberResponse) => member.tripProfileCompleted || Boolean(member.tbtiCompleted);
const isAvailabilityDone = (member: TeamMemberResponse) => member.availabilitySubmitted || Boolean(member.availabilityCompleted);

export function TeamManagementPage() {
  const { teamId = "" } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [modalApi, modalContextHolder] = Modal.useModal();
  const [renameForm] = Form.useForm<RenameFormValues>();
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [coverModalOpen, setCoverModalOpen] = useState(false);

  const detailQuery = useQuery({
    queryKey: queryKey.detail(teamId),
    queryFn: () => teamsService.getDetail(teamId),
    enabled: Boolean(teamId),
  });

  const membersQuery = useQuery({
    queryKey: queryKey.members(teamId),
    queryFn: () => teamsService.getManagementMembers(teamId),
    enabled: Boolean(teamId),
  });

  const detail = detailQuery.data;
  const members = membersQuery.data?.items || [];
  const storedUserId = getStoredUserId();
  const currentMember =
    members.find((member) => String(member.userId) === String(storedUserId)) ||
    (detail?.myRole === "owner" ? members.find((member) => member.role === "owner") : undefined) ||
    members[0];
  const isInitialLoading = detailQuery.isLoading || membersQuery.isLoading;
  const pageError = detailQuery.error || membersQuery.error;
  const hasFinalTravelDates = Boolean(detail?.dateLocked || (detail?.finalStartDate && detail?.finalEndDate));
  const canShareFinalItinerary = Boolean(detail?.locked);
  const inviteCode = detail?.inviteCode || String(detail?.teamId || teamId);
  const statusText = detail?.teamStatusText || detail?.statusTag || "筹备中";
  const isOwner = detail?.myRole === "owner";
  const coverImage = detail?.displayCoverUrl || detail?.coverUrl || detail?.cityThumbnail || detail?.avatar || teamCoverFallback;
  const ownerMember = members.find((member) => member.role === "owner");
  const removableMembers = useMemo(
    () => members.filter((member) => member.role !== "owner" && String(member.userId) !== String(storedUserId)),
    [members, storedUserId],
  );

  const invalidateTeamScope = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["team-management", teamId] }),
      queryClient.invalidateQueries({ queryKey: ["wb", teamId] }),
    ]);
  };

  const shareFinalItineraryMutation = useMutation({
    mutationFn: () => teamsService.createShareLink(teamId),
    onSuccess: (share) => {
      if (!share.token) {
        messageApi.error("分享链接生成失败，请稍后重试");
        return;
      }

      window.open(`/final-itinerary/${encodeURIComponent(share.token)}`, "_blank", "noopener,noreferrer");
    },
    onError: (error) => messageApi.error(getShareErrorMessage(error)),
  });

  const renameMutation = useMutation({
    mutationFn: ({ name }: RenameFormValues) => teamsService.updateTeam(teamId, { name: name.trim() }),
    onSuccess: async () => {
      await invalidateTeamScope();
      messageApi.success("团队名称已更新");
      setRenameModalOpen(false);
    },
    onError: (error) => messageApi.error(getErrorMessage(error)),
  });

  const coverUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const uploaded = await uploadService.uploadFile(file, "team_cover");
      await teamsService.updateTeam(teamId, { coverFileId: uploaded.fileId });
      return uploaded;
    },
    onSuccess: async () => {
      await invalidateTeamScope();
      messageApi.success("团队封面已更新");
      setCoverModalOpen(false);
    },
    onError: (error) => messageApi.error(getErrorMessage(error)),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => teamsService.removeMember(teamId, userId),
    onSuccess: async () => {
      await invalidateTeamScope();
      messageApi.success("成员已移出");
    },
    onError: (error) => messageApi.error(getErrorMessage(error)),
  });

  const transferOwnerMutation = useMutation({
    mutationFn: (targetUserId: number) => teamsService.transferOwner(teamId, targetUserId),
    onSuccess: async () => {
      await invalidateTeamScope();
      messageApi.success("Owner 已转交");
    },
    onError: (error) => messageApi.error(getErrorMessage(error)),
  });

  const copyInviteMutation = useMutation({
    mutationFn: () => teamsService.getInvite(teamId),
    onSuccess: async (invite) => {
      try {
        await navigator.clipboard?.writeText(invite.inviteText);
        messageApi.success("邀请文案已复制");
      } catch {
        messageApi.error("复制失败，请手动复制邀请码");
      }
    },
    onError: () => messageApi.error("复制失败，请手动复制邀请码"),
  });

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      messageApi.warning("服务端退出失败，已清理本地登录状态");
    } finally {
      authTokenStorage.clear();
      window.localStorage.removeItem("teamtrip-auth-user");
      window.location.assign("/login");
    }
  };

  const openRenameModal = () => {
    renameForm.setFieldsValue({ name: detail?.name || "" });
    setRenameModalOpen(true);
  };

  const submitRename = async ({ name }: RenameFormValues) => {
    const nextName = name.trim();

    if (!nextName) {
      messageApi.warning("请输入团队名称");
      return;
    }

    await renameMutation.mutateAsync({ name: nextName });
  };

  const confirmRemoveMember = (member: TeamMemberResponse) => {
    modalApi.confirm({
      centered: true,
      title: `确认将该成员移出团队吗？`,
      content: `移出后，该成员将无法继续访问团队内容。如需重新加入，需要通过邀请码再次加入。`,
      okText: "确认移出",
      okType: "danger",
      cancelText: "取消",
      onOk: () => removeMemberMutation.mutateAsync(member.userId),
    });
  };

  const confirmTransferOwner = (member: TeamMemberResponse) => {
    modalApi.confirm({
      centered: true,
      title: "确认将 Owner 转交给该成员吗？",
      content: `转交后，你将变为普通成员，团队管理权限将由新 Owner 接管。`,
      okText: "确认转交",
      cancelText: "取消",
      onOk: () => transferOwnerMutation.mutateAsync(member.userId),
    });
  };

  const coverUploadProps: UploadProps = {
    accept: "image/*",
    maxCount: 1,
    showUploadList: false,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith("image/");
      const isLt5M = file.size / 1024 / 1024 <= 5;

      if (!isImage) {
        messageApi.error("请上传图片文件");
      }

      if (!isLt5M) {
        messageApi.error("图片不能超过 5MB");
      }

      return isImage && isLt5M ? true : Upload.LIST_IGNORE;
    },
    customRequest: async ({ file, onError, onSuccess }) => {
      try {
        const uploaded = await coverUploadMutation.mutateAsync(file as File);
        onSuccess?.(uploaded);
      } catch (error) {
        onError?.(error as Error);
      }
    },
  };

  return (
    <Layout hasSider className="team-management-page" aria-busy={isInitialLoading}>
      {contextHolder}
      {modalContextHolder}
      <TeamSidebar
        activeItem="management"
        finalItineraryEnabled={canShareFinalItinerary}
        finalItineraryLoading={shareFinalItineraryMutation.isPending}
        hasFinalTravelDates={hasFinalTravelDates}
        teamId={teamId}
        user={{
          avatar: getMemberAvatar(currentMember),
          nickname: currentMember?.nickname,
          role: currentMember?.role || detail?.myRole,
          roleText: currentMember?.roleText,
        }}
        onBlockedFinalItinerary={() => messageApi.warning(canShareFinalItinerary ? "暂无查看最终行程单权限" : "请先在行程规划页锁定行程")}
        onBlockedItinerary={() => messageApi.warning("请先锁定最终出行日期")}
        onOpenFinalItinerary={() => shareFinalItineraryMutation.mutate()}
        onLogout={handleLogout}
      />

      <Layout className="team-management-main-layout">
        <Content className="team-management-main">
          {pageError && !detail ? (
            <section className="team-management-card team-management-error-state">
              <AlertCircle size={24} />
              <strong>{getErrorMessage(pageError)}</strong>
              <button className="team-management-primary-button" type="button" onClick={() => navigate("/teams")}>
                返回我的团队
              </button>
            </section>
          ) : (
            <div className="team-management-shell">
              <section className="team-management-hero-card">
                <div className="team-management-hero-card__icon">
                  <Settings2 size={28} />
                </div>
                <div className="team-management-hero-card__body">
                  <div className="team-management-title-row">
                    <span>团队管理</span>
                    <StatusTag variant={getStatusVariant(statusText)}>{statusText}</StatusTag>
                  </div>
                  <h2>{detail?.name || "团队旅行"}</h2>
                  <p>{detail?.destination || "待确认目的地"} · {detail?.totalMemberCount ?? members.length} 位成员 · {getDateSummary(detail?.finalStartDate, detail?.finalEndDate)}</p>
                </div>
                <div className="team-management-hero-card__actions">
                  <button className="team-management-outline-button" type="button" onClick={() => navigate(`/teams/${teamId}/workspace`)}>
                    返回工作台
                  </button>
                  <button className="team-management-primary-button" disabled={!hasFinalTravelDates} type="button" onClick={() => navigate(`/teams/${teamId}/itinerary`)}>
                    <Route size={18} />
                    行程规划
                  </button>
                </div>
              </section>

              <div className="team-management-grid">
                <section className="team-management-left-column">
                  <article className="team-management-card">
                    <div className="team-management-card-header">
                      <h3>
                        <Sparkles size={20} />
                        团队信息
                      </h3>
                      {isOwner && (
                        <button className="team-management-text-button" type="button" onClick={openRenameModal}>
                          <Edit3 size={15} />
                          修改团名
                        </button>
                      )}
                    </div>

                    <div className="team-management-cover-preview">
                      <img src={coverImage} alt="团队封面" />
                      {isOwner && (
                        <button className="team-management-cover-action" type="button" onClick={() => setCoverModalOpen(true)}>
                          <Camera size={16} />
                          上传封面
                        </button>
                      )}
                    </div>

                    <div className="team-management-info-list">
                      <div>
                        <span>团队名称</span>
                        <strong>{detail?.name || "团队旅行"}</strong>
                      </div>
                      <div>
                        <span>目的地</span>
                        <strong>{detail?.destination || "待确认"}</strong>
                      </div>
                      <div>
                        <span>Owner</span>
                        <strong>{ownerMember?.nickname || detail?.ownerNickname || "待同步"}</strong>
                      </div>
                      <div>
                        <span>出行日期</span>
                        <strong>{getDateSummary(detail?.finalStartDate, detail?.finalEndDate)}</strong>
                      </div>
                    </div>

                    {!isOwner && <p className="team-management-permission-hint">仅 Owner 可修改团队资料和成员权限。</p>}
                  </article>

                  <article className="team-management-card">
                    <h3>
                      <Copy size={20} />
                      邀请文案
                    </h3>
                    <button className="team-management-invite-card" disabled={copyInviteMutation.isPending} type="button" onClick={() => copyInviteMutation.mutate()}>
                      <span>复制完整邀请文案给队友</span>
                      <strong>{inviteCode}</strong>
                      <Copy size={16} />
                    </button>
                  </article>
                </section>

                <section className="team-management-card team-management-members-card">
                  <div className="team-management-section-header">
                    <h3>
                      <UserRound size={20} />
                      成员管理
                    </h3>
                    <span>{members.length} 人</span>
                  </div>

                  <div className="team-management-member-list">
                    {members.map((member) => {
                      const canManageMember = isOwner && member.role !== "owner" && String(member.userId) !== String(storedUserId);

                      return (
                        <article className="team-management-member" key={member.userId}>
                          <img src={getMemberAvatar(member)} alt={member.nickname} />
                          <div>
                            <strong>
                              {member.nickname}
                              {member.role === "owner" && <Crown size={16} />}
                            </strong>
                            <span>
                              {member.tbtiTypeName || `Trip-BTI ${isTripProfileDone(member) ? "已完成" : "待完成"}`} · 可出行时间 {isAvailabilityDone(member) ? "已填写" : "待填写"}
                            </span>
                          </div>
                          <div className="team-management-member__actions">
                            <StatusTag variant={getRoleVariant(member.role)}>{getRoleText(member)}</StatusTag>
                            {canManageMember && (
                              <>
                                <button className="team-management-text-button" disabled={transferOwnerMutation.isPending} type="button" onClick={() => confirmTransferOwner(member)}>
                                  <UserCog size={15} />
                                  转交 Owner
                                </button>
                                <button className="team-management-danger-button" disabled={removeMemberMutation.isPending} type="button" onClick={() => confirmRemoveMember(member)}>
                                  <Trash2 size={15} />
                                  移出
                                </button>
                              </>
                            )}
                          </div>
                        </article>
                      );
                    })}

                    {!members.length && (
                      <p className="team-management-empty-text">成员信息加载中，可以稍后刷新查看。</p>
                    )}
                  </div>

                  {isOwner && !removableMembers.length && members.length > 0 && (
                    <p className="team-management-permission-hint">当前暂无可移出或转交 Owner 的成员。</p>
                  )}
                </section>
              </div>
            </div>
          )}
        </Content>
      </Layout>

      <Modal
        centered
        destroyOnHidden
        confirmLoading={renameMutation.isPending}
        okText="保存"
        open={renameModalOpen}
        title="修改团名"
        width={460}
        cancelText="取消"
        onCancel={() => setRenameModalOpen(false)}
        onOk={() => renameForm.submit()}
      >
        <div className="team-management-modal-content">
          <div className="team-management-modal-icon">
            <Edit3 size={22} />
          </div>
          <p>团队名称会展示在工作台、邀请文案和行程页面。</p>
          <Form form={renameForm} layout="vertical" requiredMark={false} onFinish={submitRename}>
            <Form.Item
              label="团队名称"
              name="name"
              rules={[
                { required: true, whitespace: true, message: "请输入团队名称" },
                { max: 20, message: "团队名称最多 20 个字符" },
              ]}
            >
              <Input allowClear maxLength={20} showCount placeholder="请输入团队名称" />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      <Modal
        centered
        destroyOnHidden
        footer={null}
        open={coverModalOpen}
        title="上传团队封面"
        width={520}
        onCancel={() => setCoverModalOpen(false)}
      >
        <div className="team-management-upload-panel">
          <img src={coverImage} alt="当前团队封面" />
          <Upload {...coverUploadProps} disabled={coverUploadMutation.isPending}>
            <button className="team-management-primary-button" disabled={coverUploadMutation.isPending} type="button">
              <UploadCloud size={18} />
              {coverUploadMutation.isPending ? "上传中..." : "选择图片"}
            </button>
          </Upload>
          <p>支持 JPG / PNG / WebP，建议横向图片，大小不超过 5MB。</p>
        </div>
      </Modal>
    </Layout>
  );
}
