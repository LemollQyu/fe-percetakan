"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getServiceById } from "@/api/jasa/services";
import type {
  ServiceJasa,
  ServiceMedia,
  ServiceSpesification,
  ServiceSpesificationValue,
} from "@/api/jasa/services";

// ─── Utilities ───────────────────────────────────────────────

function normalizeMediaUrl(url: string): string {
  if (!url || typeof url !== "string") return url;
  const t = url.trim();
  if (!t) return t;
  if (t.startsWith("http://") || t.startsWith("https://")) {
    const idx = t.indexOf("/static/");
    return idx !== -1 ? t.substring(idx) : t;
  }
  if (t.startsWith("/static/")) return t;
  const idx = t.indexOf("/static/");
  if (idx !== -1) return t.substring(idx);
  if (t.startsWith("static/")) return `/${t}`;
  return t.startsWith("/") ? t : `/${t}`;
}

function formatRupiah(amount: number | string | undefined | null): string {
  return `Rp\u00a0${Number(amount || 0).toLocaleString("id-ID")}`;
}

function parseSelectOptions(options: unknown): string[] {
  if (Array.isArray(options)) {
    return options
      .map((o) =>
        typeof o === "string"
          ? o
          : String((o as { value?: unknown })?.value ?? o),
      )
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof options === "string") {
    const t = options.trim();
    if (!t) return [];
    try {
      return parseSelectOptions(JSON.parse(t));
    } catch {
      return t
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

// ─── Image Slider ────────────────────────────────────────────

interface ImageSliderProps {
  galleries: string[];
  thumbnails: string[];
  name: string;
}

function ImageSlider({ galleries, thumbnails, name }: ImageSliderProps) {
  const allImages = useMemo(
    () => [...galleries, ...thumbnails],
    [galleries, thumbnails],
  );

  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const galleryStripRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (idx: number) =>
      setActive(Math.max(0, Math.min(allImages.length - 1, idx))),
    [allImages.length],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    setStartX(e.clientX);
    setDragDelta(0);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragDelta(e.clientX - startX);
  };
  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (dragDelta < -40) goTo(active + 1);
    else if (dragDelta > 40) goTo(active - 1);
    setDragDelta(0);
  };

  // Auto-scroll active gallery thumb into view
  useEffect(() => {
    const strip = galleryStripRef.current;
    if (!strip || active >= galleries.length) return;
    const thumb = strip.children[active] as HTMLElement | undefined;
    thumb?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [active, galleries.length]);

  if (!allImages.length)
    return (
      <div className="w-full aspect-[4/3] bg-stone-100 rounded-2xl flex items-center justify-center">
        <span className="text-4xl font-bold text-stone-300 uppercase">
          {name.charAt(0)}
        </span>
      </div>
    );

  return (
    <div className="space-y-3">
      {/* ── Main slider ── */}
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-stone-950 select-none cursor-grab active:cursor-grabbing"
        style={{ aspectRatio: "4/3" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          ref={trackRef}
          className="flex h-full"
          style={{
            width: `${allImages.length * 100}%`,
            transform: `translateX(calc(-${(active / allImages.length) * 100}% + ${dragging ? dragDelta : 0}px))`,
            transition: dragging
              ? "none"
              : "transform 350ms cubic-bezier(0.25,1,0.5,1)",
          }}
        >
          {allImages.map((url, i) => (
            <div
              key={i}
              className="relative h-full"
              style={{ width: `${100 / allImages.length}%` }}
            >
              <img
                src={url}
                alt={`${name} ${i + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-stone-950/70 to-transparent pointer-events-none" />

        {/* Arrow buttons — desktop */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm items-center justify-center shadow-lg hover:bg-white transition-all disabled:opacity-0 disabled:pointer-events-none"
              aria-label="Sebelumnya"
            >
              <svg
                className="w-4 h-4 text-stone-900"
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
            <button
              onClick={() => goTo(active + 1)}
              disabled={active === allImages.length - 1}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm items-center justify-center shadow-lg hover:bg-white transition-all disabled:opacity-0 disabled:pointer-events-none"
              aria-label="Selanjutnya"
            >
              <svg
                className="w-4 h-4 text-stone-900"
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
          </>
        )}

        {/* Dot indicators */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {allImages.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === active
                    ? "w-5 h-1.5 bg-white"
                    : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Gambar ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Counter badge */}
        {allImages.length > 1 && (
          <div className="absolute top-3 right-3 bg-stone-950/50 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {active + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* ── Gallery + Thumbnail strips side-by-side when both exist ── */}
      {(galleries.length > 0 || thumbnails.length > 0) && (
        <div
          className={`flex gap-4 ${galleries.length > 0 && thumbnails.length > 0 ? "items-start" : ""}`}
        >
          {/* Gallery strip */}
          {galleries.length > 0 && (
            <div
              className={`${thumbnails.length > 0 ? "flex-1 min-w-0" : "w-full"} space-y-1.5`}
            >
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="inline-block w-3 h-px bg-stone-300" />
                Galeri
              </p>
              <div
                ref={galleryStripRef}
                className="flex gap-2 overflow-x-auto pb-1"
                style={{ scrollbarWidth: "none" }}
              >
                {galleries.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`flex-shrink-0 rounded-xl overflow-hidden transition-all duration-200 ${
                      active === i
                        ? "ring-2 ring-stone-900 ring-offset-1 scale-105 opacity-100"
                        : "opacity-55 hover:opacity-90 hover:scale-[1.02]"
                    }`}
                    style={{ width: 64, height: 64 }}
                  >
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Thumbnail grid */}
          {thumbnails.length > 0 && (
            <div
              className={`${galleries.length > 0 ? "flex-shrink-0" : "w-full"} space-y-1.5`}
            >
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="inline-block w-3 h-px bg-stone-300" />
                Thumbnail
              </p>
              <div
                className={`grid gap-2 ${galleries.length > 0 ? "grid-cols-2" : "grid-cols-4"}`}
              >
                {thumbnails.map((url, i) => {
                  const sliderIdx = galleries.length + i;
                  return (
                    <button
                      key={i}
                      onClick={() => goTo(sliderIdx)}
                      className={`relative rounded-xl overflow-hidden transition-all duration-200 ${
                        active === sliderIdx
                          ? "ring-2 ring-stone-900 ring-offset-1 scale-105 opacity-100"
                          : "opacity-55 hover:opacity-90 hover:scale-[1.02]"
                      }`}
                      style={{ width: 64, height: 64 }}
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                      {/* T badge */}
                      <span className="absolute bottom-1 left-1 text-[9px] font-bold text-white bg-stone-900/60 px-1 rounded leading-tight">
                        T{i + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Spec Info Card (read-only) ───────────────────────────────

function SpecInfoCard({ spec }: { spec: ServiceSpesification }) {
  const [open, setOpen] = useState(false);
  const options = useMemo(
    () => parseSelectOptions(spec.options),
    [spec.options],
  );
  const inputType = String(spec.input_type || "").toLowerCase();

  const typeLabel: Record<string, string> = {
    select: "Pilihan",
    boolean: "Ya / Tidak",
    text: "Teks",
    number: "Angka",
  };

  return (
    <li className="border border-stone-100 rounded-2xl overflow-hidden bg-white/70 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 hover:bg-stone-50/80 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
            {inputType === "select" && (
              <svg
                className="w-4 h-4 text-stone-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 9l4-4 4 4M8 15l4 4 4-4"
                />
              </svg>
            )}
            {inputType === "boolean" && (
              <svg
                className="w-4 h-4 text-stone-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4"
                />
                <circle cx="12" cy="12" r="9" />
              </svg>
            )}
            {(inputType === "text" || inputType === "number") && (
              <svg
                className="w-4 h-4 text-stone-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.586 3.586a2 2 0 112.828 2.828L12 15l-4 1 1-4 9.414-9.414z"
                />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-900 truncate">
              {spec.name}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              {typeLabel[inputType] ?? inputType}
              {spec.is_required && (
                <span className="ml-1.5 text-rose-400">Wajib</span>
              )}
            </p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-stone-400 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: open ? "500px" : 0, opacity: open ? 1 : 0 }}
      >
        <div className="px-4 pb-4 pt-1 border-t border-stone-100">
          {inputType === "select" && options.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Opsi yang tersedia
              </p>
              <div className="flex flex-wrap gap-2">
                {options.map((opt) => {
                  const price = (spec.spesification_value ?? []).find(
                    (v) => String(v.value) === opt,
                  )?.additional_price;
                  return (
                    <div
                      key={opt}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-100"
                    >
                      <span className="text-[12px] font-medium text-stone-800">
                        {opt}
                      </span>
                      {price !== undefined && Number(price) > 0 && (
                        <span className="text-[11px] text-stone-400">
                          +{formatRupiah(price)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {inputType === "boolean" &&
            (spec.spesification_value ?? []).length > 0 && (
              <div className="flex items-center justify-between py-2">
                <span className="text-[12px] text-stone-600">
                  Biaya tambahan jika dipilih
                </span>
                <span className="text-[13px] font-semibold text-stone-800">
                  {Number(
                    spec.spesification_value?.[0]?.additional_price ?? 0,
                  ) > 0
                    ? `+${formatRupiah(spec.spesification_value![0].additional_price)}`
                    : "Gratis"}
                </span>
              </div>
            )}

          {(inputType === "text" || inputType === "number") && (
            <p className="text-[12px] text-stone-500 italic">
              {inputType === "number"
                ? "Masukkan nilai angka saat pemesanan"
                : "Masukkan teks kustom saat pemesanan"}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

// ─── Price Breakdown ──────────────────────────────────────────

function PriceInfo({ service }: { service: ServiceJasa }) {
  const basePrice = Number(service.base_price ?? 0);
  const specs = (service.spesification ?? []).filter((s) => s.is_active);
  const hasAdditional = specs.some((s) =>
    (s.spesification_value ?? []).some((v) => Number(v.additional_price) > 0),
  );

  return (
    <div className="rounded-2xl border border-stone-100 bg-white/70 backdrop-blur-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">
          Harga Mulai Dari
        </p>
        <p className="text-3xl font-bold text-stone-900 tracking-tight">
          {formatRupiah(basePrice)}
        </p>
        {hasAdditional && (
          <p className="text-xs text-stone-400 mt-1">
            Harga final menyesuaikan spesifikasi yang dipilih
          </p>
        )}
      </div>

      {specs.length > 0 && (
        <div className="px-5 py-4 space-y-3">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            Komponen harga
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-dashed border-stone-100">
              <span className="text-sm text-stone-700">Harga dasar</span>
              <span className="text-sm font-semibold text-stone-900">
                {formatRupiah(basePrice)}
              </span>
            </div>
            {specs.map((spec) => {
              const inputType = String(spec.input_type || "").toLowerCase();
              if (inputType !== "select" && inputType !== "boolean")
                return null;
              const vals = (spec.spesification_value ?? []).filter(
                (v) => Number(v.additional_price) > 0,
              );
              if (!vals.length) return null;
              return (
                <div
                  key={spec.id}
                  className="flex items-start justify-between gap-2"
                >
                  <span className="text-sm text-stone-500">{spec.name}</span>
                  <span className="text-sm font-medium text-stone-600 text-right flex-shrink-0">
                    {inputType === "boolean"
                      ? `+${formatRupiah(vals[0].additional_price)}`
                      : `+${formatRupiah(Math.min(...vals.map((v) => Number(v.additional_price))))}+`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-stone-200 rounded-xl w-2/3" />
      <div className="aspect-[4/3] bg-stone-200 rounded-2xl" />
      <div className="space-y-2">
        <div className="h-4 bg-stone-200 rounded-xl w-full" />
        <div className="h-4 bg-stone-200 rounded-xl w-5/6" />
        <div className="h-4 bg-stone-200 rounded-xl w-4/6" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function ServiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [service, setService] = useState<ServiceJasa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getServiceById(parseInt(id, 10))
      .then((data) => {
        setService(data.data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e?.message ?? "Layanan tidak ditemukan.");
        setLoading(false);
      });
  }, [id]);

  const { galleries, thumbnails } = useMemo(() => {
    const galleries: string[] = [];
    const thumbnails: string[] = [];

    if (!service?.media) return { galleries, thumbnails };

    (service.media as (ServiceMedia & { type: string })[]).forEach((m) => {
      if (!m.url) return;
      const url = normalizeMediaUrl(m.url);
      if (m.type === "gallery") galleries.push(url);
      else if (m.type === "thumbnail") thumbnails.push(url);
    });

    return {
      galleries: Array.from(new Set(galleries)),
      thumbnails: Array.from(new Set(thumbnails)),
    };
  }, [service?.media]);

  const activeSpecs = useMemo(
    () => (service?.spesification ?? []).filter((s) => s.is_active),
    [service?.spesification],
  );

  const handleShare = async () => {
    try {
      await navigator.share({
        title: service?.name,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 border-b border-stone-200/60 bg-stone-50/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Link
            href="/landing-page"
            className="flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors group"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-stone-200 group-hover:bg-stone-100 transition-colors">
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </span>
            <span className="hidden sm:inline">Kembali</span>
          </Link>

          <div className="flex-1 min-w-0 text-center">
            {service && (
              <p className="text-sm font-semibold text-stone-800 truncate">
                {service.name}
              </p>
            )}
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors px-3 h-8 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 flex-shrink-0"
          >
            {copied ? (
              <>
                <svg
                  className="w-3.5 h-3.5 text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-emerald-600 text-xs">Disalin!</span>
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
                  />
                </svg>
                <span className="hidden sm:inline text-xs">Bagikan</span>
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-16">
        {loading ? (
          <Skeleton />
        ) : error || !service ? (
          <div className="py-20 text-center space-y-3">
            <p className="text-stone-400 text-sm">
              {error ?? "Layanan tidak ditemukan."}
            </p>
            <Link
              href="/landing-page"
              className="text-sm font-semibold text-stone-700 hover:text-stone-900 underline underline-offset-2"
            >
              Kembali ke beranda
            </Link>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 xl:gap-12 space-y-6 lg:space-y-0">
            {/* ── Left / Main column ── */}
            <div className="space-y-6 min-w-0">
              {/* Title + badge */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {service.slug && (
                    <span className="text-[11px] font-semibold text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">
                      #{service.slug}
                    </span>
                  )}
                  {service.is_active === false && (
                    <span className="text-[11px] font-semibold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                      Tidak aktif
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-stone-900 leading-tight tracking-tight">
                  {service.name}
                </h1>
              </div>

              {/* Image slider */}
              <ImageSlider
                galleries={galleries}
                thumbnails={thumbnails}
                name={service.name}
              />

              {/* Description */}
              {service.description && (
                <section>
                  <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                    Deskripsi Layanan
                  </h2>
                  <div className="rounded-2xl border border-stone-100 bg-white/70 backdrop-blur-sm p-5">
                    <p className="text-[14px] text-stone-700 leading-relaxed whitespace-pre-wrap">
                      {service.description}
                    </p>
                  </div>
                </section>
              )}

              {/* Specifications — mobile */}
              {activeSpecs.length > 0 && (
                <section className="lg:hidden">
                  <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                    Spesifikasi ({activeSpecs.length})
                  </h2>
                  <ul className="space-y-2">
                    {activeSpecs.map((spec) => (
                      <SpecInfoCard key={spec.id} spec={spec} />
                    ))}
                  </ul>
                </section>
              )}

              {/* Price info — mobile */}
              <div className="lg:hidden">
                <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                  Info Harga
                </h2>
                <PriceInfo service={service} />
              </div>

              {/* CTA order — mobile */}
              <div className="lg:hidden">
                <Link
                  href={`/landing-page/service/${id}/order`}
                  className="flex items-center justify-between w-full h-14 px-5 rounded-2xl bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98] transition-all shadow-xl shadow-stone-900/20"
                >
                  <span className="font-bold text-[15px]">Pesan Sekarang</span>
                  <span className="text-[13px] font-semibold text-stone-300">
                    {formatRupiah(service.base_price)}
                  </span>
                </Link>
              </div>
            </div>

            {/* ── Right / Sidebar (desktop) ── */}
            <aside className="hidden lg:flex flex-col gap-6 min-w-0">
              {/* Price */}
              <div>
                <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                  Info Harga
                </h2>
                <PriceInfo service={service} />
              </div>

              {/* CTA */}
              <Link
                href={`/landing-page/service/${id}/order`}
                className="flex items-center justify-between w-full h-14 px-5 rounded-2xl bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98] transition-all shadow-xl shadow-stone-900/20"
              >
                <span className="font-bold text-[15px]">Pesan Sekarang</span>
                <span className="text-[13px] font-semibold text-stone-300">
                  {formatRupiah(service.base_price)}
                </span>
              </Link>

              {/* Specs */}
              {activeSpecs.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                    Spesifikasi ({activeSpecs.length})
                  </h2>
                  <ul className="space-y-2">
                    {activeSpecs.map((spec) => (
                      <SpecInfoCard key={spec.id} spec={spec} />
                    ))}
                  </ul>
                </div>
              )}

              {/* Info note */}
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <svg
                  className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"
                  />
                </svg>
                <p className="text-[12px] text-amber-700 leading-relaxed">
                  Harga dapat berubah sesuai spesifikasi yang Anda pilih saat
                  memesan.
                </p>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Sticky CTA bar — mobile only */}
      {!loading && service && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-4 pb-6 pt-3 bg-gradient-to-t from-stone-50 via-stone-50/95 to-transparent pointer-events-none">
          <Link
            href={`/landing-page/service/${id}/order`}
            className="pointer-events-auto flex items-center justify-between w-full h-14 px-5 rounded-2xl bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98] transition-all shadow-xl shadow-stone-900/25"
          >
            <div className="flex items-center gap-2.5">
              <svg
                className="w-5 h-5 text-white/80"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 8m12-8l2 8M9 21h6"
                />
              </svg>
              <span className="font-bold text-[15px]">Pesan Sekarang</span>
            </div>
            <span className="text-[13px] font-semibold text-stone-300">
              {formatRupiah(service.base_price)}
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
