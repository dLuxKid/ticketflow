import Image from "next/image";

export default function Loading() {
  return (
    <main className="flex-center p-[5%] gap-10 flex-col">
      <div className="icon-transition flex-center">
        <Image src="/ticketflow-logo.jpg" alt="TicketFlow Logo" width={180} height={60} className="w-auto h-12 md:h-16" priority />
      </div>
      <div className="text-transition w-full flex-center">
        <p className="text-medium text-lg">
          Your favorite place of amazing events and seamless ticket booking!
        </p>
      </div>
    </main>
  );
}
