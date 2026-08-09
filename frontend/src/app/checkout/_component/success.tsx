import Link from "next/link";
import { useEffect, useState } from "react";

import SuccessIcon from "@/assets/svg/successful";
import DigitalTicket from "@/components/ui/digital-ticket";
import Button from "@/components/ui/submit-btn";

import generatePDF, { Margin, Resolution } from "react-to-pdf";
import { toPng } from "html-to-image";
// import { saveAs } from "file-saver";

type Props = {
  bookings: BookingsType[];
  event: EventDetails;
};

export default function Success({ bookings, event }: Props) {
  const [showTickets, setShowTickets] = useState(false);

  const downloadTickets = () => {
    console.time("download-ticket");
    const capture = document.querySelectorAll(".ticket");
    capture.forEach((ticket, i) => {
      const filename = `${bookings[i].name}-${bookings[i].ticketType}-${event.eventName}.pdf`;
      const downloadname = `${bookings[i].name}-${bookings[i].ticketType}-${event.eventName}.png`;
      toPng(ticket as HTMLElement, { cacheBust: true })
        .then((dataUrl) => {
          const link = document.createElement("a");
          link.download = downloadname;
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => console.log(err));
      // const options = {
      //   filename,
      //   method: "save",
      //   resolution: Resolution.HIGH,
      //   page: {
      //     margin: Margin.NONE,
      //     format: [80, 210],
      //   },
      //   canvas: {
      //     mimeType: "image/jpeg",
      //     qualityRatio: 1,
      //   },
      //   overrides: {
      //     canvas: {
      //       useCORS: true,
      //     },
      //   },
      // };
      // // @ts-ignore
      // generatePDF(() => ticket, options);
    });
    console.timeEnd("download-ticket");
  };

  useEffect(() => {
    sessionStorage.removeItem("checkoutDetails");
    if (showTickets) return downloadTickets();
  }, [showTickets]);

  // The wrapper below is the page's grey background, not a white card. The tickets are
  // white, so a white container flattened them into one shape — and the perforation notches
  // are drawn in the background colour, so they only read as torn edges against grey.
  if (showTickets)
    return (
      <div className="relative px-[5%] py-10">
        <div className="mx-auto max-w-screen-xl">
          <header className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-main-black md:text-3xl">
              {bookings.length > 1
                ? `Your ${bookings.length} tickets`
                : "Your ticket"}
            </h1>
            <p className="mt-2 text-sm text-sec-black/70">
              A copy has been emailed to you. Show the QR code at the door — each
              ticket admits one person once.
            </p>
          </header>

          <div className="flex flex-wrap items-start justify-center gap-8">
            {bookings.map((booking, i) => (
              <div className="ticket" key={i}>
                <DigitalTicket ticketBodyDetails={{ ...booking, ...event }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  return (
    <div className="relative flex-center p-[5%]">
      <div className="bg-main-white rounded-[1.25rem] px-12 py-6 w-full max-w-xl flex-col gap-6 flex-center">
        <span>
          <SuccessIcon />
        </span>
        <h3 className="sub-title-text text-main-purple -mt-4">Successful</h3>
        <p className="body-text text-center text-main-black/50">
          We are delighted to inform you that your ticket purchase for{" "}
          {event.eventName} has been successfully completed! Thank you for
          choosing to be a part of this exciting event.
        </p>
        <Button
          onClick={() => {
            setShowTickets(!showTickets);
          }}
        >
          Download Ticket(s)
        </Button>

        <Link href={"/"} className="body-text text-main-purple underline">
          Go Home
        </Link>
      </div>
    </div>
  );
}
