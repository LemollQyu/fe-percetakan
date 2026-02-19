/**
 * GET /api/v1/i/admin/info - info admin yang login (butuh token + role admin)
 */
import { apiUser } from "@/lib/api";

export type AdminInfoResponse = {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
};

export async function getAdminInfo(token: string): Promise<AdminInfoResponse> {
  return apiUser<AdminInfoResponse>("/api/v1/i/admin/info", {
    method: "GET",
    token,
  });
}
