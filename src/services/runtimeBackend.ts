const RUNTIME_BACKEND_ORIGIN_KEY = "teamtrip-runtime-backend-origin";
const RUNTIME_HTTP_BACKEND_ORIGIN_KEY = "teamtrip-runtime-http-backend-origin";
const RUNTIME_SOCKET_BACKEND_ORIGIN_KEY = "teamtrip-runtime-socket-backend-origin";

type RuntimeBackendTarget = "http" | "socket";

const addDefaultProtocol = (value: string) => (/^https?:\/\//i.test(value) ? value : `http://${value}`);
const getRuntimeBackendKey = (target: RuntimeBackendTarget) =>
  target === "http" ? RUNTIME_HTTP_BACKEND_ORIGIN_KEY : RUNTIME_SOCKET_BACKEND_ORIGIN_KEY;

export const normalizeBackendOrigin = (input: string) => {
  const value = input.trim();

  if (!value) {
    return "";
  }

  try {
    return new URL(addDefaultProtocol(value)).origin;
  } catch {
    return "";
  }
};

export const getRuntimeBackendOrigin = (target: RuntimeBackendTarget) => {
  if (typeof window === "undefined") {
    return "";
  }

  return normalizeBackendOrigin(
    window.localStorage.getItem(getRuntimeBackendKey(target)) || window.localStorage.getItem(RUNTIME_BACKEND_ORIGIN_KEY) || "",
  );
};

export const setRuntimeBackendOrigin = (target: RuntimeBackendTarget, origin: string) => {
  const normalizedOrigin = normalizeBackendOrigin(origin);

  if (!normalizedOrigin) {
    throw new Error("请输入有效的后端域名或 IP 地址");
  }

  window.localStorage.setItem(getRuntimeBackendKey(target), normalizedOrigin);
  return normalizedOrigin;
};

export const clearRuntimeBackendOrigin = (target: RuntimeBackendTarget) => {
  window.localStorage.removeItem(getRuntimeBackendKey(target));
};

export const clearRuntimeBackendOrigins = () => {
  window.localStorage.removeItem(RUNTIME_BACKEND_ORIGIN_KEY);
  window.localStorage.removeItem(RUNTIME_HTTP_BACKEND_ORIGIN_KEY);
  window.localStorage.removeItem(RUNTIME_SOCKET_BACKEND_ORIGIN_KEY);
};
