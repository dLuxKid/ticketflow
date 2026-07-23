"use client";

import { useState } from "react";

export default function Switch() {
  const [isChecked, setChecked] = useState(false);

  const handleToggle = () => {
    setChecked(!isChecked);
  };

  return (
    <label className="relative inline-block w-[60px] h-[34px]">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleToggle}
        className="hidden peer"
      />
      <span className="absolute cursor-pointer inset-x-0 inset-y-0 bg-main-light-grey transition-all duration-300 rounded-[34px] before:absolute before:content-[''] before:h-[26px] before:w-[26px] before:left-1 before:inset-y-1 before:bg-main-white before:duration-300 before:transition-all before:rounded-[50%] peer-checked:bg-main-purple peer-checked:before:translate-x-[26px]" />
    </label>
  );
}
