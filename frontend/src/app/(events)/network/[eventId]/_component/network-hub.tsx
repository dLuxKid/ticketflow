"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  getDmThread,
  postDm,
  postGroupMessage,
  setNetworkOptIn,
} from "@/utils/actions";
import PageHeader from "@/components/ui/page-header";
import { useUser } from "@/store/useUser";

/**
 * Guest networking hub: group chat, opt-in directory, and DMs for one event, all fed by a
 * single SSE connection (same shape as live-dashboard.tsx's EventSource subscription).
 * Sending is a normal REST call - SSE is receive-only - and the sender sees their own
 * message arrive back over the same stream, so there's no optimistic local state to keep in
 * sync, matching how the live dashboard handles scans.
 *
 * Liveness is recomputed client-side on a timer from the event's actual start/end
 * (delivered once in the snapshot), not held as a static string from that snapshot - a tab
 * left open across the boundary would otherwise keep showing "Live" long after the window
 * closed, while the server correctly rejects sends, with nothing on screen explaining why.
 */

type SenderRef = { _id: string; name: string };

type ChatMessage = {
  _id: string;
  sender: SenderRef;
  recipient: string | null;
  body: string;
  createdAt: string;
};

type DirectoryEntry = {
  _id: string;
  name: string;
  networkingBio?: string;
  user?: string;
  vip?: boolean;
};

type Tab = "group" | "directory" | "dms";

