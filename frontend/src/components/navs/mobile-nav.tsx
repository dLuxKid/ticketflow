"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { nav_items } from "@/assets/data/nav-items";
import avatar from "@/assets/images/default-avatar.png";
import CloseIcon from "@/assets/svg/close-icon";
import NavIcon from "@/assets/svg/navbar-icon";

import { deleteToken } from "@/utils/cookies";
import Button from "../ui/cta-btn";

type UserData = {
  photo?: string;
  // Needed to label the events link: an admin's list spans the whole platform, so it is
  // "Events" for them and "My events" for everyone else.
  role?: string;
} | null;

type NavProps = {
  data: {
    data: {
      user: UserData;
    };
  } | null;
};

export default function MobileNav({ data }: NavProps) {
  const [openNav, setOpenNav] = useState<boolean>(false);
  const [openSubLinks, setOpenSubLinks] = useState<boolean>(false);
  const [openProfile, setOpenProfile] = useState<boolean>(false);
  const pathname = usePathname();

  const router = useRouter();

  const logout = () => {
    deleteToken();
  };

  return (
    <>
      <div className="block nav:hidden absolute right-[5%]">
        <div
          onClick={() => setOpenNav((prev) => !prev)}
          className="cursor-pointer transform hover:scale-110 transition-transform"
        >
          {openNav ? <CloseIcon /> : <NavIcon />}
        </div>
      </div>

      <div
        className={`block nav:hidden absolute top-8 md:top-[53px] right-0 py-12 bg-white border-t border-gray-300 shadow-md w-full max-w-screen-nav z-50 transition-transform transform duration-200 delay-75 ${
          !openNav ? "translate-x-full hidden" : "translate-x-0"
        }`}
      >
        <ul className="flex-center flex-col space-y-10 w-full px-[5%]">
          <li>
            <Link
              onClick={() => setOpenNav((prev) => !prev)}
              href={"/"}
              className={`nav-text hover:text-main-purple ${
                pathname === "/" ? "text-main-purple" : "text-sec-black"
              }`}
            >
              Home
            </Link>
          </li>
          {nav_items.map((item, idx) => (
            <li
              key={idx}
              className="gap-3 group w-full flex-center text-center flex-col"
            >
              {item.sublinks ? (
                <div
                  onClick={() => setOpenSubLinks((prev) => !prev)}
                  className={`nav-text group-hover:text-main-purple ${
                    pathname.includes(item.href)
                      ? "text-main-purple"
                      : "text-sec-black"
                  }`}
                >
                  <div className="flex-center gap-2 w-full">
                    {item.name}
                    {item.sublinks && (
                      <span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="12"
                          viewBox="0 0 20 12"
                          className={`hover:fill-main-purple duration-200 transition ${
                            openSubLinks ? "rotate-180" : ""
                          }
                            ${
                              pathname.includes(item.href)
                                ? "fill-main-purple"
                                : "fill-sec-black"
                            }
                            `}
                        >
                          <path d="M19.9999 2.32515C20.0006 2.55996 19.9535 2.79196 19.8621 3.00411C19.7706 3.21626 19.6371 3.40316 19.4714 3.55109L10.9008 11.1425C10.6452 11.3736 10.3246 11.5 9.9937 11.5C9.66284 11.5 9.34224 11.3736 9.08665 11.1425L0.516026 3.2839C0.224316 3.01712 0.0408693 2.63376 0.00604443 2.21816C-0.0287805 1.80256 0.0878684 1.38875 0.330329 1.06778C0.57279 0.746814 0.921202 0.544969 1.29892 0.506651C1.67663 0.468332 2.05271 0.596681 2.34442 0.863461L10.0008 7.88901L17.6573 1.09922C17.8669 0.907024 18.1223 0.784939 18.393 0.747407C18.6638 0.709875 18.9386 0.758468 19.1851 0.887436C19.4315 1.0164 19.6392 1.22035 19.7836 1.47514C19.928 1.72993 20.0031 2.0249 19.9999 2.32515Z" />
                        </svg>
                      </span>
                    )}
                  </div>
                  {openSubLinks && (
                    <div className="bg-main-white p-4 rounded-sm border-[.5px] border-main-purple/30 w-full max-w-screen-nav duration-200 transition flex mt-4">
                      <ul className="flex-center flex-col gap-4 w-full">
                        {item.sublinks.map(({ name, href }, i) => (
                          <li key={i}>
                            <Link
                              onClick={() => setOpenNav((prev) => !prev)}
                              href={href}
                              className={`text-sm font-semibold leading-4 hover:text-main-purple ${
                                pathname === href
                                  ? "text-main-purple"
                                  : "text-sec-black"
                              }`}
                            >
                              {name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`nav-text group-hover:text-main-purple ${
                    pathname.includes(item.href)
                      ? "text-main-purple"
                      : "text-sec-black"
                  }`}
                >
                  {item.name}
                </Link>
              )}
            </li>
          ))}
          <li className="group flex-center w-full">
            {data?.data.user ? (
              <div className="flex-center flex-col w-full">
                <div
                  className="flex-center w-full gap-2"
                  onClick={() => setOpenProfile((prev) => !prev)}
                >
                  <Image
                    src={data.data.user.photo || avatar}
                    alt="user display photo"
                    width={45}
                    height={45}
                    className="object-center w-[45px] h-[45px] rounded-full"
                  />
                  <div className="cursor-pointer relative">
                    <span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="12"
                        viewBox="0 0 20 12"
                        className={`hover:fill-main-purple duration-200 transition ${
                          openProfile ? "rotate-180" : ""
                        }`}
                      >
                        <path d="M19.9999 2.32515C20.0006 2.55996 19.9535 2.79196 19.8621 3.00411C19.7706 3.21626 19.6371 3.40316 19.4714 3.55109L10.9008 11.1425C10.6452 11.3736 10.3246 11.5 9.9937 11.5C9.66284 11.5 9.34224 11.3736 9.08665 11.1425L0.516026 3.2839C0.224316 3.01712 0.0408693 2.63376 0.00604443 2.21816C-0.0287805 1.80256 0.0878684 1.38875 0.330329 1.06778C0.57279 0.746814 0.921202 0.544969 1.29892 0.506651C1.67663 0.468332 2.05271 0.596681 2.34442 0.863461L10.0008 7.88901L17.6573 1.09922C17.8669 0.907024 18.1223 0.784939 18.393 0.747407C18.6638 0.709875 18.9386 0.758468 19.1851 0.887436C19.4315 1.0164 19.6392 1.22035 19.7836 1.47514C19.928 1.72993 20.0031 2.0249 19.9999 2.32515Z" />
                      </svg>
                    </span>
                  </div>
                </div>
                {openProfile && (
                  <div className="bg-main-white p-4 rounded-sm border-[.5px] border-main-purple/30 w-full max-w-screen-nav duration-200 transition flex mt-4">
                    <ul className="flex-center flex-col gap-4 w-full">
                      {/* Same reasoning as the desktop menu: personal inventory belongs with
                          the account, not in the public nav where logged-out visitors were
                          shown links that middleware bounced to /login. */}
                      {(
                        [
                          [
                            "/my-events",
                            // Same reasoning as the desktop menu: an admin's list spans the
                            // whole platform, not only what they organise.
                            data.data.user.role === "admin" ? "Events" : "My events",
                          ],
                          ["/my-profile/tickets", "My tickets"],
                        ] as [string, string][]
                      ).map(([href, label]) => (
                        <li key={href}>
                          <Link
                            href={href}
                            onClick={() => setOpenNav(false)}
                            className={`nav-text hover:text-main-purple ${
                              pathname === href
                                ? "text-main-purple"
                                : "text-sec-black"
                            }`}
                          >
                            {label}
                          </Link>
                        </li>
                      ))}
                      <li>
                        <Link
                          href={"/my-profile"}
                          className={`nav-text hover:text-main-purple ${
                            pathname.includes("/my-profile")
                              ? "text-main-purple"
                              : "text-sec-black"
                          }`}
                        >
                          My Account
                        </Link>
                      </li>
                      <li
                        onClick={logout}
                        className="nav-text hover:text-main-purple text-center"
                      >
                        Logout
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <Link href={"/signup"}>
                <Button title="become an organiser">Become an Organiser</Button>
              </Link>
            )}
          </li>
        </ul>
      </div>
    </>
  );
}
