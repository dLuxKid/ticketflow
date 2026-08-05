import React from "react";
import Button from "./ui/submit-btn";
import Loader from "./ui/loader";

export default function LoadingEvent({ text }: { text?: string }) {
  return (
    <div className="w-full flex-center flex-col gap-4 animate-pulse h-screen">
      <div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="231"
          height="231"
          viewBox="0 0 231 231"
          fill="none"
        >
          <circle cx="115.5" cy="115.5" r="115.5" fill="#E5E5E6" />
          <path
            d="M87.4054 81.1622H91.5675V72.8379H99.8919V81.1622H133.189V72.8379H141.513V81.1622H145.676C150.296 81.1622 154 84.8665 154 89.4865V147.757C154 149.965 153.123 152.082 151.562 153.643C150.001 155.204 147.883 156.081 145.676 156.081H87.4054C85.1976 156.081 83.0803 155.204 81.5192 153.643C79.9581 152.082 79.0811 149.965 79.0811 147.757V89.4865C79.0811 87.2788 79.9581 85.1615 81.5192 83.6004C83.0803 82.0392 85.1976 81.1622 87.4054 81.1622ZM87.4054 147.757H145.676V106.135H87.4054V147.757ZM87.4054 97.8109H145.676V89.4865H87.4054V97.8109ZM137.351 114.46V139.432H129.027V114.46H137.351Z"
            fill="#1F1F1F"
            fillOpacity="0.4"
          />
        </svg>
      </div>
      <h4>{text || "Loading your events"}</h4>
    </div>
  );
}

export function LoadingMyEvent({ text }: { text?: string }) {
  return (
    <div className="w-full h-full flex-center flex-col gap-4 animate-pulse">
      <div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="231"
          height="231"
          viewBox="0 0 231 231"
          fill="none"
        >
          <circle cx="115.5" cy="115.5" r="115.5" fill="#E5E5E6" />
          <path
            d="M87.4054 81.1622H91.5675V72.8379H99.8919V81.1622H133.189V72.8379H141.513V81.1622H145.676C150.296 81.1622 154 84.8665 154 89.4865V147.757C154 149.965 153.123 152.082 151.562 153.643C150.001 155.204 147.883 156.081 145.676 156.081H87.4054C85.1976 156.081 83.0803 155.204 81.5192 153.643C79.9581 152.082 79.0811 149.965 79.0811 147.757V89.4865C79.0811 87.2788 79.9581 85.1615 81.5192 83.6004C83.0803 82.0392 85.1976 81.1622 87.4054 81.1622ZM87.4054 147.757H145.676V106.135H87.4054V147.757ZM87.4054 97.8109H145.676V89.4865H87.4054V97.8109ZM137.351 114.46V139.432H129.027V114.46H137.351Z"
            fill="#1F1F1F"
            fillOpacity="0.4"
          />
        </svg>
      </div>
      <h4>{text || "Loading your events"}</h4>
    </div>
  );
}

