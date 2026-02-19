 "use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken, getAuthRole } from "@/lib/auth";

type Props = {
  children: React.ReactNode;
  /** Judul halaman (e.g. "Profile", "Riwayat Order") */
  title: string;
  /** Teks deskripsi saat belum login */
  description?: string;
};

/**
 * Jika user belum login (bukan role user), tampilkan card "Silakan login atau daftar".
 * Jika sudah login, tampilkan children.
 */
export function RequireUser({ children, title, description }: Props) {
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = getToken();
    const role = getAuthRole();
    setLoggedIn(!!token && role === "user");
  }, [mounted]);

  if (!mounted) return null;

  if (!loggedIn) {
    return (
      <div className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 p-6">
        <h1 className="font-barlow-bold text-xl font-bold text-stone-900 mb-2">
          {title}
        </h1>
        <p className="font-monterat-tipis text-sm text-stone-600 mb-4">
          {description ?? "Silakan login atau daftar untuk mengakses halaman ini."}
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/auth/login"
            className="font-barlow-bold w-full min-h-[48px] flex items-center justify-center rounded-2xl bg-stone-900 text-white font-semibold text-[15px] shadow-lg shadow-stone-900/20 hover:bg-stone-800 active:scale-[0.99] transition-all"
          >
            Masuk
          </Link>
          <Link
            href="/auth"
            className="font-barlow-bold w-full min-h-[48px] flex items-center justify-center rounded-2xl bg-white border-2 border-stone-200 text-stone-700 font-semibold text-[15px] hover:bg-stone-50 active:scale-[0.99] transition-all"
          >
            Daftar
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

