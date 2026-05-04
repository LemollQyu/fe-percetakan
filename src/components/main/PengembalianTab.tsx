"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { getMyRefund } from "@/api/payment";
import type { RefundData, RefundItem, RefundProof } from "@/api/payment";
import { toStaticUrl } from "@/app/helper/normalizeUrl";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Status config ────────────────────────────────────────────────────────────

type RefundStatus = "requested" | "transferred" | "accepted";

const REFUND_STATUS_TABS = [
  {
    key: "requested" as RefundStatus,
    label: "Diajukan",
    dot: "bg-amber-400",
    bar: "bg-amber-400",
    badge: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    emptyMsg: "Tidak ada pengajuan pengembalian.",
    icon: (
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
          d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
        />
      </svg>
    ),
  },
  {
    key: "transferred" as RefundStatus,
    label: "Ditransfer",
    dot: "bg-blue-500",
    bar: "bg-blue-500",
    badge: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    emptyMsg: "Tidak ada pengembalian yang sedang dalam proses transfer.",
    icon: (
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
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    ),
  },
  {
    key: "accepted" as RefundStatus,
    label: "Diterima",
    dot: "bg-violet-500",
    bar: "bg-violet-500",
    badge: "bg-violet-50 border-violet-200",
    text: "text-violet-700",
    emptyMsg: "Tidak ada pengembalian yang telah diterima.",
    icon: (
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
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Refund Card ──────────────────────────────────────────────────────────────

function RefundCard({
  refundData,
  statusCfg,
}: {
  refundData: RefundData;
  statusCfg: (typeof REFUND_STATUS_TABS)[0];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const isPendingInput =
    statusCfg.key === "requested" &&
    (!refundData.refunds || refundData.refunds.length === 0);

  const activeRefund: RefundItem | undefined =
    refundData.refunds?.find((r) => r.status === statusCfg.key) ??
    refundData.refunds?.[0];

  return (
    <Link
      href={`/refund/${refundData.id}`}
      className="block rounded-[20px] bg-white border border-stone-100 shadow-sm overflow-hidden active:scale-[0.99] transition-transform"
    >
      <div className={`h-[3px] w-full ${statusCfg.bar}`} />
      <div className="p-4">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-barlow-bold text-[15px] font-bold text-stone-900 leading-tight truncate">
              {refundData.order_name ?? "Pengembalian"}
            </p>
            <p className="text-[11px] text-stone-400 font-mono mt-0.5 truncate">
              {refundData.order_code}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border whitespace-nowrap shrink-0 ${
              isPendingInput
                ? "bg-stone-50 border-stone-200 text-stone-500"
                : `${statusCfg.badge} ${statusCfg.text}`
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isPendingInput ? "bg-stone-400" : statusCfg.dot}`}
            />
            {isPendingInput ? "Belum Input" : statusCfg.label}
          </span>
        </div>

        {/* ── Chips ── */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-xl bg-stone-50 border border-stone-100 px-3 py-1.5">
            <span className="text-[10px] text-stone-400">Jumlah</span>
            <span className="font-barlow-bold text-xs font-bold text-stone-900">
              {formatRupiah(refundData.amount)}
            </span>
          </div>
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
              {formatDateShort(refundData.created_at)}
            </span>
          </div>
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
              {refundData.admin_note}
            </p>
          </div>
        )}

        {/* ── Banner + tombol input rekening ── */}
        {isPendingInput && (
          <div
            className="mt-1 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 flex items-center justify-between gap-3"
            onClick={(e) => e.preventDefault()} // cegah Link navigate saat area ini diklik
          >
            <div className="flex items-center gap-2">
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
                Masukkan rekening tujuan refund
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                router.push(`/refund/${refundData.id}`);
              }}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-1.5 text-[11px] font-semibold text-white active:scale-95 transition"
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
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              Input Rekening
            </button>
          </div>
        )}

        {/* ── Detail rekening (expandable) ── */}
        {!isPendingInput && activeRefund && (
          <>
            {activeRefund.transferred_at && (
              <div className="flex items-center gap-2 mb-2.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
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

            {/* Tombol expand detail rekening — cegah Link navigate */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setExpanded((v) => !v);
              }}
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
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                Detail rekening
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

            {/* Proof files */}
            {(statusCfg.key === "transferred" ||
              statusCfg.key === "accepted") &&
              activeRefund.proofs &&
              activeRefund.proofs.length > 0 && (
                <div
                  className="mt-2 space-y-1"
                  onClick={(e) => e.preventDefault()}
                >
                  {activeRefund.proofs.map((proof: RefundProof) => {
                    const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(
                      proof.file_url,
                    );
                    return (
                      <Link
                        key={proof.id}
                        href={toStaticUrl(proof.file_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 active:scale-[0.99] transition"
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
                      </Link>
                    );
                  })}
                </div>
              )}
          </>
        )}

        {/* Chevron indicator navigasi */}
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
// ─── PengembalianTab ──────────────────────────────────────────────────────────

export function PengembalianTab() {
  const [activeStatus, setActiveStatus] = useState<RefundStatus>("requested");
  const [allData, setAllData] = useState<RefundData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const activeCfg = REFUND_STATUS_TABS.find((t) => t.key === activeStatus)!;

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    // tab requested = fetch semua (kosong + requested), tab lain filter by status
    const statusParam = activeStatus === "requested" ? "" : activeStatus;

    getMyRefund({ token, status: statusParam, page, limit: 10 })
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        // untuk tab requested, filter hanya yang kosong ATAU status requested
        const filtered =
          activeStatus === "requested"
            ? list.filter(
                (d) =>
                  !d.refunds ||
                  d.refunds.length === 0 ||
                  d.refunds.some((r) => r.status === "requested"),
              )
            : list;
        setAllData(filtered);
        setHasMore(list.length === 10);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Gagal memuat data pengembalian.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeStatus, page]);

  const handleChangeStatus = (key: RefundStatus) => {
    setActiveStatus(key);
    setPage(1);
    setAllData([]);
  };

  return (
    <div>
      {/* ── Status chips ── */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex gap-2 flex-1 justify-center overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
          {REFUND_STATUS_TABS.map((tab) => {
            const isActive = activeStatus === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleChangeStatus(tab.key)}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2 text-[11px] font-semibold border transition-all active:scale-[0.96] shrink-0 ${
                  isActive
                    ? "bg-stone-900 border-stone-900 text-white shadow-sm shadow-stone-900/20"
                    : "bg-white border-stone-200 text-stone-600"
                }`}
              >
                <span className={isActive ? "text-white" : tab.text}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            );
          })}
        </div>
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
      {!loading && !error && allData.length === 0 && (
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
                d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-barlow-bold font-semibold text-stone-700 text-sm">
              Tidak ada pengembalian
            </p>
            <p className="text-xs text-stone-400 mt-1 leading-relaxed">
              {activeCfg.emptyMsg}
            </p>
          </div>
        </div>
      )}

      {/* ── List ── */}
      {!loading && !error && allData.length > 0 && (
        <>
          <div className="space-y-3 mb-5">
            {allData.map((item) => (
              <RefundCard
                key={item.id}
                refundData={item}
                statusCfg={activeCfg}
              />
            ))}
          </div>

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
