import Scanner from "./_component/scanner";
import { getEventWorkspace } from "@/utils/queries";

/**
 * Door-scanning page for ushers/organisers/admins. Access is authorized backend-side
 * (admissionService.authorizeScan) - an usher not assigned to this event gets a clear
 * rejection on their first scan attempt, not a page-level block, since the same endpoint
 * serves every event an usher might be assigned to from one shared URL pattern.
 */
export default async function ScanPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  // Fetched here rather than in the client component so the tab strip is correct on
  // first paint - a tab that appears and then vanishes is worse than one that never did.
  const workspace = await getEventWorkspace(eventId);
  return (
    <Scanner
      eventId={eventId}
      hasGuestList={workspace?.hasGuestList ?? false}
    />
  );
}
