"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { exploreEventCategories } from "@/assets/data/react-select-options";
import Select, { SingleValue } from "react-select";

import CategoriesIcon from "@/assets/svg/categories-icon";

type OptionType = { label: string; value: null | string };

const options: OptionType[] = [
  { label: "All Categories", value: "" },
  ...exploreEventCategories,
];

export default function Category() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = (category: string) => {
    const params = new URLSearchParams(searchParams);
    if (category) {
      params.set("eventCategory", category);
    } else {
      params.delete("eventCategory");
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <label className="relative flex flex-1 flex-shrink-0">
      <Select
        styles={{
          container: (provided) => ({
            ...provided,
            width: "100%",
            height: "48px",
            color: "#fff",
            fontSize: "1rem",
          }),
          control: () => ({
            borderRadius: "0.3125rem",
            backgroundColor: "#1f1f1f",
            color: "#fff",
            paddingLeft: "1.875rem",
            height: "100%",
            cursor: "pointer",
            border: "0",
            outline: "0",
            display: "flex",
            alignItems: "center",
            justifyContents: "space-between",
          }),
          option: () => ({
            backgroundColor: "#1f1f1f",
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            fontWeight: "400",
            color: "#fff",
            cursor: "pointer",
          }),
          singleValue: (styles) => ({
            ...styles,
            color: "#fff",
          }),
          placeholder: (provided) => ({
            ...provided,
            color: "#fff",
            fontSize: "1rem",
          }),
        }}
        classNamePrefix="select"
        name="category"
        placeholder="Category"
        value={options.find(
          (option) =>
            option.value === searchParams.get("eventCategory")?.toString() || ""
        )}
        defaultValue={options[0]}
        options={options}
        onChange={(category: SingleValue<OptionType>) => {
          if (category) handleSearch(category.value as string);
        }}
      />
      <span className="absolute left-3 bottom-[15px] h-[18px] w-[18px] text-main-white">
        <CategoriesIcon />
      </span>
    </label>
  );
}
