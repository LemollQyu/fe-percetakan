"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { getOrderByCode } from "@/api/order";
import type { OrderByCode } from "@/api/order";
import { getPaymentByOrderId, cancelPayment } from "@/api/payment";
import { completedOrder } from "@/api/order";
import type { PaymentInner } from "@/api/payment";
import { deleteOrderNotFile } from "@/api/order";
import { getPaymentProof } from "@/api/payment";
import type { PaymentProof } from "@/api/payment";
import { toStaticUrl } from "@/app/helper/normalizeUrl";
import Link from "next/link";

// ─── Status config ────────────────────────────────────────────────────────────

// Status yang sudah pasti ada bukti pembayaran
const STATUS_WITH_PROOF: StatusKey[] = [
  "paid",
  "on_progress",
  "finished",
  "completed",
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
  {
    label: string;
    dot: string;
    bar: string;
    badge: string;
    text: string;
    step: number;
  }
> = {
  created: {
    label: "Created",
    dot: "bg-sky-400",
    bar: "bg-sky-400",
    badge: "bg-sky-50 border-sky-200",
    text: "text-sky-700",
    step: 1,
  },
  waiting_payment: {
    label: "Menunggu Bayar",
    dot: "bg-amber-400",
    bar: "bg-amber-400",
    badge: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    step: 2,
  },
  paid: {
    label: "Dibayar",
    dot: "bg-lime-500",
    bar: "bg-lime-500",
    badge: "bg-lime-50 border-lime-200",
    text: "text-lime-700",
    step: 3,
  },
  on_progress: {
    label: "Diproses",
    dot: "bg-blue-500",
    bar: "bg-blue-500",
    badge: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    step: 4,
  },
  finished: {
    label: "Selesai",
    dot: "bg-violet-500",
    bar: "bg-violet-500",
    badge: "bg-violet-50 border-violet-200",
    text: "text-violet-700",
    step: 5,
  },
  completed: {
    label: "Completed",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    badge: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    step: 6,
  },
  cancelled: {
    label: "Dibatalkan",
    dot: "bg-red-400",
    bar: "bg-red-400",
    badge: "bg-red-50 border-red-200",
    text: "text-red-600",
    step: 0,
  },
  expired: {
    label: "Expired",
    dot: "bg-stone-400",
    bar: "bg-stone-300",
    badge: "bg-stone-100 border-stone-200",
    text: "text-stone-500",
    step: 0,
  },
};

function getStatusConfig(rawStatus: string) {
  const key = rawStatus.toLowerCase().replace(/\s+/g, "_") as StatusKey;
  return (
    STATUS_CONFIG[key] ?? {
      label: rawStatus,
      dot: "bg-stone-400",
      bar: "bg-stone-300",
      badge: "bg-stone-100 border-stone-200",
      text: "text-stone-600",
      step: 0,
    }
  );
}

// ─── Timeline steps ───────────────────────────────────────────────────────────

const TIMELINE_STEPS: { key: StatusKey; label: string; desc: string }[] = [
  { key: "created", label: "Order Dibuat", desc: "Pesanan berhasil dibuat" },
  {
    key: "waiting_payment",
    label: "Menunggu Bayar",
    desc: "Menunggu konfirmasi pembayaran",
  },
  {
    key: "paid",
    label: "Pembayaran Diterima",
    desc: "Pembayaran telah dikonfirmasi",
  },
  {
    key: "on_progress",
    label: "Sedang Diproses",
    desc: "Pesanan sedang dikerjakan",
  },
  {
    key: "finished",
    label: "Selesai",
    desc: "Pesanan telah selesai dikerjakan",
  },
  { key: "completed", label: "Completed", desc: "Pesanan selesai & diterima" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
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
        style={{ maxHeight: "90dvh" }}
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
          style={{ maxHeight: "calc(90dvh - 90px)" }}
        >
          {isPdf && (
            <iframe
              src={fullUrl}
              title="Preview"
              className="w-full border-0"
              style={{ height: "calc(90dvh - 90px)" }}
            />
          )}
          {isImage && (
            <div className="p-4 flex items-center justify-center bg-stone-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fullUrl}
                alt="Preview"
                className="max-w-full rounded-2xl object-contain"
                style={{ maxHeight: "calc(90dvh - 140px)" }}
              />
            </div>
          )}
          {!isPdf && !isImage && (
            <div className="flex flex-col items-center justify-center gap-3 py-14 px-4">
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

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] bg-white border border-stone-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-stone-100">
        <span className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 shrink-0">
          {icon}
        </span>
        <p className="font-barlow-bold text-sm font-bold text-stone-900">
          {title}
        </p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function PaymentProofSection({ paymentID }: { paymentID: number }) {
  const [proof, setProof] = useState<PaymentProof | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token || !paymentID) return;
    setLoading(true);
    setError(null);
    getPaymentProof({ paymentID, token })
      .then((res) => setProof(res.data))
      .catch(() => setError("Gagal memuat bukti pembayaran."))
      .finally(() => setLoading(false));
  }, [paymentID]);

  const isImage = proof?.proof_url
    ? /\.(png|jpe?g|gif|webp|svg)$/i.test(proof.proof_url)
    : false;
  const fullUrl = proof?.proof_url ? toStaticUrl(proof.proof_url) : "";
  const fileExt = proof?.proof_url
    ? (proof.proof_url.split(".").pop()?.toUpperCase() ?? "FILE")
    : "FILE";

  return (
    <Section
      title="Bukti Pembayaran"
      icon={
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
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      }
      // badge={
      //   proof?.proof_url ? (
      //     <a
      //       href={fullUrl}
      //       download
      //       className="inline-flex items-center gap-1 rounded-xl bg-stone-100 border border-stone-200 px-2.5 py-1 text-[11px] font-semibold text-stone-700 active:scale-95 transition hover:bg-stone-200"
      //     >
      //       <svg
      //         className="w-3 h-3"
      //         fill="none"
      //         stroke="currentColor"
      //         viewBox="0 0 24 24"
      //       >
      //         <path
      //           strokeLinecap="round"
      //           strokeLinejoin="round"
      //           strokeWidth={2}
      //           d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      //         />
      //       </svg>
      //       Download
      //     </a>
      //   ) : undefined
      // }
    >
      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          <div
            className="w-full rounded-2xl bg-stone-100"
            style={{ aspectRatio: "16/9" }}
          />
          <div className="h-3 bg-stone-100 rounded-lg w-2/3" />
          <div className="h-3 bg-stone-100 rounded-lg w-1/2" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5">
          <svg
            className="w-3.5 h-3.5 text-red-400 shrink-0"
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
          <p className="text-[11px] text-red-600">{error}</p>
        </div>
      )}

      {/* Data bukti */}
      {!loading && !error && proof && (
        <div className="space-y-3">
          {/* Gambar bukti */}
          {isImage ? (
            <div
              className="relative w-full rounded-2xl overflow-hidden bg-stone-100 cursor-pointer active:scale-[0.99] transition"
              style={{ aspectRatio: "4/3" }}
              onClick={() => setPreviewOpen(true)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fullUrl}
                alt="Bukti pembayaran"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-stone-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            // Non-image file
            <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
              <div className="w-10 h-10 rounded-xl bg-stone-200 flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 text-stone-600"
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
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-stone-800">
                  Bukti pembayaran
                </p>
                <p className="text-[10px] text-stone-400 uppercase font-semibold mt-0.5">
                  {fileExt}
                </p>
              </div>
              <a
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
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
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          )}

          {/* Meta info */}
          <div className="space-y-1.5">
            {/* Catatan user */}
            {proof.note && (
              <div className="flex items-start gap-2 bg-stone-50 rounded-xl px-3 py-2.5 border border-stone-100">
                <svg
                  className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0"
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
                  {proof.note}
                </p>
              </div>
            )}

            {/* Waktu upload */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-[11px] text-stone-400">Dikirim pada</span>
              <span className="text-[12px] font-semibold text-stone-800">
                {formatDate(proof.uploaded_at)}
              </span>
            </div>

            {/* Waktu verifikasi */}
            {proof.verified_at && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-[11px] text-emerald-600">
                  Diverifikasi pada
                </span>
                <span className="text-[12px] font-semibold text-emerald-700">
                  {formatDate(proof.verified_at)}
                </span>
              </div>
            )}
          </div>

          {/* Tombol lihat penuh (hanya gambar) */}
          {isImage && (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-stone-50 border border-stone-200 py-2 text-[12px] font-semibold text-stone-600 active:scale-[0.99] transition"
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Lihat ukuran penuh
            </button>
          )}
        </div>
      )}

      {/* Tidak ada bukti */}
      {!loading && !error && !proof && (
        <div className="flex flex-col items-center justify-center py-6 gap-2 text-stone-400">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-[12px]">Bukti pembayaran tidak tersedia.</p>
        </div>
      )}

      {/* Preview modal */}
      {previewOpen && proof?.proof_url && (
        <FilePreviewModal
          url={proof.proof_url}
          fileType={`.${fileExt.toLowerCase()}`}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </Section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;

  const [order, setOrder] = useState<OrderByCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [payment, setPayment] = useState<PaymentInner | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showCompletedConfirm, setShowCompletedConfirm] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    const token = getToken();

    setLoading(true);
    setError(null);

    getOrderByCode({ code, token: token ?? undefined })
      .then((res) => {
        setOrder(res.data);

        // Fetch payment kalau status bukan created
        if (res.data.status.toLowerCase() !== "created") {
          const t = getToken();
          if (t) {
            setPaymentLoading(true);
            getPaymentByOrderId({ order_id: res.data.id, token: t })
              .then((p) => setPayment(p.data))
              .catch(() => setPayment(null))
              .finally(() => setPaymentLoading(false));
          }
        }
      })
      .catch((err: unknown) =>
        setError(
          err instanceof Error ? err.message : "Gagal memuat detail order.",
        ),
      )
      .finally(() => setLoading(false));
  }, [code]);

  const showPaymentProof = STATUS_WITH_PROOF.includes(
    order?.status.toLowerCase() as StatusKey,
  );

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [showCancelPaymentConfirm, setShowCancelPaymentConfirm] =
    useState(false);
  const [cancellingPayment, setCancellingPayment] = useState(false);
  const [cancelPaymentError, setCancelPaymentError] = useState<string | null>(
    null,
  );

  async function handleCompleteOrder() {
    const token = getToken();
    if (!token || !order) return;
    setCompleting(true);
    setCompleteError(null);
    try {
      await completedOrder({ code: order.order_code?.code ?? "", token });
      router.replace("/riwayat-order");
    } catch (e) {
      setCompleteError(
        e instanceof Error ? e.message : "Gagal menyelesaikan order.",
      );
      setCompleting(false);
    }
  }

  async function handleDeleteOrder() {
    const token = getToken();
    if (!token || !order) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteOrderNotFile({ code: order.order_code?.code ?? "", token });
      router.replace("/riwayat-order");
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : "Gagal membatalkan order.",
      );
      setDeleting(false);
    }
  }

  async function handleCancelPayment() {
    const token = getToken();
    if (!token || !payment) return;
    setCancellingPayment(true);
    setCancelPaymentError(null);
    try {
      await cancelPayment({
        payment_code: payment.payment_codes?.[0]?.code ?? "",
        token,
      });
      router.replace("/riwayat-order");
    } catch (e) {
      setCancelPaymentError(
        e instanceof Error ? e.message : "Gagal membatalkan pembayaran.",
      );
      setCancellingPayment(false);
    }
  }
  // ── Loading ──
  if (loading) {
    return (
      <main className="flex-1 w-full max-w-[430px] mx-auto px-4 py-6 pb-28">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-stone-100 animate-pulse" />
          <div className="h-5 bg-stone-100 rounded-lg w-32 animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[20px] border border-stone-100 bg-white overflow-hidden animate-pulse"
            >
              <div className="h-[3px] w-full bg-stone-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-stone-100 rounded-lg w-3/4" />
                <div className="h-3 bg-stone-100 rounded-lg w-1/2" />
                <div className="flex gap-2">
                  <div className="h-7 bg-stone-100 rounded-xl w-24" />
                  <div className="h-7 bg-stone-100 rounded-xl w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  // ── Error ──
  if (error || !order) {
    return (
      <main className="flex-1 w-full max-w-[430px] mx-auto px-4 py-6 pb-28">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6 text-stone-600 active:scale-95 transition"
        >
          <svg
            className="w-5 h-5"
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
          <span className="text-sm font-semibold">Kembali</span>
        </button>
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm font-semibold text-stone-700">
            Order tidak ditemukan
          </p>
          <p className="text-xs text-stone-400 text-center">
            {error ?? "Kode order tidak valid atau sudah tidak tersedia."}
          </p>
        </div>
      </main>
    );
  }

  const statusCfg = getStatusConfig(order.status);
  const isCancelledOrExpired = ["cancelled", "expired"].includes(
    order.status.toLowerCase(),
  );
  const fileUrl = order.order_file?.file_url ?? null;
  const ft = order.order_file?.file_type ?? ".pdf";
  const isImageFile = /\.(png|jpe?g|gif|webp|svg)$/i.test(ft);
  const hasPayment = order.status.toLowerCase() !== "created";

  const isCreated = order.status.toLowerCase() === "created";
  const isWaitingPayment = order.status.toLowerCase() === "waiting_payment";
  const isFinished = order.status.toLowerCase() === "finished";

  return (
    <main className="flex-1 w-full max-w-[430px] mx-auto px-4 py-6 pb-28">
      {/* ── Back + Header ── */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 mb-4 text-stone-500 active:scale-95 transition -ml-1"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-[13px] font-semibold">Kembali</span>
        </button>

        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-barlow-bold text-xl font-bold text-stone-900 leading-tight">
              Detail Order
            </h1>
            <p className="text-[12px] text-stone-400 font-mono mt-0.5">
              {order.order_code?.code}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold border shrink-0 ${statusCfg.badge} ${statusCfg.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* ── Info Order ── */}
        <div className="rounded-[20px] bg-white border border-stone-100 shadow-sm overflow-hidden">
          <div className={`h-[3px] w-full ${statusCfg.bar}`} />
          <div className="p-4">
            <p className="font-barlow-bold text-[16px] font-bold text-stone-900 mb-1">
              {order.service_name_snapshot}
            </p>
            <div className="flex gap-2 flex-wrap mt-3">
              <div className="flex items-center gap-1.5 rounded-xl bg-stone-50 border border-stone-100 px-3 py-1.5">
                <span className="text-[10px] text-stone-400">Harga Dasar</span>
                <span className="font-barlow-bold text-xs font-bold text-stone-900">
                  {formatRupiah(order.base_price_snapshot)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-stone-50 border border-stone-100 px-3 py-1.5">
                <span className="text-[10px] text-stone-400">Qty</span>
                <span className="font-barlow-bold text-xs font-bold text-stone-900">
                  {order.quantity}×
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
                  {formatDateShort(order.created_at)}
                </span>
              </div>
            </div>

            {/* Total */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-stone-900 px-4 py-3">
              <span className="text-[12px] text-stone-400">
                Total Pembayaran
              </span>
              <span className="font-barlow-bold text-sm font-bold text-white">
                {formatRupiah(order.total_price_snapshot)}
              </span>
            </div>

            {/* User note */}
            {order.user_note && (
              <div className="mt-3 flex items-start gap-2 bg-stone-50 rounded-xl px-3 py-2.5 border border-stone-100">
                <svg
                  className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0"
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
                  {order.user_note}
                </p>
              </div>
            )}

            {/* Expired at */}
            {order.order_code?.expired_at && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
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
                  Berlaku hingga: {formatDate(order.order_code.expired_at)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Timeline Status ── */}
        {!isCancelledOrExpired && (
          <Section
            title="Status Pesanan"
            icon={
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            }
          >
            <div className="space-y-0">
              {TIMELINE_STEPS.map((step, idx) => {
                const stepCfg = STATUS_CONFIG[step.key];
                const currentStep = statusCfg.step;
                const isDone = currentStep >= stepCfg.step;
                const isCurrent = currentStep === stepCfg.step;
                const isLast = idx === TIMELINE_STEPS.length - 1;

                return (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                          isCurrent
                            ? `${stepCfg.dot} border-transparent`
                            : isDone
                              ? "bg-stone-900 border-stone-900"
                              : "bg-white border-stone-200"
                        }`}
                      >
                        {isDone && !isCurrent ? (
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : isCurrent ? (
                          <span className="w-2 h-2 rounded-full bg-white" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-stone-200" />
                        )}
                      </div>
                      {!isLast && (
                        <div
                          className={`w-0.5 flex-1 my-1 min-h-[20px] ${isDone && currentStep > stepCfg.step ? "bg-stone-900" : "bg-stone-100"}`}
                        />
                      )}
                    </div>

                    <div className={`pb-4 flex-1 ${isLast ? "pb-0" : ""}`}>
                      <p
                        className={`text-[13px] font-semibold leading-tight ${isCurrent ? statusCfg.text : isDone ? "text-stone-900" : "text-stone-400"}`}
                      >
                        {step.label}
                        {isCurrent && (
                          <span
                            className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${statusCfg.badge} ${statusCfg.text}`}
                          >
                            Sekarang
                          </span>
                        )}
                      </p>
                      <p
                        className={`text-[11px] mt-0.5 ${isDone ? "text-stone-500" : "text-stone-300"}`}
                      >
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Cancelled / Expired notice */}
        {isCancelledOrExpired && (
          <div
            className={`rounded-[20px] border p-4 flex items-center gap-3 ${
              order.status.toLowerCase() === "cancelled"
                ? "bg-red-50 border-red-100"
                : "bg-stone-50 border-stone-200"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                order.status.toLowerCase() === "cancelled"
                  ? "bg-red-100"
                  : "bg-stone-100"
              }`}
            >
              <svg
                className={`w-5 h-5 ${order.status.toLowerCase() === "cancelled" ? "text-red-400" : "text-stone-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d={
                    order.status.toLowerCase() === "cancelled"
                      ? "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  }
                />
              </svg>
            </div>
            <div>
              <p
                className={`text-sm font-semibold ${order.status.toLowerCase() === "cancelled" ? "text-red-700" : "text-stone-700"}`}
              >
                Pesanan{" "}
                {order.status.toLowerCase() === "cancelled"
                  ? "Dibatalkan"
                  : "Expired"}
              </p>
              <p
                className={`text-xs mt-0.5 ${order.status.toLowerCase() === "cancelled" ? "text-red-500" : "text-stone-500"}`}
              >
                {order.status.toLowerCase() === "cancelled"
                  ? "Pesanan ini telah dibatalkan."
                  : "Batas waktu pembayaran telah habis."}
              </p>
            </div>
          </div>
        )}

        {/* ── Spesifikasi ── */}
        {order.order_spesifications?.length > 0 && (
          <Section
            title="Spesifikasi"
            icon={
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            }
          >
            <div className="space-y-2">
              {order.order_spesifications.map((spec) => (
                <div
                  key={spec.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-stone-50 border border-stone-100"
                >
                  <span className="text-[12px] text-stone-500">
                    {spec.spesification_name_snapshot}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[12px] font-semibold text-stone-900">
                      {spec.value_snapshot === "true"
                        ? "Ya"
                        : spec.value_snapshot === "false"
                          ? "Tidak"
                          : spec.value_snapshot}
                    </span>
                    {spec.additional_price_snapshot > 0 && (
                      <span className="text-[10px] text-stone-400 bg-stone-100 rounded-lg px-1.5 py-0.5">
                        +{formatRupiah(spec.additional_price_snapshot)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Bukti Pembayaran ── */}
        {showPaymentProof && payment && (
          <PaymentProofSection paymentID={payment.id} />
        )}

        {/* ── Informasi Pembayaran ── */}
        {hasPayment && (
          <Section
            title="Informasi Pembayaran"
            icon={
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
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            }
          >
            {paymentLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-8 bg-stone-100 rounded-xl w-full" />
                <div className="h-8 bg-stone-100 rounded-xl w-full" />
                <div className="h-8 bg-stone-100 rounded-xl w-full" />
              </div>
            ) : payment ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[11px] text-stone-400">
                    Kode Pembayaran
                  </span>
                  <span className="text-[12px] font-mono font-semibold text-stone-800">
                    {payment.payment_codes?.[0]?.code ?? "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[11px] text-stone-400">Metode</span>
                  <span className="text-[12px] font-semibold text-stone-800">
                    {payment.payment_method}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[11px] text-stone-400">Total</span>
                  <span className="text-[12px] font-semibold text-stone-800">
                    {formatRupiah(payment.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[11px] text-stone-400">
                    Status Bayar
                  </span>
                  <span
                    className={`text-[12px] font-semibold ${
                      payment.status.toLowerCase() === "paid"
                        ? "text-emerald-600"
                        : payment.status.toLowerCase() === "expired"
                          ? "text-stone-400"
                          : payment.status.toLowerCase() === "cancelled"
                            ? "text-red-500"
                            : "text-amber-600"
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[11px] text-stone-400">
                    Berlaku Hingga
                  </span>
                  <span className="text-[12px] font-semibold text-stone-800">
                    {payment.payment_codes?.[0]?.expired_at
                      ? formatDate(payment.payment_codes[0].expired_at)
                      : "-"}
                  </span>
                </div>
                {payment.paid_at && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="text-[11px] text-emerald-600">
                      Dibayar Pada
                    </span>
                    <span className="text-[12px] font-semibold text-emerald-700">
                      {formatDate(payment.paid_at)}
                    </span>
                  </div>
                )}
                {payment.approved_at && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="text-[11px] text-emerald-600">
                      Dikonfirmasi Pada
                    </span>
                    <span className="text-[12px] font-semibold text-emerald-700">
                      {formatDate(payment.approved_at)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[12px] text-stone-400 text-center py-2">
                Data pembayaran tidak tersedia.
              </p>
            )}
          </Section>
        )}

        {/* ── File / Dokumen ── */}
        {fileUrl && (
          <Section
            title="File Terlampir"
            icon={
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
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            }
          >
            {isImageFile ? (
              <div className="space-y-2">
                <div
                  className="relative w-full rounded-2xl overflow-hidden bg-stone-100 cursor-pointer active:scale-[0.99] transition"
                  style={{ aspectRatio: "16/9" }}
                  onClick={() => setPreviewOpen(true)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={toStaticUrl(fileUrl)}
                    alt="File order"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-stone-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-stone-50 border border-stone-200 py-2 text-[12px] font-semibold text-stone-600 active:scale-[0.99] transition"
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  Lihat ukuran penuh
                </button>
                {previewOpen && (
                  <FilePreviewModal
                    url={fileUrl}
                    fileType={ft}
                    onClose={() => setPreviewOpen(false)}
                  />
                )}
              </div>
            ) : (
              <a
                href={toStaticUrl(fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100 active:scale-[0.99] transition"
              >
                <div className="w-10 h-10 rounded-xl bg-stone-200 flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-stone-600"
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
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-stone-800">
                    Dokumen terlampir
                  </p>
                  <p className="text-[10px] text-stone-400 uppercase font-semibold mt-0.5">
                    {ft}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-stone-400 shrink-0"
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
          </Section>
        )}

        {/* ── Info User ── */}
        {order.user && (
          <Section
            title="Informasi Pemesan"
            icon={
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            }
          >
            <div className="flex items-center gap-3 mb-3">
              {order.user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={toStaticUrl(order.user.avatar_url)}
                  alt={order.user.name}
                  className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0 border border-stone-200">
                  <svg
                    className="w-5 h-5 text-stone-400"
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
              <div className="min-w-0">
                <p className="font-barlow-bold text-sm font-bold text-stone-900 truncate">
                  {order.user.name}
                </p>
                <p className="text-[11px] text-stone-400 truncate">
                  {order.user.email}
                </p>
              </div>
            </div>
            {order.user.phone && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
                <svg
                  className="w-3.5 h-3.5 text-stone-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className="text-[12px] text-stone-600">
                  {order.user.phone}
                </span>
              </div>
            )}
          </Section>
        )}

        {/* ── Timestamps ── */}
        <Section
          title="Waktu"
          icon={
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-[11px] text-stone-400">Dibuat</span>
              <span className="text-[12px] font-semibold text-stone-800">
                {formatDate(order.created_at)}
              </span>
            </div>
          </div>
        </Section>

        {/* ── CTA Buttons ── */}
        {isCreated && (
          <>
            {/* Delete confirm modal */}
            {showDeleteConfirm && (
              <div
                className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
                onClick={() => !deleting && setShowDeleteConfirm(false)}
              >
                <div
                  className="w-full max-w-[430px] bg-white rounded-t-[28px] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="w-9 h-1 rounded-full bg-stone-200" />
                  </div>
                  <div className="px-5 pt-4 pb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                        <svg
                          className="w-5 h-5 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-barlow-bold text-[15px] font-bold text-stone-900">
                          Batalkan Order
                        </p>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          Tindakan ini tidak dapat dibatalkan
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 mb-5">
                      <p className="text-[13px] text-red-700 font-semibold">
                        Yakin ingin menghapus order ini?
                      </p>
                      <p className="text-[11px] text-red-500 mt-1">
                        Order{" "}
                        <span className="font-mono font-bold">
                          {order?.order_code?.code}
                        </span>{" "}
                        akan dihapus permanen.
                      </p>
                    </div>

                    {deleteError && (
                      <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 mb-3">
                        <svg
                          className="w-3.5 h-3.5 text-red-400 shrink-0"
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
                        <p className="text-[11px] text-red-600">
                          {deleteError}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteError(null);
                        }}
                        disabled={deleting}
                        className="flex-1 h-[48px] rounded-2xl border border-stone-200 bg-white text-[13px] font-bold text-stone-700 active:scale-[0.98] transition disabled:opacity-50"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteOrder}
                        disabled={deleting}
                        className="flex-1 h-[48px] rounded-2xl bg-red-500 text-[13px] font-bold text-white active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {deleting && (
                          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        )}
                        {deleting ? "Menghapus..." : "Ya, Hapus"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom CTA bar */}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-6 pt-3 bg-gradient-to-t from-stone-50 via-stone-50/95 to-transparent pointer-events-none z-40">
              <div className="flex gap-2">
                {/* Tombol batalkan — hanya muncul kalau belum ada file */}
                {!fileUrl && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="pointer-events-auto w-[56px] h-[56px] rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0 active:scale-[0.97] transition"
                  >
                    <svg
                      className="w-5 h-5 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}

                {/* Tombol selesaikan order */}
                <Link
                  href={`/my-order/${order.service_name_snapshot}/${order.order_code?.code}`}
                  className="pointer-events-auto flex-1 h-[56px] rounded-2xl bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-between px-5 active:scale-[0.98] transition-all shadow-xl shadow-stone-900/25"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-white"
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
                    <span className="font-barlow-bold text-[14px] font-bold">
                      Selesaikan Order
                    </span>
                  </div>
                  <svg
                    className="w-4 h-4 text-white/70"
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
                </Link>
              </div>
            </div>
          </>
        )}

        {isWaitingPayment && !paymentLoading && (
          <>
            {/* Cancel payment confirm modal */}
            {showCancelPaymentConfirm && (
              <div
                className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
                onClick={() =>
                  !cancellingPayment && setShowCancelPaymentConfirm(false)
                }
              >
                <div
                  className="w-full max-w-[430px] bg-white rounded-t-[28px] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="w-9 h-1 rounded-full bg-stone-200" />
                  </div>
                  <div className="px-5 pt-4 pb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                        <svg
                          className="w-5 h-5 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-barlow-bold text-[15px] font-bold text-stone-900">
                          Batalkan Pembayaran
                        </p>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          Tindakan ini tidak dapat dibatalkan
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 mb-5">
                      <p className="text-[13px] text-red-700 font-semibold">
                        Yakin ingin membatalkan pembayaran ini?
                      </p>
                      <p className="text-[11px] text-red-500 mt-1">
                        Pembayaran{" "}
                        <span className="font-mono font-bold">
                          {payment?.payment_codes?.[0]?.code ?? "-"}
                        </span>{" "}
                        akan dibatalkan permanen.
                      </p>
                    </div>

                    {cancelPaymentError && (
                      <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 mb-3">
                        <svg
                          className="w-3.5 h-3.5 text-red-400 shrink-0"
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
                        <p className="text-[11px] text-red-600">
                          {cancelPaymentError}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCancelPaymentConfirm(false);
                          setCancelPaymentError(null);
                        }}
                        disabled={cancellingPayment}
                        className="flex-1 h-[48px] rounded-2xl border border-stone-200 bg-white text-[13px] font-bold text-stone-700 active:scale-[0.98] transition disabled:opacity-50"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelPayment}
                        disabled={cancellingPayment}
                        className="flex-1 h-[48px] rounded-2xl bg-red-500 text-[13px] font-bold text-white active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {cancellingPayment && (
                          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        )}
                        {cancellingPayment ? "Membatalkan..." : "Ya, Batalkan"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom CTA bar */}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-6 pt-3 bg-gradient-to-t from-stone-50 via-stone-50/95 to-transparent pointer-events-none z-40">
              <div className="flex gap-2">
                {/* Tombol batalkan pembayaran */}
                <button
                  type="button"
                  onClick={() => setShowCancelPaymentConfirm(true)}
                  className="pointer-events-auto w-[56px] h-[56px] rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0 active:scale-[0.97] transition"
                >
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                {/* Tombol selesaikan pembayaran */}
                <Link
                  href={
                    payment?.payment_codes?.[0]?.code
                      ? `/payment/${payment.payment_codes[0].code}`
                      : `/payment`
                  }
                  className="pointer-events-auto flex-1 h-[56px] rounded-2xl bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-between px-5 active:scale-[0.98] transition-all shadow-xl shadow-amber-500/25"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    <span className="font-barlow-bold text-[14px] font-bold">
                      Selesaikan Pembayaran
                    </span>
                  </div>
                  <svg
                    className="w-4 h-4 text-white/70"
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
                </Link>
              </div>
            </div>
          </>
        )}
        {isFinished && (
          <>
            {showCompletedConfirm && (
              <div
                className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
                onClick={() => !completing && setShowCompletedConfirm(false)}
              >
                <div
                  className="w-full max-w-[430px] bg-white rounded-t-[28px] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="w-9 h-1 rounded-full bg-stone-200" />
                  </div>
                  <div className="px-5 pt-4 pb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                        <svg
                          className="w-5 h-5 text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-barlow-bold text-[15px] font-bold text-stone-900">
                          Konfirmasi Pesanan Diterima
                        </p>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          Pastikan pesanan sudah kamu terima
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 mb-5">
                      <p className="text-[13px] text-emerald-700 font-semibold">
                        Tandai pesanan sebagai selesai?
                      </p>
                      <p className="text-[11px] text-emerald-600 mt-1">
                        Order{" "}
                        <span className="font-mono font-bold">
                          {order?.order_code?.code}
                        </span>{" "}
                        akan ditandai completed dan tidak bisa diubah.
                      </p>
                    </div>

                    {completeError && (
                      <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 mb-3">
                        <svg
                          className="w-3.5 h-3.5 text-red-400 shrink-0"
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
                        <p className="text-[11px] text-red-600">
                          {completeError}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCompletedConfirm(false);
                          setCompleteError(null);
                        }}
                        disabled={completing}
                        className="flex-1 h-[48px] rounded-2xl border border-stone-200 bg-white text-[13px] font-bold text-stone-700 active:scale-[0.98] transition disabled:opacity-50"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleCompleteOrder}
                        disabled={completing}
                        className="flex-1 h-[48px] rounded-2xl bg-emerald-500 text-[13px] font-bold text-white active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {completing && (
                          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        )}
                        {completing ? "Memproses..." : "Ya, Sudah Diterima"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-6 pt-3 bg-gradient-to-t from-stone-50 via-stone-50/95 to-transparent pointer-events-none z-40">
              <button
                type="button"
                onClick={() => setShowCompletedConfirm(true)}
                className="pointer-events-auto w-full h-[56px] rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-between px-5 active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/25"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-barlow-bold text-[14px] font-bold">
                    Pesanan Sudah Diterima
                  </span>
                </div>
                <svg
                  className="w-4 h-4 text-white/70"
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
            </div>
          </>
        )}
      </div>
    </main>
  );
}

// ─── Reusable CTA button ──────────────────────────────────────────────────────

function ButtonAction({
  label,
  href,
  icon,
  variant = "dark",
}: {
  label: string;
  href: string;
  icon: React.ReactNode;
  variant?: "dark" | "amber";
}) {
  const bgClass =
    variant === "amber"
      ? "bg-amber-500 hover:bg-amber-400 shadow-amber-500/25"
      : "bg-stone-900 hover:bg-stone-800 shadow-stone-900/25";

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-6 pt-3 bg-gradient-to-t from-stone-50 via-stone-50/95 to-transparent pointer-events-none z-40">
      <Link
        href={href}
        className={`pointer-events-auto w-full h-[56px] rounded-2xl text-white flex items-center justify-between px-5 active:scale-[0.98] transition-all shadow-xl ${bgClass}`}
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            {icon}
          </svg>
          <span className="font-barlow-bold text-[14px] font-bold">
            {label}
          </span>
        </div>
        <svg
          className="w-4 h-4 text-white/70"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
