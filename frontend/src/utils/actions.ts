"use server";

import axios, { AxiosError } from "axios";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { API_URLS } from "./urls";

type LoginData = { email: string; password: string };

type SignupData = {
  name: string;
  email: string;
  password: string;
  passwordConfim: string;
};

type UserDetails = {
  name: string;
  email: string;
  phoneNumber: string;
  gender: string;
  photo: string;
};

type UpdatePassword = {
  currentPassword: string;
  password: string;
  passwordConfirm: string;
};

export const authenticateUser = async (
  data: LoginData | SignupData,
  type: string
) => {
  const url =
    type === "login"
      ? API_URLS.users.login
      : API_URLS.users.signup;

  try {
    const res = await axios({
      method: "POST",
      url,
      data,
    });

    revalidatePath("/", "layout");
    return res.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      return error.response?.data ?? { message: "Error logging you in" };
    }
    return { message: "An unexpected error occurred" };
  }
};

export const createEvent = async (data: eventData) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  try {
    const res = await axios({
      method: "POST",
      url: API_URLS.events.create,
      data,
      headers: {
        Authorization: "Bearer " + token,
      },
    });
    return res.data;
  } catch (err: unknown) {
    if (err instanceof AxiosError) return err.response?.data ?? err;
    return err;
  }
};

export const updateEvent = async (data: eventData) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  try {
    const res = await axios({
      method: "PATCH",
      url: API_URLS.events.update(data.id as string),
      data,
      headers: {
        Authorization: "Bearer " + token,
      },
    });
    return res.data;
  } catch (err: unknown) {
    if (err instanceof AxiosError) {
      console.error("updateEvent error:", err.response?.data);
      return err.response?.data ?? err;
    }
    return err;
  }
};

export const updateUserDetails = async (
  data: UserDetails | UpdatePassword,
  type: string
) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;
  const url =
    type === "password"
      ? API_URLS.users.updatePassword
      : API_URLS.users.updateDetails;

  try {
    const res = await axios({
      method: "PATCH",
      url,
      data,
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    return res.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error("updateUserDetails error:", error.response?.data);
      return error.response?.data ?? error;
    }
    return error;
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const res = await axios({
      method: "POST",
      url: API_URLS.users.forgotPassword,
      data: { email },
    });

    return res.data;
  } catch (err: unknown) {
    if (err instanceof AxiosError) return err.response?.data ?? err;
    return err;
  }
};

export const checkInAttendee = async (id: string, isCheckedIn: boolean) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  try {
    const res = await axios({
      method: "PATCH",
      url: API_URLS.bookings.checkIn(id),
      data: { isCheckedIn },
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    return res.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) return error.response?.data ?? error;
    return error;
  }
};

type GuestInput = {
  name: string;
  email: string;
  vip?: boolean;
  plusOnes?: number;
};

export const getEventGuests = async (eventId: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  try {
    const res = await axios({
      method: "GET",
      url: API_URLS.events.guests(eventId),
      headers: { Authorization: "Bearer " + token },
    });
    return res.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) return error.response?.data ?? error;
    return error;
  }
};

export const importGuests = async (
  eventId: string,
  payload: { guests?: GuestInput[]; csv?: string },
) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  try {
    const res = await axios({
      method: "POST",
      url: API_URLS.events.guests(eventId),
      data: payload,
      headers: { Authorization: "Bearer " + token },
    });
    revalidatePath(`/guest-list/${eventId}`);
    return res.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) return error.response?.data ?? error;
    return error;
  }
};

export const eraseGuest = async (eventId: string, guestId: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  try {
    const res = await axios({
      method: "DELETE",
      url: API_URLS.events.eraseGuest(eventId, guestId),
      headers: { Authorization: "Bearer " + token },
    });
    revalidatePath(`/guest-list/${eventId}`);
    return res.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) return error.response?.data ?? error;
    return error;
  }
};

export const queryGuests = async (eventId: string, question: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  try {
    const res = await axios({
      method: "POST",
      url: API_URLS.events.guestsQuery(eventId),
      data: { question },
      headers: { Authorization: "Bearer " + token },
    });
    return res.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) return error.response?.data ?? error;
    return error;
  }
};

