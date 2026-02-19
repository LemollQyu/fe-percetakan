/**
 * API forgot-password - POST - consume dari halaman auth/forgot-password & otp (resend)
 */
import { apiUser } from "@/lib/api";

export type ForgotPasswordPayload = {
  user: string;
};

export type ForgotPasswordResponse = {
  message: string;
  expired?: number;
};

export async function postForgotPassword(body: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
  return apiUser<ForgotPasswordResponse>("/api/v1/forgot-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
