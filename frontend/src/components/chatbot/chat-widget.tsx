"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import chatIcon from "@/assets/images/Chat.png";
import { sendChatMessage } from "@/utils/actions";

/**
 * Floating AI concierge widget (Phase 8), mounted globally so it's available on every page.
 * No conversation persistence — history lives only in this component's state for the
 * current page session, matching the backend's stateless-per-request design (see
 * chatbotService.js). Reuses Chat.png, an asset already sitting unused in this repo,
 * apparently earmarked for exactly this.
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

  const endRef = useRef<HTMLDivElement>(null);

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

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat assistant" : "Open chat assistant"}
        aria-expanded={open}
        className="size-14 rounded-full bg-main-purple shadow-lg shadow-main-purple/30 flex-center overflow-hidden"
      >
        <Image src={chatIcon} alt="" width={28} height={28} className="object-contain" />
      </button>
    </div>
  );
}
