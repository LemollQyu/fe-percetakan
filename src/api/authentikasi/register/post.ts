/**
 * API register - POST - consume dari halaman auth/register
 */
import { apiUser } from "@/lib/api";

export type RegisterPayload = {
  username: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
};

export type RegisterResponse = {
  message: string;
  note?: string;
};

export async function postRegister(body: RegisterPayload): Promise<RegisterResponse> {
  return apiUser<RegisterResponse>("/api/v1/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
