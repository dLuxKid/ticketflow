import bg from "@/assets/images/qrcodebg.png";
import Image from "next/image";
import QRCode from "react-qr-code";

interface Props {
  ticketBodyDetails: {
    price: number;
    name: string;
    eventName: string;
    startDate: Date;
    startTime: Date;
    eventLocation: locationData;
    eventCategory: string;
    user: { name: string; email: string; photo: string };
    currency: string;
    ticketId: string;
  };
}

export default function DigitalTicket({ ticketBodyDetails }: Props) {
  return (
    <div className="flex flex-col gap-3 py-4 bg-main-white rounded-3xl w-80 h-full">
      <div className="text-center">
        <h3 className="text-xl font-bold text-main-black">
          Kindly show this <br />
          digital ticket at entry
        </h3>
      </div>
      <div className="flex-center">
        <span className="inline-block h-5 w-10 bg-black rounded-b-full -rotate-90 -ml-[7px]" />
        <span className="w-full h-0.5 border-black/50 border-dashed border" />
        <span className="inline-block h-5 w-10 bg-black rounded-b-full rotate-90 -mr-[7px]" />
      </div>
      <div className="p-4 flex flex-col gap-4">
        <div>
          <button className="bg-[#FF006E] px-5 py-1.5 font-medium text-sm text-sec-grey flex-center capitalize rounded-full">
            {ticketBodyDetails.eventCategory}
          </button>
        </div>
        <div className="flex-between gap-4">
          <h1 className="text-lg font-bold text-[#1f1f1f]">
            {ticketBodyDetails.eventName}
          </h1>
          <span className="cursor-pointer">
            <svg
              width="17"
              height="22"
              viewBox="0 0 17 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.5 0L4.5 4H7.5V13H9.5V4H12.5L8.5 0ZM14.5 22H2.5C1.96957 22 1.46086 21.7893 1.08579 21.4142C0.710714 21.0391 0.5 20.5304 0.5 20V8C0.5 7.46957 0.710714 6.96086 1.08579 6.58579C1.46086 6.21071 1.96957 6 2.5 6H5.5V8H2.5V20H14.5V8H11.5V6H14.5C15.0304 6 15.5391 6.21071 15.9142 6.58579C16.2893 6.96086 16.5 7.46957 16.5 8V20C16.5 20.5304 16.2893 21.0391 15.9142 21.4142C15.5391 21.7893 15.0304 22 14.5 22Z"
                fill="#6528F7"
              />
            </svg>
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-[#1f1f1f]/50">Location</p>
          <h3 className="text-base font-bold text-[#1f1f1f]">
            {ticketBodyDetails.eventLocation.address}{" "}
            {ticketBodyDetails.eventLocation.city},{" "}
            {ticketBodyDetails.eventLocation.state},{" "}
            {ticketBodyDetails.eventLocation.country}
          </h3>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <p className="text-xs font-medium text-[#1f1f1f]/50">Date</p>
            <p className="text-xs font-medium text-[#1f1f1f]/50">Time</p>
          </div>
          <div className="flex justify-between">
            <p className="text-base font-bold text-[#1f1f1f]">
              {new Date(ticketBodyDetails.startDate).toLocaleDateString(
                "en-GB",
                {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }
              )}
            </p>
            <p className="text-base font-bold text-[#1f1f1f]">
              {new Date(ticketBodyDetails.startTime).toLocaleTimeString(
                "en-US",
                {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }
              )}
            </p>
          </div>
          <div className="-mt-2">
            <p className="text-[10px] font-medium text-main-purple cursor-pointer">
              Add to calendar
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <p className="text-xs font-medium text-[#1f1f1f]/50">
              Ticket Count
            </p>
            <p className="text-xs font-medium text-[#1f1f1f]/50">Cost</p>
          </div>
          <div className="flex justify-between">
            <p className="text-base font-bold text-[#1f1f1f]">1</p>
            <p className="text-base font-bold text-[#1f1f1f]">
              {ticketBodyDetails.currency} {ticketBodyDetails.price}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-[#1f1f1f]/50">Organizer</p>
          <p className="text-base font-bold text-[#1f1f1f]">
            {ticketBodyDetails.user.name}
          </p>
        </div>

        <div className="flex-center -mb-4">
          <div className="relative flex-center w-[256px] h-[256px]">
            <div className="absolute z-0 inset-x-0 inset-y-0 p-4 rounded-2xl">
              <Image src={bg} alt="..." />
            </div>
            <div className="relative flex-center z-10">
              <QRCode
                size={200}
                value={ticketBodyDetails.ticketId}
                style={{
                  borderRadius: 16,
                  padding: 16,
                  backgroundColor: "none",
                }}
                fgColor="#6528F7"
                viewBox={`0 0 200 200`}
              />
            </div>
          </div>
        </div>

        <div className="flex-center gap-2">
          <p className="text-base font-medium text-[#1f1f1f]/50">Ticket ID</p>
          <p className="text-lg font-bold text-[#1f1f1f]">
            {ticketBodyDetails.ticketId}
          </p>
        </div>

        <div className="flex-center">
          <Image src="/ticketflow-logo.jpg" alt="TicketFlow Logo" width={120} height={40} className="w-auto h-8" />
        </div>
      </div>
    </div>
  );
}
