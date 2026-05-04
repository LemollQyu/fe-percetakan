"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { getOrderByCode, uploadOrderFile } from "@/api/order";

import { getPaymentMethods } from "@/api/payment";
import type { PaymentMethod } from "@/api/payment";

import { postCheckout } from "@/api/payment";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderSpesification = {
  id: number;
  order_id: number;
  spesification_id: number;
  spesification_name_snapshot: string;
  value_snapshot: string;
  additional_price_snapshot: number;
  created_at: string;
};

type OrderCode = {
  id: number;
  order_id: number;
  code: string;
  expired_at: string;
  created_at: string;
};

type OrderFile = {
  id: number;
  order_id: number;
  file_url: string;
  file_type: string;
  created_at: string;
};

type OrderDetail = {
  id: number;
  user_id: number;
  service_id: number;
  service_name_snapshot: string;
  base_price_snapshot: number;
  total_price_snapshot: number;
  user_note: string;
  status: string;
  quantity: number;
  order_code: OrderCode;
  order_spesifications: OrderSpesification[];
  order_file?: OrderFile | null;
  created_at: string;
  updated_at: string;
};

// ─── Status Config ────────────────────────────────────────────────────────────

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
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  created: {
    label: "Dibuat",
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    dot: "bg-sky-400",
  },
  waiting_payment: {
    label: "Menunggu Bayar",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  paid: {
    label: "Dibayar",
    color: "text-lime-700",
    bg: "bg-lime-50",
    border: "border-lime-200",
    dot: "bg-lime-500",
  },
  on_progress: {
    label: "Diproses",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  finished: {
    label: "Selesai",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    dot: "bg-violet-500",
  },
  completed: {
    label: "Completed",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Dibatalkan",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-400",
  },
  expired: {
    label: "Expired",
    color: "text-stone-500",
    bg: "bg-stone-100",
    border: "border-stone-200",
    dot: "bg-stone-400",
  },
};

function getStatusConfig(raw: string) {
  const key = raw.toLowerCase().replace(/\s+/g, "_") as StatusKey;
  return (
    STATUS_CONFIG[key] ?? {
      label: raw,
      color: "text-stone-600",
      bg: "bg-stone-100",
      border: "border-stone-200",
      dot: "bg-stone-400",
    }
  );
}

// ─── Allowed file types ───────────────────────────────────────────────────────

const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".tiff",
  ".heic",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
  ".rtf",
  ".odt",
  ".ods",
  ".odp",
];

const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  "image/heic",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/rtf",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
];

