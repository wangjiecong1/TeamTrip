import { io, Socket } from "socket.io-client";
import { authTokenStorage } from "../http/client";
import {
  AddItineraryItemCommand,
  ItineraryCommandAck,
  ItineraryOnlineMember,
  ItineraryRealtimeConnection,
  ItineraryRealtimeStatus,
  ItineraryServerEvent,
  ItinerarySocketEventName,
  ItinerarySocketSnapshot,
  MoveItineraryItemCommand,
  UpdateItineraryItemCommand,
} from "./types";

const DEFAULT_API_BASE_URL = "https://cricketchief.com";
const COMMAND_TIMEOUT_MS = 5_000;
const SERVER_EVENT_NAMES: ItinerarySocketEventName[] = [
  "itinerary:item_added",
  "itinerary:item_updated",
  "itinerary:item_deleted",
  "itinerary:item_moved",
  "itinerary:locked",
  "itinerary:unlocked",
];

type JoinAck =
  | {
      ok: true;
      snapshot: ItinerarySocketSnapshot;
      onlineMembers: ItineraryOnlineMember[];
      serverVersion: number;
    }
  | {
      ok: false;
      reason?: string;
      message?: string;
    };

type SyncAck =
  | {
      ok: true;
      mode: "snapshot";
      snapshot: ItinerarySocketSnapshot;
    }
  | {
      ok: true;
      mode: "events";
      events: Array<ItineraryServerEvent & { type?: ItinerarySocketEventName; eventName?: ItinerarySocketEventName }>;
    }
  | {
      ok: false;
      reason?: string;
      message?: string;
    };

type ItineraryRealtimeOptions = {
  tripId: string | number;
  onEvent: (eventName: ItinerarySocketEventName, event: ItineraryServerEvent) => void;
  onSnapshot?: (snapshot: ItinerarySocketSnapshot) => void;
  onOnlineMembersChange?: (members: ItineraryOnlineMember[]) => void;
  onStatusChange?: (status: ItineraryRealtimeStatus) => void;
  onProtocolError?: (message: string) => void;
};

let sharedSocket: Socket | null = null;

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  return new URL(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL, window.location.origin).origin;
};

const createSocket = (token: string) =>
  io(getSocketUrl(), {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 5_000,
    timeout: 20_000,
    autoConnect: false,
  });

const getSocket = (token: string) => {
  if (!sharedSocket) {
    sharedSocket = createSocket(token);
  } else {
    sharedSocket.auth = { token };
  }

  return sharedSocket;
};

const createClientEventId = () =>
  typeof window.crypto?.randomUUID === "function"
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const getAckError = (ack?: unknown) => {
  if (ack && typeof ack === "object") {
    const response = ack as { reason?: string; message?: string };
    return response.message || response.reason || "实时协作操作失败";
  }

  return "实时协作操作失败";
};

export const disconnectItinerarySocket = () => {
  sharedSocket?.disconnect();
  sharedSocket = null;
};

