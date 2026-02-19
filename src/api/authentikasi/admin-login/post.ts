/**
 * API admin login - POST - consume dari halaman admin/login
 */
import { apiUser } from "@/lib/api";

export type AdminLoginPayload = {
  username: string;
  password: string;
};

export type AdminLoginResponse = {
  message: string;
  token: string;
};

export async function postAdminLogin(body: AdminLoginPayload): Promise<AdminLoginResponse> {
  return apiUser<AdminLoginResponse>("/api/v1/admin-login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
