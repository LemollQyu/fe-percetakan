"use client";

import { useEffect, useMemo, useState } from "react";
import { getToken } from "@/lib/auth";
import type { OrderStatus } from "@/api/order";
import { getOrders } from "@/api/order";
import { toStaticUrl } from "@/app/helper/normalizeUrl"; // ← tambah ini

const STATUS_OPTIONS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "Semua status", value: "all" },
  { label: "Created", value: "created" },
  { label: "Waiting Payment", value: "waiting_payment" },
  { label: "Paid", value: "paid" },
  { label: "On Progress", value: "on_progress" },
  { label: "Finished", value: "finished" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Expired", value: "expired" },
];

type StatusKey =
  | "created"
  | "waiting_payment"
  | "paid"
  | "on_progress"
  | "finished"
  | "completed"
  | "cancelled"
  | "expired";

const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; dot: string; badge: string; text: string }
> = {
  created: {
    label: "Created",
    dot: "bg-sky-400",
    badge: "bg-sky-50 border border-sky-200",
    text: "text-sky-700",
  },
  waiting_payment: {
    label: "Waiting Payment",
    dot: "bg-amber-400",
    badge: "bg-amber-50 border border-amber-200",
    text: "text-amber-700",
  },
  paid: {
    label: "Paid",
    dot: "bg-lime-500",
    badge: "bg-lime-50 border border-lime-200",
    text: "text-lime-700",
  },
  on_progress: {
    label: "On Progress",
    dot: "bg-blue-500",
    badge: "bg-blue-50 border border-blue-200",
    text: "text-blue-700",
  },
  finished: {
    label: "Finished",
    dot: "bg-violet-500",
    badge: "bg-violet-50 border border-violet-200",
    text: "text-violet-700",
  },
  completed: {
    label: "Completed",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 border border-emerald-200",
    text: "text-emerald-700",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-red-400",
    badge: "bg-red-50 border border-red-200",
    text: "text-red-600",
  },
  expired: {
    label: "Expired",
    dot: "bg-stone-400",
    badge: "bg-stone-100 border border-stone-200",
    text: "text-stone-500",
  },
};

