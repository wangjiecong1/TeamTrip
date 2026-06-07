import React, { useEffect, useRef, useState } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";
import { AlertCircle, Clock3, ExternalLink, LoaderCircle, MapPin, Phone, Star, WalletCards, X } from "lucide-react";
import placeFallbackImage from "../../../assets/my-teams/my-teams-card-cover-city.svg";
import { itineraryService } from "../../services";

type ItineraryAmapProps = {
  destination: string;
  searchRequest?: {
    id: number;
    keyword: string;
  } | null;
  selectedPlace?: AmapSearchResult | null;
  onSelectPlace?: (place: AmapSearchResult | null) => void;
  onAddPlace?: (place: AmapSearchResult) => void;
  addPlaceDisabled?: boolean;
  onSearchResults?: (results: AmapSearchResult[]) => void;
  onSearchError?: (message: string) => void;
};

type MapStatus = "loading" | "ready" | "missing-config" | "error";

export type AMapLocation = {
  lng: number;
  lat: number;
};

type AMapPosition = [number, number];

export type AmapSearchResult = {
  id: string;
  name: string;
  type: string;
  address: string;
  location: AMapLocation;
  phone?: string;
  website?: string;
  province?: string;
  city?: string;
  district?: string;
  rating?: string;
  averageCost?: string;
  openingHours?: string;
  photoUrl?: string;
};

type GeocoderResult = {
  info?: string;
  geocodes?: Array<{
    location: AMapLocation;
  }>;
};

type AMapInstance = {
  add: (overlay: unknown) => void;
  addControl: (control: unknown) => void;
  destroy: () => void;
  remove: (overlays: unknown[]) => void;
  setFitView: (overlays?: unknown[], immediately?: boolean, avoid?: number[], maxZoom?: number) => void;
  setZoomAndCenter: (zoom: number, center: AMapPosition) => void;
};

type AMapMarker = {
  on: (eventName: string, callback: () => void) => void;
};

type AMapNamespace = {
  getConfig: () => { appname?: string };
  Geocoder: new (options?: Record<string, unknown>) => {
    getLocation: (
      address: string,
      callback: (status: string, result: GeocoderResult) => void,
    ) => void;
  };
  Map: new (container: HTMLDivElement, options: Record<string, unknown>) => AMapInstance;
  Marker: new (options: Record<string, unknown>) => AMapMarker;
  Scale: new (options?: Record<string, unknown>) => unknown;
  ToolBar: new (options?: Record<string, unknown>) => unknown;
};

declare global {
  interface Window {
    _AMapSecurityConfig?: {
      securityJsCode?: string;
      serviceHost?: string;
    };
  }
}

const DEFAULT_CENTER: [number, number] = [120.1551, 30.2741];

const toMapPosition = (longitude: unknown, latitude: unknown): AMapPosition | null => {
  const lng = Number(longitude);
  const lat = Number(latitude);

  if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    return null;
  }

  return [lng, lat];
};

const getMapErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "请检查高德 Key、安全密钥和域名白名单";
};

const getPoiPhotoUrl = (photos: unknown) => {
  if (!Array.isArray(photos)) {
    return undefined;
  }

  for (const photo of photos) {
    if (typeof photo === "string" && photo.trim()) {
      return photo.trim();
    }

    if (photo && typeof photo === "object") {
      const url = (photo as { url?: unknown }).url;

      if (typeof url === "string" && url.trim()) {
        return url.trim();
      }
    }
  }

  return undefined;
};

