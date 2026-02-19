/**
 * POST /api/v1/i/logout - invalidate session di server (user: hapus session, admin: 200)
 * Butuh Bearer token. Setelah panggil ini, client wajib clear token (clearAuth) dan redirect.
 */
import { apiUser } from "@/lib/api";

export type LogoutResponse = {
  message: string;
};

export async function logout(token: string): Promise<LogoutResponse> {
  return apiUser<LogoutResponse>("/api/v1/i/logout", {
    method: "POST",
    token,
  });
}
