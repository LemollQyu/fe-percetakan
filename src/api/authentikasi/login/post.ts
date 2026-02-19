/**
 * API login - POST - consume dari halaman auth/login
 */
import { apiUser } from "@/lib/api";

export type LoginPayload = {
  user: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  token: string;
};

export async function postLogin(body: LoginPayload): Promise<LoginResponse> {
  return apiUser<LoginResponse>("/api/v1/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
