import { Metadata } from "next";
import Link from "next/link";

import GreaterThan from "@/assets/svg/greater-than";

export const metadata: Metadata = {
  title: "Settings",
};

export default function Settings() {
  const style =
    "bg-main-purple/10 pl-4 py-6 pr-6 rounded-big flex-between gap-4 transition-all duration-300 active:scale-95 active:opacity-25 cursor-pointer";

  return (
    <div className="flex flex-col gap-6 items-stretch w-full p-4 md:p-0">
      <Link href={"/my-profile/settings/update-password"}>
        <div className={style}>
          <h3 className="text-lg font-semibold text-main-black">
            Update Password
          </h3>
          <span className="cursor-pointer">
            <GreaterThan />
          </span>
        </div>
      </Link>
      <Link href={"/my-profile/settings/general-preferences"}>
        <div className={style}>
          <h3 className="text-lg font-semibold text-main-black">
            General Preferences
          </h3>
          <span>
            <GreaterThan />
          </span>
        </div>
      </Link>
    </div>
  );
}
