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
      {/* Horizontal padding stays proportional - that is a page gutter, and it should widen
          with the window. Vertical padding is a fixed scale, because percentage padding
          resolves against the container's WIDTH: `p-[5%]` put ~95px of dead space above and
          below the content on a 1890px screen, and more on anything wider. The gap grew with
          the monitor for no reason anyone chose.

          The scale is deliberately tight. The fixed navbar already contributes an 80px
          spacer above this block, so anything generous here compounds into a first screen
          that is one-third chrome: 80 (spacer) + 24 (pt) + 32 (mt on the row) put the
          actual content ~180px down. pt-4 + mt-4 halves the layout's own share. */}
      <div className="px-[2.5%] md:px-[5%] pt-3 pb-5 md:pt-4 md:pb-6">
        <div className="flex-center w-full">
          <h3 className="sub-title-text text-main-black">My Account</h3>
        </div>
        <div className="flex flex-col nav:flex-row gap-6 md:gap-10 nav:gap-16 mt-4 h-full relative">
          <div className="w-full md:flex-[35%] rounded-[1.25rem] md:max-h-[80vh] h-full overflow-hidden">
            <SideNav />
          </div>
          {/* No max-height, so the page scrolls as one document.
              This pane used to be capped at 70vh with its own scrollbar, which on a laptop
              meant two nested scroll regions and content — the revenue "By event" table, the
              bottom of the earnings chart — hidden below an inner fold that looks like the
              end of the page. It also put a hard ceiling on how tall any child could be. */}
          <div className="md:flex-[65%] w-full bg-main-white p-2 md:px-4 md:py-6 rounded-[1.25rem]">
            <Suspense fallback={<ProfileSkeleton />}>{children}</Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