function getStatusConfig(rawStatus: string) {
  const key = rawStatus.toLowerCase().replace(/\s+/g, "_") as StatusKey;
  return (
    STATUS_CONFIG[key] ?? {
      label: rawStatus.replace(/_/g, " "),
      dot: "bg-stone-400",
      badge: "bg-stone-100 border border-stone-200",
      text: "text-stone-600",
    }
  );
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
  const fullUrl = toStaticUrl(url); // ← ganti ini

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[600px] bg-white rounded-t-3xl overflow-hidden"
        style={{ maxHeight: "85dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-stone-200" />
        </div>
        <div className="flex items-center justify-between px-4 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <p className="font-barlow-bold text-sm font-bold text-stone-900">
                Preview Dokumen
              </p>
              <p className="text-[10px] text-stone-400 uppercase font-semibold">
                {fileType}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
              className="w-7 h-7 rounded-xl bg-stone-100 flex items-center justify-center active:scale-95 transition"
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
          style={{ maxHeight: "calc(85dvh - 90px)" }}
        >
          {isPdf && (
            <iframe
              src={fullUrl}
              title="Preview PDF"
              className="w-full border-0"
              style={{ height: "calc(85dvh - 90px)" }}
            />
          )}
          {isImage && (
            <div className="p-4 flex items-center justify-center bg-stone-50 min-h-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fullUrl}
                alt="Preview"
                className="max-w-full rounded-xl object-contain"
                style={{ maxHeight: "calc(85dvh - 140px)" }}
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

function AdminOrderCard({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const code = order?.order_code?.code ?? order?.code ?? `#${order.id}`;
  const createdAt = order?.created_at ?? null;
  const expiredAt = order?.order_code?.expired_at ?? null;
  const statusCfg = getStatusConfig(order.status ?? "");
  const specs: any[] = order?.order_spesifications ?? [];
  const totalPrice = order?.total_price_snapshot ?? null;
  const basPrice = order?.base_price_snapshot ?? null;
  const serviceName = order?.service_name_snapshot ?? null;
  const userNote = order?.user_note ?? null;
  const quantity = order?.quantity ?? null;
  const fileUrl = order?.order_file?.file_url ?? null;
  const fileType = order?.order_file?.file_type ?? ".pdf";
  const user = order?.user ?? null;

  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(fileType);
  const fullFileUrl = fileUrl ? toStaticUrl(fileUrl) : null; // ← ganti ini

  return (
    <div className="rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden">
      <div className={`h-1 w-full ${statusCfg.dot}`} />
      <div className="px-4 pt-3 pb-3">
        {/* Top: service name + order code + status badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-barlow-bold text-sm font-bold text-stone-900 truncate">
              {serviceName ?? "Layanan"}
            </p>
            <p className="text-[11px] text-stone-400 font-mono mt-0.5 truncate">
              {String(code)}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${statusCfg.badge} ${statusCfg.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
        </div>

        {/* User info */}
        {user && (
          <div className="flex items-center gap-2 mb-3 rounded-xl border border-stone-100 bg-stone-50 px-3 py-2">
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={toStaticUrl(user.avatar_url)}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover border border-stone-200 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center shrink-0">
                <svg
                  className="w-4 h-4 text-stone-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-stone-800 truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-stone-400 truncate">
                {user.email}
              </p>
            </div>
            {user.phone && (
              <span className="text-[10px] text-stone-500 font-mono shrink-0">
                {user.phone}
              </span>
            )}
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {totalPrice !== null && (
            <div className="col-span-2 rounded-xl bg-stone-50 border border-stone-100 px-2 py-1.5 flex flex-col">
              <span className="text-[10px] text-stone-400 mb-0.5">
                Total Harga
              </span>
              <span className="font-barlow-bold text-xs font-bold text-stone-900">
                {formatRupiah(totalPrice)}
              </span>
              {basPrice !== null && quantity !== null && (
                <span className="text-[10px] text-stone-400 mt-0.5">
                  {formatRupiah(basPrice)} × {quantity}
                </span>
              )}
            </div>
          )}
          {quantity !== null && (
            <div className="col-span-1 rounded-xl bg-stone-50 border border-stone-100 px-2 py-1.5 flex flex-col items-center justify-center">
              <span className="text-[10px] text-stone-400 mb-0.5">Qty</span>
              <span className="font-barlow-bold text-xs font-bold text-stone-900">
                {quantity}x
              </span>
            </div>
          )}
          {createdAt && (
            <div className="col-span-1 rounded-xl bg-stone-50 border border-stone-100 px-2 py-1.5 flex flex-col items-center justify-center">
              <span className="text-[10px] text-stone-400 mb-0.5">Dibuat</span>
              <span className="text-[10px] text-stone-700 text-center leading-tight">
                {formatDate(createdAt)}
              </span>
            </div>
          )}
        </div>

        {expiredAt && (
          <div className="flex items-center gap-1.5 mb-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-1.5">
            <svg
              className="w-3 h-3 text-amber-400 shrink-0"
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
            <span className="text-[11px] text-amber-700">
              Expired: {formatDate(expiredAt)}
            </span>
          </div>
        )}

        {userNote && (
          <div className="flex items-start gap-1.5 mb-2 bg-stone-50 rounded-xl px-3 py-2 border border-stone-100">
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
            <p className="text-[11px] text-stone-600 italic">{userNote}</p>
          </div>
        )}

        {specs.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-[11px] font-medium text-stone-600 active:scale-[0.99] transition mb-2"
          >
            <span>Detail spesifikasi ({specs.length})</span>
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
        )}

        {expanded && specs.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {specs.map((spec: any) => (
              <div
                key={spec.id}
                className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-100"
              >
                <span className="text-[11px] text-stone-500">
                  {spec.spesification_name_snapshot}
                </span>
                <div className="flex items-center gap-2">
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

        {/* File */}
        {fullFileUrl && (
          <>
            {isImage ? (
              <>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="w-full flex items-center gap-1.5 rounded-xl border border-stone-100 bg-stone-50 px-3 py-1.5 active:scale-[0.99] transition text-left"
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
                  <span className="text-[11px] text-stone-500 flex-1">
                    Gambar terlampir
                  </span>
                  <span className="text-[10px] font-semibold text-stone-400 uppercase">
                    {fileType}
                  </span>
                  <svg
                    className="w-3 h-3 text-stone-300 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
                {previewOpen && (
                  <FilePreviewModal
                    url={fileUrl}
                    fileType={fileType}
                    onClose={() => setPreviewOpen(false)}
                  />
                )}
              </>
            ) : (
              <a
                href={fullFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-stone-100 bg-stone-50 px-3 py-1.5 active:scale-[0.99] transition"
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
                <span className="text-[11px] text-stone-500 flex-1">
                  Dokumen terlampir
                </span>
                <span className="text-[10px] font-semibold text-stone-400 uppercase">
                  {fileType}
                </span>
                <svg
                  className="w-3 h-3 text-stone-300 shrink-0"
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
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const statusLabel = useMemo(
    () =>
      STATUS_OPTIONS.find((s) => s.value === status)?.label ?? "Semua status",
    [status],
  );

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = orders.filter((order: any) => {
      if (!q) return true;
      const code = (order?.order_code?.code ?? order?.code ?? "").toLowerCase();
      const service = (order?.service_name_snapshot ?? "").toLowerCase();
      return code.includes(q) || service.includes(q);
    });
    result = [...result].sort((a: any, b: any) => {
      const da = new Date(a?.created_at ?? 0).getTime();
      const db = new Date(b?.created_at ?? 0).getTime();
      return sort === "newest" ? db - da : da - db;
    });
    return result;
  }, [orders, search, sort]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getOrders({
      token,
      status: status === "all" ? undefined : status,
      page,
      limit: 10,
    })
      .then((res) => {
        if (cancelled) return;
        const list: any[] = Array.isArray(res)
          ? res
          : Array.isArray((res as any).data)
            ? (res as any).data
            : [];
        setOrders(list);
        setHasMore(list.length === 10);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Gagal memuat data order.",
        );
        setOrders([]);
        setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, page]);

  return (
    <main className="flex-1 w-full max-w-[900px] mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="font-barlow-bold text-2xl font-bold text-stone-900 mb-0.5">
          Management Orders
        </h1>
        <p className="text-sm text-stone-500">
          Pantau dan kelola semua pesanan yang masuk.
        </p>
      </div>

      {/* Search + Sort */}
      <div className="mb-5">
        <div className="flex gap-2 mb-2">
          {(["newest", "oldest"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-[12px] font-semibold border transition active:scale-[0.97] ${sort === s ? "bg-stone-900 border-stone-900 text-white" : "bg-white border-stone-200 text-stone-600"}`}
            >
              {s === "newest" ? "Terbaru" : "Terlama"}
            </button>
          ))}
        </div>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode order atau nama layanan..."
            className="font-barlow-bold w-full rounded-2xl border border-stone-200 bg-white pl-9 pr-9 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center active:scale-95 transition"
            >
              <svg
                className="w-3 h-3 text-stone-500"
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
          )}
        </div>
        {search && (
          <p className="mt-1.5 text-[11px] text-stone-400">
            {filteredOrders.length === 0
              ? "Tidak ada hasil untuk"
              : `${filteredOrders.length} hasil untuk`}{" "}
            <span className="font-semibold text-stone-700">"{search}"</span>
          </p>
        )}
      </div>

      {/* Filter chips */}
      <div className="mb-5">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_OPTIONS.map((opt) => {
            const isActive = status === opt.value;
            const cfg = opt.value !== "all" ? getStatusConfig(opt.value) : null;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setStatus(opt.value as any);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-semibold border transition active:scale-[0.97] ${isActive ? "bg-stone-900 border-stone-900 text-white" : "bg-white border-stone-200 text-stone-600"}`}
              >
                {cfg && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white/60" : cfg.dot}`}
                  />
                )}
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-stone-400">
          Menampilkan:{" "}
          <span className="font-medium text-stone-600">{statusLabel}</span>
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-stone-100 bg-white h-44 animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="py-3 px-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-stone-400"
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
            <p className="font-semibold text-stone-700 text-sm">
              {search ? "Hasil tidak ditemukan" : "Tidak ada order"}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              {search
                ? `Tidak ada order dengan kode atau layanan "${search}".`
                : `Tidak ada pesanan dengan status ${statusLabel.toLowerCase()}.`}
            </p>
          </div>
        </div>
      )}

      {!loading && !error && filteredOrders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {filteredOrders.map((order: any) => (
            <AdminOrderCard
              key={String(order.id) + String(order?.order_code?.code ?? "")}
              order={order}
            />
          ))}
        </div>
      )}

      {!loading && !error && filteredOrders.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="font-barlow-bold inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 py-2 text-xs border border-stone-200 text-stone-700 bg-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition"
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
          <span className="text-xs text-stone-500">
            Halaman <span className="font-semibold text-stone-900">{page}</span>
          </span>
          <button
            type="button"
            onClick={() => hasMore && setPage((p) => p + 1)}
            disabled={!hasMore || loading}
            className="font-barlow-bold inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 py-2 text-xs border border-stone-900 bg-stone-900 text-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition"
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
      )}
    </main>
  );
}
