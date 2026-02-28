"use client";

/**
 * app/auth/google/success/page.tsx
 *
 * Halaman perantara setelah Google OAuth berhasil.
 * Tugasnya: ambil token dari query param → simpan ke localStorage → redirect ke homepage.
 * Tidak ada UI yang perlu dilihat user, langsung redirect.
 */

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuth } from "@/lib/auth";

export default function GoogleSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      router.replace("/auth?error=no_token");
      return;
    }

    // Simpan token ke localStorage dengan role "user"
    setAuth(token, "user");

    // Redirect ke homepage
    router.replace("/");
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f0eb]">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="w-10 h-10 rounded-full border-2 border-stone-200 border-t-stone-900 animate-spin" />
        <p className="font-barlow-bold text-sm font-semibold text-stone-600">
          Sedang masuk...
        </p>
      </div>
    </div>
  );
}
