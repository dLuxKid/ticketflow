import Link from "next/link";

import GuestManager from "./_component/guest-manager";
import { getEventWorkspace } from "@/utils/queries";

/**
 * Guest-list management for an invite_only / hybrid event. The organiser imports guests
 * here and the backend issues each a single-use QR invite. Access is authorized backend-side
 * (only the event owner or an admin).
 *
 * A public event has no guest list at all, and the API rejects guest-list calls for one.
 * Nothing links here for a public event any more, but the URL is guessable and an old
 * bookmark may still point at it, so that case is answered with an explanation of what to
 * change rather than the manager UI failing on every request it makes.
 */
export default async function GuestListPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  // Fetched here rather than in the client component so the tab strip is correct on
  // first paint - a tab that appears and then vanishes is worse than one that never did.
  const workspace = await getEventWorkspace(eventId);

  // Only when the event is known AND known to be public. A null workspace means the lookup
  // itself failed (no permission, backend down), which is a different problem - that falls
  // through to the manager so its own error handling reports it.
  if (workspace && !workspace.hasGuestList) {
    return (
      <section className="mx-auto max-w-2xl">
        <div className="rounded-big border border-main-light-grey/70 bg-main-white p-6">
          <h1 className="text-xl font-bold text-main-black">
            {workspace.eventName} has no guest list
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-sec-black/75">
            Guest lists belong to <strong>invite-only</strong> and{" "}
            <strong>hybrid</strong> events. This one is public, so everyone
            attending gets in by buying a ticket — there is no separate list to
            invite people from.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-sec-black/75">
            To invite named guests, change the event&apos;s access mode to
            invite-only or hybrid.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/edit-event/${workspace.slug}`}
              className="rounded-sm bg-main-purple px-4 py-2.5 text-sm font-semibold text-main-white"
            >
              Edit this event
            </Link>
            <Link
              href={`/dashboard/${eventId}`}
              className="rounded-sm border border-main-light-grey px-4 py-2.5 text-sm font-semibold text-main-black"
            >
              Go to live dashboard
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <GuestManager
      eventId={eventId}
      hasGuestList={workspace?.hasGuestList ?? false}
    />
  );
}
