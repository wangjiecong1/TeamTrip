import React, { useEffect, useMemo, useState } from "react";
import { Image, Timeline } from "antd";
import { useParams } from "react-router-dom";
import { CalendarDays, Car, ChevronDown, ChevronRight, Footprints, MapPin, Share2, ShieldCheck, Users } from "lucide-react";
import { BrandMark } from "../../components/BrandMark";
import { StatusTag, StatusTagVariant } from "../../components/StatusTag";
import { ApiError, itineraryService, ItineraryItem, SharedFinalItineraryView } from "../../services";
import heroImage from "../../../assets/login-register/login-register-hero-approved.webp";
import "./index.less";

type Transfer = {
  type: string;
  duration: string;
  distance: string;
};

type FinalStop = {
  id: string;
  title: string;
  tags: string[];
  address: string;
  note: string;
  photos?: string[];
  transfer?: Transfer;
};

type FinalDay = {
  id: string;
  label: string;
  date: string;
  weekday: string;
  stops: FinalStop[];
};

type FinalItineraryData = {
  code: string;
  status: string;
  title: string;
  destination: string;
  dateRange: string;
  duration: string;
  memberCount: number;
  dayCount: number;
  placeCount: number;
  summary: string;
  days: FinalDay[];
};

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const buildAmapUrl = (stop: FinalStop) =>
  `https://uri.amap.com/search?keyword=${encodeURIComponent(`${stop.title} ${stop.address}`)}`;

const formatDisplayDate = (date?: string | null) => {
  if (!date) {
    return "待确认";
  }

  const [, month, day] = date.split("-").map(Number);

  if (!month || !day) {
    return date;
  }

  return `${month}月${day}日`;
};

const getDurationText = (startDate?: string | null, endDate?: string | null) => {
  if (!startDate || !endDate) {
    return "待确认";
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const dayCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);

  return `${dayCount}天${dayCount > 1 ? `${dayCount - 1}晚` : ""}`;
};

const getItemTags = (item: ItineraryItem) => [item.poiType, item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : ""].filter(Boolean) as string[];

const normalizePhotos = (photos?: ItineraryItem["photos"] | null) => {
  const urls = photos?.map((photo) => photo.trim()).filter(Boolean) || [];

  return urls.length ? urls : undefined;
};

const mapSharedItinerary = (token: string, view: SharedFinalItineraryView): FinalItineraryData => {
  const team = view.team;
  const days = (view.days || []).map((day, index) => ({
    id: day.date || `day-${index + 1}`,
    label: `Day ${index + 1}`,
    date: formatDisplayDate(day.date),
    weekday: day.date ? WEEKDAYS[new Date(`${day.date}T00:00:00`).getDay()] : "",
    stops: (day.items || []).map((item, itemIndex) => ({
      id: String(item.id ?? `${day.date}-${itemIndex}`),
      title: item.placeName || "未命名地点",
      tags: getItemTags(item),
      address: item.address || "暂无详细地址",
      note: item.note || "待补充备注",
      photos: normalizePhotos(item.photos),
    })),
  }));
  const placeCount = days.reduce((total, day) => total + day.stops.length, 0);

  return {
    code: token,
    status: team.locked ? "已锁定行程" : team.teamStatusText || "最终行程单",
    title: team.name || "团队最终行程单",
    destination: team.destination || "目的地待确认",
    dateRange: `${formatDisplayDate(team.finalStartDate)} - ${formatDisplayDate(team.finalEndDate)}`,
    duration: getDurationText(team.finalStartDate, team.finalEndDate),
    memberCount: team.memberCount ?? team.totalMemberCount ?? 0,
    dayCount: days.length,
    placeCount,
    summary: `${team.destination || "这段旅程"}的最终行程已整理完成，团队成员可以按天查看地点安排。`,
    days,
  };
};

const getStatusVariant = (status: string): StatusTagVariant => {
  if (status.includes("锁定")) {
    return "locked";
  }

  if (status.includes("完成")) {
    return "completed";
  }

  if (status.includes("过期")) {
    return "expired";
  }

  if (status.includes("待")) {
    return "pending";
  }

  if (status.includes("进行")) {
    return "active";
  }

  if (status.includes("规划")) {
    return "planning";
  }

  return "neutral";
};

