// /**
//  * API setup - base URL dan client untuk panggil backend
//  */

// import { logoutAndRedirect } from "@/lib/auth";

// const getUserBaseUrl = (): string => {
//   if (typeof window !== "undefined") {
//     return process.env.NEXT_PUBLIC_API_USER_URL ?? "http://localhost:8080";
//   }
//   return process.env.NEXT_PUBLIC_API_USER_URL ?? "http://localhost:8080";
// };

// // const getUserBaseUrl = (): string => {
// //   // Browser → pakai proxy Next.js (/api/user)
// //   if (typeof window !== "undefined") {
// //     return "";
// //   }
// //   // Server-side (SSR) masih bisa direct ke service
// //   return process.env.NEXT_PUBLIC_API_USER_URL ?? "http://localhost:8080";
// // };

// const getOrderBaseUrl = (): string => {
//   // Di browser pakai proxy Next.js (same-origin) supaya tidak kena CORS
//   if (typeof window !== "undefined") {
//     return "";
//   }
//   return process.env.NEXT_PUBLIC_API_ORDER_URL ?? "http://localhost:8082";
// };

// const getJasaBaseUrl = (): string => {
//   // Di browser pakai proxy Next.js (same-origin) supaya tidak kena CORS
//   if (typeof window !== "undefined") {
//     return "";
//   }
//   return process.env.NEXT_PUBLIC_API_JASA_URL ?? "http://localhost:8081";
// };

// /** URL untuk fetch API Jasa (pakai proxy /api/jasa di browser) */
// export function getJasaFetchUrl(path: string): string {
//   const base = getJasaBaseUrl();
//   const normalizedPath = path.startsWith("/") ? path : `/${path}`;
//   if (base === "") {
//     return `/api/jasa${normalizedPath}`;
//   }
//   return `${base}${normalizedPath}`;
// }

// /** Base URL untuk service User (usermc-percetakan) - port 8080 */
// export const API_USER_BASE = getUserBaseUrl();

// /** Base URL untuk service Order (ordermc-percetakan) - port 8082 */
// export const API_ORDER_BASE = getOrderBaseUrl();

// /** URL untuk fetch API Order (pakai proxy /api/order di browser) */
// export function getOrderFetchUrl(path: string): string {
//   const base = getOrderBaseUrl();
//   const normalizedPath = path.startsWith("/") ? path : `/${path}`;
//   if (base === "") {
//     return `/api/order${normalizedPath}`;
//   }
//   return `${base}${normalizedPath}`;
// }



// /** Base URL untuk service Jasa (server-side); di browser pakai proxy /api/jasa */
// export const API_JASA_BASE = typeof window === "undefined"
//   ? (process.env.NEXT_PUBLIC_API_JASA_URL ?? "http://localhost:8081")
//   : "";

// export type ApiOptions = RequestInit & {
//   token?: string;
// };

// /**
//  * Fetch ke API User (login, register, session, dll)
//  * Error yang dilempar punya property .status (kode HTTP) untuk penanganan 401 dll.
//  */
// export async function apiUser<T>(
//   path: string,
//   options: ApiOptions = {}
// ): Promise<T> {
//   const { token, ...init } = options;
//   const url = `${API_USER_BASE}${path.startsWith("/") ? path : `/${path}`}`;
//   const headers: HeadersInit = {
//     "Content-Type": "application/json",
//     ...(init.headers as Record<string, string>),
//   };
//   if (token) {
//     (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
//   }
//   const res = await fetch(url, { ...init, headers });
//   if (!res.ok) {
//     if (res.status === 401 && typeof window !== "undefined") {
//       logoutAndRedirect();
//     }
//     const err = await res.json().catch(() => ({ error_message: res.statusText }));
//     const e = new Error((err as { error_message?: string }).error_message ?? "Request failed") as Error & { status?: number };
//     e.status = res.status;
//     throw e;
//   }
//   return res.json() as Promise<T>;
// }

// // proxy ngrok user service
// // export async function apiUser<T>(
// //   path: string,
// //   options: ApiOptions = {}
// // ): Promise<T> {
// //   const { token, ...init } = options;

// //   // kalau base "" → pakai proxy /api/user
// //   const base = API_USER_BASE === "" ? "/api/user" : API_USER_BASE;
// //   const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

