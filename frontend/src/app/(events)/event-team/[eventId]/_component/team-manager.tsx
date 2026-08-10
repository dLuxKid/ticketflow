"use client";

import { useEffect, useState, useTransition } from "react";

import { getUshers, assignUsher, unassignUsher } from "@/utils/actions";
import PageHeader from "@/components/ui/page-header";
import { eventTabs } from "@/utils/event-tabs";

/**
 * Door-staff (usher) management. Assigning someone here is what actually grants them
 * access to /scan/[eventId] - it sets the same assignedEvents field
 * admissionService.authorizeScan checks, not a separate permission list.
 */

type Usher = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

export default function TeamManager({
  eventId,
  hasGuestList = false,
}: {
  eventId: string;
  /** Whether this event has a guest list, so the tab strip can omit it. */
  hasGuestList?: boolean;
}) {
  const [ushers, setUshers] = useState<Usher[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [removing, setRemoving] = useState<string | null>(null);

  const loadUshers = () =>
    getUshers(eventId).then((res) => {
      if (res?.status === "success") setUshers(res.data.ushers ?? []);
    });

  useEffect(() => {
    loadUshers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(() => {
      void (async () => {
        const res = await assignUsher(eventId, email);
        if (res?.status === "success") {
          setMessage(res.message ?? "Usher added.");
          setEmail("");
          await loadUshers();
        } else {
          setError(res?.message ?? "Couldn't add this person. Check the email.");
        }
      })();
    });
  };

  const handleRemove = async (usher: Usher) => {
    const confirmed = window.confirm(
      `Remove ${usher.name} from this event's door staff? They will no longer be able to scan tickets for it.`,
    );
    if (!confirmed) return;

    setRemoving(usher._id);
    const res = await unassignUsher(eventId, usher._id);
    setRemoving(null);
    if (res?.status === "success") {
      await loadUshers();
    } else {
      setError(res?.message ?? "Couldn't remove this person. Try again.");
    }
  };

  return (
    <section className="flex-center flex-col w-full max-w-screen-md mx-auto gap-6 py-10 px-4">
      <PageHeader
        eyebrow="TicketFlow"
        title="Door staff"
        subtitle="Add anyone with a TicketFlow account by email - they can scan and admit guests for this event only, without access to edit it or see your other events."
        tabs={eventTabs(eventId, "team", hasGuestList)}
      />

      <div className="w-full rounded-big bg-main-white shadow shadow-black/10 p-4 sm:p-6">
        <form onSubmit={handleAssign} className="flex gap-3">
          <label htmlFor="usher-email" className="sr-only">
            Usher&apos;s email
          </label>
          <input
            id="usher-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usher@example.com"
            className="flex-1 rounded-md border border-main-purple bg-sec-grey px-4 h-12 text-sm text-main-black"
          />
          <button
            type="submit"
            disabled={pending || email.trim() === ""}
            className="bg-main-purple text-main-white px-6 rounded-big font-medium shrink-0"
          >
            {pending ? "Adding…" : "Add"}
          </button>
        </form>
        <div aria-live="polite" role="status">
          {error && <p role="alert" className="error-text mt-3">{error}</p>}
          {message && <p className="mt-3 text-sm text-green-700">{message}</p>}
        </div>
      </div>

      <div className="w-full rounded-big bg-main-white shadow shadow-black/10 p-4 sm:p-6">
        <h2 className="sub-title-text text-main-black mb-4">
          Assigned ({ushers.length})
        </h2>
        {ushers.length === 0 ? (
          <p className="body-text text-main-black/60">
            No door staff assigned yet - only you (and admins) can scan tickets for this
            event.
          </p>
        ) : (
          <ul className="divide-y divide-main-light-grey/40">
            {ushers.map((u) => (
              <li key={u._id} className="flex-between py-3 text-sm">
                <div>
                  <p className="font-medium text-main-black">{u.name}</p>
                  <p className="text-main-black/60">{u.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(u)}
                  disabled={removing === u._id}
                  className="text-xs text-main-error-red underline decoration-dotted underline-offset-2"
                >
                  {removing === u._id ? "Removing…" : "Remove"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
