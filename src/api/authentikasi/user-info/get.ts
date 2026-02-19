/**
 * GET /api/v1/i/user-info - info user yang login (butuh token)
 */
import { apiUser } from "@/lib/api";

export type UserInfoResponse = {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
};

export async function getUserInfo(token: string): Promise<UserInfoResponse> {
  return apiUser<UserInfoResponse>("/api/v1/i/user-info", {
    method: "GET",
    token,
  });
}