// //   const headers: HeadersInit = {
// //     ...(init.headers as Record<string, string>),
// //   };

// //   // Jangan paksa JSON kalau FormData (biar upload aman)
// //   if (!(init.body instanceof FormData)) {
// //     (headers as Record<string, string>)["Content-Type"] = "application/json";
// //   }

// //   if (token) {
// //     (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
// //   }

// //   const res = await fetch(url, {
// //     ...init,
// //     headers,
// //     cache: "no-store",
// //   });

// //   if (!res.ok) {
// //     if (res.status === 401 && typeof window !== "undefined") {
// //       logoutAndRedirect();
// //     }
// //     const err = await res.json().catch(() => ({
// //       error_message: res.statusText,
// //     }));
// //     const e = new Error(
// //       (err as { error_message?: string }).error_message ?? "Request failed"
// //     ) as Error & { status?: number };
// //     e.status = res.status;
// //     throw e;
// //   }

// //   return res.json() as Promise<T>;
// // }

// /**
//  * Fetch ke API Order (riwayat order, dll)
//  * Mirip apiUser tapi base URL berbeda (port 8082).
//  */


// export async function apiOrder<T>(
//   path: string,
//   options: ApiOptions = {}
// ): Promise<T> {
//   const { token, ...init } = options;
//   const url = getOrderFetchUrl(path);
//   const headers: HeadersInit = {
//     "Content-Type": "application/json",
//     ...(init.headers as Record<string, string>),
//   };
//   if (token) {
//     (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
//   }
//   const res = await fetch(url, { ...init, headers });
//   if (!res.ok) {
//     if (res.status === 401 && typeof window !== "undefined") {
//       logoutAndRedirect();
//     }
//     const err = await res.json().catch(() => ({ error_message: res.statusText }));
//     const e = new Error((err as { error_message?: string }).error_message ?? "Request failed") as Error & { status?: number };
//     e.status = res.status;
//     throw e;
//   }
//   return res.json() as Promise<T>;
// }

// /**
//  * Fetch ke API Jasa (kategori, layanan, dll)
//  */
// export async function apiJasa<T>(
//   path: string,
//   options: ApiOptions = {}
// ): Promise<T> {
//   const { token, ...init } = options;
//   const url = getJasaFetchUrl(path);
//   console.log("🌐 [apiJasa] Fetching URL:", url);
//   console.log("🌐 [apiJasa] Path:", path);
//   console.log("🌐 [apiJasa] Base URL (server-side):", typeof window === "undefined" ? (process.env.NEXT_PUBLIC_API_JASA_URL ?? "http://localhost:8081") : "browser (using proxy)");
  
//   const headers: HeadersInit = {
//     "Content-Type": "application/json",
//     ...(init.headers as Record<string, string>),
//   };
//   if (token) {
//     (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
//   }
//   // Force no cache untuk selalu ambil data terbaru
//   const fetchOptions = {
//     ...init,
//     headers: {
//       ...headers,
//       'Cache-Control': 'no-cache, no-store, must-revalidate',
//       'Pragma': 'no-cache',
//       'Expires': '0'
//     },
//     cache: 'no-store' as RequestCache
//   };
  
//   const res = await fetch(url, fetchOptions);
//   console.log("📡 [apiJasa] Response status:", res.status, res.statusText);

//   if (!res.ok) {
//     if (res.status === 401 && typeof window !== "undefined") {
//       logoutAndRedirect();
//     }
//     const err = await res.json().catch(() => ({ error_message: res.statusText }));
//     console.error("❌ [apiJasa] Error response:", err);
//     throw new Error((err as { error_message?: string }).error_message ?? "Request failed");
//   }
//   const data = await res.json() as T;
//   console.log("✅ [apiJasa] Response data:", JSON.stringify(data, null, 2));
//   return data;
// }

/**
 * lib/api.ts
 *
 * Base fetch functions untuk semua microservice.
 * Drop-in replacement — signature apiUser / apiJasa / apiOrder tidak berubah.
 *
 * Switch mode via .env:
 *   NEXT_PUBLIC_USE_PROXY=false  → hit langsung localhost:808x  (dev biasa)
 *   NEXT_PUBLIC_USE_PROXY=true   → lewat /api/proxy/*           (ngrok / demo)
 *
 * Kalau USE_PROXY=true, wajib set:
 *   NEXT_PUBLIC_APP_URL=https://xxxx.ngrok-free.app
 */

