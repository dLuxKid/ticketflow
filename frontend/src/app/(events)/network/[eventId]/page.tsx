import NetworkHub from "./_component/network-hub";

/**
 * Guest networking for one event: a live group chat, an opt-in attendee directory, and
 * DMs, open while the event is live. Data streams from the same-origin SSE proxy (same
 * pattern as the organiser live dashboard); access is authorized backend-side — only an
 * attendee with a booking for this event, or its organiser/admin, can open the stream.
 */
export default async function NetworkPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <NetworkHub eventId={eventId} />;
}