export function LoadingAllEvents() {
  return (
    <div className="rounded-2xl border border-main-black/30 overflow-hidden cursor-pointer animate-pulse">
      <div className="h-60 w-full bg-gray-200"></div>
      <div className="p-4 bg-main-white flex-between gap-4">
        <div className="flex-start flex-col gap-0.5 w-full">
          <h2 className="text-base font-bold text-main-black bg-gray-200 h-6 w-3/4"></h2>
          <div className="text-sm font-medium text-main-black flex-center gap-1 bg-gray-200 h-4 w-2/3"></div>
          <p className="text-xs font-normal text-main-black flex-center truncate bg-gray-200 h-3 w-3/4"></p>
          <div className="relative flex [&>*:nth-child(1)]:-ml-0 [&>*]:-ml-5 mt-1">
            <span className="h-6 w-8 rounded-[50%] border border-black bg-gray-600 relative z-0"></span>
            <span className="h-6 w-8 rounded-[50%] border border-black bg-gray-600 relative z-10"></span>
            <span className="h-6 w-8 rounded-[50%] border border-black bg-gray-600 relative z-20"></span>
            <span className="h-6 w-8 rounded-[50%] border border-black  text-main-white relative z-30 flex-center text-xs font-medium bg-gray-600">
              0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventAnalyticsCard() {
  return (
    <div className="flex-center flex-col gap-4 shadow-md border-[0.5px] border-main-purple rounded-sm p-4 animate-pulse">
      <div className="w-10 h-10 bg-gray-200 rounded-full" />
      <p className="w-10 h-4 bg-gray-200 rounded-sm" />
      <p className="w-20 bg-gray-200 h-4 rounded-sm" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="w-full border-b border-gray-200 last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
      <td className="relative overflow-hidden whitespace-nowrap py-3 pl-6 pr-3">
        <div className="h-4 w-4 rounded-full bg-gray-200"></div>
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        <div className="h-6 w-16 rounded bg-gray-200"></div>
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        <div className="h-6 w-20 rounded bg-gray-200"></div>
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        <div className="h-6 w-16 rounded bg-gray-200"></div>
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        <div className="h-6 w-16 rounded bg-gray-200"></div>
      </td>
    </tr>
  );
}

export function MobileSkeleton() {
  return (
    <div className="mb-2 w-full rounded-md bg-gray-200 flex items-center gap-2">
      <div className="h-4 w-4 rounded-sm bg-gray-200" />
      <div className="relative overflow-x-auto py-2 border-b pb-2 w-full">
        <div>
          <div className="w-36 h-6 bg-gray-200 rounded" />
          <div className="w-full h-4 bg-gray-200 rounded" />
          <div className="flex-between w-full gap-4">
            <div className="w-20 h-4 bg-gray-200 rounded" />
            <div className="w-12 h-4 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventAnalyticsTableSkeleton() {
  return (
    <div className="border-[0.5px] border-main-purple rounded-sm p-4">
      <div className="flex gap-4 w-full bg-gray-200 rounded-md border"></div>
      <div className="inline-block min-w-full align-middle">
        <div className="mt-8 w-full">
          <div className="md:hidden">
            <MobileSkeleton />
            <MobileSkeleton />
            <MobileSkeleton />
            <MobileSkeleton />
            <MobileSkeleton />
            <MobileSkeleton />
          </div>
          <table className="hidden min-w-full text-main-black md:table">
            <thead className="rounded-big text-left text-sm font-normal">
              <tr>
                <th scope="col" className="pr-3 py-5 font-medium">
                  <div className="h-4 w-4 rounded-sm border border-main-purple bg-transparent" />
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Name
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Email
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Ticket ID
                </th>
                <th scope="col" className="pl-3 py-5 font-medium">
                  Ticket Type
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <form className="flex flex-col gap-6">
      <div className="flex items-center gap-4 md:gap-8">
        <div className="size-40 md:size-[100px] bg-gray-200 rounded-full animate-pulse"></div>
        <p className="text-lg font-semibold h-2 hidden md:block animate-pulse"></p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <label className="flex-1">
          <p className="text-base md:text-lg font-medium mb-1">Fullname</p>
          <input
            type="text"
            className="bg-gray-200 h-12 px-4 rounded-sm animate-pulse"
            disabled
          />
        </label>
        <label className="flex-1">
          <p className="text-base md:text-lg font-medium mb-1">Email Address</p>
          <input
            type="text"
            className="bg-gray-200 h-12 px-4 rounded-sm animate-pulse"
            disabled
          />
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <label className="flex-1">
          <p className="text-base md:text-lg font-medium mb-1">Phone Number</p>
          <input
            type="tel"
            placeholder="(___) ___-____"
            className="bg-gray-200 h-12 px-4 rounded-sm animate-pulse"
            disabled
          />
        </label>
        <label className="flex-1">
          <p className="text-base md:text-lg font-medium mb-1">Gender</p>
          <div className="bg-gray-200 h-12 px-4 rounded-sm animate-pulse" />
        </label>
      </div>

      <div className="self-center max-w-md w-full mt-6 md:mt-8">
        <Button disabled title="update details">
          Update Details
        </Button>
      </div>
    </form>
  );
}
