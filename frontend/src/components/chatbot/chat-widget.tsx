"use client";

import { useEffect, useRef, useState } from "react";

import { sendChatMessage } from "@/utils/actions";

/**
 * Floating AI concierge widget (Phase 8), mounted globally so it's available on every page.
 * No conversation persistence — history lives only in this component's state for the
 * current page session, matching the backend's stateless-per-request design (see
 * chatbotService.js).
 *
 * The launcher is a speech-bubble silhouette that pops, haloes and shows a teaser until it
 * has been opened once — all of it suppressed under prefers-reduced-motion, and none of it
 * load-bearing: the button works identically with every animation switched off. It used to
 * be a plain circle with Chat.png inside; the icon is now inline SVG so it can invert with
 * the open/close state and inherit currentColor.
 */

type Message = { role: "user" | "assistant"; content: string };

const GREETING: Message = {
  role: "assistant",
  content: "Hi! Ask me about events, tickets, or how TicketFlow works.",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  /** True once the launcher has been opened — the attention cues never return after that. */
  const [used, setUsed] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);

  // Attention cues run only while the assistant is closed and has never been used. Nudging
  // someone who has already found it would be noise, not help.
  const attention = !open && !used;

  useEffect(() => {
    if (!attention) return;
    // Held back a few seconds: popping the instant the page loads competes with the content
    // the visitor actually came for, and reads as an ad rather than an offer of help.
    const timer = setTimeout(() => setShowTeaser(true), 4000);
    return () => clearTimeout(timer);
  }, [attention]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, open]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || loading) return;

    const history = messages.slice(-6);
    setMessages((prev) => [...prev, { role: "user", content }]);
    setInput("");
    setLoading(true);

    const res = await sendChatMessage(content, history);
    const reply =
      res?.status === "success"
        ? res.data.reply
        : "Sorry, I'm having trouble answering that right now — please try again in a moment.";

    setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[calc(100vw-3rem)] max-w-sm h-[28rem] max-h-[70vh] rounded-big bg-main-white shadow-xl shadow-black/20 flex flex-col overflow-hidden">
          <div className="bg-main-purple text-main-white px-4 py-3 flex-between">
            <p className="font-medium">TicketFlow Assistant</p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-main-white/80 hover:text-main-white text-lg leading-none"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "self-end text-right" : ""}>
                <p
                  className={`inline-block rounded-big px-3 py-2 text-sm max-w-[85%] ${
                    m.role === "user"
                      ? "bg-main-purple text-main-white"
                      : "bg-main-grey-bg text-main-black"
                  }`}
                >
                  {m.content}
                </p>
              </div>
            ))}
            {loading && (
              <p className="text-sm text-main-black/50" aria-live="polite">
                Thinking…
              </p>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={send} className="flex gap-2 p-3 border-t border-main-light-grey/60">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              disabled={loading}
              className="flex-1 rounded-big border border-main-light-grey px-3 py-2 text-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-big bg-main-purple px-4 py-2 text-sm font-medium text-main-white disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <div className="flex items-end gap-2.5">
        {/* Teaser. Rendered only while the launcher has never been used, and marked
            aria-hidden because the button beside it already carries an accessible name —
            announcing both would read as two separate controls. */}
        {attention && showTeaser && (
          <span
            aria-hidden="true"
            className="animate-chat-teaser mb-1 hidden rounded-2xl rounded-br-sm border border-main-light-grey/70 bg-main-white px-3.5 py-2 text-sm font-medium text-main-black shadow-lg shadow-black/10 sm:block"
          >
            Need a hand?
          </span>
        )}

        <span className="relative flex size-16 items-center justify-center">
          {/* Halo rings sit behind the button and are purely decorative. pointer-events-none
              so they never intercept the click they are advertising. */}
          {attention && (
            <>
              <span
                aria-hidden="true"
                className="animate-chat-halo pointer-events-none absolute inset-0 rounded-[26px] rounded-br-lg bg-main-purple"
              />
              <span
                aria-hidden="true"
                style={{ animationDelay: "1.6s" }}
                className="animate-chat-halo pointer-events-none absolute inset-0 rounded-[26px] rounded-br-lg bg-main-purple"
              />
            </>
          )}

          <button
            onClick={() => {
              setOpen((v) => !v);
              setUsed(true);
            }}
            onMouseEnter={() => setShowTeaser(false)}
            aria-label={open ? "Close chat assistant" : "Open chat assistant"}
            aria-expanded={open}
            /* Chat-bubble silhouette: generous radius with one squared-off bottom-right
               corner, which is the corner nearest the page edge — so it reads as a speech
               bubble with its tail pointing into the corner it lives in. */
            className={`relative flex size-16 items-center justify-center rounded-[26px] rounded-br-lg bg-main-purple text-main-white shadow-xl shadow-main-purple/40 transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-purple/50 focus-visible:ring-offset-2 active:scale-95 ${
              attention ? "animate-chat-pop" : ""
            }`}
          >
            {open ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden="true"
                className="size-6"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="size-7"
              >
                <path
                  d="M20 2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h3v4l4.5-4H20a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"
                  fill="currentColor"
                />
                <circle cx="8" cy="9.5" r="1.35" fill="#6c5ce7" />
                <circle cx="12" cy="9.5" r="1.35" fill="#6c5ce7" />
                <circle cx="16" cy="9.5" r="1.35" fill="#6c5ce7" />
              </svg>
            )}

            {/* Unread-style dot: the same signal a real message would carry, so the eye
                treats the launcher as something waiting rather than mere decoration. */}
            {attention && (
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 size-4 rounded-full border-2 border-main-white bg-main-error-red"
              />
            )}
          </button>
        </span>
      </div>
    </div>
  );
}
