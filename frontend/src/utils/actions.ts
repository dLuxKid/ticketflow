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
