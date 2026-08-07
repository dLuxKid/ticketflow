"use client";

import { faqs } from "@/assets/data/faqs";
import { useState } from "react";

/**
 * FAQ accordion.
 *
 * Expansion animates via a `grid-rows-[0fr] → [1fr]` transition rather than mounting and
 * unmounting the answer, so the panel grows smoothly at its natural height - no measuring,
 * no fixed max-height guess that clips longer answers.
 *
 * Each row is a real `<button>` with `aria-expanded`/`aria-controls` instead of a `div` with
 * an onClick, so the accordion is operable by keyboard and announced correctly (WCAG 2.2
 * 2.1.1 Keyboard, 4.1.2 Name Role Value).
 */
export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const toggle = (i: number) =>
    setActiveIndex((current) => (current === i ? null : i));

  return (
    <div className="flex w-full flex-col gap-3">
      {faqs.map((faq, i) => {
        const open = activeIndex === i;

        return (
          <div
            key={i}
            className={`group overflow-hidden rounded-2xl border transition-all duration-300 ${
              open
                ? "border-main-purple/30 bg-main-purple/[0.04] shadow-[0_16px_36px_-18px_rgba(108,92,231,0.45)]"
                : "border-main-light-grey/80 bg-main-white hover:border-main-purple/25 hover:shadow-[0_12px_28px_-18px_rgba(46,50,68,0.35)]"
            }`}
          >
            <h3>
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={open}
                aria-controls={`faq-panel-${i}`}
                id={`faq-trigger-${i}`}
                className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-main-purple/40 md:px-7 md:py-6"
              >
                <span
                  className={`text-base font-semibold leading-snug transition-colors md:text-lg ${
                    open
                      ? "text-main-purple"
                      : "text-main-black group-hover:text-main-purple"
                  }`}
                >
                  {faq.question}
                </span>

                <span
                  aria-hidden="true"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                    open
                      ? "rotate-180 bg-main-purple text-main-white"
                      : "bg-main-grey-bg text-main-purple group-hover:bg-main-purple/10"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </button>
            </h3>

            {/* Animates to the answer's natural height; the inner wrapper does the clipping. */}
            <div
              id={`faq-panel-${i}`}
              role="region"
              aria-labelledby={`faq-trigger-${i}`}
              className={`grid transition-all duration-300 ease-out ${
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-sec-black/75 md:px-7 md:pb-6 md:text-base">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
