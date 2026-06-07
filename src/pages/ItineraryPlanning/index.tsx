import React, { CSSProperties, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Form, Input, Layout, message, Modal, Tabs } from "antd";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";
import {
  CalendarDays,
  GripVertical,
  Lock,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { TeamSidebar } from "../../components/TeamSidebar";
import { AmapSearchResult, ItineraryAmap } from "../../components/ItineraryAmap";
import { StatusTag } from "../../components/StatusTag";
import {
  ApiError,
  authService,
  authTokenStorage,
  connectItineraryRealtime,
  disconnectItinerarySocket,
  invalidateItinerary,
  itineraryQueryKeys,
  itineraryService,
  ItineraryDayGroup,
  ItineraryItem,
  ItineraryRealtimeConnection,
  ItineraryRealtimeFrame,
  ItineraryRealtimeStatus,
  ItinerarySocketEventName,
  ItineraryTimeline,
  teamsService,
} from "../../services";
import avatar from "../../../assets/common/app-header-user-avatar.svg";
import "./index.less";

const { Content } = Layout;

const formatTripDate = (date?: string | null) => {
  if (!date) {
    return "";
  }

  const [, month, day] = date.split("-").map(Number);

  return `${month}月${day}日`;
};

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const getTripDateSummary = (startDate?: string | null, endDate?: string | null) => {
  if (!startDate || !endDate) {
    return { dateRange: "日期待锁定", duration: "" };
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const duration = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);

  return {
    dateRange: `${formatTripDate(startDate)} - ${formatTripDate(endDate)}`,
    duration: `${duration}天`,
  };
};

type SortableStopItemProps = {
  stop: ItineraryItem;
  index: number;
  disabled?: boolean;
};

type ManualAddFormValues = {
  placeName: string;
  note?: string;
};

const getStoredUserId = () => {
  try {
    const user = JSON.parse(window.localStorage.getItem("teamtrip-auth-user") || "null") as {
      id?: string | number;
      userId?: string | number;
    };

    return user?.id ?? user?.userId;
  } catch {
    return undefined;
  }
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return "请求失败，请稍后重试";
};

const buildTimelineDays = (
  timeline?: ItineraryTimeline,
  fallbackDates?: { startDate?: string | null; endDate?: string | null },
): ItineraryDayGroup[] => {
  const daysByDate = new Map((timeline?.days || []).map((day) => [day.date, day]));
  const startDate = timeline?.team.finalStartDate || fallbackDates?.startDate;
  const endDate = timeline?.team.finalEndDate || fallbackDates?.endDate;

  if (!startDate || !endDate) {
    return (timeline?.days || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  }

  const days: ItineraryDayGroup[] = [];
  let current = dayjs(startDate);
  const end = dayjs(endDate);

  while (current.valueOf() <= end.valueOf()) {
    const date = current.format("YYYY-MM-DD");
    days.push(daysByDate.get(date) || { date, items: [] });
    current = current.add(1, "day");
  }

  return days;
};

const sortItineraryItems = (items: ItineraryItem[]) =>
  items.slice().sort((left, right) => (left.orderNum ?? 0) - (right.orderNum ?? 0));

const upsertTimelineItem = (timeline: ItineraryTimeline, item: ItineraryItem): ItineraryTimeline => {
  const existingItem = timeline.days.flatMap((day) => day.items).find((current) => current.id === item.id);

  if (
    existingItem?.version !== undefined &&
    item.version !== undefined &&
    Number(item.version) < Number(existingItem.version)
  ) {
    return timeline;
  }

  const daysWithoutItem = timeline.days.map((day) => ({
    ...day,
    items: day.items.filter((current) => current.id !== item.id),
  }));
  const targetDay = daysWithoutItem.find((day) => day.date === item.itemDate);

  if (targetDay) {
    targetDay.items = sortItineraryItems([...targetDay.items, item]);
  } else {
    daysWithoutItem.push({ date: item.itemDate, items: [item] });
    daysWithoutItem.sort((left, right) => left.date.localeCompare(right.date));
  }

  return { ...timeline, days: daysWithoutItem };
};

const removeTimelineItem = (timeline: ItineraryTimeline, itemId: number): ItineraryTimeline => ({
  ...timeline,
  days: timeline.days.map((day) => ({
    ...day,
    items: day.items.filter((item) => item.id !== itemId),
  })),
});

const getNumericItemId = (itemId: unknown) => {
  const numericItemId = Number(itemId);

  return Number.isFinite(numericItemId) ? numericItemId : null;
};

const moveTimelineItem = (
  timeline: ItineraryTimeline,
  itemId: number,
  toDayId: string,
  toIndex: number,
): ItineraryTimeline => {
  const movedItem = timeline.days.flatMap((day) => day.items).find((item) => item.id === itemId);

  if (!movedItem) {
    return timeline;
  }

  return {
    ...timeline,
    days: timeline.days.map((day) => {
      const itemsWithoutMoved = day.items.filter((item) => item.id !== itemId);

      if (day.date !== toDayId) {
        return { ...day, items: itemsWithoutMoved };
      }

      const nextItems = itemsWithoutMoved.slice();
      nextItems.splice(Math.max(0, Math.min(toIndex, nextItems.length)), 0, {
        ...movedItem,
        itemDate: toDayId,
      });

      return {
        ...day,
        items: nextItems.map((item, index) => ({ ...item, orderNum: index })),
      };
    }),
  };
};

const applyTimelineConflicts = (
  timeline: ItineraryTimeline,
  date: string,
  conflicts: Array<{ itemId1: number; itemId2: number }>,
): ItineraryTimeline => {
  const conflictingItemIds = new Set(conflicts.flatMap((conflict) => [conflict.itemId1, conflict.itemId2]));

  return {
    ...timeline,
    days: timeline.days.map((day) =>
      day.date === date
        ? {
            ...day,
            items: day.items.map((item) => ({
              ...item,
              hasConflict: conflictingItemIds.has(item.id),
              conflictWith: conflicts.flatMap((conflict) => {
                if (conflict.itemId1 === item.id) {
                  return [conflict.itemId2];
                }
                if (conflict.itemId2 === item.id) {
                  return [conflict.itemId1];
                }
                return [];
              }),
            })),
          }
        : day,
    ),
  };
};

function SortableStopItem({ stop, index, disabled = false }: SortableStopItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stop.id,
    disabled,
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article className={`itinerary-stop ${isDragging ? "is-dragging" : ""}`} ref={setNodeRef} style={style}>
      <button
        className="itinerary-stop__drag"
        disabled={disabled}
        type="button"
        aria-label={`拖动 ${stop.placeName}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>
      <span className="itinerary-stop__index">{index + 1}</span>
      <div className="itinerary-stop__thumb"><MapPin size={22} /></div>
      <div className="itinerary-stop__body">
        <div>
          <strong>{stop.placeName}</strong>
          {stop.poiType && <StatusTag variant="neutral">{stop.poiType}</StatusTag>}
          {stop.hasConflict && <StatusTag variant="pending">时间冲突</StatusTag>}
        </div>
        <p><MapPin size={14} />{stop.address || "暂无详细地址"}</p>
        <small>
          {[stop.startTime && stop.endTime ? `${stop.startTime} - ${stop.endTime}` : "", stop.note].filter(Boolean).join(" · ") ||
            "待补充时间和备注"}
        </small>
      </div>
      <div className="itinerary-stop__meta">
        <span><img src={avatar} alt="" />{stop.createdByNickname || "团队成员"} 添加</span>
        <button type="button" aria-label="更多操作"><MoreHorizontal size={20} /></button>
      </div>
    </article>
  );
}

export function ItineraryPlanningPage() {
  const { teamId = "" } = useParams();
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchRequest, setSearchRequest] = useState<{ id: number; keyword: string } | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<AmapSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<ItineraryRealtimeStatus>("connecting");
  const [manualAddForm] = Form.useForm<ManualAddFormValues>();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const realtimeConnectionRef = useRef<ItineraryRealtimeConnection | null>(null);
  const detailQuery = useQuery({
    queryKey: ["itinerary", teamId, "detail"],
    queryFn: () => teamsService.getDetail(teamId),
    enabled: Boolean(teamId),
    staleTime: 30_000,
  });
  const membersQuery = useQuery({
    queryKey: ["itinerary", teamId, "members"],
    queryFn: () => teamsService.getMembers(teamId),
    enabled: Boolean(teamId),
    staleTime: 30_000,
  });
  const timelineQuery = useQuery({
    queryKey: itineraryQueryKeys.timeline(teamId),
    queryFn: () => itineraryService.getTimeline(teamId),
    enabled: Boolean(teamId),
    staleTime: 30_000,
  });
  const storedUserId = getStoredUserId();
  const detail = detailQuery.data;
  const timeline = timelineQuery.data;
  const timelineDays = useMemo(
    () =>
      buildTimelineDays(timeline, {
        startDate: detail?.finalStartDate,
        endDate: detail?.finalEndDate,
      }),
    [detail?.finalEndDate, detail?.finalStartDate, timeline],
  );
  const safeActiveDayIndex = Math.min(activeDayIndex, Math.max(0, timelineDays.length - 1));
  const activeDay = timelineDays[safeActiveDayIndex];
  const tripDateSummary = getTripDateSummary(
    timeline?.team.finalStartDate || detail?.finalStartDate,
    timeline?.team.finalEndDate || detail?.finalEndDate,
  );
  const teamName = timeline?.team.name || detail?.name || "团队旅行";
  const teamDestination = timeline?.team.destination || detail?.destination || "地点待确认";
  const teamMemberCount = detail?.totalMemberCount ?? membersQuery.data?.total ?? 0;
  const isItineraryLocked = Boolean(timeline?.team.locked ?? detail?.locked);
  const currentMember =
    membersQuery.data?.items.find((member) => String(member.userId) === String(storedUserId)) ||
    (detail?.myRole === "owner" ? membersQuery.data?.items.find((member) => member.role === "owner") : undefined);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const refreshItinerary = () => invalidateItinerary(queryClient, teamId);

  useEffect(() => {
    if (!teamId) {
      return;
    }

    const updateTimeline = (updater: (timeline: ItineraryTimeline) => ItineraryTimeline) => {
      queryClient.setQueryData<ItineraryTimeline>(itineraryQueryKeys.timeline(teamId), (current) =>
        current ? updater(current) : current,
      );
    };

    const handleRealtimeEvent = (eventName: ItinerarySocketEventName, frame: ItineraryRealtimeFrame) => {
      const data = frame.data as Record<string, unknown>;

      switch (eventName) {
        case "itinerary:item_added": {
          const item = data.item as ItineraryItem | undefined;

          if (item) {
            updateTimeline((current) => upsertTimelineItem(current, item));
          } else {
            void queryClient.invalidateQueries({ queryKey: itineraryQueryKeys.timeline(teamId) });
          }
          break;
        }
        case "itinerary:item_updated": {
          const item = data.item as ItineraryItem | undefined;

          if (item) {
            updateTimeline((current) => upsertTimelineItem(current, item));
          }
          break;
        }
        case "itinerary:item_deleted": {
          const itemId = getNumericItemId(data.itemId);

          if (itemId !== null) {
            updateTimeline((current) => removeTimelineItem(current, itemId));
            const softDeleteTtlSec = Number(data.softDeleteTtlSec);
            messageApi.info(
              Number.isFinite(softDeleteTtlSec)
                ? `行程项已删除，${softDeleteTtlSec} 秒内可撤销`
                : "行程项已删除",
            );
            void realtimeConnectionRef.current?.sync(true).catch(() => {});
          }
          break;
        }
        case "itinerary:item_moved": {
          const date = String(data.date || "");
          const orderedItemIds = Array.isArray(data.orderedItemIds)
            ? data.orderedItemIds.map(getNumericItemId).filter((itemId): itemId is number => itemId !== null)
            : [];

          if (date && orderedItemIds.length) {
            updateTimeline((current) => {
              let nextTimeline = current;

              orderedItemIds.forEach((itemId, index) => {
                nextTimeline = moveTimelineItem(nextTimeline, itemId, date, index);
              });

              return nextTimeline;
            });
            void realtimeConnectionRef.current?.sync(true).catch(() => {});
          }
          break;
        }
        case "itinerary:locked":
          updateTimeline((current) => ({
            ...current,
            team: {
              ...current.team,
              locked: true,
              lockedBy: getNumericItemId(data.lockedBy) ?? undefined,
              finalStartDate: data.finalStartDate
                ? String(data.finalStartDate)
                : current.team.finalStartDate,
              finalEndDate: data.finalEndDate ? String(data.finalEndDate) : current.team.finalEndDate,
            },
          }));
          queryClient.setQueryData(["itinerary", teamId, "detail"], (current: typeof detail) =>
            current ? { ...current, locked: true } : current,
          );
          break;
        case "itinerary:unlocked":
          updateTimeline((current) => ({
            ...current,
            team: { ...current.team, locked: false, lockedBy: undefined },
          }));
          queryClient.setQueryData(["itinerary", teamId, "detail"], (current: typeof detail) =>
            current ? { ...current, locked: false } : current,
          );
          break;
        case "itinerary:conflict_detected": {
          const date = String(data.date || "");
          const conflicts = Array.isArray(data.conflicts)
            ? (data.conflicts as Array<{ itemId1: number; itemId2: number }>)
            : [];

          if (date) {
            updateTimeline((current) => applyTimelineConflicts(current, date, conflicts));
          }
          break;
        }
        default:
          break;
      }
    };

    const connection = connectItineraryRealtime({
      tripId: teamId,
      onEvent: handleRealtimeEvent,
      onSnapshot: () => {
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: itineraryQueryKeys.timeline(teamId) }),
          queryClient.invalidateQueries({ queryKey: ["itinerary", teamId, "detail"] }),
        ]);
      },
      onVersionConflict: (frame) => {
        messageApi.warning(frame.message || "行程已被其他成员更新，正在同步最新内容");
      },
      onPersonalError: (frame) => {
        messageApi.error(frame.message || "行程操作失败");
      },
      onCommandRejected: (ack) => {
        if (String(ack.reason) !== "423" && String(ack.reason) !== "ITINERARY_LOCKED") {
          return;
        }

        queryClient.setQueryData<ItineraryTimeline>(itineraryQueryKeys.timeline(teamId), (current) =>
          current ? { ...current, team: { ...current.team, locked: true } } : current,
        );
        queryClient.setQueryData(["itinerary", teamId, "detail"], (current: typeof detail) =>
          current ? { ...current, locked: true } : current,
        );
      },
      onProtocolError: (error) => messageApi.error(error),
      onStatusChange: setRealtimeStatus,
    });

    realtimeConnectionRef.current = connection;

    return () => {
      connection.disconnect();
      realtimeConnectionRef.current = null;
    };
  }, [messageApi, queryClient, teamId]);

  const createItemMutation = useMutation({
    mutationFn: (place: AmapSearchResult) => {
      if (!activeDay) {
        throw new Error("暂无可添加行程的日期");
      }

      const connection = realtimeConnectionRef.current;

      if (!connection) {
        throw new Error("实时连接未就绪，请稍后重试");
      }

      return connection.addItem({
        itemDate: activeDay.date,
        placeName: place.name,
        address: place.address,
        longitude: place.location.lng,
        latitude: place.location.lat,
        amapPoiId: place.id,
        poiType: place.type,
      });
    },
    onSuccess: () => {
      messageApi.success("已加入行程");
      setSelectedPlace(null);
    },
    onError: (error) => messageApi.error(getErrorMessage(error)),
  });

  const manualAddMutation = useMutation({
    mutationFn: (values: ManualAddFormValues) => {
      if (!activeDay) {
        throw new Error("暂无可添加行程的日期");
      }

      const trimmedNote = values.note?.trim();

      const connection = realtimeConnectionRef.current;

      if (!connection) {
        throw new Error("实时连接未就绪，请稍后重试");
      }

      return connection.addItem({
        itemDate: activeDay.date,
        placeName: values.placeName.trim(),
        note: trimmedNote || "",
      });
    },
    onSuccess: () => {
      messageApi.success("已添加安排");
      setIsManualAddOpen(false);
      manualAddForm.resetFields();
    },
    onError: (error) => messageApi.error(getErrorMessage(error)),
  });

  const reorderMutation = useMutation({
    mutationFn: ({
      itemId,
      fromDayId,
      toDayId,
      toIndex,
      orderedItemIds,
    }: {
      itemId: number;
      fromDayId: string;
      toDayId: string;
      toIndex: number;
      orderedItemIds: number[];
    }) => {
      const connection = realtimeConnectionRef.current;

      if (!connection) {
        throw new Error("实时连接未就绪，请稍后重试");
      }

      return connection.moveItem({
        itemId,
        fromDayId,
        toDayId,
        toIndex,
        orderedItemIds,
      });
    },
    onError: async (error) => {
      await refreshItinerary();
      messageApi.error(getErrorMessage(error));
    },
  });

  const lockMutation = useMutation({
    mutationFn: () => {
      const connection = realtimeConnectionRef.current;

      if (!connection) {
        throw new Error("实时连接未就绪，请稍后重试");
      }

      return isItineraryLocked ? connection.unlock() : connection.lock();
    },
    onSuccess: () => {
      messageApi.success(isItineraryLocked ? "行程已解锁" : "行程已锁定");
    },
    onError: (error) => messageApi.error(getErrorMessage(error)),
  });

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      messageApi.warning("服务端退出失败，已清理本地登录状态");
    } finally {
      disconnectItinerarySocket();
      authTokenStorage.clear();
      window.localStorage.removeItem("teamtrip-auth-user");
      window.location.assign("/login");
    }
  };

  const submitPlaceSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = searchKeyword.trim();

    if (!keyword) {
      messageApi.warning("请输入地点名称或地址");
      return;
    }

    setIsSearching(true);
    setSelectedPlace(null);
    setSearchRequest({ id: Date.now(), keyword });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent, dragDay: ItineraryDayGroup) => {
    if (!over || active.id === over.id || isItineraryLocked || reorderMutation.isPending) {
      return;
    }

    const oldIndex = dragDay.items.findIndex((stop) => stop.id === active.id);
    const newIndex = dragDay.items.findIndex((stop) => stop.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const reorderedItems = arrayMove(dragDay.items, oldIndex, newIndex);

    reorderMutation.mutate({
      itemId: Number(active.id),
      fromDayId: dragDay.date,
      toDayId: dragDay.date,
      toIndex: newIndex,
      orderedItemIds: reorderedItems.map((item) => item.id),
    });
  };

  return (
    <Layout hasSider className="itinerary-page">
      {contextHolder}
      <TeamSidebar
        activeItem="itinerary"
        inviteCode={detail?.inviteCode}
        teamId={teamId}
        user={{
          avatar: currentMember?.avatar,
          nickname: currentMember?.nickname,
          role: currentMember?.role || detail?.myRole,
          roleText: currentMember?.roleText,
        }}
        onLogout={handleLogout}
      />

      <Layout className="itinerary-main-layout">
        <Content className="itinerary-main">
        <div className="itinerary-shell">
          <section className="itinerary-board">
            <article className="itinerary-trip-card">
              <div className="itinerary-trip-card__icon">
                <CalendarDays size={26} />
              </div>
              <div className="itinerary-trip-card__main">
                <div className="itinerary-title-row">
                  <h2>{teamName}</h2>
                </div>
                <p>
                  {teamDestination}　|　{tripDateSummary.dateRange}
                  {tripDateSummary.duration && `（${tripDateSummary.duration}）`}　|　{teamMemberCount}位成员
                </p>
              </div>
              <div className="itinerary-trip-card__actions">
                <StatusTag variant={isItineraryLocked ? "neutral" : "member"}>
                  {isItineraryLocked ? "行程只读" : "所有成员可编辑"}
                </StatusTag>
                <StatusTag variant={timelineQuery.isError || realtimeStatus !== "connected" ? "pending" : "completed"}>
                  {timelineQuery.isError
                    ? "同步失败"
                    : realtimeStatus === "connected"
                      ? "实时同步"
                      : realtimeStatus === "syncing"
                        ? "同步中"
                      : realtimeStatus === "connecting"
                        ? "连接中"
                        : "实时连接已断开"}
                </StatusTag>
                {detail?.myRole === "owner" && (
                  <button disabled={lockMutation.isPending} type="button" onClick={() => lockMutation.mutate()}>
                    <Lock size={18} />{isItineraryLocked ? "解锁行程" : "锁定行程"}
                  </button>
                )}
              </div>
            </article>

            <div className="itinerary-day-tabs" aria-label="行程日期">
              <Tabs
                activeKey={timelineDays.length ? String(safeActiveDayIndex) : "empty"}
                animated={{ inkBar: true, tabPane: false }}
                className="itinerary-day-tabs__tabs"
                onChange={(key) => setActiveDayIndex(Number(key))}
                items={
                  timelineDays.length
                    ? timelineDays.map((day, index) => ({
                        key: String(index),
                        label: `Day ${index + 1} · ${dayjs(day.date).format("M月D日")}`,
                        children: (
                          <section className="itinerary-day-card">
                            <div className="itinerary-day-card__head">
                              <h3>
                                {`Day ${index + 1} · ${dayjs(day.date).format("M月D日")}（${WEEKDAYS[dayjs(day.date).day()]}）`}
                              </h3>
                              <div>
                                <button
                                  disabled={!day || isItineraryLocked || manualAddMutation.isPending}
                                  type="button"
                                  onClick={() => setIsManualAddOpen(true)}
                                >
                                  <Plus size={17} />手动添加安排
                                </button>
                              </div>
                            </div>

                            {timelineQuery.isLoading && <div className="itinerary-empty-state">正在加载团队行程...</div>}
                            {timelineQuery.isError && (
                              <div className="itinerary-empty-state">
                                {getErrorMessage(timelineQuery.error)}
                                <button type="button" onClick={() => timelineQuery.refetch()}>重新加载</button>
                              </div>
                            )}
                            {!timelineQuery.isLoading && !timelineQuery.isError && day && (
                              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => handleDragEnd(event, day)}>
                                <SortableContext items={day.items.map((stop) => stop.id)} strategy={verticalListSortingStrategy}>
                                  <div className="itinerary-stop-list">
                                    {day.items.map((stop, stopIndex) => (
                                      <SortableStopItem
                                        disabled={isItineraryLocked || reorderMutation.isPending}
                                        stop={stop}
                                        index={stopIndex}
                                        key={stop.id}
                                      />
                                    ))}
                                    {day.items.length === 0 && (
                                      <div className="itinerary-empty-state">
                                        从右侧搜索地点，选中后即可加入当天行程
                                      </div>
                                    )}
                                  </div>
                                </SortableContext>
                              </DndContext>
                            )}
                          </section>
                        ),
                      }))
                    : [
                        {
                          key: "empty",
                          label: "行程日期待锁定",
                          children: (
                            <section className="itinerary-day-card">
                              <div className="itinerary-empty-state">
                                等待团队锁定出发和返程日期
                              </div>
                            </section>
                          ),
                        },
                      ]
                }
              />
            </div>
          </section>

          <aside className="itinerary-map-panel">
            <div className="itinerary-search-tabs">
              <button className="active" type="button">搜索地点</button>
              <button type="button">智能建议（即将上线）<Sparkles size={15} /></button>
            </div>
            <form className="itinerary-search-box" role="search" onSubmit={submitPlaceSearch}>
              <input
                ref={searchInputRef}
                aria-label="搜索地点或地址"
                placeholder="搜索景点、餐厅、商圈、地址"
                type="search"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
              />
              <button aria-label="搜索" disabled={isSearching} type="submit">
                <Search size={20} />
              </button>
            </form>

            <ItineraryAmap
              destination={teamDestination}
              searchRequest={searchRequest}
              selectedPlace={selectedPlace}
              addPlaceDisabled={!activeDay || isItineraryLocked || createItemMutation.isPending}
              onAddPlace={(place) => createItemMutation.mutate(place)}
              onSelectPlace={setSelectedPlace}
              onSearchError={(error) => {
                setIsSearching(false);
                messageApi.warning(error);
              }}
              onSearchResults={() => {
                setIsSearching(false);
              }}
            />
          </aside>
        </div>
        </Content>
      </Layout>

      <Modal
        centered
        destroyOnHidden
        confirmLoading={manualAddMutation.isPending}
        okText="添加"
        cancelText="取消"
        open={isManualAddOpen}
        title={
          activeDay
            ? `手动添加安排 · Day ${safeActiveDayIndex + 1} · ${dayjs(activeDay.date).format("M月D日")}`
            : "手动添加安排"
        }
        onCancel={() => {
          if (manualAddMutation.isPending) {
            return;
          }
          setIsManualAddOpen(false);
          manualAddForm.resetFields();
        }}
        onOk={() => manualAddForm.submit()}
      >
        <Form
          form={manualAddForm}
          layout="vertical"
          requiredMark={false}
          onFinish={(values) => manualAddMutation.mutate(values)}
        >
          <Form.Item
            label="地点或安排名称"
            name="placeName"
            rules={[
              { required: true, message: "请输入地点或安排名称" },
              { max: 50, message: "名称不能超过 50 个字符" },
            ]}
          >
            <Input
              allowClear
              maxLength={50}
              placeholder="例如:酒店入住、午餐、机场大巴"
            />
          </Form.Item>
          <Form.Item
            label="备注"
            name="note"
            rules={[{ max: 200, message: "备注不能超过 200 个字符" }]}
          >
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 6 }}
              maxLength={200}
              placeholder="例如:提前预约、注意事项"
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
