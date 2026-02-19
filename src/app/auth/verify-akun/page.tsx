"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { postVerifyEmail } from "@/api/authentikasi/verify-email/post";
import { postVerifyPhone } from "@/api/authentikasi/verify-phone/post";

type VerifyType = "email" | "phone";

export default function VerifyAkunPage() {
  const router = useRouter();
  const [choice, setChoice] = useState<VerifyType | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"choose" | "input">("choose");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChoose = (type: VerifyType) => {
    setChoice(type);
    setStep("input");
    setError("");
    setSuccess("");
  };

  const handleBackFromInput = () => {
    setChoice(null);
    setStep("choose");
    setEmail("");
    setPhone("");
    setError("");
    setSuccess("");
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (choice === "email") {
        const res = await postVerifyEmail({ email });
        setSuccess(res.message ?? "Kode verifikasi dikirim. Mengalihkan...");
        const at = Math.floor(Date.now() / 1000);
        const exp = res.expired != null ? `&expired=${res.expired}&at=${at}` : "";
        router.push(`/auth/verify-akun/otp?type=email&target=${encodeURIComponent(email)}${exp}`);
      } else {
        const res = await postVerifyPhone({ phone });
        setSuccess(res.message ?? "Kode verifikasi dikirim. Mengalihkan...");
        const at = Math.floor(Date.now() / 1000);
        const exp = res.expired != null ? `&expired=${res.expired}&at=${at}` : "";
        router.push(`/auth/verify-akun/otp?type=phone&target=${encodeURIComponent(phone)}${exp}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim kode.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f0eb] relative">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(214,211,209,0.4),transparent)] pointer-events-none" aria-hidden />

      <header className="relative z-10 flex items-center justify-between h-14 px-4 max-w-[430px] w-full mx-auto">
        <Link
          href={step === "choose" ? "/auth/login" : "#"}
          className="flex items-center justify-center w-10 h-10 rounded-full text-stone-600 hover:bg-white/80 hover:text-stone-800 active:scale-95 transition-all duration-200 shadow-sm"
          aria-label="Kembali"
          onClick={(e) => {
            if (step === "input") {
              e.preventDefault();
              handleBackFromInput();
            }
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="w-10" />
      </header>

      <div className="relative z-10 flex-1 w-full max-w-[430px] mx-auto px-4 pb-10 pt-1">
        <div className="bg-white rounded-[28px] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100/80">
          <div className="mt-4 mx-4 rounded-2xl overflow-hidden bg-stone-200">
            <div className="relative h-32 w-full">
              <img
                src="/photo/printing2.webp"
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center grayscale contrast-[1.08] brightness-[0.97]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-white/5 to-transparent pointer-events-none" />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none" />
            </div>
          </div>

          <div className="px-5 pt-6">
            <h1 className="font-barlow-bold text-2xl font-bold text-stone-900 text-center tracking-tight">
              Verifikasi Akun
            </h1>
            <p className="font-monterat-tipis text-center text-sm font-medium text-stone-600 mt-1.5">
              {step === "choose" && "Pilih verifikasi email atau Phone yang didaftarkan"}
              {step === "input" && choice === "email" && "Masukkan email untuk menerima kode OTP"}
              {step === "input" && choice === "phone" && "Masukkan Phone untuk menerima kode OTP via WhatsApp"}
            </p>
          </div>

          <div className="px-5 pt-5 pb-6">
            {error && (
              <div
                role="alert"
                className="font-monterat-tipis mb-4 flex items-start gap-3 rounded-2xl bg-red-50/90 border border-red-100 px-4 py-3 text-sm font-medium text-red-800"
              >
                <span className="flex-shrink-0 mt-0.5 text-red-500" aria-hidden>●</span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div
                role="status"
                className="font-monterat-tipis mb-4 flex items-start gap-3 rounded-2xl bg-emerald-50/90 border border-emerald-100 px-4 py-3 text-sm font-medium text-emerald-800"
              >
                <span className="flex-shrink-0 mt-0.5 text-emerald-500" aria-hidden>✓</span>
                <span>{success}</span>
              </div>
            )}

            {step === "choose" && (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => handleChoose("email")}
                  className="font-barlow-bold w-full min-h-[52px] rounded-2xl bg-stone-900 text-white font-semibold text-[15px] shadow-lg shadow-stone-900/20 hover:bg-stone-800 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Verifikasi Email
                </button>
                <button
                  type="button"
                  onClick={() => handleChoose("phone")}
                  className="font-barlow-bold w-full min-h-[52px] rounded-2xl bg-white border-2 border-stone-200 text-stone-700 font-semibold text-[15px] hover:bg-stone-50 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                >
                  Verifikasi Phone (WhatsApp)
                </button>
              </div>
            )}

            {step === "input" && choice && (
              <form onSubmit={handleSendCode}>
                {choice === "email" && (
                  <>
                    <label className="font-monterat-tipis block text-[13px] font-semibold text-stone-600 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => (setEmail(e.target.value), setError(""))}
                      required
                      placeholder="contoh@email.com"
                      className="font-monterat-tipis w-full min-h-[46px] rounded-xl border border-stone-200 bg-stone-50/80 px-4 text-[15px] font-medium text-stone-900 placeholder-stone-400 transition-all duration-200 focus:bg-white focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80 focus:ring-offset-0 mb-5"
                    />
                  </>
                )}
                {choice === "phone" && (
                  <>
                    <label className="font-monterat-tipis block text-[13px] font-semibold text-stone-600 mb-2">
                      Phone (WhatsApp)
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => (setPhone(e.target.value.replace(/\D/g, "").slice(0, 14)), setError(""))}
                      required
                      minLength={10}
                      maxLength={14}
                      placeholder="08123456789"
                      className="font-monterat-tipis w-full min-h-[46px] rounded-xl border border-stone-200 bg-stone-50/80 px-4 text-[15px] font-medium text-stone-900 placeholder-stone-400 transition-all duration-200 focus:bg-white focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80 focus:ring-offset-0 mb-5"
                    />
                  </>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="font-barlow-bold w-full min-h-[52px] rounded-2xl bg-stone-900 text-white font-semibold text-[15px] shadow-lg shadow-stone-900/20 hover:bg-stone-800 active:scale-[0.99] disabled:opacity-60 transition-all duration-200"
                >
                  {loading ? "Mengirim..." : "Kirim kode"}
                </button>
              </form>
            )}
          </div>

          <div className="px-5 pb-6 text-center">
            <Link
              href="/auth/login"
              className="font-monterat-tipis inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-200 transition-colors duration-200"
            >
              Kembali ke <span className="font-barlow-bold text-stone-700">Masuk</span>
            </Link>
          </div>

          <p className="px-5 font-monterat-italic text-center text-[11px] font-medium text-stone-500 pb-6 leading-relaxed">
            Aktivasi akun yang baru mendaftar (email atau Phone).
          </p>
        </div>
      </div>
    </div>
  );
}
