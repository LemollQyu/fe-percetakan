"use client";

import { useEffect, useRef, useState } from "react";
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
import { formatDuration } from "@/app/helper/formatDuration";

// ─── Status config ────────────────────────────────────────────────────────────

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
    >
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
      {!loading && !error && proof && (
        <div className="space-y-3">
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
          <div className="space-y-1.5">
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
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-[11px] text-stone-400">Dikirim pada</span>
              <span className="text-[12px] font-semibold text-stone-800">
                {formatDate(proof.uploaded_at)}
              </span>
            </div>
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showCancelPaymentConfirm, setShowCancelPaymentConfirm] =
    useState(false);
  const [cancellingPayment, setCancellingPayment] = useState(false);
  const [cancelPaymentError, setCancelPaymentError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!code) return;
    const token = getToken();
    setLoading(true);
    setError(null);
    getOrderByCode({ code, token: token ?? undefined })
      .then((res) => {
        setOrder(res.data);
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

  // ── Kondisi timer ──
  const isOnProgress = order.status.toLowerCase() === "on_progress";

  return (
    <main className="flex-1 w-full max-w-[430px] mx-auto px-4 py-6 pb-28">
      {/* Back + Header */}
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
        {/* Info Order */}
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
            <div className="mt-3 flex items-center justify-between rounded-xl bg-stone-900 px-4 py-3">
              <span className="text-[12px] text-stone-400">
                Total Pembayaran
              </span>
              <span className="font-barlow-bold text-sm font-bold text-white">
                {formatRupiah(order.total_price_snapshot)}
              </span>
            </div>
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
                {order.status === "On_progress" && (
                  <span className="text-[11px] text-amber-700 font-medium">
                    Estimasi : {formatDuration(order.estimated_duration)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Timeline Status */}
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
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${isCurrent ? `${stepCfg.dot} border-transparent` : isDone ? "bg-stone-900 border-stone-900" : "bg-white border-stone-200"}`}
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
                    <div className={`pb-4 ${isLast ? "" : ""}`}>
                      <p
                        className={`text-[13px] font-semibold ${isCurrent ? statusCfg.text : isDone ? "text-stone-900" : "text-stone-300"}`}
                      >
                        {step.label}
                      </p>
                      <p
                        className={`text-[11px] mt-0.5 ${isCurrent ? "text-stone-500" : isDone ? "text-stone-400" : "text-stone-200"}`}
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

        {/* Spesifikasi */}
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            }
          >
            <div className="space-y-2">
              {order.order_spesifications.map((spec) => (
                <div
                  key={spec.id}
                  className="flex items-center justify-between rounded-xl bg-stone-50 border border-stone-100 px-3 py-2.5"
                >
                  <span className="text-[11px] text-stone-500">
                    {spec.spesification_name_snapshot}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-stone-800">
                      {spec.value_snapshot}
                    </span>
                    {spec.additional_price_snapshot > 0 && (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 rounded-lg px-2 py-0.5 font-semibold">
                        +{formatRupiah(spec.additional_price_snapshot)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* File Order */}
        {fileUrl && (
          <Section
            title="File Order"
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
              <div
                className="relative w-full rounded-2xl overflow-hidden bg-stone-100 cursor-pointer active:scale-[0.99] transition"
                style={{ aspectRatio: "4/3" }}
                onClick={() => setPreviewOpen(true)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={toStaticUrl(fileUrl)}
                  alt="File order"
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
                  <p className="text-[12px] font-semibold text-stone-800 truncate">
                    {fileUrl.split("/").pop()}
                  </p>
                  <p className="text-[10px] text-stone-400 uppercase font-semibold mt-0.5">
                    {ft.replace(".", "")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
              </div>
            )}
            {previewOpen && (
              <FilePreviewModal
                url={fileUrl}
                fileType={ft}
                onClose={() => setPreviewOpen(false)}
              />
            )}
          </Section>
        )}

        {/* Bukti Pembayaran */}
        {showPaymentProof && payment && (
          <PaymentProofSection paymentID={payment.id} />
        )}

        {/* CTA: Waiting Payment */}
        {isWaitingPayment && payment?.payment_codes?.[0] && (
          <>
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
                          Batalkan Pembayaran?
                        </p>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          Tindakan ini tidak dapat dibatalkan
                        </p>
                      </div>
                    </div>
                    {cancelPaymentError && (
                      <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 mb-3">
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
                        Tidak
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
                        {cancellingPayment ? "Memproses..." : "Ya, Batalkan"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-6 pt-3 bg-gradient-to-t from-stone-50 via-stone-50/95 to-transparent pointer-events-none z-40">
              <div className="flex gap-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setShowCancelPaymentConfirm(true)}
                  className="h-[56px] px-5 rounded-2xl border border-stone-200 bg-white text-stone-700 text-[13px] font-bold active:scale-[0.98] transition shadow-sm"
                >
                  Batal
                </button>
                <Link
                  href={`/payment/${payment.payment_codes[0].code}`}
                  className="flex-1 h-[56px] rounded-2xl bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-between px-5 active:scale-[0.98] transition-all shadow-xl shadow-amber-500/25"
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

        {/* CTA: Finished */}
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
