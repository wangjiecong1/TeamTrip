import { io } from "socket.io-client";
import { authTokenStorage } from "../http/client";
import { getRuntimeBackendOrigin } from "../runtimeBackend";

const DEFAULT_API_BASE_URL = "https://cricketchief.com";

export type TeamRealtimeEventName = "team:updated" | "team:deleted";

export type TeamRealtimeFrame = {
  data?: {
    teamId?: number;
    teamName?: string;
    action?: "updated" | "deleted";
  };
};

const getSocketUrl = () => {
  const runtimeBackendOrigin = getRuntimeBackendOrigin("socket");

  if (runtimeBackendOrigin) {
    return runtimeBackendOrigin;
  }

  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  return new URL(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL, window.location.origin).origin;
};

export const connectTeamRealtime = async (
  onEvent: (eventName: TeamRealtimeEventName, frame: TeamRealtimeFrame) => void,
) => {
  const token = await authTokenStorage.ensureAccessToken();

  if (!token) {
    throw new Error("登录状态已过期，无法建立团队实时连接");
  }

  const socket = io(getSocketUrl(), {
    path: "/socket.io",
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2_000,
    reconnectionDelayMax: 30_000,
  });

  const handleUpdated = (frame: TeamRealtimeFrame) => onEvent("team:updated", frame);
  const handleDeleted = (frame: TeamRealtimeFrame) => onEvent("team:deleted", frame);

  socket.on("team:updated", handleUpdated);
  socket.on("team:deleted", handleDeleted);

  return () => {
    socket.off("team:updated", handleUpdated);
    socket.off("team:deleted", handleDeleted);
    socket.disconnect();
  };
};
