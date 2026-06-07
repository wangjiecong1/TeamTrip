const RUNTIME_BACKEND_ORIGIN_KEY = "teamtrip-runtime-backend-origin";

const addDefaultProtocol = (value: string) => (/^https?:\/\//i.test(value) ? value : `http://${value}`);

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

export const getRuntimeBackendOrigin = () => {
  if (typeof window === "undefined") {
    return "";
  }

  return normalizeBackendOrigin(window.localStorage.getItem(RUNTIME_BACKEND_ORIGIN_KEY) || "");
};

export const setRuntimeBackendOrigin = (origin: string) => {
  const normalizedOrigin = normalizeBackendOrigin(origin);

  if (!normalizedOrigin) {
    throw new Error("请输入有效的后端域名或 IP 地址");
  }

  window.localStorage.setItem(RUNTIME_BACKEND_ORIGIN_KEY, normalizedOrigin);
  return normalizedOrigin;
};

export const clearRuntimeBackendOrigin = () => {
  window.localStorage.removeItem(RUNTIME_BACKEND_ORIGIN_KEY);
};
