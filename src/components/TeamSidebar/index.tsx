import React, { useState } from "react";
import { Layout } from "antd";
import { CalendarCheck, ChevronDown, ClipboardCheck, Grid2X2, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import avatarFallback from "../../../assets/common/app-header-user-avatar.svg";
import { BrandMark } from "../BrandMark";
import { StatusTag, StatusTagVariant } from "../StatusTag";
import { UserAccountMenu } from "../UserAccountMenu";
import "./index.less";

const { Sider } = Layout;

export type TeamSidebarItem = "workspace" | "itinerary" | "final";

type TeamSidebarUser = {
  avatar?: string | null;
  nickname?: string;
  role?: string;
  roleText?: string;
};

type TeamSidebarProps = {
  activeItem: TeamSidebarItem;
  teamId: string;
  hasFinalTravelDates?: boolean;
  finalItineraryEnabled?: boolean;
  finalItineraryLoading?: boolean;
  user?: TeamSidebarUser;
  onBlockedItinerary?: () => void;
  onBlockedFinalItinerary?: () => void;
  onOpenFinalItinerary?: () => void | Promise<void>;
  onLogout?: () => void | Promise<void>;
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

const getRoleText = (user?: TeamSidebarUser) => {
  if (user?.role === "owner") {
    return "Owner";
  }

  return user?.roleText || "成员";
};

export function TeamSidebar({
  activeItem,
  teamId,
  hasFinalTravelDates = true,
  finalItineraryEnabled = false,
  finalItineraryLoading = false,
  user,
  onBlockedItinerary,
  onBlockedFinalItinerary,
  onOpenFinalItinerary,
  onLogout,
}: TeamSidebarProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const navItems = [
    { key: "workspace" as const, label: "团队工作台", icon: Grid2X2, path: `/teams/${teamId}/workspace` },
    {
      key: "itinerary" as const,
      label: "行程规划",
      icon: CalendarCheck,
      path: `/teams/${teamId}/itinerary`,
      requiresFinalDates: true,
    },
    {
      key: "final" as const,
      label: "最终行程单",
      icon: ClipboardCheck,
      requiresLockedItinerary: true,
    },
  ];

  return (
    <Sider
      aria-label="团队导航"
      breakpoint="lg"
      className="workspace-sidebar"
      collapsed={collapsed}
      collapsedWidth={80}
      theme="light"
      trigger={null}
      width={252}
      onBreakpoint={setCollapsed}
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
        {navItems.map(({ key, label, icon: Icon, path, requiresFinalDates, requiresLockedItinerary }) => {
          const isItineraryBlocked = Boolean(requiresFinalDates && !hasFinalTravelDates && key !== activeItem);
          const isFinalBlocked = Boolean(requiresLockedItinerary && !finalItineraryEnabled);
          const isBlocked = isItineraryBlocked || isFinalBlocked;
          const isLoading = key === "final" && finalItineraryLoading;

          return (
            <button
              aria-busy={isLoading || undefined}
              aria-disabled={isBlocked || undefined}
              className={`workspace-nav__item ${key === activeItem ? "active" : ""} ${isBlocked ? "disabled" : ""} ${isLoading ? "loading" : ""}`}
              key={key}
              type="button"
              onClick={() => {
                if (isItineraryBlocked) {
                  onBlockedItinerary?.();
                  return;
                }

                if (key === "final") {
                  if (isFinalBlocked) {
                    onBlockedFinalItinerary?.();
                    return;
                  }

                  void onOpenFinalItinerary?.();
                  return;
                }

                if (path) {
                  navigate(path);
                }
              }}
            >
              {isLoading ? <LoaderCircle className="workspace-nav__loading-icon" size={20} /> : <Icon size={20} />}
              <span className="workspace-nav__item-label">{isLoading ? "生成中..." : label}</span>
            </button>
          );
        })}
      </nav>

      <UserAccountMenu placement="topRight" onLogout={onLogout}>
        <button aria-label="打开个人菜单" className="workspace-sidebar__user" type="button">
          <img src={user?.avatar || avatarFallback} alt={user?.nickname || "我"} />
          <span className="workspace-sidebar__user-info">
            <strong>{user?.nickname || "我"}</strong>
            <StatusTag variant={getRoleVariant(user?.role)}>{getRoleText(user)}</StatusTag>
          </span>
          <ChevronDown size={18} />
        </button>
      </UserAccountMenu>
    </Sider>
  );
}
