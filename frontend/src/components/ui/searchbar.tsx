"use client";

import SearchIcon from "@/assets/svg/search";
import SearchIconDark from "@/assets/svg/search-dark";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

type Props = {
  light?: boolean;
};

export default function Search(
  props: Props & React.ComponentPropsWithoutRef<"input">
) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <label className="relative flex flex-1 flex-shrink-0">
      <input
        {...props}
        title="search"
        type="text"
        name="search"
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get("query")?.toString() || ""}
      />
      <span
        className={`absolute left-3 bottom-[15px] top-[15px] h-[18px] w-[18px] `}
      >
        {props.light ? <SearchIcon /> : <SearchIconDark />}
      </span>
    </label>
  );
}
