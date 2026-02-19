/**
 * API verify phone (kirim OTP) - POST - consume dari halaman auth/verify-akun & otp resend
 */
import { apiUser } from "@/lib/api";

export type VerifyPhonePayload = {
  phone: string;
};

export type VerifyPhoneResponse = {
  message: string;
  expired?: number;
};

export async function postVerifyPhone(body: VerifyPhonePayload): Promise<VerifyPhoneResponse> {
  return apiUser<VerifyPhoneResponse>("/api/v1/verify-phone", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
