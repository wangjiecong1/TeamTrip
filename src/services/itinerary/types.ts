export type ItineraryTeam = {
  teamId: number;
  name: string;
  description?: string;
  avatar?: string;
  ownerId?: number;
  destination?: string;
  inviteCode?: string;
  teamStatus?: number;
  teamStatusText?: string;
  dateLocked?: number;
  locked: boolean;
  lockedBy?: number;
  lockedAt?: string;
  finalStartDate?: string;
  finalEndDate?: string;
  createTime?: string;
};

export type ItineraryItem = {
  id: number;
  teamId: number;
  itemDate: string;
  placeName: string;
  address?: string;
  longitude?: number;
  latitude?: number;
  amapPoiId?: string;
  poiType?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  note?: string;
  orderNum?: number;
  itemStatus?: number;
  version?: number;
  createdBy?: number;
  createdByNickname?: string;
  updatedBy?: number;
  updatedByNickname?: string;
  createTime?: string;
  updateTime?: string;
  hasConflict?: boolean;
  conflictWith?: number[];
  transitToNextMinutes?: number;
  transitSufficient?: boolean;
  nextItemId?: number;
};

export type ItineraryDayGroup = {
  date: string;
  items: ItineraryItem[];
};

export type ItineraryTimeline = {
  team: ItineraryTeam;
  days: ItineraryDayGroup[];
};

export type CreateItineraryItemRequest = {
  itemDate: string;
  placeName: string;
  address?: string;
  longitude?: number;
  latitude?: number;
  amapPoiId?: string;
  poiType?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  note?: string;
};

export type UpdateItineraryItemRequest = Partial<CreateItineraryItemRequest>;

export type ReorderItineraryRequest = {
  itemDate: string;
  orderedItemIds: number[];
};

export type AmapPoiResult = {
  id: string;
  name: string;
  address?: string;
  type?: string;
  longitude: number;
  latitude: number;
};

export type ItineraryOnlineMember = {
  userId: string | number;
  nickname?: string;
  avatar?: string;
};

export type ItinerarySocketSnapshot = {
  tripId?: string | number;
  days?: unknown[];
  items?: unknown[];
  locked?: boolean;
  serverVersion?: number;
  [key: string]: unknown;
};

export type ItinerarySocketEventName =
  | "itinerary:item_added"
  | "itinerary:item_updated"
  | "itinerary:item_deleted"
  | "itinerary:item_moved"
  | "itinerary:locked"
  | "itinerary:unlocked"
  | "itinerary:conflict_detected";

export type ItineraryRealtimeActor = {
  userId: number;
  displayName?: string;
  avatar?: string;
};

export type ItineraryRealtimeFrame<T = Record<string, unknown>> = {
  type: string;
  code: number;
  message?: string;
  actor?: ItineraryRealtimeActor | null;
  occurredAt: string;
  data: T;
  version?: number;
  traceId?: string;
};

export type ItineraryCommandAck =
  | {
      ok: true;
      serverVersion?: number;
      locked?: boolean;
    }
  | {
      ok: false;
      reason?: string | number;
      message?: string;
    };

export type AddItineraryItemCommand = {
  itemDate: string;
  placeName: string;
  address?: string;
  longitude?: number;
  latitude?: number;
  amapPoiId?: string;
  poiType?: string;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes?: number;
  note?: string;
};

export type UpdateItineraryItemCommand = {
  itemId: string | number;
  patch: Partial<AddItineraryItemCommand>;
};

export type MoveItineraryItemCommand = {
  itemId: string | number;
  fromDayId: string;
  toDayId: string;
  toIndex: number;
  orderedItemIds: Array<string | number>;
};

export type ItineraryRealtimeConnection = {
  addItem: (payload: AddItineraryItemCommand) => Promise<ItineraryCommandAck>;
  updateItem: (payload: UpdateItineraryItemCommand) => Promise<ItineraryCommandAck>;
  deleteItem: (itemId: string | number) => Promise<ItineraryCommandAck>;
  moveItem: (payload: MoveItineraryItemCommand) => Promise<ItineraryCommandAck>;
  lock: () => Promise<ItineraryCommandAck>;
  unlock: () => Promise<ItineraryCommandAck>;
  sync: (force?: boolean) => Promise<void>;
  disconnect: () => void;
};

export type ItineraryRealtimeStatus = "connecting" | "connected" | "syncing" | "disconnected" | "error";
