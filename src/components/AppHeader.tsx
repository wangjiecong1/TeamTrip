import React, { useState } from "react";
import { Avatar, Button, Dropdown } from "antd";
import type { MenuProps } from "antd";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, LogOut, Plus, Settings, UserPlus } from "lucide-react";
import logoPin from "../../assets/common/app-header-logo-pin.svg";
import avatar from "../../assets/common/app-header-user-avatar.svg";
import { PersonalSettingsDrawer } from "./PersonalSettingsDrawer";
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const headerActions =
    actions ??
    [
      { label: "创建团队", icon: Plus, onClick: onCreateTeam, variant: "primary" as const },
      { label: "加入团队", icon: UserPlus, onClick: onJoinTeam, variant: "outline" as const },
    ];
  const userMenuItems: MenuProps["items"] = [
    {
      key: "settings",
      icon: <Settings size={17} />,
      label: "个人设置",
    },
    {
      key: "logout",
      icon: <LogOut size={17} />,
      label: "退出登录",
    },
  ];

  const handleUserMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "settings") {
      setSettingsOpen(true);
    }

    if (key === "logout") {
      onLogout?.();
    }
  };

  return (
    <>
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
            <Dropdown
              classNames={{ root: "app-header__dropdown" }}
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <Button className="app-header__avatar-button" htmlType="button" type="text">
                <Avatar alt="用户头像" size={46} src={avatar} />
                <ChevronDown size={20} />
              </Button>
            </Dropdown>
          )}
        </div>
      </header>

      <PersonalSettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
