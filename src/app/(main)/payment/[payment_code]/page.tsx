"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import {
  getWaitingPayment,
  uploadPaymentProof,
  cancelPayment,
} from "@/api/payment";
import type { WaitingPaymentData } from "@/api/payment";

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

function normalizeUrl(url: string): string {
  // if (!url) return "";
  // try {
  //   const parsed = new URL(url.startsWith("http") ? url : `http://${url}`);
  //   return `/api/proxy/paymentmc${parsed.pathname}`;
  // } catch {
  //   const path = url.startsWith("/") ? url : `/${url}`;
  //   return `/api/proxy/paymentmc${path}`;
  // }
  if (!url || typeof url !== "string") return url;
  const t = url.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) {
    const idx = t.indexOf("/static/");
    if (idx !== -1) return t.substring(idx);
    return t;
  }
  if (t.startsWith("/static/")) return t;
  const idx = t.indexOf("/static/");
  if (idx !== -1) return t.substring(idx);
  if (t.startsWith("static/")) return `/${t}`;
  return t.startsWith("/") ? t : `/${t}`;
}

// ─── Countdown Hook ───────────────────────────────────────────────────────────

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState<{
    h: number;
    m: number;
    s: number;
  } | null>(null);

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ h: 0, m: 0, s: 0 });
        return;
      }
      const totalSecs = Math.floor(diff / 1000);
      setTimeLeft({
        h: Math.floor(totalSecs / 3600),
        m: Math.floor((totalSecs % 3600) / 60),
        s: totalSecs % 60,
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const payment_code = params?.payment_code as string;

  const [payment, setPayment] = useState<WaitingPaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofNote, setProofNote] = useState("");
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proofSuccess, setProofSuccess] = useState(false);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isFullLoading, setIsFullLoading] = useState(false);
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    async function fetchPayment() {
      try {
        const res = await getWaitingPayment({
          code: payment_code,
          token: token!,
        });
        setPayment(res.data);
      } catch {
        setPayment(null);
      } finally {
        setLoading(false);
      }
    }
    fetchPayment();
  }, [payment_code, router]);

  const countdown = useCountdown(payment?.expired_at ?? "");
  const isUrgent =
    !!payment &&
    !(new Date() > new Date(payment.expired_at)) &&
    countdown !== null &&
    countdown.h === 0 &&
    countdown.m < 5;

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleProofFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofError(null);
    if (file.type.startsWith("image/"))
      setProofPreview(URL.createObjectURL(file));
    else setProofPreview(null);
  }

  async function handleUploadProof() {
    if (!proofFile) return;
    const token = getToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    setUploadingProof(true);
    setProofError(null);
    try {
      await uploadPaymentProof({
        code: payment_code,
        file: proofFile,
        note: proofNote || undefined,
        token,
      });
      setIsFullLoading(true);
      router.replace(`/payment/success/${payment_code}`);

      // setProofSuccess(true);
      // setProofFile(null);
      // setProofNote("");
      // setProofPreview(null);
    } catch (e) {
      setProofError(e instanceof Error ? e.message : "Gagal mengupload bukti.");
    } finally {
      setUploadingProof(false);
    }
  }

  async function handleCancelPayment() {
    const token = getToken();
    if (!token) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelPayment({ payment_code, token });
      router.replace("/riwayat-order");
    } catch (e) {
      setCancelError(
        e instanceof Error ? e.message : "Gagal membatalkan pembayaran.",
      );
      setCancelling(false);
    }
  }

  if (isFullLoading) {
    return (
      <div className="fixed inset-0 z-[999] bg-white flex flex-col items-center justify-center gap-4">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-stone-200 border-t-stone-800" />
        <p className="text-sm text-stone-500">Memproses pembayaran...</p>
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
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-[22px] border border-stone-100 bg-white p-4 space-y-3 animate-pulse"
            >
              <div className="h-3 bg-stone-100 rounded w-24" />
              <div className="h-16 bg-stone-100 rounded-xl w-full" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  // ── Not found ──
  if (!payment) {
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
            Data pembayaran tidak ditemukan
          </p>
          <p className="text-xs text-stone-400 text-center">
            Kode pembayaran tidak valid atau sudah kadaluarsa.
          </p>
        </div>
      </main>
    );
  }

  const isQris = !!payment.code_qris;
  const isTransfer = !!payment.number_payment;
  const amount = payment.amount;
  const method = payment.payment.payment_method;
  const expiredAt = payment.expired_at;
  const statusPembayaran = payment.payment.status;
  const isExpired = new Date() > new Date(expiredAt);

  return (
    <main className="flex-1 w-full max-w-[430px] mx-auto px-4 py-6 pb-28 space-y-3">
      {/* ── Cancel confirm modal ── */}
      {showCancelConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => !cancelling && setShowCancelConfirm(false)}
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
                  <span className="font-mono font-bold">{payment_code}</span>{" "}
                  akan dibatalkan permanen.
                </p>
              </div>

              {cancelError && (
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
                  <p className="text-[11px] text-red-600">{cancelError}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelConfirm(false);
                    setCancelError(null);
                  }}
                  disabled={cancelling}
                  className="flex-1 h-[48px] rounded-2xl border border-stone-200 bg-white text-[13px] font-bold text-stone-700 active:scale-[0.98] transition disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleCancelPayment}
                  disabled={cancelling}
                  className="flex-1 h-[48px] rounded-2xl bg-red-500 text-[13px] font-bold text-white active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {cancelling && (
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  )}
                  {cancelling ? "Membatalkan..." : "Ya, Batalkan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            Pembayaran
          </h1>
          <p className="text-[11px] text-stone-400 font-mono mt-0.5 truncate">
            {payment.order_code}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold border shrink-0 ${isExpired ? "bg-stone-100 border-stone-200 text-stone-500" : "bg-amber-50 border-amber-200 text-amber-700"}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${isExpired ? "bg-stone-400" : "bg-amber-400"}`}
          />
          {isExpired ? "Kadaluarsa" : statusPembayaran}
        </span>
      </div>

      {/* ── Hero total ── */}
      <div className="rounded-[22px] bg-stone-900 overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-1">
            Metode Pembayaran
          </p>
          <p className="font-barlow-bold text-[17px] font-bold text-white leading-snug">
            {method}
          </p>
        </div>
        <div className="flex items-center justify-between bg-white/5 border-t border-white/10 px-5 py-3.5">
          <div>
            <p className="text-[10px] text-stone-500 font-semibold">
              BATAS WAKTU
            </p>
            <p
              className={`text-[12px] font-bold mt-0.5 ${isExpired ? "text-red-400" : "text-amber-400"}`}
            >
              {formatDate(expiredAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-stone-500 font-semibold">TOTAL</p>
            <p className="font-barlow-bold text-[17px] font-bold text-white mt-0.5">
              {formatRupiah(amount)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Countdown Timer ── */}
      <div
        className={`rounded-[22px] border shadow-sm overflow-hidden ${isExpired ? "bg-stone-50 border-stone-200" : isUrgent ? "bg-red-50 border-red-200" : "bg-white border-stone-100"}`}
      >
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <p
            className={`text-[11px] font-bold uppercase tracking-widest ${isExpired ? "text-stone-400" : isUrgent ? "text-red-400" : "text-stone-400"}`}
          >
            Sisa Waktu
          </p>
          {!isExpired && isUrgent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-600">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Segera habis!
            </span>
          )}
        </div>
        <div className="px-4 pb-4">
          {isExpired ? (
            <div className="flex items-center gap-3 rounded-2xl bg-stone-100 px-4 py-3">
              <svg
                className="w-5 h-5 text-stone-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-[13px] font-bold text-stone-500">
                Waktu pembayaran telah habis
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { val: countdown?.h ?? 0, label: "Jam" },
                    { val: countdown?.m ?? 0, label: "Menit" },
                    { val: countdown?.s ?? 0, label: "Detik" },
                  ] as { val: number; label: string }[]
                ).map(({ val, label }) => (
                  <div
                    key={label}
                    className={`rounded-2xl py-3 text-center border ${isUrgent ? "bg-red-100 border-red-200" : "bg-stone-50 border-stone-100"}`}
                  >
                    <p
                      className={`font-barlow-bold text-[28px] font-bold tabular-nums leading-none ${isUrgent ? "text-red-600" : "text-stone-900"}`}
                    >
                      {String(val).padStart(2, "0")}
                    </p>
                    <p
                      className={`text-[10px] mt-1 font-semibold ${isUrgent ? "text-red-400" : "text-stone-400"}`}
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <svg
                  className={`w-3.5 h-3.5 shrink-0 ${isUrgent ? "text-red-400" : "text-stone-400"}`}
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
                <p
                  className={`text-[11px] ${isUrgent ? "text-red-500" : "text-stone-400"}`}
                >
                  Batas: {formatDate(expiredAt)}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Expired notice ── */}
      {isExpired && (
        <div className="rounded-[22px] border border-red-100 bg-red-50 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <svg
              className="w-5 h-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-bold text-red-700">
              Pembayaran Kadaluarsa
            </p>
            <p className="text-[11px] text-red-500 mt-0.5">
              Batas waktu telah habis. Silakan buat order baru.
            </p>
          </div>
        </div>
      )}

      {/* ── Metode badge ── */}
      <div className="rounded-[22px] bg-white border border-stone-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
        {payment.icon_method_payment && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={normalizeUrl(payment.icon_method_payment)}
            alt={method}
            className="w-8 h-8 rounded-xl object-contain bg-stone-100 p-1 shrink-0"
          />
        )}
        <div>
          <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
            Metode Pembayaran
          </p>
          <p className="text-[13px] font-bold text-stone-900 mt-0.5">
            {method}
          </p>
        </div>
      </div>

      {/* ── QRIS ── */}
      {isQris && (
        <div className="rounded-[22px] bg-white border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
              Scan QRIS
            </p>
          </div>
          <div className="px-4 pb-4 space-y-3">
            <p className="text-[12px] text-stone-500">
              Scan QR code di bawah menggunakan aplikasi e-wallet atau mobile
              banking kamu.
            </p>
            <div className="flex items-center justify-center bg-stone-50 rounded-2xl p-5 border border-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={normalizeUrl(payment.code_qris)}
                alt="QR Code Pembayaran"
                className="w-full max-w-[240px] rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Transfer Bank ── */}
      {isTransfer && (
        <div className="rounded-[22px] bg-white border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
              Transfer Bank
            </p>
          </div>
          <div className="px-4 pb-4 space-y-3">
            <p className="text-[12px] text-stone-500">
              Transfer sejumlah tagihan ke nomor rekening berikut.
            </p>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-stone-900 px-4 py-3.5">
              <div className="min-w-0">
                <p className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">
                  Nomor Rekening
                </p>
                <p className="font-barlow-bold text-[18px] font-bold text-white mt-0.5 tracking-widest truncate">
                  {payment.number_payment}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(payment.number_payment, "norek")}
                className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition px-3 py-2 shrink-0"
              >
                {copied === "norek" ? (
                  <svg
                    className="w-3.5 h-3.5 text-emerald-400"
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
                ) : (
                  <svg
                    className="w-3.5 h-3.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                )}
                <span className="text-[11px] font-semibold text-white">
                  {copied === "norek" ? "Tersalin!" : "Salin"}
                </span>
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 border border-stone-100 px-4 py-3">
              <p className="text-[12px] text-stone-500">Jumlah Transfer</p>
              <div className="flex items-center gap-2">
                <p className="font-barlow-bold text-[13px] font-bold text-stone-900">
                  {formatRupiah(amount)}
                </p>
                <button
                  type="button"
                  onClick={() => handleCopy(String(amount), "amount")}
                  className="w-7 h-7 rounded-lg bg-stone-200 flex items-center justify-center active:scale-95 transition"
                >
                  {copied === "amount" ? (
                    <svg
                      className="w-3 h-3 text-emerald-600"
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
                  ) : (
                    <svg
                      className="w-3 h-3 text-stone-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
              <svg
                className="w-3.5 h-3.5 text-amber-500 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-[11px] text-amber-700">
                Transfer tepat sesuai nominal agar pembayaran dapat dikonfirmasi
                otomatis.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload Bukti Pembayaran ── */}
      <div className="rounded-[22px] bg-white border border-stone-100 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
            Bukti Pembayaran
          </p>
        </div>
        <div className="px-4 pb-4 space-y-3">
          {isExpired ? (
            <div className="flex items-center gap-3 rounded-2xl bg-stone-50 border border-stone-200 px-4 py-4">
              <div className="w-9 h-9 rounded-xl bg-stone-200 flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 text-stone-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-bold text-stone-600">
                  Pembayaran Kadaluarsa
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Bukti tidak dapat diupload karena batas waktu telah habis.
                </p>
              </div>
            </div>
          ) : proofSuccess ? (
            <div className="flex flex-col items-center justify-center gap-3 py-5">
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
                  Bukti berhasil dikirim!
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Tim kami akan memverifikasi pembayaran kamu.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[12px] text-stone-500">
                Upload foto atau screenshot bukti transfer / pembayaran kamu.
              </p>
              <div
                onClick={() => proofInputRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all overflow-hidden ${proofFile ? "border-stone-300 bg-stone-50" : "border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-stone-100"}`}
              >
                {proofPreview ? (
                  <div
                    className="relative w-full"
                    style={{ aspectRatio: "16/9" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proofPreview}
                      alt="Preview bukti"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                      <div className="flex items-center gap-1.5 bg-white/90 rounded-xl px-3 py-1.5">
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
                ) : proofFile ? (
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-stone-200 flex items-center justify-center shrink-0">
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
                        {proofFile.name}
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        {(proofFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <svg
                        className="w-3 h-3 text-emerald-600"
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
                  <div className="flex flex-col items-center justify-center gap-2.5 py-7 px-4">
                    <div className="w-10 h-10 rounded-2xl bg-stone-200 flex items-center justify-center">
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
                    <div className="text-center">
                      <p className="text-[13px] font-semibold text-stone-700">
                        Tap untuk pilih file
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Foto, screenshot, atau PDF
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={proofInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={handleProofFileChange}
                />
              </div>

              {proofFile && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setProofFile(null);
                      setProofPreview(null);
                      if (proofInputRef.current)
                        proofInputRef.current.value = "";
                    }}
                    className="text-[11px] font-semibold text-stone-400 hover:text-red-500 transition"
                  >
                    Hapus
                  </button>
                </div>
              )}

              <div className="rounded-xl bg-stone-50 border border-stone-100 overflow-hidden">
                <textarea
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  placeholder="Catatan (opsional) — misal: sudah transfer jam 14.00"
                  rows={2}
                  className="w-full px-3 py-2.5 text-[12px] text-stone-700 bg-transparent resize-none outline-none placeholder:text-stone-300"
                />
              </div>

              {proofError && (
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
                  <p className="text-[11px] text-red-600">{proofError}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleUploadProof}
                disabled={!proofFile || uploadingProof}
                className={`w-full h-[48px] rounded-2xl text-white font-barlow-bold text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${proofFile && !uploadingProof ? "bg-stone-900 hover:bg-stone-800 active:scale-[0.98] shadow-lg shadow-stone-900/15" : "bg-stone-200 cursor-not-allowed"}`}
              >
                {uploadingProof && (
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                )}
                {uploadingProof ? "Mengupload..." : "Kirim Bukti Pembayaran"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Batalkan Pembayaran — hanya muncul kalau belum expired & belum sukses upload ── */}
      {!isExpired && !proofSuccess && (
        <div className="rounded-[22px] bg-white border border-stone-100 shadow-sm px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <svg
                  className="w-4 h-4 text-red-400"
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
                <p className="text-[12px] font-bold text-stone-700">
                  Batalkan Pembayaran
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  Order akan dikembalikan ke status sebelumnya
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold text-red-600 active:scale-[0.97] transition hover:bg-red-100"
            >
              Batalkan
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
