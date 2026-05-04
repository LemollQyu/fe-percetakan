"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { getServicesList } from "@/api/jasa/services";
import type { ServiceJasa } from "@/api/jasa/services/types";

// ─── Icons ────────────────────────────────────────────────────────────────────
import Image from "next/image";

// Helper: ambil path-nya saja dari URL apapun
function toRelativePath(url: string): string {
  // Kalau sudah relative path, kembalikan langsung
  if (url.startsWith("/")) return url;

  // Kalau ada protocol (http:// / https://), ambil pathname-nya
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }

  // Format tanggung seperti "localhost:8081/static/..."
  // → cari slash pertama setelah host:port, ambil dari sana
  const slashIndex = url.indexOf("/");
  if (slashIndex !== -1) {
    return url.slice(slashIndex); // → "/static/jasa/..."
  }

  return "/" + url;
}

const SearchIcon = () => (
  <svg
    className="w-5 h-5 text-stone-500 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const BackIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const TagIcon = () => (
  <svg
    className="w-3.5 h-3.5 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2h2z"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    className="w-3 h-3"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const HistoryIcon = () => (
  <svg
    className="w-3.5 h-3.5 text-stone-400 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(num: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
}

const HISTORY_KEY = "search_history";
const PAGE_SIZE = 10;

function getHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(query: string) {
  const prev = getHistory().filter((h) => h !== query);
  const next = [query, ...prev].slice(0, 8);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function removeHistory(query: string) {
  const next = getHistory().filter((h) => h !== query);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

// ─── Service Card (grid 2 kolom) ──────────────────────────────────────────────

function ServiceCard({ service }: { service: ServiceJasa }) {
  const thumbnail =
    service.media?.find((m) => m.type === "thumbnail") ?? service.media?.[0];
  const icon = service.media?.find((m) => m.type === "icon");

  return (
    <Link
      href={`/category/${service.category?.slug ?? service.category_id}/service/${service.id}`}
      className="flex flex-col rounded-2xl bg-white border border-stone-100 shadow-sm shadow-stone-100/60 hover:shadow-md hover:border-stone-200 active:scale-[0.98] transition-all overflow-hidden"
    >
      <div className="w-full aspect-square bg-stone-100 flex items-center justify-center overflow-hidden">
        {thumbnail ? (
          <Image
            src={toRelativePath(thumbnail.url)}
            alt={service.name}
            width={200}
            height={200}
            className="w-full h-full object-cover"
          />
        ) : icon ? (
          <Image
            src={toRelativePath(icon.url)}
            alt=""
            width={200}
            height={200}
            className="object-contain"
          />
        ) : (
          <span className="text-stone-300">
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        {service.category && (
          <p className="text-[10px] text-stone-400 truncate">
            {service.category.name}
          </p>
        )}
        <p className="font-barlow-bold text-[13px] font-semibold text-stone-800 line-clamp-2 leading-snug">
          {service.name}
        </p>
        {service.base_price > 0 && (
          <p className="font-barlow-bold text-[12px] font-semibold text-stone-700 mt-0.5">
            {formatRupiah(service.base_price)}
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── Highlight helper ─────────────────────────────────────────────────────────

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim())
    return <span className="text-sm text-stone-800">{text}</span>;
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);
  return (
    <span className="text-sm text-stone-800">
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-100 text-amber-900 font-semibold rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

// ─── Inner component ──────────────────────────────────────────────────────────

function SearchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("search") ?? "";

  const [inputValue, setInputValue] = useState(initialQuery);
  const [allServices, setAllServices] = useState<ServiceJasa[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<ServiceJasa[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [filteredResults, setFilteredResults] = useState<ServiceJasa[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    async function fetchAll() {
      setFetchLoading(true);
      try {
        const res = await getServicesList({ limit: 999 });
        setAllServices(res.data ?? []);
      } catch {
        setAllServices([]);
      } finally {
        setFetchLoading(false);
      }
    }
    fetchAll();
  }, []);

  useEffect(() => {
    if (initialQuery && allServices.length > 0) {
      const q = initialQuery.toLowerCase();
      setFilteredResults(
        allServices.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q) ||
            s.category?.name.toLowerCase().includes(q),
        ),
      );
      setVisibleCount(PAGE_SIZE);
      setHasSearched(true);
    }
  }, [initialQuery, allServices]);

  // Infinite scroll
  useEffect(() => {
    if (!hasSearched) return;
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          visibleCount < filteredResults.length
        ) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) =>
              Math.min(prev + PAGE_SIZE, filteredResults.length),
            );
            setIsLoadingMore(false);
          }, 500);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasSearched, visibleCount, filteredResults.length]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);
      if (!val.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      const q = val.toLowerCase();
      const matched = allServices
        .filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.category?.name.toLowerCase().includes(q),
        )
        .slice(0, 6);
      setSuggestions(matched);
      setShowSuggestions(true);
    },
    [allServices],
  );

  const doSearch = useCallback(
    (query: string) => {
      const q = query.trim();
      if (!q) return;
      setShowSuggestions(false);
      setHasSearched(true);
      setVisibleCount(PAGE_SIZE);
      saveHistory(q);
      setHistory(getHistory());
      router.push(`/search?search=${encodeURIComponent(q)}`);
      const lower = q.toLowerCase();
      setFilteredResults(
        allServices.filter(
          (s) =>
            s.name.toLowerCase().includes(lower) ||
            s.description?.toLowerCase().includes(lower) ||
            s.category?.name.toLowerCase().includes(lower),
        ),
      );
    },
    [allServices, router],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") doSearch(inputValue);
    if (e.key === "Escape") setShowSuggestions(false);
  };

  const handleRemoveHistory = (q: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeHistory(q);
    setHistory(getHistory());
  };

  // Close suggestions klik luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const visibleResults = filteredResults.slice(0, visibleCount);
  const hasMore = visibleCount < filteredResults.length;

  return (
    <div className="min-h-screen w-full max-w-[430px] mx-auto overflow-x-hidden bg-[#f5f0eb]">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 w-full px-3 py-3 border-b border-stone-200/60 bg-[#f5f0eb]/90 backdrop-blur-sm flex items-center gap-2">
        <Link
          href="/"
          className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full text-stone-600 hover:bg-white/80 active:scale-95 transition-all"
          aria-label="Kembali"
        >
          <BackIcon />
        </Link>

        <div className="relative flex-1 min-w-0">
          <div className="relative flex items-center h-11 pl-4 pr-2 rounded-full bg-white shadow-sm shadow-stone-200/50 border border-stone-100 focus-within:border-stone-300 transition-all">
            {/* Icon search kiri */}
            <span
              className="flex items-center justify-center mr-2.5 shrink-0"
              aria-hidden
            >
              <SearchIcon />
            </span>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => inputValue.trim() && setShowSuggestions(true)}
              placeholder="Cari layanan..."
              autoFocus
              className="flex-1 min-w-0 bg-transparent font-monterat-tipis text-sm text-stone-900 placeholder:text-stone-400 outline-none"
              aria-label="Cari"
            />

            {/* Tombol × ATAU tombol search — di kanan dalam input */}
            {inputValue ? (
              <div className="flex items-center gap-1 shrink-0 ml-1">
                <button
                  type="button"
                  onClick={() => {
                    setInputValue("");
                    setSuggestions([]);
                    setShowSuggestions(false);
                    inputRef.current?.focus();
                  }}
                  className="w-5 h-5 flex items-center justify-center rounded-full bg-stone-200 text-stone-500 hover:bg-stone-300 transition-colors"
                  aria-label="Hapus"
                >
                  <CloseIcon />
                </button>
                <button
                  type="button"
                  onClick={() => doSearch(inputValue)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-900 text-white hover:bg-stone-800 active:scale-95 transition-all"
                  aria-label="Cari"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => doSearch(inputValue)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-900 text-white hover:bg-stone-800 active:scale-95 transition-all shrink-0 ml-1"
                aria-label="Cari"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-stone-100 shadow-xl shadow-stone-200/50 overflow-hidden z-30"
            >
              <div className="px-4 pt-3 pb-1.5">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                  Saran Pencarian
                </p>
              </div>
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setInputValue(s.name);
                    doSearch(s.name);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 active:bg-stone-100 transition-colors text-left"
                >
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-stone-100 shrink-0">
                    <TagIcon />
                  </span>
                  <div className="flex-1 min-w-0">
                    <HighlightText text={s.name} query={inputValue} />
                    {s.category && (
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {s.category.name}
                      </p>
                    )}
                  </div>
                  <svg
                    className="w-3.5 h-3.5 text-stone-300 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  doSearch(inputValue);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 border-t border-stone-100 hover:bg-stone-50 transition-colors text-left"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-stone-900 shrink-0">
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
                <p className="text-sm text-stone-700 font-medium">
                  Cari &ldquo;
                  <span className="font-semibold text-stone-900">
                    {inputValue}
                  </span>
                  &rdquo;
                </p>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 py-4">
        {/* ── Belum search: riwayat ── */}
        {!hasSearched && (
          <>
            {fetchLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-11 rounded-xl bg-stone-200/40 animate-pulse"
                  />
                ))}
              </div>
            ) : history.length > 0 ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                    Pencarian Terakhir
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem(HISTORY_KEY);
                      setHistory([]);
                    }}
                    className="text-[11px] text-stone-400 hover:text-red-500 transition-colors"
                  >
                    Hapus semua
                  </button>
                </div>
                <div className="space-y-1.5">
                  {history.map((q) => (
                    <div
                      key={q}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-stone-100 shadow-sm"
                    >
                      <HistoryIcon />
                      <button
                        type="button"
                        onClick={() => {
                          setInputValue(q);
                          doSearch(q);
                        }}
                        className="flex-1 text-left text-sm text-stone-700 font-monterat-tipis truncate"
                      >
                        {q}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveHistory(q, e)}
                        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors shrink-0"
                        aria-label="Hapus riwayat"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg
                  className="w-14 h-14 text-stone-200"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="mt-4 text-sm text-stone-400">
                  Ketik untuk mencari layanan
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Sudah search ── */}
        {hasSearched && (
          <>
            <div className="mb-3 flex items-center gap-2 shrink-0">
              <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Hasil &ldquo;{initialQuery || inputValue}&rdquo;
              </p>
              <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                {filteredResults.length}
              </span>
            </div>

            {/* Tidak ditemukan */}
            {filteredResults.length === 0 && !fetchLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg
                  className="w-12 h-12 text-stone-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="mt-4 font-barlow-bold text-base font-semibold text-stone-700">
                  Layanan tidak ditemukan
                </p>
                <p className="mt-1 text-sm text-stone-400">
                  Coba kata kunci lain
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setInputValue("");
                    setHasSearched(false);
                    setFilteredResults([]);
                    router.push("/search");
                    inputRef.current?.focus();
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
                >
                  Reset pencarian
                </button>
              </div>
            )}

            {/* Grid 2 kolom */}
            {visibleResults.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {visibleResults.map((s) => (
                  <ServiceCard key={s.id} service={s} />
                ))}
              </div>
            )}

            {/* Skeleton load more */}
            {isLoadingMore && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white border border-stone-100 overflow-hidden animate-pulse"
                  >
                    <div className="aspect-square bg-stone-100" />
                    <div className="p-3 space-y-2">
                      <div className="h-2 bg-stone-100 rounded w-1/2" />
                      <div className="h-3 bg-stone-100 rounded w-3/4" />
                      <div className="h-2 bg-stone-100 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sentinel infinite scroll */}
            <div ref={loaderRef} className="h-4 mt-2" />

            {!hasMore && filteredResults.length > 0 && (
              <p className="text-center text-[11px] text-stone-400 mt-2 pb-4">
                Semua {filteredResults.length} layanan ditampilkan
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Export dengan Suspense ───────────────────────────────────────────────────

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f0eb] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-stone-300 border-t-stone-700 animate-spin" />
        </div>
      }
    >
      <SearchInner />
    </Suspense>
  );
}
