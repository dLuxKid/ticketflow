"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Live arrivals dashboard. Subscribes to the same-origin SSE proxy and updates in place as
 * guests are admitted or rejected at the door — no polling, no refresh.
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

const MAX_FEED = 25;

export default function LiveDashboard({ eventId }: { eventId: string }) {
  const [connected, setConnected] = useState(false);
  const [capacity, setCapacity] = useState(0);
  const [sold, setSold] = useState(0);
  const [admitted, setAdmitted] = useState(0);
  const [noShow, setNoShow] = useState<NoShowPrediction | null>(null);
  const [feed, setFeed] = useState<RecentScan[]>([]);
  const feedRef = useRef<RecentScan[]>([]);

  const pushFeed = (scan: RecentScan) => {
    feedRef.current = [scan, ...feedRef.current].slice(0, MAX_FEED);
    setFeed(feedRef.current);
  };

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
    });

    return () => source.close();
  }, [eventId]);

  const pct = capacity > 0 ? Math.min(100, Math.round((admitted / capacity) * 100)) : 0;

  return (
    <section className="mx-auto max-w-3xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Live arrivals</h1>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
            connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          {connected ? "Live" : "Reconnecting…"}
        </span>
      </header>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <Stat label="Admitted" value={admitted} />
        <Stat label="Sold" value={sold} />
        <Stat label="Capacity" value={capacity} />
      </div>

      <div className="mb-6">
        <div className="mb-1 flex justify-between text-sm text-gray-500">
          <span>Arrivals</span>
          <span>{pct}% of capacity</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-[#6528F7] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {noShow && noShow.pendingCount > 0 && (
        <div className="mb-8 rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm">
          <p className="font-medium text-amber-800">
            ~{noShow.expectedNoShows} of the {noShow.pendingCount} remaining guest
            {noShow.pendingCount === 1 ? "" : "s"} may not show up
          </p>
          <p className="mt-1 text-amber-700">
            Average predicted no-show risk:{" "}
            {Math.round(noShow.averageProbability * 100)}%. Estimate from a model
            trained on synthetic data pre-launch — treat as a rough guide, not a
            guarantee.
          </p>
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold">Recent scans</h2>
      {feed.length === 0 ? (
        <p className="text-sm text-gray-500">No scans yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {feed.map((scan, i) => (
            <li
              key={`${scan.bookingId}-${i}`}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span
                className={
                  scan.outcome === "admitted" ? "text-green-600" : "text-red-600"
                }
              >
                {scan.outcome === "admitted"
                  ? "Admitted"
                  : `Rejected — ${scan.reason ?? "unknown"}`}
              </span>
              <time className="text-gray-400">
                {new Date(scan.at).toLocaleTimeString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-100 p-4 text-center">
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
    </div>
  );
}
