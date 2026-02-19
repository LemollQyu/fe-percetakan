/**
 * API verify OTP email - POST - consume dari halaman auth/verify-akun/otp
 */
import { apiUser } from "@/lib/api";

export type VerifyOtpEmailPayload = {
  otp: string;
};

export type VerifyOtpEmailResponse = {
  message: string;
};

export async function postVerifyOtpEmail(body: VerifyOtpEmailPayload): Promise<VerifyOtpEmailResponse> {
  return apiUser<VerifyOtpEmailResponse>("/api/v1/verify-otp-email", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
