import TeamManager from "./_component/team-manager";

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
  return <TeamManager eventId={eventId} />;
}
