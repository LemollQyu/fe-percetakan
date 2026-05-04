"use client";

import Link from "next/link";
import { useState } from "react";
import { ServiceThumbnailCarousel } from "@/components/main/ServiceThumbnailCarousel";

const PAGE_SIZE = 4; // ganti dari 8 ke 2 buat test

function normalizeServiceMediaUrl(url: string): string {
  if (!url || typeof url !== "string") return url;
  let t = url.trim();
  if (!t) return t;
  if (t.startsWith("/static/")) return t;
  if (t.startsWith("http://") || t.startsWith("https://")) {
    const staticIndex = t.indexOf("/static/");
    if (staticIndex !== -1) return t.substring(staticIndex);
    return t;
  }
  const staticIndex = t.indexOf("/static/");
  if (staticIndex !== -1) return t.substring(staticIndex);
  if (t.startsWith("static/")) return `/${t}`;
  if (t.startsWith("/")) return t;
  return `/static/${t}`;
}

type Props = {
  services: any[];
  slug: string;
};

export function ServicePaginatedGrid({ services, slug }: Props) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(services.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const paginated = services.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 grid-cols-2">
        {paginated.map((s) => {
          const icon =
            (s.media ?? []).find((m: { type?: string }) => m.type === "icon")
              ?.url ?? "";
          const thumbnails = (s.media ?? [])
            .filter((m: { type?: string }) => m.type === "thumbnail")
            .map((m: { url?: string }) => m.url ?? "");

          return (
            <Link
              key={s.id}
              href={`/category/${slug}/service/${s.id}`}
              className="rounded-2xl bg-white border border-stone-100 shadow-sm shadow-stone-200/20 overflow-hidden hover:shadow-md hover:border-stone-200 transition-all"
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center shrink-0">
                    {icon ? (
                      <img
                        src={normalizeServiceMediaUrl(icon)}
                        alt=""
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-stone-600 font-barlow-bold text-lg">
                        {s.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-barlow-bold text-[15px] font-bold text-stone-900 leading-tight truncate">
                      {s.name}
                    </p>
                  </div>
                </div>

                <ServiceThumbnailCarousel
                  images={thumbnails.map(normalizeServiceMediaUrl)}
                  alt={s.name}
                />

                <div className="flex justify-end mt-2">
                  {s.base_price != null && (
                    <span className="font-barlow-bold text-xs font-bold text-stone-700 border border-stone-200 rounded-full px-3 py-1">
                      Rp {s.base_price.toLocaleString("id-ID")}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-9 h-9 rounded-xl border border-stone-200 bg-white flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
          >
            <svg
              className="w-4 h-4 text-stone-700"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl border text-sm font-barlow-bold transition-all active:scale-95 ${
                p === page
                  ? "bg-stone-900 border-stone-900 text-white"
                  : "bg-white border-stone-200 text-stone-700 hover:border-stone-300"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-9 h-9 rounded-xl border border-stone-200 bg-white flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
          >
            <svg
              className="w-4 h-4 text-stone-700"
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
          </button>
        </div>
      )}
    </div>
  );
}
