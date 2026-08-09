"use client";

import { subDays } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { FILTER_FIELD_WRAPPER } from "./field-styles";

export default function SearchDate() {
  const [startDate, setStartDate] = useState<Date | null>(null);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = (date: Date | null) => {
    setStartDate(date);
    const params = new URLSearchParams(searchParams);
    if (date) {
      params.set("startDate", date.toString());
    } else {
      params.delete("startDate");
    }
    replace(`${pathname}?${params.toString()}`);
  };

  const minDate = new Date();
  const excludeDates = [
    minDate,
    ...Array.from({ length: minDate.getDate() }).map((_, i) =>
      subDays(minDate, i)
    ),
  ];

  return (
    <div className={FILTER_FIELD_WRAPPER}>
      <ReactDatePicker
        selected={startDate}
        placeholderText="Date"
        onChange={(date: Date | null) => handleSearch(date)}
        className="h-12 w-full bg-transparent pl-10 pr-3 text-main-white placeholder:text-main-white/75 focus:outline-none"
        excludeDates={excludeDates}
      />
      <span className="absolute left-3 bottom-[15px] h-[18px] w-[18px] text-main-white">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.968 1V4.11111M4.47324 1V4.11111M1.22586 7.22222H14.2154M6.09693 11.1111H9.34431M2.84955 2.55556H12.5917C13.4884 2.55556 14.2154 3.252 14.2154 4.11111V13.4444C14.2154 14.3036 13.4884 15 12.5917 15H2.84955C1.95281 15 1.22586 14.3036 1.22586 13.4444V4.11111C1.22586 3.252 1.95281 2.55556 2.84955 2.55556Z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
