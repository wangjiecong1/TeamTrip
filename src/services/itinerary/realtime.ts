import { io, Socket } from "socket.io-client";
import { authTokenStorage } from "../http/client";
import { getRuntimeBackendOrigin } from "../runtimeBackend";
import {
  AddItineraryItemCommand,
  ItineraryCommandAck,
  ItineraryOnlineMember,
  ItineraryRealtimeConnection,
  ItineraryRealtimeFrame,
  ItineraryRealtimeStatus,
  ItinerarySocketEventName,
  ItinerarySocketSnapshot,
  MoveItineraryItemCommand,
  UpdateItineraryItemCommand,
} from "./types";

const DEFAULT_API_BASE_URL = "https://cricketchief.com";
const COMMAND_TIMEOUT_MS = 8_000;
const SERVER_EVENT_NAMES: ItinerarySocketEventName[] = [
  "itinerary:item_added",
  "itinerary:item_updated",
  "itinerary:item_deleted",
  "itinerary:item_moved",
  "itinerary:locked",
  "itinerary:unlocked",
  "itinerary:conflict_detected",
];

type FailedAck = {
  ok: false;
  reason?: string | number;
  message?: string;
};

type JoinAck =
  | {
      ok: true;
      snapshot: ItinerarySocketSnapshot;
      onlineMembers: ItineraryOnlineMember[];
      serverVersion: number;
    }
  | FailedAck;

type SyncAck =
  | {
      ok: true;
      mode: "snapshot";
      snapshot: ItinerarySocketSnapshot;
      serverVersion?: number;
    }
  | FailedAck;

type ItineraryRealtimeOptions = {
  tripId: string | number;
  onEvent: (eventName: ItinerarySocketEventName, frame: ItineraryRealtimeFrame) => void;
  onSnapshot?: (snapshot: ItinerarySocketSnapshot) => void;
  onOnlineMembersChange?: (members: ItineraryOnlineMember[]) => void;
  onVersionConflict?: (frame: ItineraryRealtimeFrame) => void;
  onPersonalError?: (frame: ItineraryRealtimeFrame) => void;
  onCommandRejected?: (ack: FailedAck) => void;
  onStatusChange?: (status: ItineraryRealtimeStatus) => void;
  onProtocolError?: (message: string) => void;
};

const activeSockets = new Set<Socket>();

const getSocketUrl = () => {
  const runtimeBackendOrigin = getRuntimeBackendOrigin();

  if (runtimeBackendOrigin) {
    return runtimeBackendOrigin;
  }

  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  return new URL(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL, window.location.origin).origin;
};

const createSocket = (token: string) =>
  io(getSocketUrl(), {
    path: "/socket.io",
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2_000,
    reconnectionDelayMax: 30_000,
    timeout: 8_000,
    autoConnect: false,
  });

const createClientEventId = () =>
  typeof window.crypto?.randomUUID === "function"
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const getAckError = (ack?: unknown) => {
  if (ack && typeof ack === "object") {
    const response = ack as { reason?: string | number; message?: string };
    return response.message || String(response.reason || "实时协作操作失败");
  }

  return "实时协作操作失败";
};

const isAuthorizationError = (message: string) =>
  message.toUpperCase().includes("UNAUTHORIZED") ||
  message.includes("401") ||
  message.toUpperCase().includes("FAILED_AUTHORIZATION");

const isFrameForTrip = (frame: ItineraryRealtimeFrame, tripId: string) => {
  const frameTeamId = (frame.data as Record<string, unknown> | undefined)?.teamId;
  return frameTeamId === undefined || String(frameTeamId) === tripId;
};

export const disconnectItinerarySocket = () => {
  for (const socket of activeSockets) {
    socket.disconnect();
  }
  activeSockets.clear();
};