export default function NetworkHub({ eventId }: { eventId: string }) {
  const { data: userData } = useUser();
  const myId: string | undefined = userData?.data?.user?._id;

  const [connected, setConnected] = useState(false);
  const [eventWindow, setEventWindow] = useState<{ startDate: string; endDate: string } | null>(
    null,
  );
  // Named in the heading so a guest arriving from an emailed link can tell which event's
  // room they are in - several may be open at once.
  const [eventName, setEventName] = useState<string>("");
  const [liveStatus, setLiveStatus] = useState<"loading" | "upcoming" | "live" | "past">(
    "loading",
  );
  const [tab, setTab] = useState<Tab>("group");

  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [directory, setDirectory] = useState<DirectoryEntry[]>([]);
  const [dmThreads, setDmThreads] = useState<Record<string, ChatMessage[]>>({});
  const [activePeer, setActivePeer] = useState<DirectoryEntry | null>(null);

  const [groupInput, setGroupInput] = useState("");
  const [dmInput, setDmInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [optedIn, setOptedIn] = useState(false);

  const groupEndRef = useRef<HTMLDivElement>(null);
  const dmEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const source = new EventSource(`/api/events/${eventId}/network/stream`);

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);

    source.addEventListener("snapshot", (e) => {
      const s = JSON.parse((e as MessageEvent).data);
      setEventWindow({ startDate: s.startDate, endDate: s.endDate });
      setEventName(s.eventName ?? "");
      setGroupMessages(s.group ?? []);
      setDirectory(s.directory ?? []);
      const mine = (s.directory ?? []).find(
        (d: DirectoryEntry) => d.user === myId,
      );
      if (mine) {
        setOptedIn(true);
        setBioInput(mine.networkingBio ?? "");
      }
    });

    source.addEventListener("chat:message", (e) => {
      const message: ChatMessage = JSON.parse((e as MessageEvent).data);
      if (message.recipient === null) {
        setGroupMessages((prev) => [...prev, message]);
        return;
      }
      const peerId =
        message.recipient === myId ? message.sender._id : message.recipient;
      setDmThreads((prev) => {
        if (!(peerId in prev)) return prev; // thread not open - will load fresh when opened
        return { ...prev, [peerId]: [...prev[peerId], message] };
      });
    });

    return () => source.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, myId]);

  useEffect(() => {
    groupEndRef.current?.scrollIntoView({ block: "end" });
  }, [groupMessages]);

  useEffect(() => {
    dmEndRef.current?.scrollIntoView({ block: "end" });
  }, [dmThreads, activePeer]);

  // Recompute liveness against the wall clock every few seconds, rather than trusting the
  // one-time string the snapshot carried - the whole reason this exists (see file header).
  useEffect(() => {
    if (!eventWindow) return;

    const recompute = () => {
      const now = Date.now();
      const start = new Date(eventWindow.startDate).getTime();
      // Must mirror Event.isLive on the server exactly: the window runs to the END of the
      // final day. Single-day events are commonly stored with startDate === endDate, which
      // under an exact-instant comparison is a zero-length window - the channel would say
      // "not live" for the entire event while the server happily accepted messages.
      const end = new Date(eventWindow.endDate);
      end.setUTCHours(23, 59, 59, 999);
      setLiveStatus(
        now < start ? "upcoming" : now <= end.getTime() ? "live" : "past",
      );
    };

    recompute();
    const id = setInterval(recompute, 5000);
    return () => clearInterval(id);
  }, [eventWindow]);

  const live = liveStatus === "live";

  const sendGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = groupInput.trim();
    if (!body) return;
    setGroupInput("");
    const res = await postGroupMessage(eventId, body);
    if (res?.status !== "success") {
      toast.error(res?.message ?? "Couldn't send your message");
    }
  };

  const openDm = async (peer: DirectoryEntry) => {
    setActivePeer(peer);
    setTab("dms");
    if (!peer.user) return;
    const res = await getDmThread(eventId, peer.user);
    if (res?.status === "success") {
      setDmThreads((prev) => ({ ...prev, [peer.user as string]: res.data.messages }));
    }
  };

  const sendDm = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = dmInput.trim();
    if (!body || !activePeer?.user) return;
    setDmInput("");
    const res = await postDm(eventId, activePeer.user, body);
    if (res?.status !== "success") {
      toast.error(res?.message ?? "Couldn't send your message");
    }
  };

  const saveProfile = async () => {
    const res = await setNetworkOptIn(eventId, {
      networkingOptIn: !optedIn,
      networkingBio: bioInput,
    });
    if (res?.status !== "success") {
      toast.error(res?.message ?? "Couldn't update your profile");
      return;
    }
    setOptedIn((v) => !v);
  };

  const activeThread = activePeer?.user ? (dmThreads[activePeer.user] ?? []) : [];

  return (
    <section className="flex-center flex-col w-full max-w-screen-md mx-auto gap-6 py-10 px-4">
      <PageHeader
        eyebrow="TicketFlow"
        title={eventName ? `Meet and Greet · ${eventName}` : "Meet and Greet"}
        subtitle="Chat with everyone here, or message someone one-to-one."
        right={
          <span
            role="status"
            aria-live="polite"
            className={`flex-center gap-2 rounded-big px-3 py-1.5 text-sm font-medium ${
              live ? "bg-main-white text-green-700" : "bg-main-white/20 text-main-white"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${live ? "bg-green-500 animate-pulse" : "bg-main-white/60"}`}
            />
            {liveStatus === "loading"
              ? "Loading…"
              : liveStatus === "live"
                ? "Live"
                : liveStatus === "past"
                  ? "Ended"
                  : "Not live yet"}
          </span>
        }
      />

      <div className="w-full flex gap-2">
        {(["group", "directory", "dms"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-big px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-main-purple text-main-white"
                : "bg-main-white text-main-black/70 shadow shadow-black/10"
            }`}
          >
            {t === "group"
              ? "Event Chat (Public)"
              : t === "directory"
                ? "Directory"
                : "DMs"}
          </button>
        ))}
      </div>

      {!connected && (
        <p className="w-full text-sm text-main-black/60">Connecting…</p>
      )}

      {tab === "group" && (
        <div className="w-full rounded-big bg-main-white shadow shadow-black/10 p-4 sm:p-6 flex flex-col gap-3">
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {groupMessages.length === 0 && (
              <p className="body-text text-main-black/60">No messages yet.</p>
            )}
            {groupMessages.map((m) => (
              <div key={m._id} className={m.sender._id === myId ? "self-end text-right" : ""}>
                <p className="text-xs text-main-black/50">{m.sender?.name ?? "Guest"}</p>
                <p className="inline-block rounded-big bg-main-grey-bg px-3 py-2 text-sm text-main-black">
                  {m.body}
                </p>
              </div>
            ))}
            <div ref={groupEndRef} />
          </div>
          <form onSubmit={sendGroup} className="flex gap-2">
            <input
              value={groupInput}
              onChange={(e) => setGroupInput(e.target.value)}
              placeholder={live ? "Say something…" : "Meet and Greet opens when the event goes live"}
              disabled={!live}
              className="flex-1 rounded-big border border-main-light-grey px-4 py-2 text-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!live || !groupInput.trim()}
              className="rounded-big bg-main-purple px-4 py-2 text-sm font-medium text-main-white disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {tab === "directory" && (
        <div className="w-full flex flex-col gap-4">
          <div className="w-full rounded-big bg-main-white shadow shadow-black/10 p-4 sm:p-6">
            <h2 className="sub-title-text text-main-black mb-3">Your profile</h2>
            <textarea
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              maxLength={280}
              placeholder="A short line about yourself (optional)"
              className="w-full rounded-big border border-main-light-grey px-4 py-2 text-sm mb-3"
              rows={2}
            />
            <button
              onClick={saveProfile}
              className="rounded-big bg-main-purple px-4 py-2 text-sm font-medium text-main-white"
            >
              {optedIn ? "Leave the directory" : "Join the directory"}
            </button>
          </div>

          <div className="w-full rounded-big bg-main-white shadow shadow-black/10 p-4 sm:p-6">
            <h2 className="sub-title-text text-main-black mb-3">
              Who&apos;s here ({directory.length})
            </h2>
            {directory.length === 0 && (
              <p className="body-text text-main-black/60">No one has joined the directory yet.</p>
            )}
            <ul className="flex flex-col divide-y divide-main-light-grey/40">
              {directory.map((d) => (
                <li key={d._id} className="flex-between py-3">
                  <div>
                    <p className="font-medium text-main-black">
                      {d.name} {d.vip && <span className="text-xs text-main-purple">VIP</span>}
                    </p>
                    {d.networkingBio && (
                      <p className="text-sm text-main-black/60">{d.networkingBio}</p>
                    )}
                  </div>
                  {d.user && d.user !== myId && (
                    <button
                      onClick={() => openDm(d)}
                      className="rounded-big bg-main-white text-main-purple border border-main-purple px-3 py-1.5 text-sm font-medium"
                    >
                      Message
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "dms" && (
        <div className="w-full rounded-big bg-main-white shadow shadow-black/10 p-4 sm:p-6 flex flex-col gap-3">
          {!activePeer ? (
            <p className="body-text text-main-black/60">
              Pick someone from the Directory to start a DM.
            </p>
          ) : (
            <>
              <p className="font-medium text-main-black">{activePeer.name}</p>
              <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                {activeThread.map((m) => (
                  <div key={m._id} className={m.sender._id === myId ? "self-end text-right" : ""}>
                    <p className="inline-block rounded-big bg-main-grey-bg px-3 py-2 text-sm text-main-black">
                      {m.body}
                    </p>
                  </div>
                ))}
                <div ref={dmEndRef} />
              </div>
              <form onSubmit={sendDm} className="flex gap-2">
                <input
                  value={dmInput}
                  onChange={(e) => setDmInput(e.target.value)}
                  placeholder={live ? "Message…" : "Meet and Greet opens when the event goes live"}
                  disabled={!live}
                  className="flex-1 rounded-big border border-main-light-grey px-4 py-2 text-sm disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!live || !dmInput.trim()}
                  className="rounded-big bg-main-purple px-4 py-2 text-sm font-medium text-main-white disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </section>
  );
}
