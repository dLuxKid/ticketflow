"use server";

import axios from "axios";
import { getToken } from "./cookies";
import { API_URLS } from "./urls";

export const getUser = async () => {
  try {
    const token = await getToken("jwt");
    if (!token?.value) return null;

    const res = await axios.get(API_URLS.users.getMyAccount, {
      headers: {
        Authorization: "Bearer " + token.value,
      },
    });

    return res.data;
  } catch (error) {
    console.error("Error fetching user in getUser server action:", error);
    return null;
  }
};

export const getMyEvents = async (query?: string) => {
  let url = API_URLS.events.myEvents;
  if (query) url = `${API_URLS.events.myEvents}?eventName=${query}`;

  const token = await getToken("jwt");

  const res = await axios.get(url, {
    headers: {
      Authorization: "Bearer " + token?.value,
    },
  });

  return res.data;
};

export const getAllEvents = async (query?: string) => {
  try {
    const res = await axios.get(`${API_URLS.events.base}${query || ""}`);
    return res.data;
  } catch (error) {
    return error;
  }
};

export const getAllEventsLength = async () => {
  try {
    const res = await axios.get(API_URLS.events.count);
    return res.data;
  } catch (error) {
    return error;
  }
};

export const getEvent = async (slug: string) => {
  try {
    const res = await axios.get(API_URLS.events.single(slug));
    return res.data;
  } catch (error) {
    return error;
  }
};

export type EventWorkspace = {
  eventId: string;
  eventName: string;
  slug: string;
  accessMode: "public" | "invite_only" | "hybrid";
  hasGuestList: boolean;
};

/**
 * What the per-event organiser pages need to draw their own tab strip.
 *
 * Fails closed: any error (not found, not permitted, backend down) returns null, and the
 * caller then renders no Guest list tab. Hiding a tool that might have been available is a
 * far smaller failure than offering one that leads to an error page.
 */
export const getEventWorkspace = async (
  eventId: string
): Promise<EventWorkspace | null> => {
  const token = await getToken("jwt");

  try {
    const res = await axios.get(API_URLS.events.workspace(eventId), {
      headers: { Authorization: "Bearer " + token?.value },
    });
    return res.data?.data?.workspace ?? null;
  } catch {
    return null;
  }
};

export const getBookingsForEvent = async (eventId: string) => {
  const token = await getToken("jwt");

  try {
    const res = await axios.get(
      API_URLS.bookings.eventBookings(eventId),
      {
        headers: {
          Authorization: "Bearer " + token?.value,
        },
      }
    );
    return res.data;
  } catch (error) {
    return error;
  }
};

export const getMyBookings = async () => {
  const token = await getToken("jwt");

  try {
    const res = await axios.get(API_URLS.bookings.myTickets, {
      headers: {
        Authorization: "Bearer " + token?.value,
      },
    });
    return res.data;
  } catch (error) {
    return error;
  }
};

export const getUpcomingEvents = async () => {
  try {
    const res = await axios.get(API_URLS.events.upcoming);
    return res.data;
  } catch (error) {
    return error;
  }
};

export const getTrendingEvents = async () => {
  try {
    const res = await axios.get(API_URLS.events.trending);
    return res.data;
  } catch (error) {
    return error;
  }
};
