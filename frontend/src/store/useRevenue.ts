import { API_URLS } from "@/utils/urls";
import { getCookie } from "cookies-next";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

/**
 * Revenue reporting. Scope is decided server-side from the caller's role: an organiser
 * receives only their own events, an admin receives every event on the platform. The client
 * cannot ask for a wider scope than it is entitled to.
 */

export type RevenueRow = {
  eventId: string;
  eventName: string;
  slug: string;
  currency: string;
  startDate: string;
  organiser?: string;
  ticketsSold: number;
  transactions: number;
  grossMinor: number;
  platformFeeMinor: number;
  netMinor: number;
};

export type TrendPoint = {
  date: string;
  grossMinor: number;
  platformFeeMinor: number;
  netMinor: number;
  ticketsSold: number;
  transactions: number;
};

export type RevenueSummary = {
  scope: "own" | "platform";
  events: RevenueRow[];
  series: TrendPoint[];
  totals: {
    events: number;
    eventsWithSales: number;
    ticketsSold: number;
    transactions: number;
    grossMinor: number;
    platformFeeMinor: number;
    netMinor: number;
  };
};

/**
 * `scope` selects which question is being asked: an organiser's own earnings, or the
 * platform's fee income. Asking for "platform" is not the same as being allowed it — the
 * server refuses that scope for anyone who is not an admin.
 */
export const useRevenue = (scope: "own" | "platform" = "own") =>
  useQuery({
    queryKey: ["revenue-summary", scope],
    queryFn: async (): Promise<RevenueSummary> => {
      const res = await axios.get(
        `${API_URLS.events.revenueSummary}?scope=${scope}`,
        { headers: { Authorization: "Bearer " + getCookie("jwt") } },
      );
      return res.data.data;
    },
  });
