"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { postLogin, type LoginPayload } from "@/api/authentikasi/login/post";
import { getUserInfo } from "@/api/authentikasi/user-info/get";

import {
  setAuth,
  setUserProfile,
  setUserAvatarUrl,
  setUserId,
} from "@/lib/auth";

type ViaType = "email" | "phone" | null;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const via = (searchParams.get("via") as ViaType) || null;
  const isEmail = via === "email";
  const isPhone = via === "phone";
  const userLabel = isEmail ? "Email" : isPhone ? "Phone" : "Email atau Phone";
  const userPlaceholder = isEmail
    ? "contoh@email.com"
    : isPhone
      ? "08123456789"
      : "contoh@email.com atau 08123456789";
  const [form, setForm] = useState<LoginPayload>({ user: "", password: "" });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await postLogin(form);
      if (typeof window !== "undefined" && res.token) {
        setAuth(res.token, "user");
        try {
          const info = await getUserInfo(res.token);
          setUserProfile({
            username: info.username ?? "",
            name: info.name ?? "",
            email: info.email ?? "",
            phone: info.phone ?? "",
          });
          if (info.avatar_url) setUserAvatarUrl(info.avatar_url);
          if (info.id) setUserId(Number(info.id));
        } catch {
          // skip if user-info gagal, profile tetap kosong
        }
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal masuk.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f0eb] relative">
      <div
        className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(214,211,209,0.4),transparent)] pointer-events-none"
        aria-hidden
      />

      <header className="relative z-10 flex items-center justify-between h-14 px-4 max-w-[430px] w-full mx-auto">
        <Link
          href="/auth"
          className="flex items-center justify-center w-10 h-10 rounded-full text-stone-600 hover:bg-white/80 hover:text-stone-800 active:scale-95 transition-all duration-200 shadow-sm"
          aria-label="Kembali"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
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
              Masuk
            </h1>
            <p className="font-monterat-tipis text-center text-sm font-medium text-stone-600 mt-1.5">
              {isEmail
                ? "Gunakan email yang sudah terdaftar"
                : isPhone
                  ? "Gunakan Phone yang sudah terdaftar"
                  : "Gunakan email atau Phone yang sudah terdaftar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-5 pt-5 pb-2">
            {error && (
              <div
                role="alert"
                className="font-monterat-tipis mb-4 flex items-start gap-3 rounded-2xl bg-red-50/90 border border-red-100 px-4 py-3 text-sm font-medium text-red-800"
              >
                <span className="flex-shrink-0 mt-0.5 text-red-500" aria-hidden>
                  ●
                </span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-0">
              <div className="group py-3.5 border-b border-stone-100">
                <label
                  htmlFor="login-user"
                  className="font-monterat-tipis block text-[13px] font-semibold text-stone-600 mb-2 group-focus-within:text-stone-800 transition-colors"
                >
                  {userLabel}
                </label>
                <input
                  id="login-user"
                  type={isEmail ? "email" : "text"}
                  name="user"
                  value={form.user}
                  onChange={handleChange}
                  required
                  placeholder={userPlaceholder}
                  autoComplete="username"
                  inputMode={isPhone ? "numeric" : undefined}
                  className="font-monterat-tipis w-full min-h-[46px] rounded-xl border border-stone-200 bg-stone-50/80 px-4 text-[15px] font-medium text-stone-900 placeholder-stone-400 transition-all duration-200 focus:bg-white focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80 focus:ring-offset-0"
                />
              </div>
              <div className="group py-3.5 border-b border-stone-100 last:border-b-0 last:pb-0">
                <label
                  htmlFor="login-password"
                  className="font-monterat-tipis block text-[13px] font-semibold text-stone-600 mb-2 group-focus-within:text-stone-800 transition-colors"
                >
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  maxLength={20}
                  placeholder="Min. 8 karakter"
                  autoComplete="current-password"
                  className="font-monterat-tipis w-full min-h-[46px] rounded-xl border border-stone-200 bg-stone-50/80 px-4 text-[15px] font-medium text-stone-900 placeholder-stone-400 transition-all duration-200 focus:bg-white focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80 focus:ring-offset-0"
                />
              </div>
            </div>

            <div className="pt-7 pb-5">
              <button
                type="submit"
                disabled={loading}
                className="font-barlow-bold w-full min-h-[52px] rounded-2xl bg-stone-900 text-white font-semibold text-[15px] shadow-lg shadow-stone-900/20 hover:bg-stone-800 active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none disabled:active:scale-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 focus:ring-offset-white"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Masuk...
                  </span>
                ) : (
                  "Masuk"
                )}
              </button>
            </div>
            <p className="font-monterat-tipis text-center text-[12px] font-medium text-stone-500 pb-2">
              <Link
                href="/auth/forgot-password"
                className="text-stone-700 underline hover:text-stone-900 font-semibold"
              >
                Lupa password?
              </Link>
            </p>
          </form>

          <div className="px-5 pb-6 text-center space-y-3">
            <p className="font-monterat-tipis text-[12px] font-medium text-stone-500">
              <Link
                href="/auth"
                className="text-stone-600 underline hover:text-stone-800 font-semibold"
              >
                Ganti cara masuk
              </Link>{" "}
              (Email / Phone / Google)
            </p>
            <Link
              href="/auth/register"
              className="font-monterat-tipis inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-200 hover:text-stone-800 active:bg-stone-300 transition-colors duration-200"
            >
              Belum punya akun?
              <span className="font-barlow-bold font-semibold text-stone-700">
                Daftar
              </span>
            </Link>
            <p className="font-monterat-tipis text-[12px] font-medium text-stone-500">
              Baru daftar?{" "}
              <Link
                href="/auth/verify-akun"
                className="text-stone-700 underline hover:text-stone-900 font-semibold"
              >
                Verifikasi akun
              </Link>
            </p>
          </div>

          <p className="px-5 font-monterat-italic text-center text-[11px] font-medium text-stone-500 pb-6 leading-relaxed">
            Pastikan email atau Phone sudah terverifikasi.
          </p>
        </div>
      </div>
    </div>
  );
}
