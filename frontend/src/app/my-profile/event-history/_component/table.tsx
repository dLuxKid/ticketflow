"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import Search from "@/components/ui/searchbar";
import { checkInAttendee } from "@/utils/actions";
import { toast } from "sonner";

type Bookers = {
  _id: string;
  name: string;
  email: string;
  ticketType: string;
  ticketId: string;
  isCheckedIn: boolean;
};

type Props = {
  bookers: Bookers[];
};

export default function Table({ bookers }: Props) {
  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [filteredAttendees, setFilteredAttendees] = useState(bookers);

  useEffect(() => {
    if (query) {
      const attendees = bookers.filter(
        (booker) =>
          booker.name.toLowerCase().includes(query.toLowerCase()) ||
          booker.email.toLowerCase().includes(query.toLowerCase())
      );

      setFilteredAttendees(attendees);
    } else {
      setFilteredAttendees(bookers);
    }
  }, [query]);

  const handleCheckIn = async (id: string, isCheckedIn: boolean) => {
    const previousAttendees = [...filteredAttendees];
    try {
      const updatedAttendees = filteredAttendees.map((booking) =>
        booking._id === id ? { ...booking, isCheckedIn } : booking
      );

      setFilteredAttendees(updatedAttendees);

      await checkInAttendee(id, isCheckedIn);

      toast.success(
        isCheckedIn
          ? "User checked in successfully"
          : "User checked out successfully"
      );
    } catch (error) {
      setFilteredAttendees(previousAttendees);
      toast.error("Error checking in user");
    }
  };

  return (
    <div className="border-[0.5px] border-main-purple rounded-sm p-4">
      <div className="flex-between gap-4 w-full">
        <div className="w-full max-w-60">
          <Search
            placeholder="Search Name or Email"
            className="w-full bg-sec-grey border border-main-purple text-main-black text-sm placeholder:text-sm placeholder:text-main-black h-12 rounded-sm pl-8 pr-3"
          />
        </div>

        <div className="flex-center gap-2 border border-main-purple px-4 h-12 rounded-sm cursor-pointer">
          <span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
            >
              <path
                d="M7 10.577L3.462 7.038L4.169 6.319L6.5 8.65V0H7.5V8.65L9.83 6.32L10.538 7.038L7 10.577ZM0 14V9.962H1V13H13V9.962H14V14H0Z"
                fill="#1F1F1F"
              />
            </svg>
          </span>
          <p className="text-xs font-normal text-main-black/50">Export</p>
        </div>
      </div>
      <div className="mt-8 w-full">
        <div className="md:hidden">
          {filteredAttendees.map((booking, i) => (
            <div
              className="mb-2 w-full rounded-md bg-white flex items-center gap-2"
              key={i}
            >
              <label
                htmlFor={booking._id}
                className="cursor-pointer flex items-center gap-1"
              >
                <input
                  title="confirm check in"
                  id={booking._id}
                  type="checkbox"
                  className="cursor-pointer hidden peer"
                  defaultChecked={booking.isCheckedIn}
                  onChange={(e) => handleCheckIn(booking._id, e.target.checked)}
                />
                <span className="bg-transparent peer-checked:bg-main-purple border border-main-purple size-4 rounded-sm" />
              </label>
              <div className="relative overflow-x-auto py-2 border-b pb-2 w-full">
                <div>
                  <p className="text-lg font-medium">{booking.name}</p>
                  <p>{booking.email}</p>
                  <div className="flex-between w-full gap-4">
                    <p className="text-sm text-gray-500">
                      {booking.ticketType}
                    </p>
                    <p className="text-sm text-gray-500">{booking.ticketId}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
          <tbody className="bg-main-white text-left">
            {filteredAttendees.map((booking, i) => (
              <tr
                key={i}
                className="w-full border-b py-3 text-sm cursor-pointer last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
              >
                <td className="whitespace-nowrap py-3 pr-3">
                  <label
                    htmlFor={booking._id}
                    className="cursor-pointer flex items-center gap-1"
                  >
                    <input
                      title="confirm check in"
                      id={booking._id}
                      type="checkbox"
                      className="cursor-pointer hidden peer"
                      checked={booking.isCheckedIn}
                      onChange={(e) =>
                        handleCheckIn(booking._id, e.target.checked)
                      }
                    />
                    <span className="bg-transparent peer-checked:bg-main-purple border border-main-purple size-4 rounded-sm" />
                  </label>
                </td>
                <td className="whitespace-nowrap px-3 py-3 relative overflow-x-auto max-w-[100px]">
                  {booking.name}
                </td>
                <td className="whitespace-nowrap px-3 py-3 relative overflow-x-auto max-w-[200px]">
                  {booking.email}
                </td>
                <td className="whitespace-nowrap px-3 py-3 relative overflow-x-auto max-w-[50px]">
                  {booking.ticketId}
                </td>
                <td className="whitespace-nowrap py-3 pl-3 relative overflow-x-auto max-w-[50px]">
                  {booking.ticketType}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
