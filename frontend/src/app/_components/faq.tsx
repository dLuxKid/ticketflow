"use client";

import { faqs } from "@/assets/data/faqs";
import { useState } from "react";

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const setShowRules = (i: number) => {
    if (activeIndex === i) {
      setActiveIndex(null);
      return;
    }
    setActiveIndex(i);
  };

  return (
    <div className="flex-center flex-col gap-6 w-full">
      {faqs.map((faq, i) => (
        <div
          className="flex flex-col w-full bg-[#6600CC]/20 shadow-lg rounded-[2.9375rem]"
          key={i}
        >
          <div
            className={`flex-between gap-4 p-4 md:p-8 w-fullcursor-pointer relative z-10 duration-300 transition-all ease-in-out`}
            onClick={() => setShowRules(i)}
          >
            <h1 className="text-sm sm:text-base md:text-lg lg:text-2xl font-normal text-black/70">
              {faq.question}
            </h1>
            <span
              className={`body-text cursor-pointer duration-300 transition-all ${
                activeIndex === i && "rotate-180"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 48 48"
              >
                <path
                  fill="none"
                  stroke="#6528F7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                  d="M36 18L24 30L12 18"
                />
              </svg>
            </span>
          </div>
          {activeIndex === i && (
            <div className="px-4 md:px-8 pt-2 pb-4 -mt-2 bg-transparent relative border-t">
              <p className="body-text text-black">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
