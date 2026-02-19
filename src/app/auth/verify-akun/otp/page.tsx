"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { postVerifyEmail } from "@/api/authentikasi/verify-email/post";
import { postVerifyPhone } from "@/api/authentikasi/verify-phone/post";
import { postVerifyOtpEmail } from "@/api/authentikasi/verify-otp-email/post";
import { postVerifyOtpPhone } from "@/api/authentikasi/verify-otp-phone/post";

const OTP_LENGTH = 6;
type VerifyType = "email" | "phone";

export default function VerifyAkunOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") as VerifyType) || null;
  const target = searchParams.get("target") || "";
  const expiredParam = searchParams.get("expired");
  const atParam = searchParams.get("at");
  const expiredAt =
    expiredParam != null && atParam != null
      ? parseInt(atParam, 10) + parseInt(expiredParam, 10)
      : null;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [ready, setReady] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if ((type === "email" || type === "phone") && target) {
      setReady(true);
    } else {
      router.replace("/auth/verify-akun");
    }
  }, [type, target, router]);

  useEffect(() => {
    if (expiredAt == null || expiredAt <= 0) return;
    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const left = Math.max(0, expiredAt - now);
      setSecondsLeft(left);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiredAt]);

  useEffect(() => {
    if (ready) inputRefs.current[0]?.focus();
  }, [ready]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
      const next = [...otp];
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) next[index + i] = d;
      });
      setOtp(next);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setError("");
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Masukkan 6 digit kode OTP.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (type === "email") {
        const res = await postVerifyOtpEmail({ otp: code });
        setSuccess(res.message ?? "Email berhasil diverifikasi.");
      } else {
        const res = await postVerifyOtpPhone({ otp: code });
        setSuccess(res.message ?? "Phone berhasil diverifikasi.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kode OTP salah atau kadaluarsa.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      if (type === "email") {
        await postVerifyEmail({ email: target });
        setSuccess("Kode baru telah dikirim ke email Anda.");
      } else {
        await postVerifyPhone({ phone: target });
        setSuccess("Kode baru telah dikirim ke WhatsApp Anda.");
      }
      setResendCooldown(180);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim ulang.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => (c <= 0 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0eb]">
        <p className="font-monterat-tipis text-stone-500">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f0eb] relative">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(214,211,209,0.4),transparent)] pointer-events-none" aria-hidden />

      <header className="relative z-10 flex items-center justify-between h-14 px-4 max-w-[430px] w-full mx-auto">
        <Link
          href="/auth/verify-akun"
          className="flex items-center justify-center w-10 h-10 rounded-full text-stone-600 hover:bg-white/80 hover:text-stone-800 active:scale-95 transition-all duration-200 shadow-sm"
          aria-label="Kembali"
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
              Masukkan kode OTP
            </h1>
            <p className="font-monterat-tipis text-center text-sm font-medium text-stone-600 mt-1.5">
              Kode 6 digit telah dikirim ke {type === "email" ? "email" : "WhatsApp"} Anda
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

            <form onSubmit={handleVerifyOtp}>
              <p className="font-monterat-tipis text-center text-[12px] font-medium text-stone-500 mb-2">
                Masukkan 6 digit kode di bawah ini
              </p>
              {expiredAt != null && (
                <p className="font-monterat-tipis text-center text-[12px] font-semibold text-stone-600 mb-4">
                  {secondsLeft != null && secondsLeft > 0 ? (
                    <>Kode kadaluarsa dalam <span className="font-barlow-bold text-stone-800">{Math.floor(secondsLeft / 60)} menit {secondsLeft % 60} detik</span></>
                  ) : secondsLeft === 0 ? (
                    <span className="text-amber-700">Kode telah kadaluarsa. Silakan kirim ulang.</span>
                  ) : null}
                </p>
              )}
              <div className="flex justify-center gap-2 mb-6 px-1">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    placeholder="0"
                    aria-label={`Digit ${i + 1}`}
                    className="font-barlow-bold w-12 h-14 rounded-2xl border-2 border-stone-200 bg-stone-50/80 text-center text-xl font-bold text-stone-900 focus:bg-white focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:ring-offset-1 placeholder:text-stone-300"
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={loading || otp.join("").length !== OTP_LENGTH}
                className="font-barlow-bold w-full min-h-[52px] rounded-2xl bg-stone-900 text-white font-semibold text-[15px] shadow-lg shadow-stone-900/20 hover:bg-stone-800 active:scale-[0.99] disabled:opacity-60 transition-all duration-200 mb-3"
              >
                {loading ? "Memverifikasi..." : "Verifikasi"}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || resendCooldown > 0}
                className="font-monterat-tipis w-full text-sm font-semibold text-stone-500 hover:text-stone-700 disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Kirim ulang (${resendCooldown}s)` : "Kirim ulang kode"}
              </button>
            </form>
          </div>

          <div className="px-5 pb-6 text-center">
            <Link
              href="/auth/verify-akun"
              className="font-monterat-tipis inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-200 transition-colors duration-200"
            >
              Ganti email atau Phone
            </Link>
          </div>

          <p className="px-5 font-monterat-italic text-center text-[11px] font-medium text-stone-500 pb-6 leading-relaxed">
            Kode dikirim ke {type === "email" ? target : target}
          </p>
        </div>
      </div>
    </div>
  );
}
