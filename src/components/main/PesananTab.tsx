"use client";

import { useEffect, useMemo, useState } from "react";
import { getToken } from "@/lib/auth";
import type { MyOrder, OrderStatus } from "@/api/order";
import { getMyOrders } from "@/api/order";
import { toStaticUrl } from "@/app/helper/normalizeUrl";

// ─── Status config khusus tab Pesanan ────────────────────────────────────────

type PesananStatusKey = "waiting_payment" | "on_progress" | "finished";

const PESANAN_TABS: {
  key: PesananStatusKey;
  label: string;
  dot: string;
  bar: string;
  badge: string;
  text: string;
  emptyMsg: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "waiting_payment",
    label: "Belum Bayar",
    dot: "bg-amber-400",
    bar: "bg-amber-400",
    badge: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    emptyMsg: "Tidak ada pesanan yang menunggu pembayaran.",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    ),
  },
  {
    key: "on_progress",
    label: "Diproses",
    dot: "bg-blue-500",
    bar: "bg-blue-500",
    badge: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    emptyMsg: "Tidak ada pesanan yang sedang diproses.",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    ),
  },
  {
    key: "finished",
    label: "Selesai",
    dot: "bg-violet-500",
    bar: "bg-violet-500",
    badge: "bg-violet-50 border-violet-200",
    text: "text-violet-700",
    emptyMsg: "Tidak ada pesanan yang selesai.",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── File Preview Modal ───────────────────────────────────────────────────────

function FilePreviewModal({
  url,
  fileType,
  onClose,
}: {
  url: string;
  fileType: string;
  onClose: () => void;
}) {
  const isPdf = fileType.toLowerCase().includes("pdf");
  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(fileType);
  const fullUrl = toStaticUrl(url);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] bg-white rounded-t-[28px] overflow-hidden"
        style={{ maxHeight: "88dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-stone-200" />
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-stone-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    isPdf
                      ? "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      : "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  }
                />
              </svg>
            </div>
            <div>
              <p className="font-barlow-bold text-sm font-bold text-stone-900">
                Preview
              </p>
              <p className="text-[10px] text-stone-400 uppercase tracking-wide font-semibold">
                {fileType}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xl bg-stone-100 px-3 py-1.5 text-[11px] font-semibold text-stone-700 active:scale-95 transition"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Buka
            </a>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center active:scale-95 transition"
            >
              <svg
                className="w-4 h-4 text-stone-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <div
          className="overflow-auto"
          style={{ maxHeight: "calc(88dvh - 90px)" }}
        >
          {isPdf && (
            <iframe
              src={fullUrl}
              title="Preview"
              className="w-full border-0"
              style={{ height: "calc(88dvh - 90px)" }}
            />
          )}
          {isImage && (
            <div className="p-4 flex items-center justify-center bg-stone-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fullUrl}
                alt="Preview"
                className="max-w-full rounded-2xl object-contain"
                style={{ maxHeight: "calc(88dvh - 140px)" }}
              />
            </div>
          )}
          {!isPdf && !isImage && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 px-4">
              <p className="text-sm font-semibold text-stone-700">
                Preview tidak tersedia
              </p>
              <a
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-2xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white active:scale-95 transition"
              >
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  statusCfg,
}: {
  order: any;
  statusCfg: (typeof PESANAN_TABS)[0];
}) {
  const [expanded, setExpanded] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const code = order?.order_code?.code ?? order?.code ?? `#${order.id}`;
  const createdAt = order?.created_at ?? order?.createdAt ?? null;
  const expiredAt = order?.order_code?.expired_at ?? null;
  const specs: any[] = order?.order_spesifications ?? [];
  const totalPrice = order?.total_price_snapshot ?? null;
  const serviceName = order?.service_name_snapshot ?? null;
  const userNote = order?.user_note ?? null;
  const quantity = order?.quantity ?? null;
  const fileUrl = order?.order_file?.file_url ?? null;
  const ft = order?.order_file?.file_type ?? ".pdf";
  const isImageFile = /\.(png|jpe?g|gif|webp|svg)$/i.test(ft);

  return (
    <div className="rounded-[20px] bg-white border border-stone-100 shadow-sm overflow-hidden">
      <div className={`h-[3px] w-full ${statusCfg.bar}`} />
      <div className="p-4">
        {/* Service + badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-barlow-bold text-[15px] font-bold text-stone-900 leading-tight truncate">
              {serviceName ?? "Layanan"}
            </p>
            <p className="text-[11px] text-stone-400 font-mono mt-0.5 truncate">
              {String(code)}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border whitespace-nowrap shrink-0 ${statusCfg.badge} ${statusCfg.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
        </div>

        {/* Info pills */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {totalPrice !== null && (
            <div className="flex items-center gap-1.5 rounded-xl bg-stone-50 border border-stone-100 px-3 py-1.5">
              <span className="text-[10px] text-stone-400">Total</span>
              <span className="font-barlow-bold text-xs font-bold text-stone-900">
                {formatRupiah(totalPrice)}
              </span>
            </div>
          )}
          {quantity !== null && (
            <div className="flex items-center gap-1.5 rounded-xl bg-stone-50 border border-stone-100 px-3 py-1.5">
              <span className="text-[10px] text-stone-400">Qty</span>
              <span className="font-barlow-bold text-xs font-bold text-stone-900">
                {quantity}×
              </span>
            </div>
          )}
          {createdAt && (
            <div className="flex items-center gap-1.5 rounded-xl bg-stone-50 border border-stone-100 px-3 py-1.5">
              <svg
                className="w-3 h-3 text-stone-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-[11px] text-stone-600">
                {formatDateShort(createdAt)}
              </span>
            </div>
          )}
        </div>

        {/* Expired */}
        {expiredAt && (
          <div className="flex items-center gap-2 mb-2.5 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
            <svg
              className="w-3.5 h-3.5 text-amber-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-[11px] text-amber-700 font-medium">
              Expired: {formatDate(expiredAt)}
            </span>
          </div>
        )}

        {/* Note */}
        {userNote && (
          <div className="flex items-start gap-2 mb-2.5 bg-stone-50 rounded-xl px-3 py-2 border border-stone-100">
            <svg
              className="w-3 h-3 text-stone-400 mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 8h10M7 12h6m-6 4h10M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-[11px] text-stone-600 italic leading-relaxed">
              {userNote}
            </p>
          </div>
        )}

        {/* Specs */}
        {specs.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="w-full flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-[11px] font-semibold text-stone-600 active:scale-[0.99] transition mb-0.5"
            >
              <span className="flex items-center gap-1.5">
                <svg
                  className="w-3 h-3 text-stone-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Detail spesifikasi
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-stone-200 text-[10px] font-bold text-stone-600">
                  {specs.length}
                </span>
              </span>
              <svg
                className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {expanded && (
              <div className="mt-1.5 mb-1 space-y-1">
                {specs.map((spec: any) => (
                  <div
                    key={spec.id}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-100"
                  >
                    <span className="text-[11px] text-stone-500 truncate">
                      {spec.spesification_name_snapshot}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-semibold text-stone-800">
                        {spec.value_snapshot === "true"
                          ? "Ya"
                          : spec.value_snapshot === "false"
                            ? "Tidak"
                            : spec.value_snapshot}
                      </span>
                      {spec.additional_price_snapshot > 0 && (
                        <span className="text-[10px] text-stone-400">
                          +{formatRupiah(spec.additional_price_snapshot)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* File */}
        {fileUrl && (
          <>
            {isImageFile ? (
              <>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="mt-2 w-full flex items-center gap-2 rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 active:scale-[0.99] transition text-left"
                >
                  <svg
                    className="w-3 h-3 text-stone-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-[11px] text-stone-500 truncate flex-1">
                    Gambar terlampir
                  </span>
                  <span className="text-[10px] font-semibold text-stone-400 uppercase">
                    {ft}
                  </span>
                </button>
                {previewOpen && (
                  <FilePreviewModal
                    url={fileUrl}
                    fileType={ft}
                    onClose={() => setPreviewOpen(false)}
                  />
                )}
              </>
            ) : (
              <a
                href={toStaticUrl(fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 w-full flex items-center gap-2 rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 active:scale-[0.99] transition"
              >
                <svg
                  className="w-3 h-3 text-stone-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-[11px] text-stone-500 truncate flex-1">
                  Dokumen terlampir
                </span>
                <span className="text-[10px] font-semibold text-stone-400 uppercase">
                  {ft}
                </span>
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Pesanan Tab Content ──────────────────────────────────────────────────────

export function PesananTab() {
  const [activeStatus, setActiveStatus] =
    useState<PesananStatusKey>("waiting_payment");
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Hitung jumlah order per status (cache sederhana)
  const [counts, setCounts] = useState<Record<PesananStatusKey, number>>({
    waiting_payment: 0,
    on_progress: 0,
    finished: 0,
  });

  const activeCfg = PESANAN_TABS.find((t) => t.key === activeStatus)!;

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const goStatus =
      activeStatus.charAt(0).toUpperCase() + activeStatus.slice(1);

    getMyOrders({ token, status: goStatus as OrderStatus, page, limit: 10 })
      .then((res) => {
        if (cancelled) return;
        const list: MyOrder[] = Array.isArray(res)
          ? res
          : Array.isArray((res as any).data)
            ? (res as any).data
            : [];
        setOrders(list);
        setHasMore(list.length === 10);
        setCounts((prev) => ({ ...prev, [activeStatus]: list.length }));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Gagal memuat pesanan.");
        setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeStatus, page]);

  const handleChangeStatus = (key: PesananStatusKey) => {
    setActiveStatus(key);
    setPage(1);
    setOrders([]);
  };

  return (
    <div>
      {/* ── Status chips ── */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
        {PESANAN_TABS.map((tab) => {
          const isActive = activeStatus === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleChangeStatus(tab.key)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2 text-[13px] font-semibold border transition-all active:scale-[0.96] shrink-0 ${
                isActive
                  ? "bg-stone-900 border-stone-900 text-white shadow-sm shadow-stone-900/20"
                  : "bg-white border-stone-200 text-stone-600"
              }`}
            >
              <span className={isActive ? "text-white" : tab.text}>
                {tab.icon}
              </span>
              {tab.label}
              {counts[tab.key] > 0 && (
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1 ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {counts[tab.key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-[20px] border border-stone-100 bg-white overflow-hidden animate-pulse"
            >
              <div className={`h-[3px] w-full ${activeCfg.bar}`} />
              <div className="p-4 space-y-3">
                <div className="flex justify-between gap-2">
                  <div className="h-4 bg-stone-100 rounded-lg w-2/3" />
                  <div className="h-6 bg-stone-100 rounded-full w-20" />
                </div>
                <div className="flex gap-2">
                  <div className="h-7 bg-stone-100 rounded-xl w-24" />
                  <div className="h-7 bg-stone-100 rounded-xl w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="flex items-center gap-3 py-3.5 px-4 rounded-2xl bg-red-50 border border-red-100">
          <svg
            className="w-4 h-4 text-red-400 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-stone-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-barlow-bold font-semibold text-stone-700 text-sm">
              Tidak ada pesanan
            </p>
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              {activeCfg.emptyMsg}
            </p>
          </div>
        </div>
      )}

      {/* ── Order list ── */}
      {!loading && !error && orders.length > 0 && (
        <>
          <div className="space-y-3 mb-5">
            {orders.map((order: any) => (
              <OrderCard
                key={String(order.id) + String(order?.order_code?.code ?? "")}
                order={order}
                statusCfg={activeCfg}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="font-barlow-bold flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-semibold border border-stone-200 text-stone-700 bg-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Sebelumnya
            </button>
            <span className="text-xs text-stone-400 shrink-0">
              Hal. <span className="font-bold text-stone-900">{page}</span>
            </span>
            <button
              type="button"
              onClick={() => hasMore && setPage((p) => p + 1)}
              disabled={!hasMore}
              className="font-barlow-bold flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-semibold border border-stone-900 bg-stone-900 text-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition"
            >
              Berikutnya
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
