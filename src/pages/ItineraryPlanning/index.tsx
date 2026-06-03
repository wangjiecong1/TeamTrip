import React, { CSSProperties, useEffect, useMemo, useState } from "react";
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
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Edit3,
  GripVertical,
  Grid2X2,
  Lock,
  MapPin,
  MoreHorizontal,
  Plus,
  Route,
  Search,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { BrandMark } from "../../components/BrandMark";
import { fetchItineraryPlanningMock } from "../../data/mockData";
import avatar from "../../../assets/common/app-header-user-avatar.svg";
import teamCover from "../../../assets/login-register/login-register-hero-approved.webp";
import "./index.less";

const navItems = [
  { label: "团队工作台", icon: Grid2X2, path: "/teams/hangzhou-2025/workspace" },
  { label: "行程规划", icon: CalendarCheck, active: true, path: "/teams/hangzhou-2025/itinerary" },
  { label: "最终行程单", icon: ClipboardCheck, externalPath: "/final-itinerary/TT-HZ-1024" },
  { label: "团队设置", icon: Settings },
];

type ItineraryStop = {
  id: string;
  title: string;
  tag: string;
  address: string;
  note: string;
  owner: string;
  transport?: boolean;
};

type ItineraryDay = {
  id: string;
  label: string;
  date: string;
  weekday: string;
  stops: ItineraryStop[];
};

type ItineraryPlanningData = {
  team: {
    id: string;
    name: string;
    destination: string;
    dateRange: string;
    duration: string;
    memberCount: number;
    status: string;
  };
  days: ItineraryDay[];
  placePreview: {
    title: string;
    tag: string;
    address: string;
    note: string;
  };
  suggestions: Array<{
    id: string;
    title: string;
    tag: string;
    area: string;
  }>;
};

type SortableStopItemProps = {
  stop: ItineraryStop;
  index: number;
};

function SortableStopItem({ stop, index }: SortableStopItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article className={`itinerary-stop ${isDragging ? "is-dragging" : ""}`} ref={setNodeRef} style={style}>
      <button className="itinerary-stop__drag" type="button" aria-label={`拖动 ${stop.title}`} {...attributes} {...listeners}>
        <GripVertical size={18} />
      </button>
      <span className="itinerary-stop__index">{index + 1}</span>
      <div className={`itinerary-stop__thumb ${stop.transport ? "transport" : ""}`}>
        {stop.transport && <Route size={24} />}
      </div>
      <div className="itinerary-stop__body">
        <div>
          <strong>{stop.title}</strong>
          <em>{stop.tag}</em>
        </div>
        <p><MapPin size={14} />{stop.address}</p>
        <small>{stop.note}</small>
      </div>
      <div className="itinerary-stop__meta">
        <span><img src={avatar} alt="" />{stop.owner} 添加</span>
        <button type="button" aria-label="更多操作"><MoreHorizontal size={20} /></button>
      </div>
    </article>
  );
}

