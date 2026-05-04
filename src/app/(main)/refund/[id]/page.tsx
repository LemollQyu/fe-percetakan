"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { approveRefund, getDetailRefunds, sendRekening } from "@/api/payment";
import type { RefundData, RefundItem, RefundProof } from "@/api/payment";
import { toStaticUrl } from "@/app/helper/normalizeUrl";
export type { ApproveRefundResponse, ApproveRefundParams } from "@/api/payment";
import { getUserByID } from "@/api/authentikasi/get-user-by-id";
import type { User } from "@/api/authentikasi/get-user-by-id";
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

// ─── Timeline Steps ───────────────────────────────────────────────────────────

const REFUND_TIMELINE: { key: RefundStatus; label: string; desc: string }[] = [
  {
    key: "requested",
    label: "Pengajuan Diterima",
    desc: "Permintaan pengembalian dana diterima",
  },
  {
    key: "transferred",
    label: "Dana Ditransfer",
    desc: "Admin telah mentransfer dana ke rekening",
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

function RefundTimeline({ activeRefund }: { activeRefund?: RefundItem }) {
  const currentStatus = (activeRefund?.status ?? "requested") as RefundStatus;
  const currentStep = REFUND_STEP[currentStatus] ?? 1;

  return (
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
      <div className="space-y-0">
        {REFUND_TIMELINE.map((step, idx) => {
          const stepNum = REFUND_STEP[step.key];
          const isDone = currentStep >= stepNum;
          const isCurrent = currentStep === stepNum;
          const isLast = idx === REFUND_TIMELINE.length - 1;
          const cfg = getRefundStatusCfg(step.key);

          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
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
                    className={`w-0.5 flex-1 my-1 min-h-[20px] ${
                      isDone && currentStep > stepNum
                        ? "bg-stone-900"
                        : "bg-stone-100"
                    }`}
                  />
                )}
              </div>

              <div className={`pb-4 flex-1 ${isLast ? "pb-0" : ""}`}>
                <p
                  className={`text-[13px] font-semibold leading-tight ${
                    isCurrent
                      ? cfg.text
                      : isDone
                        ? "text-stone-900"
                        : "text-stone-400"
                  }`}
                >
                  {step.label}
                  {isCurrent && (
                    <span
                      className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${cfg.badge} ${cfg.text}`}
                    >
                      Sekarang
                    </span>
                  )}
                </p>
                <p
                  className={`text-[11px] mt-0.5 ${
                    isDone ? "text-stone-500" : "text-stone-300"
                  }`}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ─── Form Input Rekening ──────────────────────────────────────────────────────

function InputRekeningForm({
  rejectId,
  onSuccess,
}: {
  rejectId: number;
  onSuccess: () => void;
}) {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = bankName.trim() && accountNumber.trim() && accountName.trim();

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    const token = getToken();
    if (!token) return;

    setSubmitting(true);
    setError(null);

    try {
      await sendRekening({
        reject_id: rejectId,
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
        token,
      });
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengirim data rekening.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section
      title="Input Rekening Refund"
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
      <div className="space-y-3">
        {/* Info hint */}
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
          <svg
            className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0"
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
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Masukkan rekening yang akan digunakan untuk menerima pengembalian
            dana. Pastikan data sudah benar.
          </p>
        </div>

        {/* Bank Name */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider px-1">
            Nama Bank
          </label>
          <input
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Contoh: BCA, BRI, Mandiri"
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-[13px] text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 focus:bg-white transition"
          />
        </div>

        {/* Account Number */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider px-1">
            Nomor Rekening
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) =>
              setAccountNumber(e.target.value.replace(/\D/g, ""))
            }
            placeholder="Contoh: 1234567890"
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-[13px] font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 focus:bg-white transition"
          />
        </div>

        {/* Account Name */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider px-1">
            Atas Nama
          </label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Nama pemilik rekening"
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

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="w-full h-[50px] rounded-2xl bg-stone-900 text-white text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-stone-900/20"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Mengirim...
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Kirim Data Rekening
            </>
          )}
        </button>
      </div>
    </Section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RefundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);

  const [data, setData] = useState<RefundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const handleApprove = async () => {
    if (!activeRefund || approving) return;
    const token = getToken();
    if (!token) return;

    setApproving(true);
    setApproveError(null);

    try {
      await approveRefund({ token, refundID: activeRefund.id });
      setShowConfirmSheet(false); // tutup sheet
      fetchDetail();
    } catch (err) {
      setApproveError(
        err instanceof Error ? err.message : "Gagal approve refund.",
      );
    } finally {
      setApproving(false);
    }
  };

  // const fetchDetail = () => {
  //   if (!id) return;
  //   const token = getToken();
  //   if (!token) return;

  //   setLoading(true);
  //   setError(null);

  //   getDetailRefunds({ token, rejectID: Number(id) })
  //     .then((res) => setData(res.data))
  //     .catch((err: unknown) =>
  //       setError(
  //         err instanceof Error ? err.message : "Gagal memuat detail refund.",
  //       ),
  //     )
  //     .finally(() => setLoading(false));
  // };

  const fetchUser = (userID: number) => {
    getUserByID({ userID })
      .then((res) => setUser(res.data))
      .catch((err: unknown) =>
        console.error(
          err instanceof Error ? err.message : "Gagal memuat data user.",
        ),
      );
  };

  const fetchDetail = () => {
    if (!id) return;
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    getDetailRefunds({ token, rejectID: Number(id) })
      .then((res) => {
        setData(res.data);
        fetchUser(res.data.user_id); // ← chain di sini
      })
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

  console.log(user);

  // ── Loading ──
  if (loading) {
    return (
      <main className="flex-1 w-full max-w-[430px] mx-auto px-4 py-6 pb-28">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-stone-100 animate-pulse" />
          <div className="h-5 bg-stone-100 rounded-lg w-40 animate-pulse" />
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
  if (error || !data) {
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
              Detail Refund
            </h1>
            <p className="text-[12px] text-stone-400 font-mono mt-0.5">
              {data.order_code}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold border shrink-0 ${
              isPendingInput
                ? "bg-stone-100 border-stone-200 text-stone-500"
                : `${statusCfg.badge} ${statusCfg.text}`
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isPendingInput ? "bg-stone-400" : statusCfg.dot
              }`}
            />
            {isPendingInput ? "Belum Input" : statusCfg.label}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* ── Info Utama ── */}
        <div className="rounded-[20px] bg-white border border-stone-100 shadow-sm overflow-hidden">
          <div
            className={`h-[3px] w-full ${
              isPendingInput ? "bg-stone-200" : statusCfg.bar
            }`}
          />
          <div className="p-4">
            <p className="font-barlow-bold text-[16px] font-bold text-stone-900 mb-1">
              {data.order_name}
            </p>

            {user ? (
              <div className="flex items-center gap-2.5 mt-2">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-stone-100"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-stone-500">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-[12px] font-semibold text-stone-800">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-stone-400">{user.email}</p>
                </div>
              </div>
            ) : (
              <div>tidak ada user</div>
            )}

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
                  {formatDate(data.created_at)}
                </span>
              </div>
            </div>

            {/* Kode referensi */}
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
            </div>

            {/* Admin note */}
            {data.admin_note && (
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
                  {data.admin_note}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Form input rekening (kalau belum diisi) ── */}
        {isPendingInput && (
          <InputRekeningForm
            rejectId={data.id}
            onSuccess={() => fetchDetail()}
          />
        )}

        {/* ── Timeline status (kalau sudah ada rekening) ── */}
        {!isPendingInput && <RefundTimeline activeRefund={activeRefund} />}

        {!isPendingInput && activeRefund?.status === "transferred" && (
          <>
            <Section
              title="Konfirmasi Dana Diterima"
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            >
              <button
                type="button"
                onClick={() => setShowConfirmSheet(true)}
                className="w-full h-[50px] rounded-2xl bg-violet-600 text-white text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition shadow-lg shadow-violet-600/20"
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Dana Sudah Diterima
              </button>
            </Section>

            {/* ── Bottom Sheet ── */}
            {showConfirmSheet && (
              <div className="fixed inset-0 z-50 flex flex-col justify-end">
                {/* Backdrop */}
                <div
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                  onClick={() => !approving && setShowConfirmSheet(false)}
                />

                {/* Sheet */}
                <div className="relative bg-white rounded-t-[28px] px-5 pt-5 pb-10 animate-slide-up">
                  {/* Handle */}
                  <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-5" />

                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-7 h-7 text-violet-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  </div>

                  <p className="text-center text-[16px] font-bold text-stone-900 mb-1">
                    Apakah dana sudah diterima?
                  </p>
                  <p className="text-center text-[12px] text-stone-400 mb-6">
                    Pastikan dana sudah masuk ke rekening kamu sebelum
                    konfirmasi.
                  </p>

                  {approveError && (
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
                      <p className="text-[11px] text-red-600">{approveError}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={approving}
                      className="w-full h-[52px] rounded-2xl bg-violet-600 text-white text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition disabled:opacity-40 shadow-lg shadow-violet-600/20"
                    >
                      {approving ? (
                        <>
                          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Mengkonfirmasi...
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Iya, sudah diterima
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowConfirmSheet(false)}
                      disabled={approving}
                      className="w-full h-[52px] rounded-2xl bg-stone-100 text-stone-700 text-[14px] font-bold active:scale-[0.99] transition disabled:opacity-40"
                    >
                      Belum
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Detail Rekening ── */}
        {activeRefund && (
          <Section
            title="Rekening Tujuan"
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
                <div className="flex items-center gap-2 mt-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
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

        {/* ── Bukti Transfer dari Admin ── */}
        {activeRefund?.proofs && activeRefund.proofs.length > 0 && (
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
                    className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100 active:scale-[0.99] transition"
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
              <span className="text-[11px] text-stone-400">Diajukan</span>
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
      </div>
    </main>
  );
}
