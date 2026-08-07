"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useUser } from "@/store/useUser";
import {
  useAdminUsers,
  useChangeRole,
  useDeleteUser,
  type AdminUser,
} from "@/store/useAdminUsers";

/**
 * Admin user directory - the one admin capability with no existing screen to reuse.
 *
 * Every other admin power is "act as owner of any event", which the ordinary event screens
 * already cover now that My Events is unscoped for admins. Users are different: nothing in
 * the product surfaces them at all, so this page exists rather than an "admin panel" that
 * would duplicate pages that already work.
 *
 * The role controls mirror the server's guards (userService.canChangeRole) so the UI never
 * offers an action that would be refused - but the server remains the boundary; hiding a
 * control is a courtesy, not a permission.
 */

const ROLES = ["user", "creator", "usher", "admin"] as const;

const ROLE_STYLE: Record<string, string> = {
  admin: "bg-main-purple/10 text-main-purple ring-main-purple/25",
  creator: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25",
  usher: "bg-amber-500/10 text-amber-700 ring-amber-500/25",
  user: "bg-main-black/[0.06] text-sec-black/70 ring-main-black/10",
};

export default function AdminUsersPage() {
  const { data: me } = useUser();
  const { data, isLoading, error } = useAdminUsers();
  const changeRole = useChangeRole();
  const deleteUser = useDeleteUser();
  const [query, setQuery] = useState("");

  const myId: string | undefined = me?.data?.user?._id;
  const isAdmin = me?.data?.user?.role === "admin";

  const users: AdminUser[] = useMemo(() => {
    const all: AdminUser[] = data?.data?.users ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q),
    );
  }, [data, query]);

  const counts = useMemo(() => {
    const all: AdminUser[] = data?.data?.users ?? [];
    return all.reduce<Record<string, number>>((acc, u) => {
      const role = u.role ?? "user";
      acc[role] = (acc[role] ?? 0) + 1;
      return acc;
    }, {});
  }, [data]);

  if (!isLoading && !isAdmin) {
    return (
      <div className="px-[5%] py-20">
        <div className="mx-auto max-w-lg rounded-2xl border border-main-light-grey/70 bg-main-white p-8 text-center">
          <h1 className="text-xl font-bold text-main-black">
            Administrators only
          </h1>
          <p className="mt-2 text-sm text-sec-black/70">
            This page manages platform roles and is limited to administrators.
          </p>
        </div>
      </div>
    );
  }

  const onDelete = (user: AdminUser) => {
    // Native confirm, matching guest-manager's GDPR erase. It is keyboard-accessible and
    // impossible to dismiss accidentally, which is what a destructive action needs - and it
    // names the person, so nobody deactivates the wrong row from muscle memory.
    const ok = window.confirm(
      `Deactivate ${user.name} (${user.email})?\n\n` +
        "They will not be able to sign in and will disappear from this list. " +
        "Their events, bookings and admission history are kept, and the account can be " +
        "restored.",
    );
    if (!ok) return;

    deleteUser.mutate(user._id, {
      onSuccess: () => toast.success(`${user.name} deactivated`),
      onError: (err: any) =>
        toast.error(
          err?.response?.data?.message ?? "Could not deactivate that account",
        ),
    });
  };

  const onChange = (user: AdminUser, role: string) => {
    if (role === user.role) return;
    changeRole.mutate(
      { id: user._id, role },
      {
        onSuccess: () => toast.success(`${user.name} is now ${role}`),
        onError: (err: any) =>
          toast.error(
            err?.response?.data?.message ?? "Could not change that role",
          ),
      },
    );
  };

  return (
    <>
      <div className="border-b border-main-light-grey/60 bg-main-white px-[5%] py-8 md:py-10">
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-main-black md:text-3xl">
                Users
              </h1>
              <p className="mt-1 text-sm text-sec-black/65">
                {isLoading
                  ? "Loading the directory…"
                  : `${data?.data?.users?.length ?? 0} accounts · ` +
                    ROLES.filter((r) => counts[r])
                      .map((r) => `${counts[r]} ${r}`)
                      .join(" · ")}
              </p>
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email"
              aria-label="Search users"
              className="h-11 w-full max-w-sm rounded-full border border-main-light-grey bg-main-grey-bg px-4 text-sm text-main-black transition-colors placeholder:text-sec-black/50 focus:border-main-purple/50 focus:bg-main-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="px-[5%] py-10 md:py-12">
        <div className="mx-auto max-w-screen-2xl">
          {error ? (
            <p className="rounded-2xl border border-main-error-red/30 bg-main-error-red/[0.06] p-5 text-sm text-main-error-red">
              Could not load users. You may not have administrator access.
            </p>
          ) : isLoading ? (
            <p className="text-sm text-sec-black/70">Loading…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-sec-black/70">
              No accounts match “{query}”.
            </p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-main-light-grey/70 bg-main-white">
              <table className="w-full text-left">
                <caption className="sr-only">
                  All platform accounts and their roles
                </caption>
                <thead>
                  <tr className="border-b border-main-light-grey/70 bg-main-grey-bg">
                    <th scope="col" className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-sec-black/60">
                      Name
                    </th>
                    <th scope="col" className="hidden px-5 py-3 text-xs font-bold uppercase tracking-wider text-sec-black/60 sm:table-cell">
                      Email
                    </th>
                    <th scope="col" className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-sec-black/60">
                      Role
                    </th>
                    <th scope="col" className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-sec-black/60">
                      Change to
                    </th>
                    <th scope="col" className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-sec-black/60">
                      <span className="sr-only">Delete</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isSelf = user._id === myId;
                    // Mirrors userService.canChangeRole: nobody edits their own role, and
                    // the root admin cannot be demoted.
                    const locked = isSelf || Boolean(user.isRootAdmin);
                    const reason = isSelf
                      ? "You cannot change your own role"
                      : "The root administrator cannot be demoted";

                    return (
                      <tr
                        key={user._id}
                        className="border-b border-main-light-grey/50 last:border-0"
                      >
                        <td className="px-5 py-4">
                          <span className="block text-sm font-semibold text-main-black">
                            {user.name}
                          </span>
                          <span className="block text-xs text-sec-black/60 sm:hidden">
                            {user.email}
                          </span>
                        </td>
                        <td className="hidden px-5 py-4 text-sm text-sec-black/75 sm:table-cell">
                          {user.email}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ${
                                ROLE_STYLE[user.role ?? "user"]
                              }`}
                            >
                              {user.role ?? "user"}
                            </span>
                            {user.isRootAdmin && (
                              <span className="rounded-full bg-main-purple px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-main-white">
                                Root
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {locked ? (
                            <span
                              title={reason}
                              className="text-xs text-sec-black/50"
                            >
                              {isSelf ? "You" : "Protected"}
                            </span>
                          ) : (
                            <label className="inline-flex items-center gap-2">
                              <span className="sr-only">
                                Change role for {user.name}
                              </span>
                              <select
                                value={user.role ?? "user"}
                                disabled={changeRole.isPending}
                                onChange={(e) => onChange(user, e.target.value)}
                                className="rounded-full border border-main-light-grey bg-main-grey-bg px-3 py-1.5 text-sm font-medium text-main-black transition-colors hover:border-main-purple/40 focus:border-main-purple/50 focus:outline-none disabled:opacity-50"
                              >
                                {ROLES.map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {locked ? (
                            <span
                              title={reason}
                              className="text-xs text-sec-black/40"
                            >
                              -
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onDelete(user)}
                              disabled={deleteUser.isPending}
                              className="inline-flex items-center gap-1.5 rounded-full border border-main-error-red/30 px-3 py-1.5 text-xs font-semibold text-main-error-red transition-colors hover:bg-main-error-red/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-error-red/40 disabled:opacity-50"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                                className="h-3.5 w-3.5"
                              >
                                <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              </svg>
                              Deactivate
                              <span className="sr-only"> {user.name}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
