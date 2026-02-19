 "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getAuthRole } from "@/lib/auth";

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#f5f0eb]">
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
  </div>
);

/**
 * Kalau sudah login: admin → /admin/dashboard, user → /
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [allowAccess, setAllowAccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = getToken();
    const role = getAuthRole();
    if (token && role === "admin") {
      router.replace("/admin/dashboard");
      return;
    }
    if (token && role === "user") {
      router.replace("/");
      return;
    }
    setAllowAccess(true);
  }, [mounted, router]);

  if (!mounted || !allowAccess) return <LoadingSpinner />;
  return <>{children}</>;
}

