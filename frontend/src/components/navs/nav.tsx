import Link from "next/link";
import Image from "next/image";

import DeskopNav from "./deskop-nav";
import MobileNav from "./mobile-nav";

import { getUser } from "@/utils/queries";

export default async function Navbar({
  showNavItems,
}: {
  showNavItems: boolean;
}) {
  const data = await getUser();

  return (
    <nav className="w-full bg-main-white/90 backdrop-blur-md h-[3.125rem] md:h-20 flex-center sticky top-0 z-50 border-b border-main-light-grey/50 shadow-sm">
      <div className="w-full px-[5%] flex-between relative max-w-screen-2xl mx-auto">
        <Link href={"/"}>
          <Image src="/ticketflow-logo.jpg" alt="TicketFlow Logo" width={150} height={50} className="w-auto h-8 md:h-12" priority />
        </Link>

        {showNavItems && (
          <>
            <DeskopNav data={data} />
            <MobileNav data={data} />
          </>
        )}
      </div>
    </nav>
  );
}