import { logoutAndRedirect } from "@/lib/auth";

// ─────────────────────────────────────────────────────────────────────────────
// URL Resolver
// ─────────────────────────────────────────────────────────────────────────────

const USE_PROXY = process.env.NEXT_PUBLIC_USE_PROXY === "true";

/** @deprecated Pakai apiJasa langsung dengan FormData */
export function getJasaFetchUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_JASA}${p}`;
}

/**
 * Resolve base URL service.
 *
 * Proxy mode:
 *   - Browser → "/api/proxy/usermc"           (relative, same-origin)
 *   - SSR     → "http://localhost:3000/api/proxy/usermc"  (absolute)
 *
 * Direct mode:
 *   - Selalu → "http://localhost:808x" (atau dari env)
 */

function resolveBase(
  proxyPath: string,   // e.g. "/api/proxy/usermc"
  directUrl: string    // e.g. "http://localhost:8080"
): string {
  if (USE_PROXY) {
    if (typeof window === "undefined") {
      // SSR butuh absolute URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      return `${appUrl}${proxyPath}`;
    }
    // Browser → relative, CORS-safe
    return proxyPath;
  }
  return directUrl;
}

// ─────────────────────────────────────────────────────────────────────────────
// Base URLs per service
// ─────────────────────────────────────────────────────────────────────────────

const BASE_USER = resolveBase(
  "/api/proxy/usermc",
  process.env.NEXT_PUBLIC_API_USER_URL ?? "http://localhost:8080"
);


const BASE_JASA = resolveBase(
  "/api/proxy/jasamc",
  process.env.NEXT_PUBLIC_API_JASA_URL ?? "http://localhost:8081"
);

const BASE_ORDER = resolveBase(
  "/api/proxy/ordermc",
  process.env.NEXT_PUBLIC_API_ORDER_URL ?? "http://localhost:8082"
);

const BASE_PAYMENT = resolveBase(
  "/api/proxy/paymentmc",
  process.env.NEXT_PUBLIC_API_PAYMENT_URL ?? "http://localhost:8083"
);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ApiOptions = RequestInit & {
  /** Bearer token — otomatis di-set ke Authorization header */
  token?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Core fetch helper (internal)
// ─────────────────────────────────────────────────────────────────────────────

async function coreFetch<T>(
  base: string,
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { token, ...init } = options;

  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };

  // Jangan set Content-Type kalau FormData (biar browser set boundary sendiri)
  if (!(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...init, headers });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      logoutAndRedirect();
    }
    const err = await res
      .json()
      .catch(() => ({ error_message: res.statusText }));
    const e = new Error(
      (err as { error_message?: string }).error_message ?? "Request failed"
    ) as Error & { status?: number };
    e.status = res.status;
    throw e;
  }

  // Handle 204 No Content
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API functions
// Signature sama persis dengan api.ts lama — tidak perlu ubah konsumer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch ke User service · port 8080
 * @example
 * const me = await apiUser<User>("/users/me", { token });
 */
export async function apiUser<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  return coreFetch<T>(BASE_USER, path, options);
}

/**
 * Fetch ke Jasa service · port 8081
 * @example
 * const list = await apiJasa<Jasa[]>("/jasa");
 */
export async function apiJasa<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  return coreFetch<T>(BASE_JASA, path, options);
}

/**
 * Fetch ke Order service · port 8082
 * @example
 * const orders = await apiOrder<Order[]>("/orders", { token });
 */
export async function apiOrder<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  return coreFetch<T>(BASE_ORDER, path, options);
}

/**
 * Fetch ke Payment service · port 8083
 * @example
 * const payment = await apiPayment<Payment>("/payments", {
 *   method: "POST",
 *   body: JSON.stringify({ orderId }),
 *   token,
 * });
 */
export async function apiPayment<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  return coreFetch<T>(BASE_PAYMENT, path, options);
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy exports — supaya import lama tidak error
// ─────────────────────────────────────────────────────────────────────────────

/** @deprecated Pakai apiUser langsung */
export const API_USER_BASE = BASE_USER;
/** @deprecated Pakai apiJasa langsung */
export const API_JASA_BASE = BASE_JASA;
/** @deprecated Pakai apiOrder langsung */
export const API_ORDER_BASE = BASE_ORDER;


