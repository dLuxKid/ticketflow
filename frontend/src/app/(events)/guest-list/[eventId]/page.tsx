import GuestManager from "./_component/guest-manager";

/**
 * Guest-list management for an invite_only / hybrid event. The organiser imports guests
 * here and the backend issues each a single-use QR invite. Access is authorized backend-side
 * (only the event owner or an admin).
 */
export default async function GuestListPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <GuestManager eventId={eventId} />;
}
