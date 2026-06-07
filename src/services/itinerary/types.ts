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
  userId: string;
  nickname?: string;
  avatar?: string;
};

export type ItinerarySocketSnapshot = {
  tripId: string;
  days: unknown[];
  items: unknown[];
  locked: boolean;
  serverVersion: number;
  [key: string]: unknown;
};

export type ItinerarySocketEventName =
  | "itinerary:item_added"
  | "itinerary:item_updated"
  | "itinerary:item_deleted"
  | "itinerary:item_moved"
  | "itinerary:locked"
  | "itinerary:unlocked";

export type ItineraryServerEvent<T = Record<string, unknown>> = {
  eventId: string;
  tripId: string;
  serverVersion: number;
  operatorUserId: string;
  payload: T;
  createdAt: string;
};

export type ItineraryCommandAck =
  | {
      ok: true;
      serverVersion: number;
    }
  | {
      ok: false;
      reason?: string;
      message?: string;
    };

export type AddItineraryItemCommand = {
  dayId: string;
  placeId?: string;
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  startTime?: string | null;
  endTime?: string | null;
  note?: string;
};

export type UpdateItineraryItemCommand = {
  itemId: string;
  patch: Partial<Omit<AddItineraryItemCommand, "dayId" | "placeId" | "name">> & {
    dayId?: string;
    placeId?: string;
    name?: string;
  };
};

export type MoveItineraryItemCommand = {
  itemId: string;
  fromDayId: string;
  toDayId: string;
  toIndex: number;
};

export type ItineraryRealtimeConnection = {
  addItem: (payload: AddItineraryItemCommand) => Promise<ItineraryCommandAck>;
  updateItem: (payload: UpdateItineraryItemCommand) => Promise<ItineraryCommandAck>;
  deleteItem: (itemId: string | number) => Promise<ItineraryCommandAck>;
  moveItem: (payload: MoveItineraryItemCommand) => Promise<ItineraryCommandAck>;
  lock: () => Promise<ItineraryCommandAck>;
  unlock: () => Promise<ItineraryCommandAck>;
  disconnect: () => void;
};

export type ItineraryRealtimeStatus = "connecting" | "connected" | "syncing" | "disconnected" | "error";