function isFileAllowed(file: File): boolean {
  if (ALLOWED_MIME.includes(file.type)) return true;
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({
  onFileSelect,
}: {
  onFileSelect: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function handleFile(file: File) {
    if (!isFileAllowed(file)) {
      setError(
        "Format file tidak didukung. Gunakan gambar (JPG, PNG, dll) atau dokumen (PDF, DOCX, dll).",
      );
      setSelectedFile(null);
      onFileSelect(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
    onFileSelect(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  const isImage = selectedFile?.type.startsWith("image/") ?? false;
  const previewUrl =
    selectedFile && isImage ? URL.createObjectURL(selectedFile) : null;

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden
          ${
            dragging
              ? "border-stone-400 bg-stone-100 scale-[0.99]"
              : selectedFile
                ? "border-stone-300 bg-stone-50"
                : "border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-stone-100"
          }`}
      >
        {previewUrl ? (
          <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition">
              <div className="flex items-center gap-2 bg-white/90 rounded-xl px-3 py-1.5">
                <svg
                  className="w-3.5 h-3.5 text-stone-700"
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
                <span className="text-[11px] font-semibold text-stone-700">
                  Ganti file
                </span>
              </div>
            </div>
          </div>
        ) : selectedFile ? (
          <div className="flex items-center gap-3 px-4 py-4">
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
              <p className="text-[13px] font-semibold text-stone-800 truncate">
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <svg
                className="w-3.5 h-3.5 text-emerald-600"
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
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-8 px-4">
            <div className="w-12 h-12 rounded-2xl bg-stone-200 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-stone-500"
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
            <div className="text-center">
              <p className="text-[13px] font-semibold text-stone-700">
                Tap untuk upload, atau drag & drop
              </p>
              <p className="text-[11px] text-stone-400 mt-1">
                Gambar (JPG, PNG, WEBP) · Dokumen (PDF, DOCX, XLSX)
              </p>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_EXTENSIONS.join(",")}
          onChange={onInputChange}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5">
          <svg
            className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0"
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
          <p className="text-[11px] text-red-600 leading-relaxed">{error}</p>
        </div>
      )}

      {selectedFile && !error && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] text-stone-400 truncate max-w-[70%]">
            {selectedFile.name}
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(null);
              onFileSelect(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="text-[11px] font-semibold text-stone-400 hover:text-red-500 transition"
          >
            Hapus
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-stone-100 last:border-0">
      <span className="text-[12px] text-stone-400 shrink-0">{label}</span>
      <span
        className={`text-[13px] font-semibold text-stone-900 text-right ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] bg-white border border-stone-100 shadow-sm overflow-hidden">
      {title && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
            {title}
          </p>
        </div>
      )}
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.order_code as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Checkout state
  const [showMethodSheet, setShowMethodSheet] = useState(false);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isFullLoading, setIsFullLoading] = useState(false);
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }

    async function fetchOrder() {
      try {
        const token = getToken()!;
        const res = await getOrderByCode({ code, token });
        const data = (res as any).data ?? (res as any).data_order ?? res;
        setOrder(data as OrderDetail);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat order.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [code, router]);

  async function handleSubmitFile() {
    if (!uploadedFile || !order) return;

    const token = getToken();
    // console.log("Token saat submit:", token); // ← tambah ini

    if (!token) {
      router.push("/auth/login");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      await uploadOrderFile({
        order_id: order.id,
        file: uploadedFile,
        token,
      });
      window.location.reload();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Gagal mengirim file.");
    } finally {
      setUploading(false);
    }
  }

  async function handleOpenCheckout() {
    setShowMethodSheet(true);
    if (methods.length > 0) return; // sudah di-fetch sebelumnya
    setMethodsLoading(true);
    try {
      const res = await getPaymentMethods();
      setMethods(res.data);
    } catch {
      setMethods([]);
    } finally {
      setMethodsLoading(false);
    }
  }

  // checkout
  async function handleConfirmCheckout() {
    if (!selectedMethod || !order) return;

    const token = getToken();
    console.log("Token saat submit:", token); // ← tambah ini
    if (!token) {
      router.push("/auth/login");
      return;
    }

    setCheckingOut(true);
    setCheckoutError(null);

    try {
      const res = await postCheckout({
        code: order.order_code?.code,
        token,
        payment_method: selectedMethod,
      });
      // ✅ simpan ke sessionStorage supaya halaman payment bisa baca
      sessionStorage.setItem(
        `payment_${res.data.order_code}`,
        JSON.stringify(res.data),
      );
      setShowMethodSheet(false);
      setIsFullLoading(true);
      router.push(`/payment/${res.data.order_code}`);
    } catch (e) {
      setCheckoutError(
        e instanceof Error ? e.message : "Gagal melakukan checkout.",
      );
    } finally {
      setCheckingOut(false);
    }
  }

  if (isFullLoading) {
    return (
      <div className="fixed inset-0 z-[999] bg-white flex flex-col items-center justify-center gap-4">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-stone-200 border-t-stone-800" />
        <p className="font-monterat-tipis text-sm text-stone-500">
          Mengirim file...
        </p>
      </div>
    );
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
              className="rounded-[22px] border border-stone-100 bg-white p-4 space-y-3 animate-pulse"
            >
              <div className="h-3 bg-stone-100 rounded w-24" />
              <div className="h-4 bg-stone-100 rounded w-3/4" />
              <div className="h-3 bg-stone-100 rounded w-1/2" />
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
          className="inline-flex items-center gap-2 mb-6 text-[13px] font-semibold text-stone-500 active:scale-95 transition"
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
          Kembali
        </button>
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-red-400"
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
            {error ?? "Kode order tidak valid."}
          </p>
        </div>
      </main>
    );
  }

  const statusCfg = getStatusConfig(order.status);
  const isCreated = order.status.toLowerCase() === "created";
  const isCancelledOrExpired = ["cancelled", "expired"].includes(
    order.status.toLowerCase(),
  );

  // ✅ file sudah ada dari server ATAU baru berhasil diupload di session ini
  const hasFile = !!order.order_file?.file_url || uploadSuccess;

  return (
    <main className="flex-1 w-full max-w-[430px] mx-auto px-4 py-6 pb-32 space-y-3">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center active:scale-95 transition shrink-0"
        >
          <svg
            className="w-4 h-4 text-stone-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-barlow-bold text-[17px] font-bold text-stone-900 leading-tight">
            Detail Pesanan
          </h1>
          <p className="text-[11px] text-stone-400 font-mono mt-0.5 truncate">
            {order.order_code?.code}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold border shrink-0 ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.dot}`}
          />
          {statusCfg.label}
        </span>
      </div>

      {/* ── Hero card ── */}
      <div className="rounded-[22px] bg-stone-900 overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-1">
            Layanan
          </p>
          <p className="font-barlow-bold text-[18px] font-bold text-white leading-snug">
            {order.service_name_snapshot}
          </p>
        </div>
        <div className="flex items-center justify-between bg-white/5 border-t border-white/10 px-5 py-3.5">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] text-stone-500 font-semibold">
                HARGA DASAR
              </p>
              <p className="text-[13px] font-bold text-stone-300 mt-0.5">
                {formatRupiah(order.base_price_snapshot)}
              </p>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <p className="text-[10px] text-stone-500 font-semibold">QTY</p>
              <p className="text-[13px] font-bold text-stone-300 mt-0.5">
                {order.quantity}×
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-stone-500 font-semibold">TOTAL</p>
            <p className="font-barlow-bold text-[17px] font-bold text-white mt-0.5">
              {formatRupiah(order.total_price_snapshot)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Cancelled / Expired notice ── */}
      {isCancelledOrExpired && (
        <div
          className={`rounded-[22px] border p-4 flex items-center gap-3 ${
            order.status.toLowerCase() === "cancelled"
              ? "bg-red-50 border-red-100"
              : "bg-stone-50 border-stone-200"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
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
              className={`text-[13px] font-bold ${order.status.toLowerCase() === "cancelled" ? "text-red-700" : "text-stone-700"}`}
            >
              Pesanan{" "}
              {order.status.toLowerCase() === "cancelled"
                ? "Dibatalkan"
                : "Expired"}
            </p>
            <p
              className={`text-[11px] mt-0.5 ${order.status.toLowerCase() === "cancelled" ? "text-red-500" : "text-stone-500"}`}
            >
              {order.status.toLowerCase() === "cancelled"
                ? "Pesanan ini telah dibatalkan."
                : "Batas waktu pembayaran telah habis."}
            </p>
          </div>
        </div>
      )}

      {/* ── Ringkasan ── */}
      <Card title="Ringkasan">
        {order.user_note && (
          <div className="flex items-start gap-2 mb-2 px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-100">
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
        <InfoRow label="Tanggal Order" value={formatDate(order.created_at)} />
        {order.order_code?.expired_at && (
          <InfoRow
            label="Berlaku Hingga"
            value={
              <span className="text-amber-600">
                {formatDate(order.order_code.expired_at)}
              </span>
            }
          />
        )}
        <InfoRow label="Kode Order" value={order.order_code?.code} mono />
      </Card>

      {/* ── Spesifikasi ── */}
      {(order.order_spesifications ?? []).length > 0 && (
        <Card title="Spesifikasi">
          {order.order_spesifications.map((spec) => (
            <div
              key={spec.id}
              className="flex items-center justify-between gap-2 py-2.5 border-b border-stone-100 last:border-0"
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
        </Card>
      )}

      {/* ── Upload file (hanya status created) ── */}
      {isCreated && (
        <Card title="Upload File">
          {hasFile ? (
            <div className="flex flex-col items-center justify-center gap-3 py-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-emerald-600"
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
              </div>
              <div className="text-center">
                <p className="text-[13px] font-bold text-stone-900">
                  File sudah tersedia
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  {order.order_file?.file_url
                    ? "File sebelumnya sudah diupload."
                    : "File Anda sedang diproses oleh tim kami."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <UploadZone
                onFileSelect={(file) => {
                  setUploadedFile(file);
                  setUploadError(null);
                }}
              />
              {uploadError && (
                <div className="mt-2 flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5">
                  <svg
                    className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0"
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
                  <p className="text-[11px] text-red-600 leading-relaxed">
                    {uploadError}
                  </p>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* ── Floating CTA (hanya status created) ── */}
      {isCreated && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-6 pt-3 bg-gradient-to-t from-stone-50 via-stone-50/95 to-transparent pointer-events-none z-40">
          {hasFile ? (
            /* ── File sudah ada → Checkout ── */
            <button
              type="button"
              onClick={handleOpenCheckout}
              className="pointer-events-auto w-full h-[56px] rounded-2xl bg-emerald-600 text-white flex items-center justify-between px-5 hover:bg-emerald-500 active:scale-[0.98] transition-all shadow-xl shadow-emerald-900/25"
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
                  Lanjut Checkout
                </span>
              </div>
              <svg
                className="w-4 h-4 text-white/50"
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
          ) : (
            /* ── Belum ada file → Kirim File ── */
            <button
              type="button"
              onClick={handleSubmitFile}
              disabled={!uploadedFile || uploading}
              className={`pointer-events-auto w-full h-[56px] rounded-2xl text-white flex items-center justify-between px-5 transition-all shadow-xl
                ${
                  !uploadedFile || uploading
                    ? "bg-stone-300 shadow-stone-200/50 cursor-not-allowed"
                    : "bg-stone-900 hover:bg-stone-800 active:scale-[0.98] shadow-stone-900/25"
                }`}
            >
              <div className="flex items-center gap-3">
                {uploading ? (
                  <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                )}
                <span className="font-barlow-bold text-[14px] font-bold">
                  {uploading ? "Mengirim..." : "Kirim File"}
                </span>
              </div>
              {!uploading && (
                <svg
                  className="w-4 h-4 text-white/40"
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
              )}
            </button>
          )}
        </div>
      )}

      {/* ── Payment Method Bottom Sheet ── */}
      {showMethodSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMethodSheet(false)}
            style={{ animation: "fadeIn 0.2s ease" }}
          />

          {/* Sheet */}
          <div
            className="relative w-full max-w-[430px] bg-white rounded-t-[28px] overflow-hidden"
            style={{ animation: "slideUp 0.3s cubic-bezier(0.32,0.72,0,1)" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-stone-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
              <div>
                <p className="font-barlow-bold text-[15px] font-bold text-stone-900">
                  Metode Pembayaran
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Pilih metode untuk melanjutkan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMethodSheet(false)}
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

            {/* Methods list */}
            <div
              className="px-4 py-3 space-y-2 overflow-y-auto"
              style={{ maxHeight: "60dvh" }}
            >
              {methodsLoading ? (
                <div className="space-y-2 py-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-[64px] rounded-2xl bg-stone-100 animate-pulse"
                    />
                  ))}
                </div>
              ) : methods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <p className="text-[13px] font-semibold text-stone-500">
                    Metode tidak tersedia
                  </p>
                </div>
              ) : (
                methods.map((method) => {
                  const isSelected = selectedMethod === method.payment_method;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethod(method.payment_method)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all active:scale-[0.99]
                  ${
                    isSelected
                      ? "border-stone-900 bg-stone-50"
                      : "border-stone-100 bg-white hover:border-stone-200"
                  }`}
                    >
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {method.url_icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={(() => {
                              try {
                                const parsed = new URL(
                                  method.url_icon.startsWith("http")
                                    ? method.url_icon
                                    : `http://${method.url_icon}`,
                                );
                                return `/api/proxy/paymentmc${parsed.pathname}`;
                              } catch {
                                return `/api/proxy/paymentmc/${method.url_icon}`;
                              }
                            })()}
                            alt={method.payment_method}
                            className="w-6 h-6 object-contain"
                          />
                        ) : (
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
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-[13px] font-bold text-stone-900">
                          {method.payment_method}
                        </p>
                        {method.number_payment && (
                          <p className="text-[11px] text-stone-400 mt-0.5 font-mono truncate">
                            {method.number_payment}
                          </p>
                        )}
                      </div>

                      {/* Radio */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                  ${isSelected ? "border-stone-900 bg-stone-900" : "border-stone-300"}`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Confirm button */}
            <div className="px-4 pb-8 pt-3 border-t border-stone-100">
              {checkoutError && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 mb-3">
                  <svg
                    className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0"
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
                  <p className="text-[11px] text-red-600 leading-relaxed">
                    {checkoutError}
                  </p>
                </div>
              )}
              <button
                type="button"
                disabled={!selectedMethod || checkingOut}
                onClick={handleConfirmCheckout}
                className={`w-full h-[52px] rounded-2xl text-white font-barlow-bold text-[14px] font-bold transition-all
      ${
        selectedMethod && !checkingOut
          ? "bg-stone-900 hover:bg-stone-800 active:scale-[0.98] shadow-lg shadow-stone-900/20"
          : "bg-stone-200 cursor-not-allowed"
      }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {checkingOut && (
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  )}
                  <span>
                    {checkingOut
                      ? "Memproses..."
                      : selectedMethod
                        ? `Bayar dengan ${selectedMethod}`
                        : "Pilih metode dulu"}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Animasi keyframes ── */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
