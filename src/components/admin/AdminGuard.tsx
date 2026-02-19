 "use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken, getAuthRole } from "@/lib/auth";

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#f5f0eb]">
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
  </div>
);

/**
 * - /admin/login: kalau sudah login admin → redirect /admin/dashboard
 * - /admin/* lainnya: kalau belum login atau bukan admin → redirect /admin/login (user ke /)
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [allowAccess, setAllowAccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const token = getToken();
    const role = getAuthRole();
    const isLoginPage = pathname === "/admin/login";

    if (isLoginPage) {
      if (token && role === "admin") {
        router.replace("/admin/dashboard");
        return;
      }
      setAllowAccess(true);
      return;
    }

    if (!token || role !== "admin") {
      if (role === "user") {
        router.replace("/");
      } else {
        router.replace("/admin/login");
      }
      return;
    }
    // Sudah login sebagai admin → boleh akses dashboard
    setAllowAccess(true);
  }, [mounted, pathname, router]);

  if (!mounted || !allowAccess) return <LoadingSpinner />;
  return <>{children}</>;
}

