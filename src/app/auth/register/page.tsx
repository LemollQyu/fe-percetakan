"use client";

import { useState } from "react";
import Link from "next/link";
import {
  postRegister,
  type RegisterPayload,
} from "@/api/authentikasi/register/post";
import AlertDialog from "@/components/main/AlertDialog";

const fields: {
  key: keyof RegisterPayload;
  label: string;
  type: string;
  placeholder: string;
  inputMode?: "text" | "email" | "numeric";
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  autoComplete?: string;
}[] = [
  {
    key: "username",
    label: "Username",
    type: "text",
    placeholder: "Min. 3 karakter",
    minLength: 3,
    maxLength: 30,
    autoComplete: "username",
  },
  {
    key: "name",
    label: "Nama lengkap",
    type: "text",
    placeholder: "Min. 3 karakter",
    minLength: 3,
    maxLength: 50,
    autoComplete: "name",
  },
  {
    key: "email",
    label: "Email",
    type: "email",
    placeholder: "contoh@email.com",
    autoComplete: "email",
  },
  {
    key: "phone",
    label: "Phone",
    type: "tel",
    placeholder: "08123456789",
    inputMode: "numeric",
    pattern: "[0-9]*",
    minLength: 9,
    maxLength: 15,
    autoComplete: "tel",
  },
  {
    key: "password",
    label: "Password",
    type: "password",
    placeholder: "Min. 8 karakter",
    minLength: 8,
    maxLength: 20,
    autoComplete: "new-password",
  },
  {
    key: "confirm_password",
    label: "Konfirmasi password",
    type: "password",
    placeholder: "Ulangi password",
    minLength: 8,
    maxLength: 20,
    autoComplete: "new-password",
  },
];

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterPayload>({
    username: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (form.password !== form.confirm_password) {
      setError("Password dan konfirmasi password tidak sama.");
      setLoading(false);
      return;
    }

    try {
      await postRegister(form);
      setForm({
        username: "",
        name: "",
        email: "",
        phone: "",
        password: "",
        confirm_password: "",
      });
      setAlertOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mendaftar.");
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

      <AlertDialog
        open={alertOpen}
        title="Registrasi Berhasil!"
        message="Silahkan aktivasi akun terlebih dulu sebelum masuk."
        onClose={() => setAlertOpen(false)}
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
              Daftar Akun
            </h1>
            <p className="font-monterat-tipis text-center text-sm font-medium text-stone-600 mt-1.5">
              Isi data berikut untuk membuat akun baru
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
              {fields.map((f) => (
                <div
                  key={f.key}
                  className="group py-3.5 border-b border-stone-100 last:border-b-0 last:pb-0"
                >
                  <label className="font-monterat-tipis block text-[13px] font-semibold text-stone-600 mb-2 group-focus-within:text-stone-800 transition-colors">
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    name={f.key}
                    value={form[f.key]}
                    onChange={handleChange}
                    required
                    placeholder={f.placeholder}
                    inputMode={f.inputMode}
                    pattern={f.pattern}
                    minLength={f.minLength}
                    maxLength={f.maxLength}
                    autoComplete={f.autoComplete}
                    className="font-monterat-tipis w-full min-h-[46px] rounded-xl border border-stone-200 bg-stone-50/80 px-4 text-[15px] font-medium text-stone-900 placeholder-stone-400 transition-all duration-200 focus:bg-white focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80 focus:ring-offset-0"
                  />
                </div>
              ))}
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
                    Mendaftar...
                  </span>
                ) : (
                  "Daftar"
                )}
              </button>
            </div>
          </form>

          <div className="px-5 pb-6 text-center">
            <Link
              href="/auth/login"
              className="font-monterat-tipis inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-200 hover:text-stone-800 active:bg-stone-300 transition-colors duration-200"
            >
              Sudah punya akun?
              <span className="font-barlow-bold font-semibold text-stone-700">
                Masuk
              </span>
            </Link>
          </div>

          <p className="px-5 font-monterat-italic text-center text-[11px] font-medium text-stone-500 pb-6 leading-relaxed">
            Dengan mendaftar, Anda menyetujui ketentuan layanan kami.
          </p>
        </div>
      </div>
    </div>
  );
}
