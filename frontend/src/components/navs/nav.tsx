import Link from "next/link";
import Image from "next/image";

import DeskopNav from "./deskop-nav";
import MobileNav from "./mobile-nav";
import NavShell from "./nav-shell";

import { getUser } from "@/utils/queries";

export default async function Navbar({
  showNavItems,
  overlay = false,
}: {
  showNavItems: boolean;
  /** Float transparently over the page until scrolled - used by the home hero. */
  overlay?: boolean;
}) {
  const data = await getUser();

  return (
    <NavShell overlay={overlay}>
      <Link href={"/"} className="shrink-0">
        <Image
          src="/ticketflow-logo.jpg"
          alt="TicketFlow Logo"
          width={150}
          height={50}
          priority
          // The logo is an opaque JPG tile, so it cannot pick up the surrounding colour.
          // Over the dark hero a soft ring keeps its edge defined against the photo.
          className="h-8 w-auto rounded-md transition-shadow duration-300 group-data-[solid=false]/nav:ring-1 group-data-[solid=false]/nav:ring-main-white/50 md:h-12"
        />
      </Link>

      {showNavItems && (
        <>
          <DeskopNav data={data} />
          <MobileNav data={data} />
        </>
      )}
    </NavShell>
  );
}