export function ItineraryAmap({
  destination,
  searchRequest,
  selectedPlace,
  onSelectPlace,
  onAddPlace,
  addPlaceDisabled = false,
  onSearchResults,
  onSearchError,
}: ItineraryAmapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<AMapInstance | null>(null);
  const amapRef = useRef<AMapNamespace | null>(null);
  const searchMarkersRef = useRef<AMapMarker[]>([]);
  const onSelectPlaceRef = useRef(onSelectPlace);
  const onSearchResultsRef = useRef(onSearchResults);
  const onSearchErrorRef = useRef(onSearchError);
  const [status, setStatus] = useState<MapStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    onSearchResultsRef.current = onSearchResults;
    onSearchErrorRef.current = onSearchError;
    onSelectPlaceRef.current = onSelectPlace;
  }, [onSearchError, onSearchResults, onSelectPlace]);

  useEffect(() => {
    const key = import.meta.env.VITE_AMAP_JSAPI_KEY?.trim();
    const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_JS_CODE?.trim();
    const serviceHost = import.meta.env.VITE_AMAP_SERVICE_HOST?.trim();

    if (!key || (!securityJsCode && !serviceHost)) {
      setStatus("missing-config");
      return;
    }

    if (!containerRef.current) {
      return;
    }

    let disposed = false;
    setStatus("loading");
    setErrorMessage("");
    window._AMapSecurityConfig = serviceHost ? { serviceHost } : { securityJsCode };

    AMapLoader.load({
      key,
      version: "2.0",
      plugins: ["AMap.Scale", "AMap.ToolBar", "AMap.Geocoder"],
    })
      .then((loadedAMap) => {
        if (disposed || !containerRef.current) {
          return;
        }

        const AMap = loadedAMap as unknown as AMapNamespace;
        amapRef.current = AMap;
        AMap.getConfig().appname = "teamtrip-itinerary";

        const map = new AMap.Map(containerRef.current, {
          center: DEFAULT_CENTER,
          mapStyle: "amap://styles/normal",
          resizeEnable: true,
          viewMode: "3D",
          zoom: 11,
        });
        mapRef.current = map;
        map.addControl(new AMap.Scale());
        map.addControl(new AMap.ToolBar({ position: "RT" }));

        const geocoder = new AMap.Geocoder({ city: destination || "全国" });
        geocoder.getLocation(destination || "杭州", (geocoderStatus, result) => {
          if (disposed) {
            return;
          }

          const location = result.geocodes?.[0]?.location;
          const position = location ? toMapPosition(location.lng, location.lat) : null;

          if (geocoderStatus === "complete" && result.info === "OK" && position) {
            map.setZoomAndCenter(12, position);
            map.add(
              new AMap.Marker({
                anchor: "bottom-center",
                content: '<div class="itinerary-amap-marker"><span></span></div>',
                position,
                title: destination,
              }),
            );
          }

          setStatus("ready");
        });
      })
      .catch((error: unknown) => {
        if (!disposed) {
          setErrorMessage(getMapErrorMessage(error));
          setStatus("error");
        }
      });

    return () => {
      disposed = true;
      mapRef.current?.destroy();
      mapRef.current = null;
      amapRef.current = null;
      searchMarkersRef.current = [];
    };
  }, [destination]);

  useEffect(() => {
    if (status !== "ready" || !searchRequest?.keyword) {
      return;
    }

    let disposed = false;

    const searchPoi = async () => {
      try {
        const pois = await itineraryService.searchPoi(searchRequest.keyword, destination);

        if (disposed) {
          return;
        }

        const results = pois.flatMap((poi, index) => {
          const position = toMapPosition(poi.longitude, poi.latitude);

          if (!position) {
            return [];
          }

          return [{
            id: poi.id || `${searchRequest.id}-${index}`,
            name: poi.name || searchRequest.keyword,
            type: poi.type?.split(";")[0] || "地点",
            address: poi.address || "暂无详细地址",
            location: {
              lng: position[0],
              lat: position[1],
            },
            photoUrl: getPoiPhotoUrl(poi.photos),
          }];
        });

        const map = mapRef.current;
        const AMap = amapRef.current;

        if (map && AMap) {
          if (searchMarkersRef.current.length) {
            map.remove(searchMarkersRef.current);
          }

          searchMarkersRef.current = results.map((place, index) => {
            const position: AMapPosition = [place.location.lng, place.location.lat];
            const marker = new AMap.Marker({
              anchor: "bottom-center",
              content: `<button class="itinerary-amap-result-marker" type="button" aria-label="${place.name}"><span>${index + 1}</span></button>`,
              position,
              title: place.name,
            });
            marker.on("click", () => onSelectPlaceRef.current?.(place));
            map.add(marker);
            return marker;
          });

          if (searchMarkersRef.current.length) {
            map.setFitView(searchMarkersRef.current, false, [56, 56, 56, 56], 16);
          }
        }

        onSearchResultsRef.current?.(results);
        onSelectPlaceRef.current?.(results[0] || null);

        if (!results.length) {
          onSearchErrorRef.current?.("没有找到匹配地点，请尝试更具体的名称或地址");
        }
      } catch (error) {
        if (!disposed) {
          onSearchResultsRef.current?.([]);
          onSelectPlaceRef.current?.(null);
          onSearchErrorRef.current?.(getMapErrorMessage(error));
        }
      }
    };

    searchPoi();

    return () => {
      disposed = true;
    };
  }, [destination, searchRequest, status]);

  return (
    <section className={`itinerary-amap-slot is-${status}`} aria-label="高德地图">
      <div ref={containerRef} className="itinerary-amap-slot__mount" />

      {status === "ready" && selectedPlace && (
        <article
          className="itinerary-amap-popup has-photo"
          aria-label={`${selectedPlace.name}地点详情`}
        >
          <img
            src={selectedPlace.photoUrl || placeFallbackImage}
            alt=""
            onError={(event) => {
              event.currentTarget.src = placeFallbackImage;
            }}
          />
          <div className="itinerary-amap-popup__content">
            <header>
              <div>
                <strong>{selectedPlace.name}</strong>
                <span>{selectedPlace.type}</span>
              </div>
              <button aria-label="关闭地点详情" type="button" onClick={() => onSelectPlace?.(null)}>
                <X size={18} />
              </button>
            </header>

            <p><MapPin size={14} />{selectedPlace.address}</p>
            {(selectedPlace.district || selectedPlace.city) && (
              <small>{[selectedPlace.province, selectedPlace.city, selectedPlace.district].filter(Boolean).join(" · ")}</small>
            )}

            <div className="itinerary-amap-popup__facts">
              {selectedPlace.rating && <span><Star size={14} />评分 {selectedPlace.rating}</span>}
              {selectedPlace.averageCost && <span><WalletCards size={14} />人均 ¥{selectedPlace.averageCost}</span>}
              {selectedPlace.openingHours && <span><Clock3 size={14} />{selectedPlace.openingHours}</span>}
              {selectedPlace.phone && <span><Phone size={14} />{selectedPlace.phone}</span>}
            </div>

            <div className="itinerary-amap-popup__actions">
              {selectedPlace.website && (
                <a href={selectedPlace.website} rel="noreferrer" target="_blank">
                  地点网站 <ExternalLink size={13} />
                </a>
              )}
              <a
                href={`https://uri.amap.com/marker?position=${selectedPlace.location.lng},${selectedPlace.location.lat}&name=${encodeURIComponent(selectedPlace.name)}`}
                rel="noreferrer"
                target="_blank"
              >
                高德详情 <ExternalLink size={13} />
              </a>
              <button disabled={addPlaceDisabled} type="button" onClick={() => onAddPlace?.(selectedPlace)}>
                加入行程
              </button>
            </div>
          </div>
        </article>
      )}

      {status !== "ready" && (
        <div className="itinerary-amap-slot__placeholder" role={status === "error" ? "alert" : "status"}>
          {status === "loading" && <LoaderCircle className="itinerary-amap-slot__spinner" size={26} />}
          {status === "missing-config" && <MapPin size={26} />}
          {status === "error" && <AlertCircle size={26} />}
          <strong>
            {status === "loading" && "正在加载高德地图"}
            {status === "missing-config" && "等待配置高德地图"}
            {status === "error" && "地图加载失败"}
          </strong>
          <span>
            {status === "loading" && `正在定位 ${destination || "旅行目的地"}`}
            {status === "missing-config" && "请配置 Web 端 Key 与安全密钥"}
            {status === "error" && errorMessage}
          </span>
        </div>
      )}

    </section>
  );
}
