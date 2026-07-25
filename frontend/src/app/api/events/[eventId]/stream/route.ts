import { cookies } from "next/headers";

import { API_URLS } from "@/utils/urls";

/**
 * Same-origin proxy for the backend live-dashboard SSE stream.
 *
 * The browser's EventSource cannot set an Authorization header, and the JWT lives in an
 * httpOnly cookie that would not travel cross-origin to the API. So the browser connects to
 * this same-origin route, which reads the cookie server-side, forwards it to the backend as
 * a Bearer token, and streams the event-stream body straight back. The token never reaches
 * client code or a URL.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  const token = (await cookies()).get("jwt")?.value;

  const upstream = await fetch(API_URLS.events.stream(eventId), {
    headers: {
      Authorization: `Bearer ${token ?? ""}`,
      Accept: "text/event-stream",
    },
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Unable to open the dashboard stream",
      }),
      {
        status: upstream.status || 502,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
