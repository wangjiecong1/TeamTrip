import { apiClient } from "../http/client";
import { ApiError } from "../http/errors";
import {
  AmapPoiResult,
  CreateItineraryItemRequest,
  ItineraryItem,
  ItineraryTimeline,
  ReorderItineraryRequest,
  SharedFinalItineraryView,
  UpdateItineraryItemRequest,
} from "./types";

type ApiResponse<T> = {
  code?: number;
  message?: string;
  data?: T;
};

const isWrappedApiResponse = <T>(response: T | ApiResponse<T>): response is ApiResponse<T> =>
  Boolean(response && typeof response === "object" && ("code" in response || "data" in response || "message" in response));

const unwrapApiResponse = <T>(response: T | ApiResponse<T>): T => {
  if (isWrappedApiResponse(response)) {
    const isSuccess = response.code === undefined || response.code === 200;

    if (!isSuccess) {
      throw new ApiError(response.message || "请求失败，请稍后重试", {
        status: response.code,
        code: String(response.code),
      });
    }

    if (response.data !== undefined && response.data !== null) {
      return response.data;
    }
  }

  return response as T;
};

export const itineraryService = {
  searchPoi: async (keywords: string, city?: string): Promise<AmapPoiResult[]> => {
    const response = await apiClient.get<AmapPoiResult[] | ApiResponse<AmapPoiResult[]>>("/api/v1/amap/poi", {
      params: {
        keywords,
        city: city?.trim() || undefined,
      },
    });

    return unwrapApiResponse(response.data) || [];
  },

  getTimeline: async (teamId: string | number): Promise<ItineraryTimeline> => {
    const response = await apiClient.get<ItineraryTimeline | ApiResponse<ItineraryTimeline>>(
      `/api/v1/teams/${teamId}/itinerary/timeline`,
    );
    const timeline = unwrapApiResponse(response.data);

    return {
      ...timeline,
      days: (timeline.days || []).map((day) => ({
        ...day,
        items: (day.items || []).slice().sort((a, b) => (a.orderNum ?? 0) - (b.orderNum ?? 0)),
      })),
    };
  },

  getSharedFinalItinerary: async (token: string): Promise<SharedFinalItineraryView> => {
    const response = await apiClient.get<SharedFinalItineraryView | ApiResponse<SharedFinalItineraryView>>(
      `/api/v1/share/${encodeURIComponent(token)}`,
    );
    const view = unwrapApiResponse(response.data);

    return {
      ...view,
      days: (view.days || []).map((day) => ({
        ...day,
        items: (day.items || []).slice().sort((a, b) => (a.orderNum ?? 0) - (b.orderNum ?? 0)),
      })),
    };
  },

  createItem: async (teamId: string | number, request: CreateItineraryItemRequest): Promise<ItineraryItem> => {
    const response = await apiClient.post<ItineraryItem | ApiResponse<ItineraryItem>>(
      `/api/v1/teams/${teamId}/itinerary/items`,
      request,
    );

    return unwrapApiResponse(response.data);
  },

  updateItem: async (
    teamId: string | number,
    itemId: string | number,
    request: UpdateItineraryItemRequest,
  ): Promise<ItineraryItem> => {
    const response = await apiClient.put<ItineraryItem | ApiResponse<ItineraryItem>>(
      `/api/v1/teams/${teamId}/itinerary/items/${itemId}`,
      request,
    );

    return unwrapApiResponse(response.data);
  },

  deleteItem: async (teamId: string | number, itemId: string | number): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<unknown> | unknown>(
      `/api/v1/teams/${teamId}/itinerary/items/${itemId}`,
    );

    unwrapApiResponse(response.data);
  },

  restoreItem: async (teamId: string | number, itemId: string | number): Promise<ItineraryItem> => {
    const response = await apiClient.post<ItineraryItem | ApiResponse<ItineraryItem>>(
      `/api/v1/teams/${teamId}/itinerary/items/${itemId}/restore`,
    );

    return unwrapApiResponse(response.data);
  },

  reorderItems: async (teamId: string | number, request: ReorderItineraryRequest): Promise<void> => {
    const response = await apiClient.post<ApiResponse<unknown> | unknown>(
      `/api/v1/teams/${teamId}/itinerary/reorder`,
      request,
    );

    unwrapApiResponse(response.data);
  },

  lock: async (teamId: string | number): Promise<void> => {
    const response = await apiClient.post<ApiResponse<unknown> | unknown>(
      `/api/v1/teams/${teamId}/itinerary/lock`,
    );

    unwrapApiResponse(response.data);
  },

  unlock: async (teamId: string | number): Promise<void> => {
    const response = await apiClient.delete<ApiResponse<unknown> | unknown>(
      `/api/v1/teams/${teamId}/itinerary/lock`,
    );

    unwrapApiResponse(response.data);
  },
};
