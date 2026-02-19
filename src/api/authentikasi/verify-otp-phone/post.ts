/**
 * API verify OTP phone - POST - consume dari halaman auth/verify-akun/otp
 */
import { apiUser } from "@/lib/api";

export type VerifyOtpPhonePayload = {
  otp: string;
};

export type VerifyOtpPhoneResponse = {
  message: string;
};

export async function postVerifyOtpPhone(body: VerifyOtpPhonePayload): Promise<VerifyOtpPhoneResponse> {
  return apiUser<VerifyOtpPhoneResponse>("/api/v1/verify-otp-phone", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
