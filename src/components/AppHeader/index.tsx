import React, { useMemo } from "react";
import { Avatar, Button } from "antd";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, Plus, UserPlus } from "lucide-react";
import logoPin from "../../../assets/common/app-header-logo-pin.svg";
import avatarFallback from "../../../assets/common/app-header-user-avatar.svg";
import { getUserAvatarUrl, UserResponse } from "../../services";
import { UserAccountMenu } from "../UserAccountMenu";
import "./index.less";

type AppHeaderAction = {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost";
};

type AppHeaderProps = {
  title?: string;
  actions?: AppHeaderAction[];
  onCreateTeam?: () => void;
  onJoinTeam?: () => void;
  onLogout?: () => void;
  showUserMenu?: boolean;
};

export function AppHeader({
  title = "我的团队",
  actions,
  onCreateTeam,
  onJoinTeam,
  onLogout,
  showUserMenu = true,
}: AppHeaderProps) {
  const headerActions =
    actions ??
    [
      { label: "创建团队", icon: Plus, onClick: onCreateTeam, variant: "primary" as const },
      { label: "加入团队", icon: UserPlus, onClick: onJoinTeam, variant: "outline" as const },
    ];
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(window.localStorage.getItem("teamtrip-auth-user") || "null") as UserResponse | null;
    } catch {
      return null;
    }
  }, []);
  const userAvatar = getUserAvatarUrl(storedUser) || avatarFallback;

  return (
    <header className="app-header">
        <div className="app-header__brand">
          <img src={logoPin} alt="TeamTrip" />
          <span>TeamTrip</span>
        </div>
        <span className="app-header__divider" aria-hidden="true" />
        <h1>{title}</h1>

        <div className="app-header__actions">
          {headerActions.map(({ label, icon: Icon, onClick, variant = "ghost" }) => (
            <Button
              className={`app-header__button app-header__button--${variant}`}
              htmlType="button"
              icon={Icon ? <Icon size={20} /> : undefined}
              key={label}
              type={variant === "primary" ? "primary" : variant === "ghost" ? "text" : "default"}
              onClick={onClick}
            >
              {label}
            </Button>
          ))}
          {showUserMenu && (
            <UserAccountMenu onLogout={onLogout}>
              <Button className="app-header__avatar-button" htmlType="button" type="text">
                <Avatar alt="用户头像" size={46} src={userAvatar} />
                <ChevronDown size={20} />
              </Button>
            </UserAccountMenu>
          )}
        </div>
    </header>
  );
}
