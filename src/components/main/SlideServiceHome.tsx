"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getServicesList } from "@/api/jasa/services";
import type { ServiceJasa } from "@/api/jasa/services/types";

function normalizeUrl(url: string): string {
  if (!url || typeof url !== "string") return url;
  const t = url.trim();
  if (t.startsWith("/static/")) return t;
  if (t.startsWith("http://") || t.startsWith("https://")) {
    const i = t.indexOf("/static/");
    if (i !== -1) return t.substring(i);
    return t;
  }
  const i = t.indexOf("/static/");
  if (i !== -1) return t.substring(i);
  if (t.startsWith("/")) return t;
  return `/static/${t}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ServiceCard({ service }: { service: ServiceJasa }) {
  const thumbnail =
    (service.media ?? []).find((m) => m.type === "thumbnail")?.url ?? "";
  const icon = (service.media ?? []).find((m) => m.type === "icon")?.url ?? "";

  return (
    <Link
      href={`/category/${service.category?.slug ?? service.category_id}/service/${service.id}`}
      className="flex-shrink-0 w-[calc(50%-6px)] bg-white rounded-2xl snap-start border border-stone-100 shadow-sm overflow-hidden hover:shadow-md hover:border-stone-200 transition-all active:scale-[0.98]"
    >
      {/* Thumbnail */}
      <div className="w-full h-[140px] bg-stone-100 overflow-hidden">
        {thumbnail ? (
          <img
            src={normalizeUrl(thumbnail)}
            alt={service.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-stone-300 text-4xl font-bold">
              {service.name?.charAt(0)?.toUpperCase() ?? "?"}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1">
          {icon && (
            <div className="w-5 h-5 rounded-md bg-stone-100 overflow-hidden flex-shrink-0">
              <img
                src={normalizeUrl(icon)}
                alt=""
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
          )}
          <p className="font-barlow-bold text-[13px] font-bold text-stone-900 leading-tight line-clamp-2">
            {service.name}
          </p>
        </div>

        {service.base_price != null && (
          <div className="mt-2">
            <span className="inline-block border-l-2  pl-2 font-barlow-bold text-[12px] font-bold">
              Rp {service.base_price.toLocaleString("id-ID")}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export function SlideServiceHome() {
  const [services, setServices] = useState<ServiceJasa[]>([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const currentIndex = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getServicesList({ page: 1, limit: 20 })
      .then((res) => setServices(shuffle(res.data ?? [])))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const startAutoSlide = () => {
    intervalRef.current = setInterval(() => {
      if (!trackRef.current) return;
      const maxScroll =
        trackRef.current.scrollWidth - trackRef.current.clientWidth;

      if (currentIndex.current * trackRef.current.clientWidth >= maxScroll) {
        currentIndex.current = 0;
        trackRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        currentIndex.current += 1;
        trackRef.current.scrollTo({
          left: currentIndex.current * trackRef.current.clientWidth,
          behavior: "smooth",
        });
      }
    }, 2500);
  };

  const stopAutoSlide = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    if (services.length === 0) return;
    startAutoSlide();
    return () => stopAutoSlide();
  }, [services]);

  return (
    <section className="w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-barlow-bold text-base font-bold text-stone-900">
          Produk Pilihan
        </h2>
        <Link
          href="/services"
          className="font-barlow-bold text-sm font-bold   flex items-center gap-1"
        >
          Lihat Semua
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>

      {/* Slider */}
      {loading ? (
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[calc(50%-6px)] h-[220px] rounded-2xl bg-stone-100 animate-pulse"
            />
          ))}
        </div>
      ) : services.length === 0 ? (
        <p className="font-monterat-tipis text-sm text-stone-400 px-4">
          Belum ada layanan tersedia.
        </p>
      ) : (
        <div
          ref={trackRef}
          onMouseEnter={stopAutoSlide}
          onMouseLeave={startAutoSlide}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} /> // snap per card
          ))}
        </div>
      )}
    </section>
  );
}
