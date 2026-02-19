/**
 * API verify OTP forgot password - POST - consume dari halaman auth/forgot-password/otp
 */
import { apiUser } from "@/lib/api";

export type VerifyOtpForgotPasswordPayload = {
  otp: string;
};

export type VerifyOtpForgotPasswordResponse = {
  message: string;
  note?: string;
  user_id: number;
};

export async function postVerifyOtpForgotPassword(
  body: VerifyOtpForgotPasswordPayload
): Promise<VerifyOtpForgotPasswordResponse> {
  return apiUser<VerifyOtpForgotPasswordResponse>("/api/v1/verify-otp-forgot-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
