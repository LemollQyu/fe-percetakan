"use client";

import Link from "next/link";
import { API_USER_BASE } from "@/lib/api";
import { useState, useEffect } from "react";

function useAccessSource() {
  const [source, setSource] = useState<"browser" | "webview" | "unknown">(
    "unknown",
  );
  const [ua, setUa] = useState("");

  useEffect(() => {
    const userAgent = navigator.userAgent; // ← ambil dari sini
    setUa(userAgent);

    const isAndroidWebView =
      userAgent.includes("Android") && userAgent.includes("Version/4.0");
    const isIOSWebView =
      /iPhone|iPad/.test(userAgent) && !/Safari/.test(userAgent);

    setSource(isAndroidWebView || isIOSWebView ? "webview" : "browser");
  }, []);

  return { source, ua };
}

export default function AuthPage() {
  const { source, ua } = useAccessSource();

  const handleGoogleLogin = () => {
    window.location.href = `${API_USER_BASE}/auth/google`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f0eb] relative">
      <div
        className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(214,211,209,0.4),transparent)] pointer-events-none"
        aria-hidden
      />

      <header className="relative z-10 flex items-center justify-between h-14 px-4 max-w-[430px] w-full mx-auto">
        <Link
          href="/"
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
              Autentikasi
            </h1>
            <p className="font-monterat-tipis text-center text-sm font-medium text-stone-600 mt-1.5">
              Pilih cara masuk atau daftar akun baru
            </p>
          </div>

          <div className="px-5 pt-5 pb-6 space-y-5">
            {/* Sign In */}
            <div>
              <div className="flex flex-col gap-3">
                <Link
                  href="/auth/login?via=email"
                  className="font-barlow-bold w-full min-h-[52px] flex items-center justify-center gap-2 rounded-2xl bg-stone-900 text-white font-semibold text-[15px] shadow-lg shadow-stone-900/20 hover:bg-stone-800 active:scale-[0.99] transition-all duration-200"
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Masuk dengan Email
                </Link>
                <Link
                  href="/auth/login?via=phone"
                  className="font-barlow-bold w-full min-h-[52px] flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-stone-200 text-stone-700 font-semibold text-[15px] hover:bg-stone-50 active:scale-[0.99] transition-all duration-200 shadow-sm"
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
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Masuk dengan Phone
                </Link>

                {source !== "webview" && (
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="font-barlow-bold w-full min-h-[52px] flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-stone-200 text-stone-700 font-semibold text-[15px] hover:bg-stone-50 active:scale-[0.99] transition-all duration-200 shadow-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Masuk dengan Google
                  </button>
                )}
                {/* <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="font-barlow-bold w-full min-h-[52px] flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-stone-200 text-stone-700 font-semibold text-[15px] hover:bg-stone-50 active:scale-[0.99] transition-all duration-200 shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Masuk dengan Google
                </button> */}
              </div>
            </div>

            <div className="border-t border-dashed border-stone-200 my-1" />

            {/* Sign Up */}
            <div>
              <Link
                href="/auth/register"
                className="font-barlow-bold w-full min-h-[52px] flex items-center justify-center gap-2 rounded-2xl bg-stone-100 text-stone-700 font-semibold text-[15px] hover:bg-stone-200 hover:text-stone-800 active:scale-[0.99] transition-all duration-200 border border-stone-200"
              >
                Daftar akun baru
              </Link>
            </div>
          </div>

          <div className="px-5 pb-6 text-center">
            <Link
              href="/auth/verify-akun"
              className="font-monterat-tipis text-[12px] font-medium text-stone-500 hover:text-stone-700 underline"
            >
              Baru daftar? Verifikasi akun
            </Link>
          </div>

          <p className="px-5 font-monterat-italic text-center text-[11px] font-medium text-stone-500 pb-6 leading-relaxed">
            Lupa password? Gunakan{" "}
            <Link
              href="/auth/forgot-password"
              className="underline font-semibold text-stone-600"
            >
              Lupa password
            </Link>{" "}
            dari halaman login.
          </p>
        </div>
      </div>
    </div>
  );
}
