/**
 * API setup - base URL dan client untuk panggil backend
 */

import { logoutAndRedirect } from "@/lib/auth";

const getUserBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_USER_URL ?? "http://localhost:8080";
  }
  return process.env.NEXT_PUBLIC_API_USER_URL ?? "http://localhost:8080";
};

// const getUserBaseUrl = (): string => {
//   // Browser → pakai proxy Next.js (/api/user)
//   if (typeof window !== "undefined") {
//     return "";
//   }
//   // Server-side (SSR) masih bisa direct ke service
//   return process.env.NEXT_PUBLIC_API_USER_URL ?? "http://localhost:8080";
// };

const getOrderBaseUrl = (): string => {
  // Di browser pakai proxy Next.js (same-origin) supaya tidak kena CORS
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.NEXT_PUBLIC_API_ORDER_URL ?? "http://localhost:8082";
};

const getJasaBaseUrl = (): string => {
  // Di browser pakai proxy Next.js (same-origin) supaya tidak kena CORS
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.NEXT_PUBLIC_API_JASA_URL ?? "http://localhost:8081";
};

/** URL untuk fetch API Jasa (pakai proxy /api/jasa di browser) */
export function getJasaFetchUrl(path: string): string {
  const base = getJasaBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (base === "") {
    return `/api/jasa${normalizedPath}`;
  }
  return `${base}${normalizedPath}`;
}

/** Base URL untuk service User (usermc-percetakan) - port 8080 */
export const API_USER_BASE = getUserBaseUrl();

/** Base URL untuk service Order (ordermc-percetakan) - port 8082 */
export const API_ORDER_BASE = getOrderBaseUrl();

/** URL untuk fetch API Order (pakai proxy /api/order di browser) */
export function getOrderFetchUrl(path: string): string {
  const base = getOrderBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (base === "") {
    return `/api/order${normalizedPath}`;
  }
  return `${base}${normalizedPath}`;
}



/** Base URL untuk service Jasa (server-side); di browser pakai proxy /api/jasa */
export const API_JASA_BASE = typeof window === "undefined"
  ? (process.env.NEXT_PUBLIC_API_JASA_URL ?? "http://localhost:8081")
  : "";

export type ApiOptions = RequestInit & {
  token?: string;
};

/**
 * Fetch ke API User (login, register, session, dll)
 * Error yang dilempar punya property .status (kode HTTP) untuk penanganan 401 dll.
 */
export async function apiUser<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { token, ...init } = options;
  const url = `${API_USER_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      logoutAndRedirect();
    }
    const err = await res.json().catch(() => ({ error_message: res.statusText }));
    const e = new Error((err as { error_message?: string }).error_message ?? "Request failed") as Error & { status?: number };
    e.status = res.status;
    throw e;
  }
  return res.json() as Promise<T>;
}

// proxy ngrok user service
// export async function apiUser<T>(
//   path: string,
//   options: ApiOptions = {}
// ): Promise<T> {
//   const { token, ...init } = options;

//   // kalau base "" → pakai proxy /api/user
//   const base = API_USER_BASE === "" ? "/api/user" : API_USER_BASE;
//   const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

//   const headers: HeadersInit = {
//     ...(init.headers as Record<string, string>),
//   };

//   // Jangan paksa JSON kalau FormData (biar upload aman)
//   if (!(init.body instanceof FormData)) {
//     (headers as Record<string, string>)["Content-Type"] = "application/json";
//   }

//   if (token) {
//     (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
//   }

//   const res = await fetch(url, {
//     ...init,
//     headers,
//     cache: "no-store",
//   });

//   if (!res.ok) {
//     if (res.status === 401 && typeof window !== "undefined") {
//       logoutAndRedirect();
//     }
//     const err = await res.json().catch(() => ({
//       error_message: res.statusText,
//     }));
//     const e = new Error(
//       (err as { error_message?: string }).error_message ?? "Request failed"
//     ) as Error & { status?: number };
//     e.status = res.status;
//     throw e;
//   }

//   return res.json() as Promise<T>;
// }

/**
 * Fetch ke API Order (riwayat order, dll)
 * Mirip apiUser tapi base URL berbeda (port 8082).
 */


export async function apiOrder<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { token, ...init } = options;
  const url = getOrderFetchUrl(path);
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      logoutAndRedirect();
    }
    const err = await res.json().catch(() => ({ error_message: res.statusText }));
    const e = new Error((err as { error_message?: string }).error_message ?? "Request failed") as Error & { status?: number };
    e.status = res.status;
    throw e;
  }
  return res.json() as Promise<T>;
}

/**
 * Fetch ke API Jasa (kategori, layanan, dll)
 */
export async function apiJasa<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { token, ...init } = options;
  const url = getJasaFetchUrl(path);
  console.log("🌐 [apiJasa] Fetching URL:", url);
  console.log("🌐 [apiJasa] Path:", path);
  console.log("🌐 [apiJasa] Base URL (server-side):", typeof window === "undefined" ? (process.env.NEXT_PUBLIC_API_JASA_URL ?? "http://localhost:8081") : "browser (using proxy)");
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  // Force no cache untuk selalu ambil data terbaru
  const fetchOptions = {
    ...init,
    headers: {
      ...headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    cache: 'no-store' as RequestCache
  };
  
  const res = await fetch(url, fetchOptions);
  console.log("📡 [apiJasa] Response status:", res.status, res.statusText);

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      logoutAndRedirect();
    }
    const err = await res.json().catch(() => ({ error_message: res.statusText }));
    console.error("❌ [apiJasa] Error response:", err);
    throw new Error((err as { error_message?: string }).error_message ?? "Request failed");
  }
  const data = await res.json() as T;
  console.log("✅ [apiJasa] Response data:", JSON.stringify(data, null, 2));
  return data;
}