export const connectItineraryRealtime = ({
  tripId,
  onEvent,
  onSnapshot,
  onOnlineMembersChange,
  onVersionConflict,
  onPersonalError,
  onCommandRejected,
  onStatusChange,
  onProtocolError,
}: ItineraryRealtimeOptions): ItineraryRealtimeConnection => {
  const normalizedTripId = String(tripId);
  const wireTripId = /^\d+$/.test(normalizedTripId) ? Number(normalizedTripId) : tripId;
  let socket: Socket | null = null;
  let currentToken: string | null = null;
  let disposed = false;
  let joined = false;
  let hasConnected = false;
  let commandVersion = 0;
  let appliedServerVersion = 0;
  let tokenRefreshPromise: Promise<void> | null = null;
  let resolveReady: (() => void) | null = null;
  let rejectReady: ((error: Error) => void) | null = null;
  let roomReady = createRoomReady();

  function createRoomReady() {
    const promise = new Promise<void>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    void promise.catch(() => {});
    return promise;
  }

  const replaceSnapshot = (snapshot: ItinerarySocketSnapshot, serverVersion?: number) => {
    const nextVersion = Number(serverVersion ?? snapshot.serverVersion);

    if (Number.isFinite(nextVersion)) {
      commandVersion = nextVersion;
      appliedServerVersion = nextVersion;
    }

    onSnapshot?.(snapshot);
  };

  const syncTrip = (force = false) =>
    new Promise<void>((resolve, reject) => {
      if (!socket?.connected || disposed) {
        reject(new Error("实时连接未就绪，请稍后重试"));
        return;
      }

      onStatusChange?.("syncing");
      socket.timeout(COMMAND_TIMEOUT_MS).emit(
        "trip:sync",
        { tripId: wireTripId, lastVersion: force ? -1 : appliedServerVersion },
        (error: Error | null, ack?: SyncAck) => {
          if (disposed) {
            resolve();
            return;
          }

          if (error || !ack?.ok) {
            const syncError = new Error(error?.message || getAckError(ack));
            onStatusChange?.("error");
            onProtocolError?.(syncError.message);
            reject(syncError);
            return;
          }

          replaceSnapshot(ack.snapshot, ack.serverVersion);
          onStatusChange?.("connected");
          resolve();
        },
      );
    });

  const handleServerEvent = (eventName: ItinerarySocketEventName, frame: ItineraryRealtimeFrame) => {
    if (!isFrameForTrip(frame, normalizedTripId)) {
      return;
    }

    const nextServerVersion = Number(frame.version);

    if (Number.isFinite(nextServerVersion)) {
      appliedServerVersion = Math.max(appliedServerVersion, nextServerVersion);
      commandVersion = Math.max(commandVersion, nextServerVersion);
    }

    onEvent(eventName, frame);
  };

  const handleVersionConflict = (frame: ItineraryRealtimeFrame) => {
    if (!isFrameForTrip(frame, normalizedTripId)) {
      return;
    }

    onVersionConflict?.(frame);
    void syncTrip(true).catch(() => {});
  };

  const handlePersonalError = (frame: ItineraryRealtimeFrame) => {
    if (isFrameForTrip(frame, normalizedTripId)) {
      onPersonalError?.(frame);
    }
  };

  const joinTrip = () => {
    if (!socket?.connected || disposed) {
      return;
    }

    onStatusChange?.("connecting");
    socket.timeout(COMMAND_TIMEOUT_MS).emit(
      "trip:join",
      { tripId: wireTripId, token: currentToken },
      (error: Error | null, ack?: JoinAck) => {
        if (disposed) {
          return;
        }

        if (error || !ack?.ok) {
          const joinError = new Error(error?.message || getAckError(ack));
          rejectReady?.(joinError);
          onStatusChange?.("error");
          onProtocolError?.(joinError.message);
          return;
        }

        joined = true;
        replaceSnapshot(ack.snapshot, ack.serverVersion);
        onOnlineMembersChange?.(ack.onlineMembers || []);
        resolveReady?.();
        onStatusChange?.("connected");
      },
    );
  };

  const handleConnect = () => {
    const isReconnect = hasConnected;
    hasConnected = true;
    joinTrip();

    if (isReconnect) {
      onStatusChange?.("syncing");
    }
  };

  const handleDisconnect = () => {
    if (!disposed) {
      joined = false;
      roomReady = createRoomReady();
      onStatusChange?.("disconnected");
    }
  };

  const attachSocketListeners = (target: Socket) => {
    target.on("connect", handleConnect);
    target.on("connect_error", handleConnectError);
    target.on("disconnect", handleDisconnect);
    target.io.on("reconnect_attempt", () => onStatusChange?.("connecting"));
    target.on("trip:member_online", (data: { onlineMembers?: ItineraryOnlineMember[] }) => {
      onOnlineMembersChange?.(data.onlineMembers || []);
    });
    target.on("trip:member_offline", (data: { onlineMembers?: ItineraryOnlineMember[] }) => {
      onOnlineMembersChange?.(data.onlineMembers || []);
    });
    target.on("personal:version_conflict", handleVersionConflict);
    target.on("personal:error", handlePersonalError);

    for (const eventName of SERVER_EVENT_NAMES) {
      target.on(eventName, (frame: ItineraryRealtimeFrame) => handleServerEvent(eventName, frame));
    }
  };

  const detachSocketListeners = (target: Socket) => {
    target.off("connect", handleConnect);
    target.off("connect_error", handleConnectError);
    target.off("disconnect", handleDisconnect);
    target.io.off("reconnect_attempt");
    target.off("trip:member_online");
    target.off("trip:member_offline");
    target.off("personal:version_conflict", handleVersionConflict);
    target.off("personal:error", handlePersonalError);

    for (const eventName of SERVER_EVENT_NAMES) {
      target.off(eventName);
    }
  };

  const replaceSocket = (token: string) => {
    if (socket) {
      detachSocketListeners(socket);
      activeSockets.delete(socket);
      socket.disconnect();
    }

    currentToken = token;
    joined = false;
    roomReady = createRoomReady();
    socket = createSocket(token);
    activeSockets.add(socket);
    attachSocketListeners(socket);
    socket.connect();
  };

  function handleConnectError(error: Error) {
    if (disposed) {
      return;
    }

    if (isAuthorizationError(error.message)) {
      if (!tokenRefreshPromise) {
        tokenRefreshPromise = authTokenStorage
          .refreshAccessToken()
          .then((token) => {
            if (!token) {
              throw new Error("登录状态已过期，请重新登录");
            }

            if (!disposed) {
              replaceSocket(token);
            }
          })
          .catch((refreshError: unknown) => {
            const message = refreshError instanceof Error ? refreshError.message : "登录状态已过期，请重新登录";
            rejectReady?.(new Error(message));
            onStatusChange?.("error");
            onProtocolError?.(message);
          })
          .finally(() => {
            tokenRefreshPromise = null;
          });
      }

      return;
    }

    onStatusChange?.("error");
    onProtocolError?.(error.message || "实时协作连接失败");
  }

  const initialize = () => {
    const currentToken = authTokenStorage.get();

    if (currentToken && authTokenStorage.isAccessTokenValid()) {
      onStatusChange?.("connecting");
      replaceSocket(currentToken);
      return;
    }

    void initializeAfterTokenRefresh();
  };

  const initializeAfterTokenRefresh = async () => {
    try {
      onStatusChange?.("connecting");
      const token = await authTokenStorage.ensureAccessToken();

      if (!token) {
        throw new Error("登录状态已过期，请重新登录");
      }

      if (!disposed) {
        replaceSocket(token);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "实时协作连接失败";
      rejectReady?.(new Error(message));
      onStatusChange?.("error");
      onProtocolError?.(message);
    }
  };

  const sendCommand = async <T,>(eventName: string, payload: T): Promise<ItineraryCommandAck> => {
    await roomReady;

    if (!socket?.connected || disposed) {
      throw new Error("实时连接未就绪，请稍后重试");
    }

    return new Promise<ItineraryCommandAck>((resolve, reject) => {
      socket?.timeout(COMMAND_TIMEOUT_MS).emit(
        eventName,
        {
          clientEventId: createClientEventId(),
          tripId: wireTripId,
          baseVersion: commandVersion,
          payload,
        },
        (error: Error | null, ack?: ItineraryCommandAck) => {
          if (error) {
            reject(new Error("操作确认超时，请检查网络后重试"));
            return;
          }

          if (!ack?.ok) {
            const failedAck = ack || { ok: false, reason: "UNKNOWN_ERROR" };
            onCommandRejected?.(failedAck);

            if (
              String(failedAck.reason) === "409" ||
              String(failedAck.reason) === "ITINERARY_VERSION_CONFLICT"
            ) {
              void syncTrip(true).catch(() => {});
            }

            reject(new Error(getAckError(failedAck)));
            return;
          }

          if (Number.isFinite(Number(ack.serverVersion))) {
            commandVersion = Math.max(commandVersion, Number(ack.serverVersion));
          }

          resolve(ack);
        },
      );
    });
  };

  const disconnect = () => {
    disposed = true;
    rejectReady?.(new Error("实时连接已关闭"));

    if (!socket) {
      return;
    }

    if (joined) {
      socket.emit("trip:leave", { tripId: wireTripId });
    }

    detachSocketListeners(socket);
    activeSockets.delete(socket);
    socket.disconnect();
    socket = null;
  };

  initialize();

  return {
    addItem: (payload: AddItineraryItemCommand) => sendCommand("itinerary:item_add", payload),
    updateItem: (payload: UpdateItineraryItemCommand) => sendCommand("itinerary:item_update", payload),
    deleteItem: (itemId: string | number) => sendCommand("itinerary:item_delete", { itemId }),
    moveItem: (payload: MoveItineraryItemCommand) => sendCommand("itinerary:item_move", payload),
    lock: () => sendCommand("itinerary:lock", {}),
    unlock: () => sendCommand("itinerary:unlock", {}),
    sync: syncTrip,
    disconnect,
  };
};
