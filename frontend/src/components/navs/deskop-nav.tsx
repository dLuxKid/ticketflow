"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { nav_items } from "@/assets/data/nav-items";
import avatar from "@/assets/images/default-avatar.png";

import { deleteToken } from "@/utils/cookies";

// Sleek nav-link styling: medium-weight, tight tracking, with an animated underline that
// wipes in from the left on hover and stays on the active route.
const navLink = (active: boolean) =>
  `relative text-[15px] font-medium tracking-tight transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-[2px] after:w-full after:origin-left after:bg-main-purple after:transition-transform after:duration-300 hover:text-main-purple ${
    active
      ? "text-main-purple after:scale-x-100"
      : "text-sec-black after:scale-x-0 hover:after:scale-x-100"
  }`;

type UserData = {
  photo?: string;
} | null;

type NavProps = {
  data: {
    data: {
      user: UserData;
    };
  } | null;
};

export default function DeskopNav({ data }: NavProps) {
  const pathname = usePathname();

  const logout = () => {
    deleteToken();
  };

  return (
    <div className="hidden nav:block">
      <ul className="flex-center gap-9">
        <li>
          <Link href={"/"} className={navLink(pathname === "/")}>
            Home
          </Link>
        </li>
        {nav_items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2 group">
            <Link
              href={item.href}
              className={navLink(pathname.includes(item.href))}
            >
              {item.name}
            </Link>
            {item.sublinks && (
              <div className="relative cursor-pointer">
                <span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="12"
                    viewBox="0 0 20 12"
                    className={`group-hover:fill-main-purple duration-200 transition
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
                <div className="hidden group-hover:block absolute -translate-x-10 pt-6 z-50">
                  <div className="bg-main-white p-3 rounded-big border border-main-light-grey/60 shadow-lg shadow-black/5 w-36">
                    <ul className="flex flex-col items-start justify-start gap-3">
                      {item.sublinks.map(({ name, href }, i) => (
                        <li key={i}>
                          <Link
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
                </div>
              </div>
            )}
          </li>
        ))}
        <li className="group">
          {data?.data.user ? (
            <div className="flex-center gap-2">
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
                    className="group-hover:fill-main-purple duration-200 transition"
                  >
                    <path d="M19.9999 2.32515C20.0006 2.55996 19.9535 2.79196 19.8621 3.00411C19.7706 3.21626 19.6371 3.40316 19.4714 3.55109L10.9008 11.1425C10.6452 11.3736 10.3246 11.5 9.9937 11.5C9.66284 11.5 9.34224 11.3736 9.08665 11.1425L0.516026 3.2839C0.224316 3.01712 0.0408693 2.63376 0.00604443 2.21816C-0.0287805 1.80256 0.0878684 1.38875 0.330329 1.06778C0.57279 0.746814 0.921202 0.544969 1.29892 0.506651C1.67663 0.468332 2.05271 0.596681 2.34442 0.863461L10.0008 7.88901L17.6573 1.09922C17.8669 0.907024 18.1223 0.784939 18.393 0.747407C18.6638 0.709875 18.9386 0.758468 19.1851 0.887436C19.4315 1.0164 19.6392 1.22035 19.7836 1.47514C19.928 1.72993 20.0031 2.0249 19.9999 2.32515Z" />
                  </svg>
                </span>
                <div className="hidden group-hover:block absolute -translate-x-20 pt-6 z-50">
                  <div className="bg-main-white p-3 rounded-big border border-main-light-grey/60 shadow-lg shadow-black/5 w-36">
                    <ul className="flex flex-col items-start justify-start gap-3">
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
                        className="nav-text hover:text-main-purple "
                      >
                        Logout
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href={"/login"}
              className="inline-flex items-center rounded-full bg-main-purple px-5 py-2 text-sm font-semibold text-main-white shadow-sm shadow-main-purple/30 transition-all hover:bg-main-purple/90 hover:shadow-md hover:shadow-main-purple/30"
            >
              Get Started
            </Link>
          )}
        </li>
      </ul>
    </div>
  );
}
