import { cookies } from "next/headers";

import { API_URLS } from "@/utils/urls";

/**
 * Same-origin proxy for the backend networking SSE stream - same reasoning as the live
 * dashboard's stream proxy: `EventSource` cannot set an Authorization header, and the JWT
 * lives in an httpOnly cookie that would not travel cross-origin to the API, so the browser
 * connects here and this route forwards the cookie server-side as a Bearer token.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  const token = (await cookies()).get("jwt")?.value;

  const upstream = await fetch(API_URLS.events.networkStream(eventId), {
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
        message: "Unable to open the networking stream",
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