export const connectItineraryRealtime = ({
  tripId,
  onEvent,
  onSnapshot,
  onOnlineMembersChange,
  onStatusChange,
  onProtocolError,
}: ItineraryRealtimeOptions): ItineraryRealtimeConnection => {
  const normalizedTripId = String(tripId);
  let socket: Socket | null = null;
  let disposed = false;
  let joined = false;
  let hasConnected = false;
  let serverVersion = 0;
  let tokenRefreshPromise: Promise<void> | null = null;
  let resolveReady: (() => void) | null = null;
  let rejectReady: ((error: Error) => void) | null = null;
  let roomReady = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  void roomReady.catch(() => {});

  const resetRoomReady = () => {
    roomReady = new Promise<void>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    void roomReady.catch(() => {});
  };

  const applySnapshot = (snapshot: ItinerarySocketSnapshot) => {
    serverVersion = Number(snapshot.serverVersion) || serverVersion;
    onSnapshot?.(snapshot);
  };

  const handleServerEvent = (eventName: ItinerarySocketEventName, event: ItineraryServerEvent) => {
    const nextVersion = Number(event.serverVersion);

    if (!Number.isFinite(nextVersion) || nextVersion <= serverVersion) {
      return;
    }

    if (nextVersion > serverVersion + 1) {
      void syncTrip();
      return;
    }

    serverVersion = nextVersion;
    onEvent(eventName, event);
  };

  const syncTrip = async () => {
    if (!socket?.connected || disposed) {
      return;
    }

    onStatusChange?.("syncing");
    socket.timeout(COMMAND_TIMEOUT_MS).emit(
      "trip:sync",
      { tripId: normalizedTripId, lastVersion: serverVersion },
      (error: Error | null, ack?: SyncAck) => {
        if (disposed) {
          return;
        }

        if (error || !ack?.ok) {
          onStatusChange?.("error");
          onProtocolError?.(error?.message || getAckError(ack));
          return;
        }

        if (ack.mode === "snapshot") {
          applySnapshot(ack.snapshot);
        } else {
          for (const event of ack.events) {
            const eventName = event.eventName || event.type;

            if (eventName && SERVER_EVENT_NAMES.includes(eventName)) {
              handleServerEvent(eventName, event);
            }
          }
        }

        onStatusChange?.("connected");
      },
    );
  };

  const joinTrip = (shouldSync: boolean) => {
    if (!socket?.connected || disposed) {
      return;
    }

    const lastKnownVersion = serverVersion;
    onStatusChange?.("connecting");
    socket.timeout(COMMAND_TIMEOUT_MS).emit(
      "trip:join",
      { tripId: normalizedTripId },
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
        onSnapshot?.(ack.snapshot);
        onOnlineMembersChange?.(ack.onlineMembers || []);
        resolveReady?.();

        if (shouldSync) {
          serverVersion = lastKnownVersion;
          void syncTrip();
        } else {
          serverVersion = Number(ack.serverVersion ?? ack.snapshot.serverVersion) || 0;
          onStatusChange?.("connected");
        }
      },
    );
  };

  const handleConnect = () => {
    const shouldSync = hasConnected;
    hasConnected = true;
    joinTrip(shouldSync);
  };

  const handleConnectError = (error: Error) => {
    if (disposed) {
      return;
    }

    if (error.message === "UNAUTHORIZED") {
      if (!tokenRefreshPromise) {
        tokenRefreshPromise = authTokenStorage
          .refreshAccessToken()
          .then((token) => {
            if (!token) {
              throw new Error("登录状态已过期，请重新登录");
            }

            if (socket && !disposed) {
              socket.auth = { token };
              socket.connect();
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
  };

  const initialize = async () => {
    try {
      onStatusChange?.("connecting");
      const token = await authTokenStorage.ensureAccessToken();

      if (!token) {
        throw new Error("登录状态已过期，请重新登录");
      }

      if (disposed) {
        return;
      }

      socket = getSocket(token);
      socket.on("connect", handleConnect);
      socket.on("connect_error", handleConnectError);
      socket.on("disconnect", () => {
        if (!disposed) {
          joined = false;
          resetRoomReady();
          onStatusChange?.("disconnected");
        }
      });
      socket.on("trip:member_online", (data: { onlineMembers?: ItineraryOnlineMember[] }) => {
        onOnlineMembersChange?.(data.onlineMembers || []);
      });
      socket.on("trip:member_offline", (data: { onlineMembers?: ItineraryOnlineMember[] }) => {
        onOnlineMembersChange?.(data.onlineMembers || []);
      });

      for (const eventName of SERVER_EVENT_NAMES) {
        socket.on(eventName, (event: ItineraryServerEvent) => handleServerEvent(eventName, event));
      }

      if (socket.connected) {
        handleConnect();
      } else {
        socket.connect();
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
          tripId: normalizedTripId,
          baseVersion: serverVersion,
          payload,
        },
        (error: Error | null, ack?: ItineraryCommandAck) => {
          if (error) {
            reject(new Error("操作确认超时，请检查网络后重试"));
            return;
          }

          if (!ack?.ok) {
            reject(new Error(getAckError(ack)));
            return;
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
      socket.emit("trip:leave", { tripId: normalizedTripId });
    }

    socket.off("connect", handleConnect);
    socket.off("connect_error", handleConnectError);
    socket.off("disconnect");
    socket.off("trip:member_online");
    socket.off("trip:member_offline");
    for (const eventName of SERVER_EVENT_NAMES) {
      socket.off(eventName);
    }
  };

  void initialize();

  return {
    addItem: (payload: AddItineraryItemCommand) => sendCommand("itinerary:item_add", payload),
    updateItem: (payload: UpdateItineraryItemCommand) => sendCommand("itinerary:item_update", payload),
    deleteItem: (itemId: string | number) => sendCommand("itinerary:item_delete", { itemId: String(itemId) }),
    moveItem: (payload: MoveItineraryItemCommand) => sendCommand("itinerary:item_move", payload),
    lock: () => sendCommand("itinerary:lock", {}),
    unlock: () => sendCommand("itinerary:unlock", {}),
    disconnect,
  };
};
