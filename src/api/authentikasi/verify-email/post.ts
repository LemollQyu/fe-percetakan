/**
 * API verify email (kirim OTP) - POST - consume dari halaman auth/verify-akun & otp resend
 */
import { apiUser } from "@/lib/api";

export type VerifyEmailPayload = {
  email: string;
};

export type VerifyEmailResponse = {
  message: string;
  expired?: number;
};

export async function postVerifyEmail(body: VerifyEmailPayload): Promise<VerifyEmailResponse> {
  return apiUser<VerifyEmailResponse>("/api/v1/verify-email", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
