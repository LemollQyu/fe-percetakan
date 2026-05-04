"use client";

import { useEffect, useMemo, useState } from "react";
import { getToken } from "@/lib/auth";
import { getRefunds } from "@/api/payment";
import type { RefundData, RefundItem, RefundProof } from "@/api/payment";
import { toStaticUrl } from "@/app/helper/normalizeUrl";
import Link from "next/link";

// ─── Status config ─────────────────────────────────────────────────────────

type RefundStatusFilter = "requested" | "transferred" | "accepted";

const STATUS_OPTIONS: { label: string; value: RefundStatusFilter | "all" }[] = [
  { label: "Semua", value: "all" },
  { label: "Diajukan", value: "requested" },
  { label: "Ditransfer", value: "transferred" },
  { label: "Diterima", value: "accepted" },
];

const STATUS_CONFIG: Record<
  RefundStatusFilter,
  { label: string; dot: string; badge: string; text: string; bar: string }
> = {
  requested: {
    label: "Diajukan",
    dot: "bg-amber-400",
    bar: "bg-amber-400",
    badge: "bg-amber-50 border border-amber-200",
    text: "text-amber-700",
  },
  transferred: {
    label: "Ditransfer",
    dot: "bg-blue-500",
    bar: "bg-blue-500",
    badge: "bg-blue-50 border border-blue-200",
    text: "text-blue-700",
  },
  accepted: {
    label: "Diterima",
    dot: "bg-violet-500",
    bar: "bg-violet-500",
    badge: "bg-violet-50 border border-violet-200",
    text: "text-violet-700",
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
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

// ─── Refund Card ───────────────────────────────────────────────────────────

function AdminRefundCard({ refundData }: { refundData: RefundData }) {
  const [expanded, setExpanded] = useState(false);

  const isPendingInput = !refundData.refunds || refundData.refunds.length === 0;
  const activeRefund: RefundItem | undefined = refundData.refunds?.[0];
  const refundStatus = activeRefund?.status as RefundStatusFilter | undefined;
  const statusCfg = refundStatus ? STATUS_CONFIG[refundStatus] : null;

  return (
    <Link
      href={`/admin/kelola/refunds/${refundData.id}`}
      className="block rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden active:scale-[0.99] transition-transform hover:border-stone-200 hover:shadow-md"
    >
      <div
        className={`h-1 w-full ${
          isPendingInput ? "bg-stone-300" : (statusCfg?.bar ?? "bg-stone-300")
        }`}
      />
      <div className="px-4 pt-3 pb-3">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-barlow-bold text-sm font-bold text-stone-900 truncate">
              {refundData.order_name ?? "Pengembalian"}
            </p>
            <p className="text-[11px] text-stone-400 font-mono mt-0.5 truncate">
              {refundData.order_code}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isPendingInput ? (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap bg-stone-100 border border-stone-200 text-stone-500">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                Belum Input Rekening
              </span>
            ) : statusCfg ? (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${statusCfg.badge} ${statusCfg.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
            ) : null}
          </div>
        </div>

        {/* ── Info chips ── */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="col-span-2 rounded-xl bg-stone-50 border border-stone-100 px-2 py-1.5 flex flex-col">
            <span className="text-[10px] text-stone-400 mb-0.5">
              Jumlah Refund
            </span>
            <span className="font-barlow-bold text-xs font-bold text-stone-900">
              {formatRupiah(refundData.amount)}
            </span>
          </div>
          <div className="col-span-1 rounded-xl bg-stone-50 border border-stone-100 px-2 py-1.5 flex flex-col items-center justify-center">
            <span className="text-[10px] text-stone-400 mb-0.5">User ID</span>
            <span className="text-xs font-semibold text-stone-700">
              #{refundData.user_id}
            </span>
          </div>
          <div className="col-span-1 rounded-xl bg-stone-50 border border-stone-100 px-2 py-1.5 flex flex-col items-center justify-center">
            <span className="text-[10px] text-stone-400 mb-0.5">Dibuat</span>
            <span className="text-[10px] text-stone-700 text-center leading-tight">
              {formatDate(refundData.created_at)}
            </span>
          </div>
        </div>

        {/* ── Kode ── */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {refundData.payment_code && (
            <div className="flex items-center gap-1.5 rounded-xl bg-stone-50 border border-stone-100 px-3 py-1.5">
              <span className="text-[10px] text-stone-400">Kode bayar</span>
              <span className="font-mono text-[11px] font-semibold text-stone-700">
                {refundData.payment_code}
              </span>
            </div>
          )}
        </div>

        {/* ── Admin note ── */}
        {refundData.admin_note && (
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
            <p className="text-[11px] text-stone-600 italic">
              {refundData.admin_note}
            </p>
          </div>
        )}

        {/* ── Banner belum input rekening ── */}
        {isPendingInput && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 mb-2">
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-[11px] text-amber-700 font-medium">
              User belum menginput nomor rekening tujuan refund.
            </p>
          </div>
        )}

        {/* ── Detail rekening (expandable) ── */}
        {!isPendingInput && activeRefund && (
          <>
            {activeRefund.transferred_at && (
              <div className="flex items-center gap-2 mb-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                <svg
                  className="w-3.5 h-3.5 text-blue-400 shrink-0"
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
                <span className="text-[11px] text-blue-700 font-medium">
                  Ditransfer: {formatDate(activeRefund.transferred_at)}
                </span>
              </div>
            )}

            {/* Tombol expand — cegah Link navigate */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setExpanded((v) => !v);
              }}
              className="w-full flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-[11px] font-medium text-stone-600 active:scale-[0.99] transition mb-2"
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
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                Detail rekening tujuan
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
              <div className="space-y-1.5 mb-2">
                {(
                  [
                    { label: "Bank", value: activeRefund.bank_name },
                    {
                      label: "No. Rekening",
                      value: activeRefund.account_number,
                    },
                    { label: "Atas Nama", value: activeRefund.account_name },
                  ] satisfies { label: string; value: string }[]
                ).map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-100"
                  >
                    <span className="text-[11px] text-stone-500">
                      {row.label}
                    </span>
                    <span className="text-[11px] font-semibold text-stone-800">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Bukti transfer — cegah Link navigate saat klik "Lihat" */}
            {activeRefund.proofs && activeRefund.proofs.length > 0 && (
              <div className="space-y-1.5" onClick={(e) => e.preventDefault()}>
                {activeRefund.proofs.map((proof: RefundProof) => {
                  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(
                    proof.file_url,
                  );
                  return (
                    <a
                      key={proof.id}
                      href={toStaticUrl(proof.file_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
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
                          d={
                            isImage
                              ? "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              : "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          }
                        />
                      </svg>
                      <span className="text-[11px] text-stone-500 truncate flex-1">
                        {proof.note || "Bukti transfer"}
                      </span>
                      <span className="text-[10px] font-semibold text-stone-400 uppercase shrink-0">
                        Lihat
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Chevron hint navigasi */}
        <div className="flex items-center justify-end mt-2 gap-1 text-stone-400">
          <span className="text-[10px]">Lihat detail</span>
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function AdminRefundsPage() {
  const [status, setStatus] = useState<RefundStatusFilter | "all">("all");
  const [page, setPage] = useState(1);
  const [refunds, setRefunds] = useState<RefundData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [refreshKey, setRefreshKey] = useState(0);

  const filteredRefunds = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = refunds.filter((r) => {
      if (!q) return true;
      return (
        r.order_code.toLowerCase().includes(q) ||
        r.order_name.toLowerCase().includes(q) ||
        r.payment_code.toLowerCase().includes(q)
      );
    });
    result = [...result].sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sort === "newest" ? db - da : da - db;
    });
    return result;
  }, [refunds, search, sort]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    // status "all" = kirim kosong ke backend supaya dapat semua termasuk belum input
    const statusParam = status === "all" ? "" : status;

    getRefunds({ token, status: statusParam, page, limit: 10 })
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setRefunds(list);
        setHasMore(list.length === 10);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Gagal memuat data refund.",
        );
        setRefunds([]);
        setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, page, refreshKey]);

  return (
    <main className="flex-1 w-full max-w-[900px] mx-auto px-4 py-6">
      {/* ── Header ── */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-barlow-bold text-2xl font-bold text-stone-900 mb-0.5">
            Management Refund
          </h1>
          <p className="text-sm text-stone-500">
            Pantau dan kelola semua pengajuan pengembalian dana.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPage(1);
            setRefreshKey((k) => k + 1);
          }}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 shadow-sm active:scale-95 transition disabled:opacity-40 mt-1"
        >
          <svg
            className={`w-3.5 h-3.5 text-stone-500 ${loading ? "animate-spin" : ""}`}
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
          Refresh
        </button>
      </div>

      {/* ── Sort + Search ── */}
      <div className="mb-5">
        <div className="flex gap-2 mb-2">
          {(["newest", "oldest"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-[12px] font-semibold border transition active:scale-[0.97] ${
                sort === s
                  ? "bg-stone-900 border-stone-900 text-white"
                  : "bg-white border-stone-200 text-stone-600"
              }`}
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
            placeholder="Cari kode order, nama layanan, kode bayar..."
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
            {filteredRefunds.length === 0
              ? "Tidak ada hasil untuk"
              : `${filteredRefunds.length} hasil untuk`}{" "}
            <span className="font-semibold text-stone-700">"{search}"</span>
          </p>
        )}
      </div>

      {/* ── Filter chips ── */}
      <div className="mb-5">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_OPTIONS.map((opt) => {
            const isActive = status === opt.value;
            const cfg = opt.value !== "all" ? STATUS_CONFIG[opt.value] : null;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setStatus(opt.value as any);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-semibold border transition active:scale-[0.97] ${
                  isActive
                    ? "bg-stone-900 border-stone-900 text-white"
                    : "bg-white border-stone-200 text-stone-600"
                }`}
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
      </div>

      {/* ── Loading ── */}
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

      {/* ── Error ── */}
      {!loading && error && (
        <div className="py-3 px-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && filteredRefunds.length === 0 && (
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
                d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-semibold text-stone-700 text-sm">
              {search ? "Hasil tidak ditemukan" : "Tidak ada refund"}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              {search
                ? `Tidak ada refund dengan pencarian "${search}".`
                : "Belum ada pengajuan pengembalian dana."}
            </p>
          </div>
        </div>
      )}

      {/* ── List ── */}
      {!loading && !error && filteredRefunds.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {filteredRefunds.map((r) => (
            <AdminRefundCard key={r.id} refundData={r} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && !error && filteredRefunds.length > 0 && (
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
