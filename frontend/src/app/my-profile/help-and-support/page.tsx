import { Metadata } from "next";
import Link from "next/link";

import GreaterThan from "@/assets/svg/greater-than";

export const metadata: Metadata = {
  title: "Help and Support",
};

export default function HelpAndSupport() {
  const style =
    "bg-main-purple/10 pl-4 py-6 pr-6 rounded-big flex-between gap-4 transition-all duration-300 active:scale-95 active:opacity-25 cursor-pointer";

  return (
    <div className="flex flex-col gap-6 items-stretch w-full p-4 md:p-0">
      <div className="bg-main-purple/10 p-4 rounded-big">
        <h3 className="text-lg font-semibold text-main-black mb-1">
          Contact Us
        </h3>
        <p className="text-base text-main-black">
          <a href="tel:+447033489593">+44 703 348 9593</a>
          {", "}
          <a href="mailto:adetunjiboyz@gmail.com">adetunjiboyz@gmail.com</a>
        </p>
      </div>
      <Link href={"/data-and-privacy"}>
        <div className={style}>
          <div>
            <h3 className="text-lg font-semibold text-main-black mb-1">
              Privacy Policy
            </h3>
            <p className="text-base text-main-black">
              Read through our Privacy and Policy
            </p>
          </div>
          <span>
            <GreaterThan />
          </span>
        </div>
      </Link>
      <Link href={"/terms-and-conditions"}>
        <div className={style}>
          <div>
            <h3 className="text-lg font-semibold text-main-black mb-1">
              Terms and Conditions
            </h3>
            <p className="text-base text-main-black">
              Read through our Terms and Conditions
            </p>
          </div>
          <span>
            <GreaterThan />
          </span>
        </div>
      </Link>
    </div>
  );
}
