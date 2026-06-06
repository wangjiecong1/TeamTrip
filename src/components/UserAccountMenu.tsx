import React, { useState } from "react";
import { Dropdown } from "antd";
import type { DropdownProps, MenuProps } from "antd";
import { LogOut, Settings } from "lucide-react";
import { PersonalSettingsDrawer } from "./PersonalSettingsDrawer";
import "./UserAccountMenu.less";

type UserAccountMenuProps = {
  children: React.ReactElement;
  onLogout?: () => void | Promise<void>;
  placement?: DropdownProps["placement"];
};

export function UserAccountMenu({ children, onLogout, placement = "bottomRight" }: UserAccountMenuProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuItems: MenuProps["items"] = [
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

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "settings") {
      setSettingsOpen(true);
    }

    if (key === "logout") {
      void onLogout?.();
    }
  };

  return (
    <>
      <Dropdown
        classNames={{ root: "user-account-menu__dropdown" }}
        menu={{ items: menuItems, onClick: handleMenuClick }}
        placement={placement}
        trigger={["click"]}
      >
        {children}
      </Dropdown>

      <PersonalSettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
