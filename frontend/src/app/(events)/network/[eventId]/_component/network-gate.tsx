"use client";

import { useCallback, useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import axios from "axios";

import { baseUrl } from "@/utils/urls";
import GuestAccess from "./guest-access";
import NetworkHub from "./network-hub";

/**
 * Decides whether the visitor can already see this event's networking channel, and shows the
 * guest email-code sign-in if not.
 *
 * The check is a real authorised request rather than "is there a jwt cookie": holding a
 * session says nothing about holding a booking *for this event*, and a signed-in user who
 * simply is not on this guest list needs the same route in as a total stranger. The server's
 * 403 is the source of truth; this component only reacts to it.
 */
export default function NetworkGate({ eventId }: { eventId: string }) {
  const [state, setState] = useState<"checking" | "allowed" | "denied">(
    "checking",
  );

  const check = useCallback(async () => {
    const jwt = getCookie("jwt");
    if (!jwt) {
      setState("denied");
      return;
    }
    try {
      await axios.get(`${baseUrl}/api/v1/events/${eventId}/network/directory`, {
        headers: { Authorization: "Bearer " + jwt },
      });
      setState("allowed");
    } catch {
      setState("denied");
    }
  }, [eventId]);

  useEffect(() => {
    check();
  }, [check]);

  if (state === "checking") {
    return (
      <div className="flex min-h-[50svh] items-center justify-center px-[5%]">
        <p className="text-sm text-sec-black/60">Checking your access…</p>
      </div>
    );
  }

  if (state === "denied") {
    return <GuestAccess eventId={eventId} onAuthenticated={check} />;
  }

  return <NetworkHub eventId={eventId} />;
}
