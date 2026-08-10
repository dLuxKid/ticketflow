import LiveDashboard from "./_component/live-dashboard";
import { getEventWorkspace } from "@/utils/queries";

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
  // Fetched here rather than in the client component so the tab strip is correct on
  // first paint - a tab that appears and then vanishes is worse than one that never did.
  const workspace = await getEventWorkspace(eventId);
  return (
    <LiveDashboard
      eventId={eventId}
      hasGuestList={workspace?.hasGuestList ?? false}
    />
  );
}
