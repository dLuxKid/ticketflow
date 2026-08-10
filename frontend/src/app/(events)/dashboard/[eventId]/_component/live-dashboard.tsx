"use client";

import { useEffect, useRef, useState } from "react";

import { getAnomalies } from "@/utils/actions";
import PageHeader from "@/components/ui/page-header";
import { eventTabs } from "@/utils/event-tabs";

/**
 * Live arrivals dashboard. Subscribes to the same-origin SSE proxy and updates in place as
 * guests are admitted or rejected at the door - no polling, no refresh.
 */

type Snapshot = {
  eventId: string;
  capacity: number;
  sold: number;
  admitted: number;
  noShow: NoShowPrediction;
  recent: RecentScan[];
};

type NoShowPrediction = {
  pendingCount: number;
  expectedNoShows: number;
  averageProbability: number;
};

type RecentScan = {
  bookingId: string;
  outcome: "admitted" | "rejected";
  reason?: string;
  at: string;
};

type AdmittedEvent = {
  eventId: string;
  bookingId: string;
  name?: string;
  ticketType?: string;
  at: string;
};

type RejectedEvent = {
  eventId: string;
  bookingId: string;
  reason?: string;
};

type FlaggedTicket = {
  bookingId: string;
  flags: string[];
  scanCount: number;
};

const MAX_FEED = 25;

const FLAG_LABEL: Record<string, string> = {
  repeated_rejects: "Repeated rejected scans",
  multi_device: "Scanned from multiple devices",
  rapid_sequential: "Scans too close together",
};

