/**
 * app/api/proxy/_handler.ts
 *
 * Universal proxy handler untuk semua service.
 * Support:
 *  - JSON request
 *  - multipart/form-data (upload file)
 *  - query params
 *  - auth header
 */

import { NextRequest, NextResponse } from "next/server";

const TARGETS: Record<string, string> = {
  usermc: process.env.NEXT_PUBLIC_API_USER_URL ?? "http://localhost:8080",
  jasamc: process.env.NEXT_PUBLIC_API_JASA_URL ?? "http://localhost:8081",
  ordermc: process.env.NEXT_PUBLIC_API_ORDER_URL ?? "http://localhost:8082",
  paymentmc: process.env.NEXT_PUBLIC_API_PAYMENT_URL ?? "http://localhost:8083",
};

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxyHandler(
  req: NextRequest,
  ctx: RouteContext,
  service: string,
): Promise<NextResponse> {
  const target = TARGETS[service];

  if (!target) {
    return NextResponse.json(
      { error: `Unknown service: ${service}` },
      { status: 404 },
    );
  }

  // ─────────────────────────────────────────────
  // Build target URL
  // ─────────────────────────────────────────────
  const { path } = await ctx.params;
  const pathname = "/" + path.join("/");
  const search = req.nextUrl.search ?? "";
  const targetUrl = `${target}${pathname}${search}`;

  // ─────────────────────────────────────────────
  // Forward headers (kecuali host)
  // ─────────────────────────────────────────────
  const headers = new Headers();

  req.headers.forEach((val, key) => {
    if (key.toLowerCase() !== "host") {
      headers.set(key, val);
    }
  });

  // ─────────────────────────────────────────────
  // Forward body (🔥 FIX UTAMA DI SINI)
  // ─────────────────────────────────────────────
  let body: BodyInit | undefined;
  const method = req.method;

  if (method !== "GET" && method !== "DELETE") {
    body = req.body ?? undefined; // ✅ fix TS + aman runtime
  }

  try {
    const svcRes = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: "manual", // 🔥 penting untuk OAuth / redirect
      // @ts-ignore (Node.js requirement untuk streaming)
      duplex: "half",
    });

    // ─────────────────────────────────────────────
    // Handle redirect (3xx)
    // ─────────────────────────────────────────────
    if (svcRes.status >= 300 && svcRes.status < 400) {
      const location = svcRes.headers.get("location");

      return new NextResponse(null, {
        status: svcRes.status,
        headers: location ? { Location: location } : undefined,
      });
    }

    // ─────────────────────────────────────────────
    // Forward response headers
    // ─────────────────────────────────────────────
    const resHeaders = new Headers();

    svcRes.headers.forEach((val, key) => {
      if (!["transfer-encoding", "connection"].includes(key.toLowerCase())) {
        resHeaders.set(key, val);
      }
    });

    // ─────────────────────────────────────────────
    // Forward response body
    // ─────────────────────────────────────────────
    const data = await svcRes.arrayBuffer();

    return new NextResponse(data, {
      status: svcRes.status,
      headers: resHeaders,
    });
  } catch (err) {
    console.error(`[proxy/${service}] Cannot reach ${targetUrl}:`, err);

    return NextResponse.json(
      {
        error: `Cannot reach ${service} service`,
        detail: err instanceof Error ? err.message : String(err),
        url: targetUrl,
      },
      { status: 502 },
    );
  }
}

/**
 * Factory handler untuk semua method
 */
export function createHandlers(service: string) {
  const handle = (req: NextRequest, ctx: RouteContext) =>
    proxyHandler(req, ctx, service);

  return {
    GET: handle,
    POST: handle,
    PUT: handle,
    PATCH: handle,
    DELETE: handle,
  };
}