export function FinalItineraryPage() {
  const { code: codeParam = "" } = useParams();
  const code = codeParam || new URLSearchParams(window.location.search).get("code") || "";
  const [itinerary, setItinerary] = useState<FinalItineraryData | null>(null);
  const [error, setError] = useState("");
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;

    setError("");
    setItinerary(null);

    if (!code) {
      setError("分享链接无效");
      return () => {
        alive = false;
      };
    }

    itineraryService.getSharedFinalItinerary(code)
      .then((data) => {
        if (alive) {
          setItinerary(mapSharedItinerary(code, data));
          setActiveDayIndex(0);
        }
      })
      .catch((error) => {
        if (!alive) {
          return;
        }

        if (error instanceof ApiError && (error.status === 404 || error.status === 410)) {
          setError(error.status === 410 ? "分享链接已过期" : "没有找到这份行程单");
          return;
        }

        setError("读取行程单失败，请稍后重试");
      });

    return () => {
      alive = false;
    };
  }, [code]);

  const activeDay = itinerary?.days[activeDayIndex];
  const currentUrl = useMemo(() => window.location.href, []);

  const shareItinerary = async () => {
    try {
      if (navigator.share && itinerary) {
        await navigator.share({ title: itinerary.title, text: itinerary.summary, url: currentUrl });
      } else {
        await navigator.clipboard?.writeText(currentUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      setCopied(false);
    }
  };

  if (error) {
    return (
      <main className="final-itinerary-page">
        <section className="final-itinerary-empty">
          <BrandMark />
          <h1>{error}</h1>
          <p>请检查链接中的 token 是否正确。</p>
        </section>
      </main>
    );
  }

  if (!itinerary || !activeDay) {
    return (
      <main className="final-itinerary-page">
        <section className="final-itinerary-empty">正在读取行程单...</section>
      </main>
    );
  }

  return (
    <main className="final-itinerary-page">
      <div className="final-itinerary-shell">
        <header className="final-itinerary-header">
          <div className="final-itinerary-brand">
            <BrandMark />
            <span>TeamTrip</span>
          </div>
          <button className="final-share-button" type="button" onClick={shareItinerary}>
            <Share2 size={18} />
            {copied ? "已复制链接" : "分享行程单"}
          </button>
        </header>

        <section className="final-hero-card">
          <img className="final-hero-card__image" src={heroImage} alt="" />
          <div className="final-hero-card__content">
            <div className="final-title-row">
              <h1>{itinerary.title}</h1>
              <StatusTag variant={getStatusVariant(itinerary.status)}>{itinerary.status}</StatusTag>
            </div>
            <div className="final-meta-row">
              <span><MapPin size={18} />{itinerary.destination}</span>
              <span><CalendarDays size={18} />{itinerary.dateRange}（{itinerary.duration}）</span>
              <span><Users size={18} />{itinerary.memberCount}人</span>
            </div>
            <p>{itinerary.summary}</p>
            <div className="final-stat-grid">
              <article><CalendarDays size={26} /><strong>{itinerary.dayCount}</strong><span>天行程</span></article>
              <article><MapPin size={26} /><strong>{itinerary.placeCount}</strong><span>个地点</span></article>
              <article><ShieldCheck size={26} /><strong>已锁定</strong><span>不可编辑</span></article>
            </div>
          </div>
        </section>

        <section className="final-content-grid">
          <aside className="final-day-nav" aria-label="行程日期">
            {itinerary.days.map((day, index) => (
              <button className={index === activeDayIndex ? "active" : ""} key={day.id} type="button" onClick={() => setActiveDayIndex(index)}>
                <strong>{day.label}</strong>
                <span>{day.date}（{day.weekday}）</span>
              </button>
            ))}
          </aside>

          <section className="final-day-panel">
            <header className="final-day-heading">
              <h2>{activeDay.label}</h2>
              <span>{activeDay.date}（{activeDay.weekday}）</span>
            </header>

            <Timeline
              className="final-timeline"
              items={activeDay.stops.map((stop, index) => ({
                color: "#00a889",
                children: (
                  <article className="final-stop">
                    <span className="final-stop__order">第 {index + 1} 站</span>
                    {stop.photos?.length ? (
                      <Image.PreviewGroup items={stop.photos}>
                        <div className="final-stop__gallery">
                          {stop.photos.slice(0, 3).map((photo, photoIndex) => (
                            <Image
                              alt={`${stop.title} 照片 ${photoIndex + 1}`}
                              className="final-stop__photo"
                              key={photo}
                              preview={{ src: photo }}
                              src={photo}
                            />
                          ))}
                        </div>
                      </Image.PreviewGroup>
                    ) : (
                      <div className="final-stop__thumb" />
                    )}
                    <div className="final-stop__body">
                      <div className="final-stop__title">
                        <h3>{stop.title}</h3>
                        <div>{stop.tags.map((tag) => <StatusTag key={tag} variant="neutral">{tag}</StatusTag>)}</div>
                      </div>
                      <p className="final-stop__address"><MapPin size={15} />{stop.address}</p>
                      <p className="final-stop__note">{stop.note}</p>
                      {stop.transfer && (
                        <button className="final-transfer" type="button">
                          {stop.transfer.type === "步行" ? <Footprints size={18} /> : <Car size={18} />}
                          {stop.transfer.type} {stop.transfer.duration} · {stop.transfer.distance}
                          <ChevronDown size={17} />
                        </button>
                      )}
                    </div>
                    <a className="final-go-link" href={buildAmapUrl(stop)} target="_blank" rel="noreferrer">
                      去这里
                      <ChevronRight size={18} />
                    </a>
                  </article>
                ),
              }))}
            />
          </section>
        </section>
      </div>
    </main>
  );
}
