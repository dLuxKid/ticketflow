"use client";

import { useState } from "react";
import { setCookie } from "cookies-next";
import { toast } from "sonner";
import axios from "axios";

import { baseUrl } from "@/utils/urls";

/**
 * Email-code sign-in for attendees who never made an account.
 *
 * Most guests never do: a guest checkout or an emailed invite captures only a name and an
 * address, so requiring a password would shut the majority of any guest list out of the
 * networking channel for the event they are actually attending.
 *
 * Proof is control of the email on the booking. The server responds identically whether or
 * not the address matches one, so this component must never claim the code "was sent" as
 * fact - it says what it can honestly say, and moves to the code step either way.
 */
export default function GuestAccess({
  eventId,
  onAuthenticated,
}: {
  eventId: string;
  onAuthenticated: () => void;
}) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const request = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !email.trim()) return;
    setBusy(true);
    try {
      await axios.post(
        `${baseUrl}/api/v1/events/${eventId}/network/guest/request`,
        { email: email.trim() },
      );
      setStep("code");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Could not send a code right now",
      );
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || code.trim().length < 6) return;
    setBusy(true);
    try {
      const res = await axios.post(
        `${baseUrl}/api/v1/events/${eventId}/network/guest/verify`,
        { email: email.trim(), code: code.trim() },
      );
      // The server issues an ordinary session token, so from here the guest is simply a
      // signed-in user and every existing networking call works unchanged.
      setCookie("jwt", res.data.token, { maxAge: 60 * 60 * 24 * 7, path: "/" });
      toast.success("You're in - welcome to the channel");
      onAuthenticated();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "That code is invalid or has expired",
      );
    } finally {
      setBusy(false);
    }
  };

  const field =
    "w-full rounded-xl border border-main-light-grey bg-main-grey-bg px-4 py-3 text-main-black transition-colors placeholder:text-sec-black/45 focus:border-main-purple/50 focus:bg-main-white focus:outline-none focus:ring-2 focus:ring-main-purple/20";

  return (
    <div className="mx-auto w-full max-w-md px-[5%] py-16">
      <div className="rounded-3xl border border-main-light-grey/70 bg-main-white p-6 shadow-[0_28px_60px_-32px_rgba(46,50,68,0.45)] sm:p-8">
        <span className="inline-flex items-center rounded-full border border-main-purple/20 bg-main-purple/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-main-purple">
          Attendees only
        </span>

        {step === "email" ? (
          <form onSubmit={request} className="mt-4 flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-bold text-main-black">
                Join the networking channel
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-sec-black/70">
                Enter the email address on your ticket or invitation and we&apos;ll
                send you a one-time code. No account needed.
              </p>
            </div>

            <div>
              <label
                htmlFor="guest-email"
                className="mb-1.5 block text-sm font-semibold text-main-black"
              >
                Email address
              </label>
              <input
                id="guest-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={field}
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-12 items-center justify-center rounded-full bg-main-purple text-base font-semibold text-main-white shadow-lg shadow-main-purple/25 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
            >
              {busy ? "Sending…" : "Send me a code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-4 flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-bold text-main-black">
                Enter your code
              </h1>
              {/* Deliberately not "we sent a code": the server does not reveal whether the
                  address is on the guest list, so promising delivery could be a lie. */}
              <p className="mt-1.5 text-sm leading-relaxed text-sec-black/70">
                If <span className="font-semibold text-main-black">{email}</span>{" "}
                is on the guest list for this event, a six-digit code is on its
                way. It expires in 10 minutes.
              </p>
            </div>

            <div>
              <label
                htmlFor="guest-code"
                className="mb-1.5 block text-sm font-semibold text-main-black"
              >
                Six-digit code
              </label>
              <input
                id="guest-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                className={`${field} text-center font-mono text-2xl tracking-[0.5em]`}
              />
            </div>

            <button
              type="submit"
              disabled={busy || code.length < 6}
              className="inline-flex h-12 items-center justify-center rounded-full bg-main-purple text-base font-semibold text-main-white shadow-lg shadow-main-purple/25 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
            >
              {busy ? "Checking…" : "Join the channel"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
              }}
              className="text-sm font-medium text-sec-black/70 underline underline-offset-4 hover:text-main-purple"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
