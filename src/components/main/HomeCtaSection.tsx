 "use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken, getAuthRole } from "@/lib/auth";

export function HomeCtaSection() {
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

  if (loggedIn) {
    return (
      <section className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 p-6">
        <h2 className="font-barlow-bold text-lg font-bold text-stone-900 mb-2">
          Pesan layanan
        </h2>
        <p className="font-monterat-tipis text-sm text-stone-600 mb-4">
          Pilih kategori layanan untuk memulai pesanan.
        </p>
        <Link
          href="/layanan"
          className="font-barlow-bold w-full min-h-[48px] flex items-center justify-center rounded-2xl bg-stone-900 text-white font-semibold text-[15px] shadow-lg shadow-stone-900/20 hover:bg-stone-800 active:scale-[0.99] transition-all"
        >
          Lihat layanan
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white border border-stone-100 shadow-lg shadow-stone-200/30 p-6">
      <h2 className="font-barlow-bold text-lg font-bold text-stone-900 mb-2">
        Mulai pesan sekarang
      </h2>
      <p className="font-monterat-tipis text-sm text-stone-600 mb-4">
        Daftar atau masuk untuk memesan layanan di Nabila Fotocopy.
      </p>
      <div className="flex flex-col gap-3">
        <Link
          href="/auth"
          className="font-barlow-bold w-full min-h-[48px] flex items-center justify-center rounded-2xl bg-stone-900 text-white font-semibold text-[15px] shadow-lg shadow-stone-900/20 hover:bg-stone-800 active:scale-[0.99] transition-all"
        >
          Daftar / Masuk
        </Link>
      </div>
    </section>
  );
}

