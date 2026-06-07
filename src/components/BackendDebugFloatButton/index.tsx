import React, { useState } from "react";
import { Button, FloatButton, Input, Popover, message } from "antd";
import { ServerCog } from "lucide-react";
import {
  clearRuntimeBackendOrigin,
  getRuntimeBackendOrigin,
  normalizeBackendOrigin,
  setRuntimeBackendOrigin,
} from "../../services/runtimeBackend";
import "./index.less";

export function BackendDebugFloatButton() {
  const [messageApi, contextHolder] = message.useMessage();
  const [open, setOpen] = useState(false);
  const [backendOrigin, setBackendOrigin] = useState(getRuntimeBackendOrigin());
  const normalizedOrigin = normalizeBackendOrigin(backendOrigin);
  const currentOrigin = getRuntimeBackendOrigin();

  const reloadApp = () => window.location.reload();

  const saveBackendOrigin = () => {
    try {
      setRuntimeBackendOrigin(backendOrigin);
      messageApi.success("后端联调地址已保存，正在刷新页面");
      window.setTimeout(reloadApp, 300);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "请输入有效的后端地址");
    }
  };

  const clearBackendOrigin = () => {
    clearRuntimeBackendOrigin();
    messageApi.success("已恢复默认后端地址，正在刷新页面");
    window.setTimeout(reloadApp, 300);
  };

  const content = (
    <div className="backend-debug-popover">
      <p>输入本地后端域名或 IP，HTTP API 与 Socket.IO 会同时切换。</p>
      <Input
        allowClear
        placeholder="例如 127.0.0.1:8080"
        value={backendOrigin}
        onChange={(event) => setBackendOrigin(event.target.value)}
        onPressEnter={saveBackendOrigin}
      />
      <div className="backend-debug-popover__preview">
        当前：{currentOrigin || "默认配置"}
        {backendOrigin && normalizedOrigin && normalizedOrigin !== backendOrigin.trim() && (
          <span>将保存为：{normalizedOrigin}</span>
        )}
      </div>
      <div className="backend-debug-popover__actions">
        <Button disabled={!currentOrigin} onClick={clearBackendOrigin}>清除</Button>
        <Button type="primary" onClick={saveBackendOrigin}>保存并刷新</Button>
      </div>
    </div>
  );

  return (
    <>
      {contextHolder}
      <Popover
        content={content}
        open={open}
        placement="leftBottom"
        title={<span className="backend-debug-popover__title">后端联调地址</span>}
        trigger="click"
        onOpenChange={setOpen}
      >
        <FloatButton
          className="backend-debug-float-button"
          icon={<ServerCog size={20} />}
          tooltip={currentOrigin ? `联调中：${currentOrigin}` : "配置后端联调地址"}
          type={currentOrigin ? "primary" : "default"}
        />
      </Popover>
    </>
  );
}
