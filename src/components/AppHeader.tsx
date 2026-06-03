import React, { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, LogOut, Plus, Settings, UserPlus } from "lucide-react";
import logoPin from "../../assets/common/app-header-logo-pin.svg";
import avatar from "../../assets/common/app-header-user-avatar.svg";
import "./AppHeader.less";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const headerActions =
    actions ??
    [
      { label: "创建团队", icon: Plus, onClick: onCreateTeam, variant: "primary" as const },
      { label: "加入团队", icon: UserPlus, onClick: onJoinTeam, variant: "outline" as const },
    ];

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
          <button className={`app-header__button app-header__button--${variant}`} key={label} type="button" onClick={onClick}>
            {Icon && <Icon size={20} />}
            {label}
          </button>
        ))}
        {showUserMenu && (
          <div className="app-header__user">
            <button
              className="app-header__avatar-button"
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <img src={avatar} alt="Laow" />
              <ChevronDown size={20} />
            </button>
            {menuOpen && (
              <div className="app-header__menu" role="menu">
                <button type="button" role="menuitem">
                  <Settings size={17} />
                  个人设置
                </button>
                <button type="button" role="menuitem" onClick={onLogout}>
                  <LogOut size={17} />
                  退出登录
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