export function ItineraryPlanningPage() {
  const navigate = useNavigate();
  const [planningData, setPlanningData] = useState<ItineraryPlanningData | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const activeDay = planningData?.days[activeDayIndex];
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const activeStopIds = useMemo(() => activeDay?.stops.map((stop) => stop.id) ?? [], [activeDay]);

  useEffect(() => {
    let alive = true;

    fetchItineraryPlanningMock().then((data) => {
      if (alive) {
        setPlanningData(data as ItineraryPlanningData);
      }
    });

    return () => {
      alive = false;
    };
  }, []);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!activeDay || !over || active.id === over.id) {
      return;
    }

    setPlanningData((current) => {
      if (!current) {
        return current;
      }

      const nextDays = current.days.map((day) => {
        if (day.id !== activeDay.id) {
          return day;
        }

        const oldIndex = day.stops.findIndex((stop) => stop.id === active.id);
        const newIndex = day.stops.findIndex((stop) => stop.id === over.id);

        if (oldIndex < 0 || newIndex < 0) {
          return day;
        }

        const reorderedStops = arrayMove(day.stops, oldIndex, newIndex);

        return {
          ...day,
          stops: reorderedStops,
        };
      });

      // 后续接 WebSocket 时，可以在这里发送 dayId 与 reorderedStops 的 id 顺序。
      return {
        ...current,
        days: nextDays,
      };
    });
  };

  if (!planningData || !activeDay) {
    return (
      <main className="itinerary-page itinerary-page--loading">
        <section className="itinerary-loading-card">正在载入行程规划...</section>
      </main>
    );
  }

  return (
    <main className="itinerary-page">
      <aside className="itinerary-sidebar" aria-label="团队导航">
        <div className="itinerary-sidebar__brand">
          <BrandMark />
          <span>TeamTrip</span>
        </div>

        <button className="itinerary-back-button" type="button" onClick={() => navigate("/teams")}>
          <ArrowLeft size={18} />
          返回我的团队
        </button>

        <section className="itinerary-team-mini" aria-label="当前团队">
          <img src={teamCover} alt="" />
          <div>
            <strong>{planningData.team.name}</strong>
            <span>{planningData.team.destination} · {planningData.team.memberCount} 人</span>
            <em>{planningData.team.status}</em>
          </div>
        </section>

        <nav className="itinerary-nav">
          {navItems.map(({ label, icon: Icon, active, path, externalPath }) => (
            <button
              className={`itinerary-nav__item ${active ? "active" : ""}`}
              key={label}
              type="button"
              onClick={() => {
                if (externalPath) {
                  window.open(externalPath, "_blank", "noopener,noreferrer");
                  return;
                }

                if (path) {
                  navigate(path);
                }
              }}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </nav>

        <div className="itinerary-sidebar__user">
          <img src={avatar} alt="Laow" />
          <div>
            <strong>Laow</strong>
            <span>Owner</span>
          </div>
          <ChevronDown size={18} />
        </div>
      </aside>

      <section className="itinerary-main">
        <header className="itinerary-topbar">
          <div>
            <h1>行程规划</h1>
            <p>按天安排要去的地方和顺序，锁定后生成最终行程单</p>
          </div>
          <div className="itinerary-status">
            <span><Users size={18} />所有成员可编辑</span>
            <span><CheckCircle2 size={18} />自动保存成功</span>
            <button type="button"><Lock size={18} />锁定行程</button>
          </div>
        </header>

        <div className="itinerary-shell">
          <section className="itinerary-board">
            <article className="itinerary-trip-card">
              <div className="itinerary-trip-card__icon">
                <CalendarDays size={26} />
              </div>
              <div>
                <div className="itinerary-title-row">
                  <h2>{planningData.team.name}</h2>
                  <button type="button" aria-label="编辑行程名称"><Edit3 size={18} /></button>
                </div>
                <p>
                  {planningData.team.destination}　|　{planningData.team.dateRange}（{planningData.team.duration}）　|　{planningData.team.memberCount}位成员
                </p>
              </div>
            </article>

            <div className="itinerary-day-tabs" aria-label="行程日期">
              {planningData.days.map((day, index) => (
                <button
                  className={index === activeDayIndex ? "active" : ""}
                  type="button"
                  key={day.label}
                  onClick={() => setActiveDayIndex(index)}
                >
                  {day.label} · {day.date}
                </button>
              ))}
              <span><Route size={16} />拖拽可调整顺序</span>
            </div>

            <div className="itinerary-days">
              <section className="itinerary-day-card" key={activeDay.label}>
                <div className="itinerary-day-card__head">
                  <h3>{activeDay.label} · {activeDay.date}（{activeDay.weekday}）</h3>
                  <div>
                    <button type="button"><Plus size={17} />添加地点</button>
                    <button type="button"><Plus size={17} />手动添加安排</button>
                  </div>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={activeStopIds} strategy={verticalListSortingStrategy}>
                    <div className="itinerary-stop-list">
                      {activeDay.stops.map((stop, index) => (
                        <SortableStopItem stop={stop} index={index} key={stop.id} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </section>
            </div>
          </section>

          <aside className="itinerary-map-panel">
            <div className="itinerary-search-tabs">
              <button className="active" type="button">搜索地点</button>
              <button type="button">智能建议（即将上线）<Sparkles size={15} /></button>
            </div>
            <label className="itinerary-search-box">
              <span>搜索景点、餐厅、商圈、地址</span>
              <Search size={20} />
            </label>

            <section className="itinerary-amap-slot" aria-label="高德地图接入预留区域">
              {/* 高德地图 SDK 可挂载到这个节点：#amap-itinerary-container */}
              <div id="amap-itinerary-container" className="itinerary-amap-slot__mount" />
              <div className="itinerary-amap-slot__placeholder">
                <MapPin size={26} />
                <strong>高德地图接入区</strong>
                <span>地图、路线和标记点可在这里接入</span>
              </div>
            </section>

            <article className="itinerary-place-preview">
              <div className="itinerary-place-preview__thumb" />
              <div>
                <strong>{planningData.placePreview.title}</strong>
                <span>{planningData.placePreview.tag}</span>
                <p><MapPin size={14} />{planningData.placePreview.address}</p>
                <small>{planningData.placePreview.note}</small>
              </div>
              <button type="button" aria-label="关闭预览">×</button>
            </article>

            <div className="itinerary-map-actions">
              <button type="button">查看位置</button>
              <button className="primary" type="button">加入行程</button>
            </div>

            <section className="itinerary-suggestions">
              <h3>搜索结果</h3>
              {planningData.suggestions.map((item) => (
                <article className="itinerary-suggestion" key={item.id}>
                  <div />
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.tag}　{item.area}</span>
                  </div>
                  <button type="button">加入行程</button>
                </article>
              ))}
              <p>以上结果来自高德地图</p>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
