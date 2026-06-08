import React, { useState } from "react";
import { Button, FloatButton, Input, Popover, message } from "antd";
import { ServerCog } from "lucide-react";
import {
  clearRuntimeBackendOrigin,
  clearRuntimeBackendOrigins,
  getRuntimeBackendOrigin,
  normalizeBackendOrigin,
  setRuntimeBackendOrigin,
} from "../../services/runtimeBackend";
import "./index.less";

export function BackendDebugFloatButton() {
  const [messageApi, contextHolder] = message.useMessage();
  const [open, setOpen] = useState(false);
  const [httpOrigin, setHttpOrigin] = useState(getRuntimeBackendOrigin("http"));
  const [socketOrigin, setSocketOrigin] = useState(getRuntimeBackendOrigin("socket"));
  const normalizedHttpOrigin = normalizeBackendOrigin(httpOrigin);
  const normalizedSocketOrigin = normalizeBackendOrigin(socketOrigin);
  const currentHttpOrigin = getRuntimeBackendOrigin("http");
  const currentSocketOrigin = getRuntimeBackendOrigin("socket");
  const hasRuntimeOrigin = Boolean(currentHttpOrigin || currentSocketOrigin);

  const reloadApp = () => window.location.reload();

  const saveBackendOrigins = () => {
    try {
      if (httpOrigin.trim() && !normalizedHttpOrigin) {
        throw new Error("请输入有效的 HTTP API 地址");
      }

      if (socketOrigin.trim() && !normalizedSocketOrigin) {
        throw new Error("请输入有效的 Socket.IO 地址");
      }

      if (httpOrigin.trim()) {
        setRuntimeBackendOrigin("http", httpOrigin);
      } else {
        clearRuntimeBackendOrigin("http");
      }

      if (socketOrigin.trim()) {
        setRuntimeBackendOrigin("socket", socketOrigin);
      } else {
        clearRuntimeBackendOrigin("socket");
      }

      messageApi.success("后端联调地址已保存，正在刷新页面");
      window.setTimeout(reloadApp, 300);
    } catch (error) {
      messageApi.error(error instanceof Error ? error.message : "请输入有效的后端地址");
    }
  };

  const clearBackendOrigins = () => {
    clearRuntimeBackendOrigins();
    messageApi.success("已恢复默认后端地址，正在刷新页面");
    window.setTimeout(reloadApp, 300);
  };

  const content = (
    <div className="backend-debug-popover">
      <p>分别配置本地 HTTP API 与 Socket.IO 地址。留空时使用默认配置。</p>
      <div className="backend-debug-popover__field">
        <label htmlFor="runtime-http-backend-origin">HTTP API</label>
        <Input
          allowClear
          id="runtime-http-backend-origin"
          placeholder="例如 127.0.0.1:8080"
          value={httpOrigin}
          onChange={(event) => setHttpOrigin(event.target.value)}
          onPressEnter={saveBackendOrigins}
        />
        <div className="backend-debug-popover__preview">
          当前：{currentHttpOrigin || "默认配置"}
          {httpOrigin && normalizedHttpOrigin && normalizedHttpOrigin !== httpOrigin.trim() && (
            <span>将保存为：{normalizedHttpOrigin}</span>
          )}
        </div>
      </div>
      <div className="backend-debug-popover__field">
        <label htmlFor="runtime-socket-backend-origin">Socket.IO</label>
        <Input
          allowClear
          id="runtime-socket-backend-origin"
          placeholder="例如 127.0.0.1:8081"
          value={socketOrigin}
          onChange={(event) => setSocketOrigin(event.target.value)}
          onPressEnter={saveBackendOrigins}
        />
        <div className="backend-debug-popover__preview">
          当前：{currentSocketOrigin || "默认配置"}
          {socketOrigin && normalizedSocketOrigin && normalizedSocketOrigin !== socketOrigin.trim() && (
            <span>将保存为：{normalizedSocketOrigin}</span>
          )}
        </div>
      </div>
      <div className="backend-debug-popover__actions">
        <Button disabled={!hasRuntimeOrigin} onClick={clearBackendOrigins}>清除全部</Button>
        <Button type="primary" onClick={saveBackendOrigins}>保存并刷新</Button>
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
          tooltip={hasRuntimeOrigin ? "后端联调地址已配置" : "配置后端联调地址"}
          type={hasRuntimeOrigin ? "primary" : "default"}
        />
      </Popover>
    </>
  );
}
