/**
 * API change password - POST - set password baru setelah OTP lupa password
 * Consume dari halaman auth/forgot-password/set-password
 */
import { apiUser } from "@/lib/api";

export type ChangePasswordPayload = {
  user_id: number;
  password: string;
  confirm_password: string;
};

export type ChangePasswordResponse = {
  message: string;
};

export async function postChangePassword(body: ChangePasswordPayload): Promise<ChangePasswordResponse> {
  return apiUser<ChangePasswordResponse>("/api/v1/change-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
