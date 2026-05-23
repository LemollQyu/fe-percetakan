"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ServiceJasa } from "@/api/jasa/services/types";

function normalizeMediaUrl(url: string): string {
  if (!url || typeof url !== "string") return url;
  const t = url.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) {
    const idx = t.indexOf("/static/");
    if (idx !== -1) return t.substring(idx);
    return t;
  }
  if (t.startsWith("/static/")) return t;
  const idx = t.indexOf("/static/");
  if (idx !== -1) return t.substring(idx);
  if (t.startsWith("static/")) return `/${t}`;
  return t.startsWith("/") ? t : `/${t}`;
}

function formatRupiah(amount: number): string {
  return `Rp ${Number(amount || 0).toLocaleString("id-ID")}`;
}

function ServiceCard({ service }: { service: ServiceJasa }) {
  const mediaList = service.media ?? [];
  const thumbnail =
    mediaList.find((m) => m.type === "thumbnail") ??
    mediaList.find((m) => m.type === "gallery");
  const imageUrl = thumbnail?.url ? normalizeMediaUrl(thumbnail.url) : null;

  const categorySlug = service.category?.slug ?? "layanan";

  return (
    <Link
      href={`/category/${categorySlug}/service/${service.id}`}
      className="flex items-start gap-3 rounded-2xl bg-white border border-stone-100 shadow-sm shadow-stone-200/20 p-3 hover:shadow-md hover:border-stone-200 active:scale-[0.98] transition-all"
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-stone-100 border border-stone-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={service.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-barlow-bold text-xl text-stone-400">
              {service.name?.charAt(0)?.toUpperCase() ?? "?"}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="font-barlow-bold text-sm font-bold text-stone-900 truncate">
          {service.name}
        </p>
        {service.category?.name && (
          <p className="font-monterat-tipis text-[11px] text-stone-400 mt-0.5 truncate">
            {service.category.name}
          </p>
        )}
        {service.description && (
          <p className="font-monterat-tipis text-[12px] text-stone-500 mt-0.5 line-clamp-1 leading-relaxed">
            {service.description}
          </p>
        )}
        {(service.base_price ?? 0) > 0 && (
          <p className="font-monterat-tipis text-[12px] font-semibold text-stone-800 mt-1">
            {formatRupiah(Number(service.base_price))}
          </p>
        )}
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 self-center">
        <svg
          className="w-4 h-4 text-stone-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

export function ShuffledServices({ services }: { services: ServiceJasa[] }) {
  const [shuffled, setShuffled] = useState<ServiceJasa[]>(services); // server render urutan asli

  useEffect(() => {
    setShuffled([...services].sort(() => Math.random() - 0.5)); // shuffle hanya di client
  }, [services]);

  return (
    <div className="space-y-2.5">
      {shuffled.map((service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
}