export default function LiveDashboard({
  eventId,
  hasGuestList = false,
}: {
  eventId: string;
  /** Whether this event has a guest list, so the tab strip can omit it. */
  hasGuestList?: boolean;
}) {
  const [connected, setConnected] = useState(false);
  const [capacity, setCapacity] = useState(0);
  const [sold, setSold] = useState(0);
  const [admitted, setAdmitted] = useState(0);
  const [noShow, setNoShow] = useState<NoShowPrediction | null>(null);
  const [feed, setFeed] = useState<RecentScan[]>([]);
  const [flagged, setFlagged] = useState<FlaggedTicket[]>([]);
  const feedRef = useRef<RecentScan[]>([]);

  const pushFeed = (scan: RecentScan) => {
    feedRef.current = [scan, ...feedRef.current].slice(0, MAX_FEED);
    setFeed(feedRef.current);
  };

  const loadAnomalies = () =>
    getAnomalies(eventId).then((res) => {
      if (res?.status === "success") setFlagged(res.data.flagged ?? []);
    });

  useEffect(() => {
    loadAnomalies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useEffect(() => {
    const source = new EventSource(`/api/events/${eventId}/stream`);

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);

    source.addEventListener("snapshot", (e) => {
      const s: Snapshot = JSON.parse((e as MessageEvent).data);
      setCapacity(s.capacity);
      setSold(s.sold);
      setAdmitted(s.admitted);
      setNoShow(s.noShow ?? null);
      feedRef.current = s.recent ?? [];
      setFeed(feedRef.current);
    });

    source.addEventListener("guest:admitted", (e) => {
      const a: AdmittedEvent = JSON.parse((e as MessageEvent).data);
      setAdmitted((n) => n + 1);
      pushFeed({ bookingId: a.bookingId, outcome: "admitted", at: a.at });
    });

    source.addEventListener("guest:rejected", (e) => {
      const r: RejectedEvent = JSON.parse((e as MessageEvent).data);
      pushFeed({
        bookingId: r.bookingId,
        outcome: "rejected",
        reason: r.reason,
        at: new Date().toISOString(),
      });
      loadAnomalies(); // a rejection can flip a ticket into "flagged" - refresh
    });

    return () => source.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const pct = capacity > 0 ? Math.min(100, Math.round((admitted / capacity) * 100)) : 0;

  return (
    <section className="flex-center flex-col w-full max-w-screen-md mx-auto gap-6 py-10 px-4">
      <PageHeader
        eyebrow="TicketFlow"
        title="Live arrivals"
        subtitle="Watch guests arrive in real time as they're scanned at the door."
        tabs={eventTabs(eventId, "dashboard", hasGuestList)}
        right={
          <span
            role="status"
            aria-live="polite"
            className={`flex-center gap-2 rounded-big px-3 py-1.5 text-sm font-medium ${
              connected ? "bg-main-white text-green-700" : "bg-main-white/20 text-main-white"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-main-white/60"}`}
            />
            {connected ? "Live" : "Reconnecting…"}
          </span>
        }
      />

      <div className="w-full grid grid-cols-3 gap-4">
        <Stat label="Admitted" value={admitted} />
        <Stat label="Sold" value={sold} />
        <Stat label="Capacity" value={capacity} />
      </div>

      <div className="w-full rounded-big bg-main-white shadow shadow-black/10 p-4 sm:p-6">
        <div className="flex-between text-sm text-main-black/70 mb-1">
          <span id="arrivals-label" className="font-semibold">Arrivals</span>
          <span>{pct}% of capacity</span>
        </div>
        <div
          role="progressbar"
          aria-labelledby="arrivals-label"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-3 w-full overflow-hidden rounded-full bg-main-grey-bg"
        >
          <div
            className="h-full rounded-full bg-main-purple transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {noShow && noShow.pendingCount > 0 && (
        <div className="w-full rounded-big border border-amber-200 bg-amber-50 p-4 sm:p-6 text-sm">
          <p className="font-semibold text-amber-800">
            ~{noShow.expectedNoShows} of the {noShow.pendingCount} remaining guest
            {noShow.pendingCount === 1 ? "" : "s"} may not show up
          </p>
          <p className="mt-1 text-amber-700">
            Average predicted no-show risk:{" "}
            {Math.round(noShow.averageProbability * 100)}%. Estimate from a model
            trained on synthetic data pre-launch - treat as a rough guide, not a
            guarantee.
          </p>
        </div>
      )}

      {flagged.length > 0 && (
        <div className="w-full rounded-big border border-main-error-red/30 bg-main-error-red/5 p-4 sm:p-6">
          <h2 className="sub-title-text text-main-error-red mb-3">
            Flagged tickets ({flagged.length})
          </h2>
          <ul className="flex flex-col gap-3">
            {flagged.map((f) => (
              <li key={f.bookingId} className="text-sm">
                <p className="font-medium text-main-black">
                  Ticket ending {f.bookingId.slice(-6)} - {f.scanCount} scans
                </p>
                <p className="text-main-black/60">
                  {f.flags.map((flag) => FLAG_LABEL[flag] ?? flag).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="w-full rounded-big bg-main-white shadow shadow-black/10 p-4 sm:p-6">
        <h2 className="sub-title-text text-main-black mb-3">Recent scans</h2>
        {feed.length === 0 ? (
          <p className="body-text text-main-black/60">No scans yet.</p>
        ) : (
          <ul aria-live="polite" className="divide-y divide-main-light-grey/40">
            {feed.map((scan, i) => (
              <li
                key={`${scan.bookingId}-${i}`}
                className="flex-between py-2 text-sm"
              >
                <span
                  className={
                    scan.outcome === "admitted" ? "text-green-700" : "text-main-error-red"
                  }
                >
                  {scan.outcome === "admitted"
                    ? "Admitted"
                    : `Rejected - ${scan.reason ?? "unknown"}`}
                </span>
                <time dateTime={scan.at} className="text-main-black/60">
                  {new Date(scan.at).toLocaleTimeString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-big bg-main-white shadow shadow-black/10 p-4 text-center">
      <div className="text-3xl font-bold tabular-nums text-main-purple">{value}</div>
      <div className="text-xs uppercase tracking-wide text-main-black/60">{label}</div>
    </div>
  );
}
