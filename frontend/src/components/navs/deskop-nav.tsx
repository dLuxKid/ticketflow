"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { nav_items } from "@/assets/data/nav-items";
import avatar from "@/assets/images/default-avatar.png";

import { deleteToken } from "@/utils/cookies";

/**
 * Desktop navigation.
 *
 * The dropdowns open on hover *and* on keyboard focus (`group-focus-within`), rather than
 * hover alone as before - a hover-only menu is unreachable by keyboard, which fails WCAG 2.2
 * 2.1.1 Keyboard. They animate rather than snapping into place with `hidden`/`block`, and
 * the panel is centred on its trigger instead of nudged with a magic pixel offset.
 *
 * The invisible padded bridge above each panel keeps the pointer "inside" the group while it
 * travels from the trigger down to the menu; without it the gap closes the menu mid-move.
 */

// Nav link: medium weight, tight tracking, with an underline that wipes in from the left on
// hover and stays put on the active route.
// `group-data-[solid=false]/nav:…` is the transparent-over-hero state published by NavShell.
// Links go white there and the underline goes white too, since the brand indigo does not
// carry enough contrast against a dark photograph.
const OVERLAY_TEXT =
  "group-data-[solid=false]/nav:text-main-white group-data-[solid=false]/nav:hover:text-main-white group-data-[solid=false]/nav:after:bg-main-white";

const navLink = (active: boolean) =>
  `relative inline-flex items-center gap-1.5 text-[15px] font-medium tracking-tight transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-[2px] after:w-full after:origin-left after:rounded-full after:bg-main-purple after:transition-transform after:duration-300 hover:text-main-purple focus-visible:outline-none focus-visible:text-main-purple ${OVERLAY_TEXT} ${
    active
      ? "text-main-purple after:scale-x-100"
      : "text-sec-black after:scale-x-0 hover:after:scale-x-100"
  }`;

// Shared panel chrome: soft cotton surface, plush radius, and a diffused shadow tinted with
// the slate text colour rather than pure black, so it sits on the page instead of on top of it.
const panelSurface =
  "rounded-2xl border border-main-light-grey/70 bg-main-white/95 p-2 shadow-[0_24px_48px_-16px_rgba(46,50,68,0.22)] backdrop-blur-xl";

// Open/close motion. Kept short and eased so it reads as responsive, not decorative.
const panelMotion =
  "invisible translate-y-1 scale-[0.98] opacity-0 transition-all duration-200 ease-out group-hover/menu:visible group-hover/menu:translate-y-0 group-hover/menu:scale-100 group-hover/menu:opacity-100 group-focus-within/menu:visible group-focus-within/menu:translate-y-0 group-focus-within/menu:scale-100 group-focus-within/menu:opacity-100";

