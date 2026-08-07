"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const profile_nav = [
  {
    name: "Event History",
    href: "/my-profile/event-history",
  },
  // {
  //   name: "Event Sales",
  //   href: "/my-profile/event-sales",
  // },
  {
    name: "Tickets",
    href: "/my-profile/tickets",
  },
  {
    name: "Revenue",
    href: "/my-profile/revenue",
  },
  {
    name: "Payouts",
    href: "/my-profile/payouts",
  },
  {
    name: "Help & support",
    href: "/my-profile/help-and-support",
  },
  {
    name: "Settings",
    href: "/my-profile/settings",
  },
];

export default function SideNav() {
  const [openNav, setOpenNav] = useState<boolean>(false);
  const pathname = usePathname();

  return (
    <aside className="w-full h-full">
      <ul className="bg-main-white w-full h-full">
        <div className="flex-between w-full nav:hidden">
          <span
            className="mr-auto self-end p-4"
            onClick={() => setOpenNav((prev) => !prev)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="12"
              viewBox="0 0 20 12"
              className={"fill-main-purple duration-200 transition"}
            >
              <path d="M19.9999 2.32515C20.0006 2.55996 19.9535 2.79196 19.8621 3.00411C19.7706 3.21626 19.6371 3.40316 19.4714 3.55109L10.9008 11.1425C10.6452 11.3736 10.3246 11.5 9.9937 11.5C9.66284 11.5 9.34224 11.3736 9.08665 11.1425L0.516026 3.2839C0.224316 3.01712 0.0408693 2.63376 0.00604443 2.21816C-0.0287805 1.80256 0.0878684 1.38875 0.330329 1.06778C0.57279 0.746814 0.921202 0.544969 1.29892 0.506651C1.67663 0.468332 2.05271 0.596681 2.34442 0.863461L10.0008 7.88901L17.6573 1.09922C17.8669 0.907024 18.1223 0.784939 18.393 0.747407C18.6638 0.709875 18.9386 0.758468 19.1851 0.887436C19.4315 1.0164 19.6392 1.22035 19.7836 1.47514C19.928 1.72993 20.0031 2.0249 19.9999 2.32515Z" />
            </svg>
          </span>
        </div>
        {openNav && (
          <div className="nav:hidden block">
            <Link
              href={"/my-profile"}
              passHref
              onClick={() => setOpenNav((prev) => !prev)}
            >
              <li
                className={`w-full py-4 px-6 text-base font-medium cursor-pointer ${
                  pathname === "/my-profile"
                    ? "text-main-black bg-main-purple/10 border-l-4 border-l-main-purple"
                    : "text-sec-black/60"
                }`}
              >
                Profile
              </li>
            </Link>
            {profile_nav.map((navitem, i) => (
              <Link
                href={navitem.href}
                key={i}
                passHref
                onClick={() => setOpenNav((prev) => !prev)}
              >
                <li
                  className={`w-full py-4 px-6 text-base font-medium cursor-pointer ${
                    pathname.includes(navitem.href)
                      ? "text-main-black bg-main-purple/10 border-l-4 border-l-main-purple"
                      : "text-sec-black/60"
                  }`}
                >
                  {navitem.name}
                </li>
              </Link>
            ))}
          </div>
        )}

        <div className="nav:block hidden">
          <Link href={"/my-profile"} passHref>
            <li
              className={`w-full py-4 px-6 text-base font-medium cursor-pointer ${
                pathname === "/my-profile"
                  ? "text-main-black bg-main-purple/10 border-l-4 border-l-main-purple"
                  : "text-sec-black/60"
              }`}
            >
              Profile
            </li>
          </Link>
          {profile_nav.map((navitem, i) => (
            <Link href={navitem.href} key={i} passHref>
              <li
                className={`w-full py-4 px-6 text-base font-medium cursor-pointer ${
                  pathname.includes(navitem.href)
                    ? "text-main-black bg-main-purple/10 border-l-4 border-l-main-purple"
                    : "text-sec-black/60"
                }`}
              >
                {navitem.name}
              </li>
            </Link>
          ))}
        </div>
      </ul>
    </aside>
  );
}
