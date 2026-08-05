"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

import { FILTER_FIELD } from "./field-styles";

export default function Location() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((location) => {
    const params = new URLSearchParams(searchParams);
    if (location) {
      params.set("eventLocation", location);
    } else {
      params.delete("eventLocation");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <label className="relative flex flex-1 flex-shrink-0">
      <input
        title="Location"
        placeholder="Search for your city"
        type="text"
        name="location"
        className={FILTER_FIELD}
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get("eventLocation")?.toString() || ""}
      />
      <span className="absolute left-3 bottom-[15px] h-[18px] w-[18px] text-main-white">
        <svg
          width="16"
          height="20"
          viewBox="0 0 16 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.94169 19C7.94169 19 14.7495 13.6 14.7495 7.75C14.7495 4.02206 11.7016 1 7.94169 1C4.18181 1 1.13385 4.02206 1.13385 7.75C1.13385 13.6 7.94169 19 7.94169 19Z"
            stroke="white"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M7.94169 10.45C9.44563 10.45 10.6648 9.24116 10.6648 7.75C10.6648 6.25883 9.44563 5.05 7.94169 5.05C6.43775 5.05 5.21855 6.25883 5.21855 7.75C5.21855 9.24116 6.43775 10.45 7.94169 10.45Z"
            stroke="white"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </label>
  );
}
