import { NextRequest } from "next/server";

const TARGET = "http://localhost:8080";

async function handler(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const url = `${TARGET}/${path}`;

  const res = await fetch(url, {
    method: req.method,
    headers: {
      ...Object.fromEntries(req.headers),
    },
    body:
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : await req.arrayBuffer(),
    cache: "no-store",
  });

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };