import TeamManager from "./_component/team-manager";
import { getEventWorkspace } from "@/utils/queries";

/**
 * Door-staff management for one event. Access is authorized backend-side (owner/admin,
 * same rule as the dashboard and guest list).
 */
export default async function EventTeamPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  // Fetched here rather than in the client component so the tab strip is correct on
  // first paint - a tab that appears and then vanishes is worse than one that never did.
  const workspace = await getEventWorkspace(eventId);
  return (
    <TeamManager
      eventId={eventId}
      hasGuestList={workspace?.hasGuestList ?? false}
    />
  );
}
