import LiveDashboard from "./_component/live-dashboard";

/**
 * Live arrivals dashboard for one event. The organiser opens this on the night and watches
 * guests arrive in real time. Data streams from the same-origin SSE proxy; access is
 * authorized backend-side (only the event owner or an admin can open the stream).
 */
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <LiveDashboard eventId={eventId} />;
}
