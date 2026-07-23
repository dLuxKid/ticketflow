"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function setToken(name: string, token: string) {
  const oneDay = 30 * 24 * 60 * 60 * 1000;
  const cookieStore = await cookies();
  cookieStore.set(name, token, {
    expires: Date.now() + oneDay,
    httpOnly: true,
  });
}

export async function deleteToken() {
  const cookieStore = await cookies();
  cookieStore.delete("jwt");
  revalidatePath("/", "layout");
}

export async function getToken(name: string) {
  const cookieStore = await cookies();
  return cookieStore.get(name);
}
