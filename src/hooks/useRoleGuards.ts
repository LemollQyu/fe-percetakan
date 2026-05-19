// hooks/useRoleGuard.ts
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthRole, isLoggedIn } from "@/lib/auth";
import type { AuthRole } from "@/lib/auth";

export function useRoleGuard(allowedRole: AuthRole) {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace(allowedRole === "admin" ? "/admin/login" : "/auth/login");
      return;
    }

    const role = getAuthRole();
    if (role !== allowedRole) {
      // Sudah login tapi role salah → redirect ke halaman default role-nya
      router.replace(role === "admin" ? "/admin/dashboard" : "/dashboard");
    }
  }, []);
}
