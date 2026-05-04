"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { getDetailRefunds, postProofRefund } from "@/api/payment";
import type { RefundData, RefundItem, RefundProof } from "@/api/payment";
import { toStaticUrl } from "@/app/helper/normalizeUrl";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Status config ────────────────────────────────────────────────────────────

type RefundStatus = "requested" | "transferred" | "accepted";

function getRefundStatusCfg(status: string) {
  switch (status) {
    case "requested":
      return {
        label: "Diajukan",
        dot: "bg-amber-400",
        bar: "bg-amber-400",
        badge: "bg-amber-50 border-amber-200",
        text: "text-amber-700",
      };
    case "transferred":
      return {
        label: "Ditransfer",
        dot: "bg-blue-500",
        bar: "bg-blue-500",
        badge: "bg-blue-50 border-blue-200",
        text: "text-blue-700",
      };
    case "accepted":
      return {
        label: "Diterima",
        dot: "bg-violet-500",
        bar: "bg-violet-500",
        badge: "bg-violet-50 border-violet-200",
        text: "text-violet-700",
      };
    default:
      return {
        label: status,
        dot: "bg-stone-400",
        bar: "bg-stone-300",
        badge: "bg-stone-100 border-stone-200",
        text: "text-stone-600",
      };
  }
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

const REFUND_TIMELINE: { key: RefundStatus; label: string; desc: string }[] = [
  {
    key: "requested",
    label: "Pengajuan Diterima",
    desc: "Rekening user sudah diinput",
  },
  {
    key: "transferred",
    label: "Dana Ditransfer",
    desc: "Admin telah upload bukti transfer",
  },
  {
    key: "accepted",
    label: "Dana Diterima",
    desc: "Pengembalian dana selesai",
  },
];

const REFUND_STEP: Record<RefundStatus, number> = {
  requested: 1,
  transferred: 2,
  accepted: 3,
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  badge,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] bg-white border border-stone-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 shrink-0">
            {icon}
          </span>
          <p className="font-barlow-bold text-sm font-bold text-stone-900">
            {title}
          </p>
        </div>
        {badge}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Admin Badge ──────────────────────────────────────────────────────────────

function AdminBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-violet-100 border border-violet-200 px-2 py-0.5 text-[10px] font-bold text-violet-700 uppercase tracking-wide">
      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
      </svg>
      Admin
    </span>
  );
}

// ─── Upload Bukti Modal ───────────────────────────────────────────────────────