const Chevron = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={`h-3.5 w-3.5 transition-transform duration-300 ${className}`}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/** Small tinted glyph per destination, so the menu reads as a set of places, not a word list. */
const subIcon = (href: string) => {
  const paths: Record<string, string> = {
    "/explore-events": "M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z",
    "/create-event": "M12 5v14M5 12h14",
    "/my-events":
      "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  };
  return paths[href] ?? "M5 12h14";
};

/** The little notch that ties a floating panel back to the control that opened it. */
const Caret = ({ className = "" }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={`absolute -top-1.5 h-3 w-3 rotate-45 rounded-[3px] border-l border-t border-main-light-grey/70 bg-main-white ${className}`}
  />
);

type UserData = {
  photo?: string;
  /** Present because verifyAndGetUser selects `+role`; drives the admin-only nav entry. */
  role?: "user" | "creator" | "admin" | "usher";
} | null;
type NavProps = { data: { data: { user: UserData } } | null };

export default function DeskopNav({ data }: NavProps) {
  const pathname = usePathname();

  const logout = () => {
    deleteToken();
  };

  return (
    <div className="hidden nav:block">
      <ul className="flex-center gap-9">
        <li>
          <Link href="/" className={navLink(pathname === "/")}>
            Home
          </Link>
        </li>

        {nav_items.map((item, idx) => {
          const active = pathname.includes(item.href);

          if (!item.sublinks) {
            return (
              <li key={idx}>
                <Link href={item.href} className={navLink(active)}>
                  {item.name}
                </Link>
              </li>
            );
          }

          return (
            <li key={idx} className="group/menu relative">
              <Link
                href={item.href}
                className={navLink(active)}
                aria-haspopup="true"
              >
                {item.name}
                <Chevron className="group-hover/menu:rotate-180 group-focus-within/menu:rotate-180" />
              </Link>

              {/* pt-4 is the hover bridge across the gap to the panel */}
              <div
                className={`absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-4 ${panelMotion}`}
              >
                <div className={`relative ${panelSurface}`}>
                  <Caret className="left-1/2 -translate-x-1/2" />
                  <ul className="relative flex flex-col">
                    {item.sublinks.map(({ name, href, description }, i) => {
                      const current = pathname === href;
                      return (
                        <li key={i}>
                          <Link
                            href={href}
                            className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-purple/40 ${
                              current
                                ? "bg-main-purple/[0.07]"
                                : "hover:bg-main-grey-bg"
                            }`}
                          >
                            <span
                              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                current
                                  ? "bg-main-purple text-main-white"
                                  : "bg-main-grey-bg text-main-purple group-hover/menu:bg-main-purple/10"
                              }`}
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                                className="h-4 w-4"
                              >
                                <path d={subIcon(href)} />
                              </svg>
                            </span>
                            <span className="flex flex-col gap-0.5">
                              <span
                                className={`text-sm font-semibold leading-tight ${
                                  current ? "text-main-purple" : "text-main-black"
                                }`}
                              >
                                {name}
                              </span>
                              {description && (
                                <span className="text-xs leading-snug text-sec-black/60">
                                  {description}
                                </span>
                              )}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </li>
          );
        })}

        <li className="group/menu relative">
          {data?.data.user ? (
            <>
              <button
                type="button"
                aria-haspopup="true"
                className="flex items-center gap-2 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-main-grey-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-purple/40 group-data-[solid=false]/nav:hover:bg-main-white/10"
              >
                <Image
                  src={data.data.user.photo || avatar}
                  alt="Your profile"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-main-light-grey/70 transition group-hover/menu:ring-main-purple/40"
                />
                <Chevron className="text-sec-black group-hover/menu:rotate-180 group-hover/menu:text-main-purple group-focus-within/menu:rotate-180 group-data-[solid=false]/nav:text-main-white" />
              </button>

              <div
                className={`absolute right-0 top-full z-50 w-56 pt-4 ${panelMotion}`}
              >
                <div className={`relative ${panelSurface}`}>
                  <Caret className="right-5" />
                  <ul className="relative flex flex-col">
                    {/* Personal inventory sits with the account, not in the public nav:
                        these require a session, and showing them to logged-out visitors
                        produced links that middleware bounced straight to /login. */}
                    {(
                      [
                        [
                          "/my-events",
                          // An admin's list is not limited to events they organise - the page
                          // carries a My events / All events switch - so "My events" would be
                          // an understatement of what is behind the link.
                          data.data.user.role === "admin" ? "Events" : "My events",
                          "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
                        ],
                        [
                          "/my-profile/tickets",
                          "My tickets",
                          "M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 6v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-6zM13 5v14",
                        ],
                      ] as [string, string, string][]
                    ).map(([href, label, path]) => (
                      <li key={href}>
                        <Link
                          href={href}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-purple/40 ${
                            pathname === href
                              ? "bg-main-purple/[0.07] text-main-purple"
                              : "text-main-black hover:bg-main-grey-bg"
                          }`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                            className="h-4 w-4"
                          >
                            <path d={path} />
                          </svg>
                          {label}
                        </Link>
                      </li>
                    ))}

                    <li>
                      <Link
                        href="/my-profile"
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-purple/40 ${
                          pathname.includes("/my-profile")
                            ? "bg-main-purple/[0.07] text-main-purple"
                            : "text-main-black hover:bg-main-grey-bg"
                        }`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                          className="h-4 w-4"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                        </svg>
                        My Account
                      </Link>
                    </li>

                    {/* Rendered only for admins. The endpoint behind it is admin-gated
                        server-side, so hiding it is tidiness, not the security boundary. */}
                    {data.data.user.role === "admin" && (
                      <li>
                        <Link
                          href="/admin/users"
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-purple/40 ${
                            pathname.includes("/admin")
                              ? "bg-main-purple/[0.07] text-main-purple"
                              : "text-main-black hover:bg-main-grey-bg"
                          }`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                            className="h-4 w-4"
                          >
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          Manage users
                        </Link>
                      </li>
                    )}

                    <li className="my-1 h-px bg-main-light-grey/70" aria-hidden="true" />
                    <li>
                      <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-main-error-red transition-colors hover:bg-main-error-red/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-error-red/40"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                          className="h-4 w-4"
                        >
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                        </svg>
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <Link
              href="/signup"
              className="inline-flex items-center rounded-full bg-main-purple px-5 py-2.5 text-sm font-semibold text-main-white shadow-lg shadow-main-purple/25 transition-all hover:-translate-y-0.5 hover:bg-main-purple/90 hover:shadow-xl hover:shadow-main-purple/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main-purple/40 focus-visible:ring-offset-2 active:translate-y-0"
            >
              Become an Organiser
            </Link>
          )}
        </li>
      </ul>
    </div>
  );
}
