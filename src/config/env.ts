/**
 * Env untuk API - dipakai di client (NEXT_PUBLIC_*)
 */

export const env = {
  apiUserUrl: process.env.NEXT_PUBLIC_API_USER_URL ?? "http://localhost:8080",
  apiJasaUrl: process.env.NEXT_PUBLIC_API_JASA_URL ?? "http://localhost:8081",
} as const;