function UploadBuktiModal({
  refundId,
  onSuccess,
  onClose,
}: {
  refundId: number;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!file || uploading) return;
    const token = getToken();
    if (!token) return;
    setUploading(true);
    setError(null);
    try {
      await postProofRefund({
        refund_id: refundId,
        file,
        note: note || undefined,
        token,
      });
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal upload bukti transfer.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => !uploading && onClose()}
    >
      <div
        className="w-full max-w-[500px] bg-white rounded-t-[28px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-stone-200" />
        </div>
        <div className="px-5 pt-4 pb-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <div>
              <p className="font-barlow-bold text-[15px] font-bold text-stone-900">
                Upload Bukti Transfer
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Kirim bukti transfer refund ke user
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* File upload area */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider px-1 mb-1.5">
                File Bukti Transfer
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`w-full rounded-2xl border-2 border-dashed cursor-pointer transition ${
                  file
                    ? "border-blue-300 bg-blue-50"
                    : "border-stone-200 bg-stone-50 hover:border-stone-300"
                }`}
              >
                {preview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="preview"
                      className="w-full rounded-2xl object-contain max-h-48"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 rounded-2xl transition" />
                  </div>
                ) : file ? (
                  <div className="flex items-center gap-3 px-4 py-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <svg
                        className="w-5 h-5 text-blue-600"
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
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-stone-800 truncate">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <div className="w-10 h-10 rounded-xl bg-stone-200 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-stone-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                    </div>
                    <p className="text-[12px] font-semibold text-stone-600">
                      Klik untuk pilih file
                    </p>
                    <p className="text-[11px] text-stone-400">
                      JPG, PNG, PDF, dll
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider px-1 mb-1.5">
                Catatan{" "}
                <span className="text-stone-400 normal-case font-normal">
                  (opsional)
                </span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: Transfer BCA 14 Apr 2026"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-[13px] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 focus:bg-white transition"
              />
            </div>

            {/* Error */}
            {error && (
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

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="flex-1 h-[48px] rounded-2xl border border-stone-200 bg-white text-[13px] font-bold text-stone-700 active:scale-[0.98] transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!file || uploading}
                className="flex-1 h-[48px] rounded-2xl bg-blue-600 text-[13px] font-bold text-white active:scale-[0.98] transition disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Mengupload...
                  </>
                ) : (
                  <>
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Upload Bukti
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminRefundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<RefundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchDetail = () => {
    if (!id) return;
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    getDetailRefunds({ token, rejectID: Number(id) })
      .then((res) => setData(res.data))
      .catch((err: unknown) =>
        setError(
          err instanceof Error ? err.message : "Gagal memuat detail refund.",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // ── Loading ──
  if (loading) {
    return (
      <main className="flex-1 w-full max-w-[900px] mx-auto px-4 py-6 pb-28">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-stone-100 animate-pulse" />
          <div className="h-5 bg-stone-100 rounded-lg w-40 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
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
  if (error || !data) {
    return (
      <main className="flex-1 w-full max-w-[900px] mx-auto px-4 py-6">
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
            Data tidak ditemukan
          </p>
          <p className="text-xs text-stone-400 text-center">
            {error ?? "Detail refund tidak tersedia."}
          </p>
        </div>
      </main>
    );
  }

  const isPendingInput = !data.refunds || data.refunds.length === 0;
  const activeRefund: RefundItem | undefined = data.refunds?.[0];
  const statusCfg = getRefundStatusCfg(activeRefund?.status ?? "requested");
  const currentStep =
    REFUND_STEP[(activeRefund?.status ?? "requested") as RefundStatus] ?? 1;

  // Admin bisa upload bukti kalau rekening sudah ada (requested) dan belum transfer
  const canUploadBukti =
    !isPendingInput && activeRefund?.status === "requested";

  const proof: RefundProof | undefined = activeRefund?.proofs?.[0];

  const isImage = proof?.file_url
    ? /\.(png|jpe?g|gif|webp|svg)$/i.test(proof.file_url)
    : false;

  const fullUrl = proof?.file_url ? toStaticUrl(proof.file_url) : "";

  return (
    <main className="flex-1 w-full max-w-[900px] mx-auto px-4 py-6 pb-28">
      {/* ── Header ── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-stone-500 active:scale-95 transition -ml-1"
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
            <span className="text-[13px] font-semibold">Management Refund</span>
          </button>
          <svg
            className="w-3 h-3 text-stone-300"
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
          <span className="text-[13px] text-stone-400 font-mono truncate">
            {data.order_code}
          </span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-barlow-bold text-2xl font-bold text-stone-900 leading-tight">
                Detail Refund
              </h1>
              <AdminBadge />
            </div>
            <p className="text-[12px] text-stone-400 font-mono">
              {data.order_code}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchDetail}
              className="w-9 h-9 rounded-xl border border-stone-200 bg-white flex items-center justify-center active:scale-95 transition hover:bg-stone-50"
              title="Refresh"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold border shrink-0 ${
                isPendingInput
                  ? "bg-stone-100 border-stone-200 text-stone-500"
                  : `${statusCfg.badge} ${statusCfg.text}`
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isPendingInput ? "bg-stone-400" : statusCfg.dot}`}
              />
              {isPendingInput ? "Belum Input Rekening" : statusCfg.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Admin Quick Actions ── */}
      <div className="mb-5 rounded-2xl border border-violet-100 bg-violet-50 p-3">
        <div className="flex items-center gap-2 mb-2.5">
          <svg
            className="w-3.5 h-3.5 text-violet-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
          </svg>
          <p className="text-[11px] font-bold text-violet-700 uppercase tracking-wide">
            Admin Actions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUploadBukti && (
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-blue-200 px-3 py-2 text-[12px] font-semibold text-blue-700 active:scale-[0.97] transition hover:bg-blue-50"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Upload Bukti Transfer
            </button>
          )}
          {isPendingInput && (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] font-semibold text-amber-700">
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Menunggu user input rekening
            </div>
          )}
          {activeRefund?.status === "transferred" && (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-[12px] font-semibold text-blue-700">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Bukti sudah dikirim, menunggu konfirmasi user
            </div>
          )}
          {activeRefund?.status === "accepted" && (
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-[12px] font-semibold text-emerald-700">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Refund selesai
            </div>
          )}
        </div>
      </div>

      {/* ── Grid content ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* ── Info Utama ── */}
        <div className="sm:col-span-2 rounded-[20px] bg-white border border-stone-100 shadow-sm overflow-hidden">
          <div
            className={`h-[3px] w-full ${isPendingInput ? "bg-stone-200" : statusCfg.bar}`}
          />
          <div className="p-4">
            <p className="font-barlow-bold text-[16px] font-bold text-stone-900 mb-1">
              {data.order_name}
            </p>
            <div className="flex gap-2 flex-wrap mt-3">
              <div className="flex items-center gap-1.5 rounded-xl bg-stone-50 border border-stone-100 px-3 py-1.5">
                <span className="text-[10px] text-stone-400">
                  Jumlah Refund
                </span>
                <span className="font-barlow-bold text-xs font-bold text-stone-900">
                  {formatRupiah(data.amount)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl bg-stone-50 border border-stone-100 px-3 py-1.5">
                <span className="text-[10px] text-stone-400">User ID</span>
                <span className="text-xs font-semibold text-stone-700">
                  #{data.user_id}
                </span>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              {data.payment_code && (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
                  <span className="text-[11px] text-stone-400">
                    Kode Pembayaran
                  </span>
                  <span className="text-[12px] font-mono font-semibold text-stone-800">
                    {data.payment_code}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-[11px] text-stone-400">Kode Order</span>
                <span className="text-[12px] font-mono font-semibold text-stone-800">
                  {data.order_code}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-[11px] text-stone-400">Diajukan</span>
                <span className="text-[12px] font-semibold text-stone-800">
                  {formatDate(data.created_at)}
                </span>
              </div>
            </div>

            {/* Admin note */}
            {data.admin_note && (
              <div className="mt-3 flex items-start gap-2 bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
                <svg
                  className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0"
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
                <div>
                  <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-0.5">
                    Catatan Admin
                  </p>
                  <p className="text-[11px] text-amber-800 italic leading-relaxed">
                    {data.admin_note}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Banner belum input rekening ── */}
        {isPendingInput && (
          <div className="sm:col-span-2 rounded-[20px] border border-amber-200 bg-amber-50 overflow-hidden">
            <div className="h-[3px] w-full bg-amber-400" />
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 text-amber-500"
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
              </div>
              <div>
                <p className="text-[13px] font-semibold text-amber-800">
                  Menunggu Input Rekening
                </p>
                <p className="text-[11px] text-amber-600 mt-0.5">
                  User belum menginput nomor rekening tujuan refund. Admin tidak
                  dapat upload bukti transfer sebelum user mengisi rekening.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Timeline status ── */}
        {!isPendingInput && (
          <div className="sm:col-span-2">
            <Section
              title="Status Pengembalian"
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
              {/* Horizontal timeline */}
              <div className="flex gap-0">
                {REFUND_TIMELINE.map((step, idx) => {
                  const stepNum = REFUND_STEP[step.key];
                  const isDone = currentStep >= stepNum;
                  const isCurrent = currentStep === stepNum;
                  const isLast = idx === REFUND_TIMELINE.length - 1;
                  const cfg = getRefundStatusCfg(step.key);

                  return (
                    <div
                      key={step.key}
                      className="flex flex-col items-center flex-1 min-w-[80px]"
                    >
                      <div className="flex items-center w-full">
                        {idx !== 0 && (
                          <div
                            className={`flex-1 h-0.5 ${isDone ? "bg-stone-900" : "bg-stone-100"}`}
                          />
                        )}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                            isCurrent
                              ? `${cfg.dot} border-transparent`
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
                            className={`flex-1 h-0.5 ${currentStep > stepNum ? "bg-stone-900" : "bg-stone-100"}`}
                          />
                        )}
                      </div>
                      <div className="mt-2 text-center px-1">
                        <p
                          className={`text-[10px] font-semibold leading-tight ${
                            isCurrent
                              ? cfg.text
                              : isDone
                                ? "text-stone-700"
                                : "text-stone-300"
                          }`}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <span
                            className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold border ${cfg.badge} ${cfg.text}`}
                          >
                            Sekarang
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          </div>
        )}

        {/* ── Rekening User ── */}
        {activeRefund && (
          <Section
            title="Rekening Tujuan User"
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
            <div className="space-y-1.5">
              {(
                [
                  { label: "Bank", value: activeRefund.bank_name },
                  { label: "No. Rekening", value: activeRefund.account_number },
                  { label: "Atas Nama", value: activeRefund.account_name },
                ] satisfies { label: string; value: string }[]
              ).map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-stone-50 border border-stone-100"
                >
                  <span className="text-[11px] text-stone-500">
                    {row.label}
                  </span>
                  <span className="text-[12px] font-semibold text-stone-800">
                    {row.value}
                  </span>
                </div>
              ))}
              {activeRefund.transferred_at && (
                <div className="flex items-center gap-2 mt-1 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
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
            </div>
          </Section>
        )}

        {/* ── Waktu ── */}
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
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-[11px] text-stone-400">
                Refund Diajukan
              </span>
              <span className="text-[12px] font-semibold text-stone-800">
                {formatDate(data.created_at)}
              </span>
            </div>
            {activeRefund?.created_at && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-[11px] text-stone-400">
                  Rekening Diinput
                </span>
                <span className="text-[12px] font-semibold text-stone-800">
                  {formatDate(activeRefund.created_at)}
                </span>
              </div>
            )}
          </div>
        </Section>

        {/* ── Bukti Transfer yang sudah diupload ── */}
        {activeRefund?.proofs && activeRefund.proofs.length > 0 && (
          <div className="sm:col-span-2">
            <Section
              title="Bukti Transfer"
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
              badge={
                canUploadBukti ? (
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center gap-1 rounded-xl bg-blue-100 border border-blue-200 px-2.5 py-1 text-[11px] font-semibold text-blue-700 active:scale-95 transition hover:bg-blue-200"
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Tambah
                  </button>
                ) : undefined
              }
            >
              <div className="space-y-2">
                {activeRefund.proofs.map((proof: RefundProof) => {
                  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(
                    proof.file_url,
                  );
                  const fullUrl = toStaticUrl(proof.file_url);
                  const ext =
                    proof.file_url.split(".").pop()?.toUpperCase() ?? "FILE";
                  return (
                    <a
                      key={proof.id}
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100 active:scale-[0.99] transition hover:bg-stone-100"
                    >
                      <div className="w-9 h-9 rounded-xl bg-stone-200 flex items-center justify-center shrink-0">
                        <svg
                          className="w-4 h-4 text-stone-600"
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
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-stone-800">
                          {proof.note || "Bukti transfer"}
                        </p>
                        <p className="text-[10px] text-stone-400 uppercase font-semibold mt-0.5">
                          {ext}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-stone-400 uppercase shrink-0">
                        Lihat
                      </span>
                    </a>
                  );
                })}
              </div>
            </Section>
          </div>
        )}

        {/* Kalau belum ada bukti tapi sudah bisa upload */}
        {canUploadBukti &&
          (!activeRefund?.proofs || activeRefund.proofs.length === 0) && (
            <div className="sm:col-span-2 rounded-[20px] border border-blue-100 bg-blue-50 overflow-hidden">
              <div className="h-[3px] w-full bg-blue-400" />
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-blue-800">
                      Belum ada bukti transfer
                    </p>
                    <p className="text-[11px] text-blue-600 mt-0.5">
                      Upload bukti transfer untuk dikirim ke user
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-blue-500 px-3 py-2 text-[11px] font-semibold text-white active:scale-95 transition shadow-sm shadow-blue-500/30"
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Upload Sekarang
                </button>
              </div>
            </div>
          )}
      </div>

      {/* ── Upload Modal ── */}
      {showUploadModal && activeRefund && (
        <UploadBuktiModal
          refundId={activeRefund.id}
          onSuccess={() => {
            setShowUploadModal(false);
            fetchDetail();
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </main>
  );
}
