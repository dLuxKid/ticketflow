import Image from "next/image";
import Link from "next/link";

export default function LogoHeader() {
  return (
    <nav className="w-full h-[3.125rem] md:h-20 flex-center bg-main-white">
      <div className="w-full px-[5%] flex-between relative hold">
        <Link href={"/"}>
          <Image src="/ticketflow-logo.jpg" alt="TicketFlow Logo" width={150} height={50} className="w-auto h-8 md:h-12" priority />
        </Link>
      </div>
    </nav>
  );
}
