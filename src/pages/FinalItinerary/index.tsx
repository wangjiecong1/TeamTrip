import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarDays, Car, ChevronDown, ChevronRight, Footprints, MapPin, Share2, ShieldCheck, Users } from "lucide-react";
import { BrandMark } from "../../components/BrandMark";
import { StatusTag, StatusTagVariant } from "../../components/StatusTag";
import { fetchFinalItineraryByCodeMock } from "../../data/mockData";
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
  transportCount: number;
  summary: string;
  days: FinalDay[];
};

const buildAmapUrl = (stop: FinalStop) =>
  `https://uri.amap.com/search?keyword=${encodeURIComponent(`${stop.title} ${stop.address}`)}`;

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
    fetchFinalItineraryByCodeMock(code)
      .then((data) => {
        if (alive) {
          setItinerary(data as FinalItineraryData);
          setActiveDayIndex(0);
        }
      })
      .catch(() => {
        if (alive) {
          setError("没有找到这份行程单");
        }
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
          <p>请检查链接中的 code 是否正确。</p>
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
              <article><Car size={26} /><strong>{itinerary.transportCount}</strong><span>次交通</span></article>
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

            <div className="final-timeline">
              {activeDay.stops.map((stop, index) => (
                <article className="final-stop" key={stop.id}>
                  <span className="final-stop__order">第 {index + 1} 站</span>
                  <span className="final-stop__dot" />
                  <div className="final-stop__thumb" />
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
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
