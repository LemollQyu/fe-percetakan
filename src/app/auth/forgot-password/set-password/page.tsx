"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { postChangePassword } from "@/api/authentikasi/change-password/post";

type FormPayload = {
  password: string;
  confirm_password: string;
};

export default function SetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get("user_id");
  const userId = userIdParam ? parseInt(userIdParam, 10) : null;

  const [form, setForm] = useState<FormPayload>({ password: "", confirm_password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (userId != null && !isNaN(userId) && userId > 0) setReady(true);
    else router.replace("/auth/forgot-password");
  }, [userId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      setError("Password dan konfirmasi password tidak sama.");
      return;
    }
    if (userId == null || isNaN(userId) || userId <= 0) {
      setError("Sesi tidak valid. Silakan ulangi dari lupa password.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await postChangePassword({
        user_id: userId,
        password: form.password,
        confirm_password: form.confirm_password,
      });
      setSuccess("Password berhasil diubah. Mengalihkan ke halaman masuk...");
      setTimeout(() => router.push("/auth/login"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah password.");
    } finally {
      setLoading(false);
    }
  };

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
          href="/auth/forgot-password"
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
              Lupa password
            </h1>
            <p className="font-monterat-tipis text-center text-sm font-medium text-stone-600 mt-1.5">
              Masukkan password baru (min. 8 karakter)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-5 pt-5 pb-2">
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

            <div className="space-y-0">
              <div className="group py-3.5 border-b border-stone-100">
                <label htmlFor="new-password" className="font-monterat-tipis block text-[13px] font-semibold text-stone-600 mb-2 group-focus-within:text-stone-800 transition-colors">
                  Password baru
                </label>
                <input
                  id="new-password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  maxLength={20}
                  placeholder="Min. 8 karakter"
                  autoComplete="new-password"
                  className="font-monterat-tipis w-full min-h-[46px] rounded-xl border border-stone-200 bg-stone-50/80 px-4 text-[15px] font-medium text-stone-900 placeholder-stone-400 transition-all duration-200 focus:bg-white focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80 focus:ring-offset-0"
                />
              </div>
              <div className="group py-3.5 border-b border-stone-100 last:border-b-0 last:pb-0">
                <label htmlFor="confirm-password" className="font-monterat-tipis block text-[13px] font-semibold text-stone-600 mb-2 group-focus-within:text-stone-800 transition-colors">
                  Konfirmasi password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  name="confirm_password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  maxLength={20}
                  placeholder="Ulangi password baru"
                  autoComplete="new-password"
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
                    Menyimpan...
                  </span>
                ) : (
                  "Simpan password"
                )}
              </button>
            </div>
          </form>

          <div className="px-5 pb-6 text-center">
            <Link
              href="/auth/login"
              className="font-monterat-tipis inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-200 hover:text-stone-800 active:bg-stone-300 transition-colors duration-200"
            >
              Kembali ke <span className="font-barlow-bold text-stone-700">Masuk</span>
            </Link>
          </div>

          <p className="px-5 font-monterat-italic text-center text-[11px] font-medium text-stone-500 pb-6 leading-relaxed">
            Gunakan password baru untuk masuk ke akun Anda.
          </p>
        </div>
      </div>
    </div>
  );
}
