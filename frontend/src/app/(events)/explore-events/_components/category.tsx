"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { exploreEventCategories } from "@/assets/data/react-select-options";
import Select, { SingleValue } from "react-select";

import CategoriesIcon from "@/assets/svg/categories-icon";

import { SELECT_SURFACE } from "./field-styles";

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
          control: (provided, state) => ({
            ...provided,
            borderRadius: "0.75rem",
            backgroundColor: state.isFocused
              ? "rgba(255,255,255,0.20)"
              : SELECT_SURFACE.base,
            color: SELECT_SURFACE.text,
            paddingLeft: "1.875rem",
            height: "100%",
            cursor: "pointer",
            border: `1px solid ${
              state.isFocused
                ? SELECT_SURFACE.borderFocus
                : SELECT_SURFACE.border
            }`,
            boxShadow: state.isFocused
              ? "0 0 0 2px rgba(255,255,255,0.25)"
              : "none",
            transition: "background-color .2s, border-color .2s",
            "&:hover": { backgroundColor: SELECT_SURFACE.hover },
            display: "flex",
            alignItems: "center",
          }),
          // The menu floats over the dark band, so it needs an opaque surface of its own -
          // a translucent one would let the band's text show through the options.
          menu: (provided) => ({
            ...provided,
            backgroundColor: SELECT_SURFACE.menuBg,
            borderRadius: "0.75rem",
            overflow: "hidden",
            border: `1px solid ${SELECT_SURFACE.border}`,
            boxShadow: "0 24px 48px -16px rgba(0,0,0,0.45)",
            zIndex: 30,
          }),
          menuList: (provided) => ({ ...provided, padding: "0.25rem" }),
          option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected
              ? "rgba(255,255,255,0.18)"
              : state.isFocused
                ? SELECT_SURFACE.menuHover
                : "transparent",
            borderRadius: "0.5rem",
            padding: "0.5rem 0.75rem",
            fontSize: "0.95rem",
            color: SELECT_SURFACE.text,
            cursor: "pointer",
          }),
          singleValue: (styles) => ({ ...styles, color: SELECT_SURFACE.text }),
          input: (styles) => ({ ...styles, color: SELECT_SURFACE.text }),
          indicatorSeparator: (styles) => ({
            ...styles,
            backgroundColor: SELECT_SURFACE.border,
          }),
          dropdownIndicator: (styles) => ({
            ...styles,
            color: SELECT_SURFACE.placeholder,
          }),
          placeholder: (provided) => ({
            ...provided,
            color: SELECT_SURFACE.placeholder,
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
