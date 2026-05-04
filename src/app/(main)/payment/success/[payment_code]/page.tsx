"use client";

import { useParams, useRouter } from "next/navigation";

export default function PaymentSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const payment_code = params?.payment_code as string;

  return (
    <main className="flex-1 w-full max-w-[430px] mx-auto px-4 py-6 pb-28 space-y-3">
      {/* ── Hero ── */}
      <div className="rounded-[22px] bg-stone-900 overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-3">
            Status Pembayaran
          </p>
          <div className="w-12 h-12 rounded-2xl bg-emerald-900/60 flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6 text-emerald-400"
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
          <p className="font-barlow-bold text-[19px] font-bold text-white leading-snug">
            Pembayaran Diterima!
          </p>
          <p className="text-[12px] text-stone-400 mt-1">
            Bukti pembayaran kamu telah berhasil dikirim
          </p>
        </div>
        <div className="flex items-center justify-between bg-white/5 border-t border-white/10 px-5 py-3.5">
          <div>
            <p className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">
              Kode Pembayaran
            </p>
            <p className="font-mono text-[13px] font-bold text-white mt-0.5">
              {payment_code}
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-bold text-emerald-400">
              Terkirim
            </span>
          </div>
        </div>
      </div>

      {/* ── Status menunggu konfirmasi ── */}
      <div className="rounded-[22px] border border-emerald-100 bg-emerald-50 p-4 flex items-center gap-3">
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-bold text-emerald-800">
            Menunggu Konfirmasi Admin
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5">
            Estimasi konfirmasi dalam 1×24 jam kerja
          </p>
        </div>
      </div>

      {/* ── Progress steps ── */}
      <div className="rounded-[22px] bg-white border border-stone-100 shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
            Proses Selanjutnya
          </p>
        </div>
        <div className="px-4 pb-4 space-y-0">
          {/* Step 1 - done */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
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
              <div className="w-px flex-1 bg-stone-100 my-1" />
            </div>
            <div className="pb-4 pt-0.5">
              <p className="text-[12px] font-bold text-stone-900">
                Bukti pembayaran dikirim
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Bukti berhasil diterima sistem
              </p>
            </div>
          </div>

          {/* Step 2 - active */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center shrink-0">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </div>
              <div className="w-px flex-1 bg-stone-100 my-1" />
            </div>
            <div className="pb-4 pt-0.5">
              <p className="text-[12px] font-bold text-stone-900">
                Verifikasi oleh admin
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Estimasi 1×24 jam kerja
              </p>
            </div>
          </div>

          {/* Step 3 - pending */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-stone-400">3</span>
              </div>
            </div>
            <div className="pt-0.5">
              <p className="text-[12px] font-bold text-stone-400">
                Order diproses
              </p>
              <p className="text-[11px] text-stone-300 mt-0.5">
                Setelah pembayaran dikonfirmasi
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={() => router.replace("/riwayat-order")}
          className="w-full h-[50px] rounded-2xl bg-stone-900 text-white font-barlow-bold text-[13px] font-bold active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-lg shadow-stone-900/15"
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          Lihat Riwayat Order
        </button>
        <button
          type="button"
          onClick={() => router.replace("/")}
          className="w-full h-[50px] rounded-2xl bg-white border border-stone-200 text-stone-700 font-barlow-bold text-[13px] font-bold active:scale-[0.98] transition flex items-center justify-center gap-2"
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
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Kembali ke Beranda
        </button>
      </div>
    </main>
  );
}
