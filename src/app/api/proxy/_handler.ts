/**
 * app/api/proxy/_handler.ts
 *
 * Satu handler yang dipakai semua route proxy.
 * Tugasnya: forward request dari browser/ngrok → localhost:808x
 *
 * Yang di-forward:
 *   - Method (GET/POST/PUT/PATCH/DELETE)
 *   - Headers (Authorization, Content-Type, dll) — kecuali 'host'
 *   - Body (JSON maupun FormData/multipart)
 *   - Query string (?foo=bar&...)
 */

import { NextRequest, NextResponse } from "next/server";

const TARGETS: Record<string, string> = {
  usermc:    process.env.NEXT_PUBLIC_API_USER_URL    ?? "http://localhost:8080",
  jasamc:    process.env.NEXT_PUBLIC_API_JASA_URL    ?? "http://localhost:8081",
  ordermc:   process.env.NEXT_PUBLIC_API_ORDER_URL   ?? "http://localhost:8082",
  paymentmc: process.env.NEXT_PUBLIC_API_PAYMENT_URL ?? "http://localhost:8083",
};

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxyHandler(
  req: NextRequest,
  ctx: RouteContext,
  service: string
): Promise<NextResponse> {
  const target = TARGETS[service];
  if (!target) {
    return NextResponse.json({ error: `Unknown service: ${service}` }, { status: 404 });
  }

  // Build target URL
  const { path } = await ctx.params;
  const pathname = "/" + path.join("/");
  const search = req.nextUrl.search ?? "";
  const targetUrl = `${target}${pathname}${search}`;

  // Forward headers — skip 'host' supaya tidak conflict dengan target
  const headers = new Headers();
  req.headers.forEach((val, key) => {
    if (key.toLowerCase() !== "host") headers.set(key, val);
  });

  // Build body
  let body: BodyInit | undefined;
  const method = req.method;
  if (method !== "GET" && method !== "DELETE") {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("multipart/form-data")) {
      body = await req.blob();
      headers.delete("content-type");
    } else {
      body = await req.text();
    }
  }

  // Hit service di local
  // try {
  //   const svcRes = await fetch(targetUrl, { method, headers, body });

  //   const resHeaders = new Headers();
  //   svcRes.headers.forEach((val, key) => {
  //     if (!["transfer-encoding", "connection"].includes(key.toLowerCase())) {
  //       resHeaders.set(key, val);
  //     }
  //   });

  //   return new NextResponse(await svcRes.arrayBuffer(), {
  //     status: svcRes.status,
  //     headers: resHeaders,
  //   });
  // } catch (err) {
  //   console.error(`[proxy/${service}] Cannot reach ${targetUrl}:`, err);
  //   return NextResponse.json(
  //     {
  //       error: `Cannot reach ${service} service`,
  //       detail: err instanceof Error ? err.message : String(err),
  //       url: targetUrl,
  //     },
  //     { status: 502 }
  //   );
  // }

try {
  const svcRes = await fetch(targetUrl, {
    method,
    headers,
    body,
    redirect: "manual", // 🔥 WAJIB untuk OAuth
  });

  // 🔥 HANDLE REDIRECT (OAuth fix)
  if (svcRes.status >= 300 && svcRes.status < 400) {
    const location = svcRes.headers.get("location");

    return new NextResponse(null, {
      status: svcRes.status,
      headers: location ? { Location: location } : undefined,
    });
  }

  // ✅ NORMAL API FLOW
  const resHeaders = new Headers();
  svcRes.headers.forEach((val, key) => {
    if (!["transfer-encoding", "connection"].includes(key.toLowerCase())) {
      resHeaders.set(key, val);
    }
  });

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
    { status: 502 }
  );
}
}

/**
 * Buat semua HTTP method handler untuk satu service.
 *
 * @example
 * export const { GET, POST, PUT, PATCH, DELETE } = createHandlers("usermc");
 */
export function createHandlers(service: string) {
  const handle = (req: NextRequest, ctx: RouteContext) =>
    proxyHandler(req, ctx, service);

  return { GET: handle, POST: handle, PUT: handle, PATCH: handle, DELETE: handle };
}
