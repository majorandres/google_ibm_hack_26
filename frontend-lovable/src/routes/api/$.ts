import { createFileRoute } from "@tanstack/react-router";

// Forwards /api/* to the existing FastAPI backend (RIDERECORD_API_URL), so the browser keeps same-origin calls.
async function forward(request: Request, splat: string | undefined) {
  const base = process.env["RIDERECORD_API_URL"];
  if (!base) return Response.json({ detail: "RideRecord server address is not set yet." }, { status: 503 });
  const incoming = new URL(request.url);
  const target = `${base.replace(/\/$/, "")}/api/${splat ?? ""}${incoming.search}`;
  const headers = new Headers();
  const ct = request.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const res = await fetch(target, { method: request.method, headers, body: hasBody ? await request.arrayBuffer() : null });
  return new Response(res.body, { status: res.status, headers: { "content-type": res.headers.get("content-type") ?? "application/json" } });
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: ({ request, params }) => forward(request, params._splat),
      POST: ({ request, params }) => forward(request, params._splat),
    },
  },
});
