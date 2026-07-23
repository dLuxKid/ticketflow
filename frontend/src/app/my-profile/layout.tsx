import { Metadata } from "next";

import Navbar from "@/components/navs/nav";
import SideNav from "@/components/navs/side-nav";
import { Suspense } from "react";
import { ProfileSkeleton } from "@/components/skeletons";

export const metadata: Metadata = {
  title: {
    default: "My Profile",
    template: "TicketFlow - %s",
  },
};

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      <Navbar showNavItems />
      <div className="p-[2.5%] md:p-[5%] pt-[2.5%]">
        <div className="flex-center w-full">
          <h3 className="sub-title-text text-main-black">My Account</h3>
        </div>
        <div className="flex flex-col nav:flex-row gap-6 md:gap-10 nav:gap-16 mt-8 h-full relative">
          <div className="w-full md:flex-[35%] rounded-[1.25rem] md:max-h-[80vh] h-full overflow-hidden">
            <SideNav />
          </div>
          <div className="md:flex-[65%] w-full md:max-h-[70vh] overflow-y-auto bg-main-white p-2 md:px-4 md:py-6 rounded-[1.25rem]">
            <Suspense fallback={<ProfileSkeleton />}>{children}</Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