export const getAnomalies = async (eventId: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  try {
    const res = await axios({
      method: "GET",
      url: API_URLS.events.anomalies(eventId),
      headers: { Authorization: "Bearer " + token },
    });
    return res.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) return error.response?.data ?? error;
    return error;
  }
};

export const getUshers = async (eventId: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  try {
    const res = await axios({
      method: "GET",
      url: API_URLS.events.ushers(eventId),
      headers: { Authorization: "Bearer " + token },
    });
    return res.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) return error.response?.data ?? error;
    return error;
  }
};

export const assignUsher = async (eventId: string, email: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  try {
    const res = await axios({
      method: "POST",
      url: API_URLS.events.ushers(eventId),
      data: { email },
      headers: { Authorization: "Bearer " + token },
    });
    revalidatePath(`/event-team/${eventId}`);
    return res.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) return error.response?.data ?? error;
    return error;
  }
};

export const unassignUsher = async (eventId: string, userId: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  try {
    const res = await axios({
      method: "DELETE",
      url: API_URLS.events.unassignUsher(eventId, userId),
      headers: { Authorization: "Bearer " + token },
    });
    revalidatePath(`/event-team/${eventId}`);
    return res.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) return error.response?.data ?? error;
    return error;
  }
};

export const getNetworkDirectory = async (eventId: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  try {
    const res = await axios({
      method: "GET",
      url: API_URLS.events.networkDirectory(eventId),
      headers: { Authorization: "Bearer " + token },
    });
    return res.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) return error.response?.data ?? error;
    return error;
  }
};

export const setNetworkOptIn = async (
  eventId: string,
  data: { networkingOptIn: boolean; networkingBio?: string },
) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  try {
    const res = await axios({
      method: "PATCH",
      url: API_URLS.events.networkOptIn(eventId),
      data,
      headers: { Authorization: "Bearer " + token },
    });
    return res.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) return error.response?.data ?? error;
    return error;
  }
};

export const postGroupMessage = async (eventId: string, body: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  try {
    const res = await axios({
      method: "POST",
      url: API_URLS.events.networkMessages(eventId),
      data: { body },
      headers: { Authorization: "Bearer " + token },
    });
    return res.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) return error.response?.data ?? error;
    return error;
  }
};

export const getDmThread = async (eventId: string, userId: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  try {
    const res = await axios({
      method: "GET",
      url: API_URLS.events.networkDm(eventId, userId),
      headers: { Authorization: "Bearer " + token },
    });
    return res.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) return error.response?.data ?? error;
    return error;
  }
};

export const postDm = async (eventId: string, userId: string, body: string) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  try {
    const res = await axios({
      method: "POST",
      url: API_URLS.events.networkDm(eventId, userId),
      data: { body },
      headers: { Authorization: "Bearer " + token },
    });
    return res.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) return error.response?.data ?? error;
    return error;
  }
};

/**
 * @param overrideCapacity - admit even though the venue is at its safe occupancy. Sent only
 *   after the door has been refused with `code: "at_capacity"` and a supervisor has
 *   explicitly confirmed; the server records the override on the audit row.
 */
export const scanTicket = async (
  code: string,
  deviceId?: string,
  overrideCapacity?: boolean,
) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  try {
    const res = await axios({
      method: "POST",
      url: API_URLS.bookings.scan,
      data: { code, deviceId, overrideCapacity },
      headers: { Authorization: "Bearer " + token },
    });
    return res.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) return error.response?.data ?? error;
    return error;
  }
};

type ChatMessage = { role: "user" | "assistant"; content: string };

// Public/unauthenticated on purpose - no cookie/token needed, unlike everything above.
export const sendChatMessage = async (message: string, history: ChatMessage[]) => {
  try {
    const res = await axios({
      method: "POST",
      url: API_URLS.chat,
      data: { message, history },
    });
    return res.data;
  } catch (error: unknown) {
    if (error instanceof AxiosError) return error.response?.data ?? error;
    return error;
  }
};
