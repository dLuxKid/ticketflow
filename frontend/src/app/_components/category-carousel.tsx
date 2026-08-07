"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { event_categories } from "@/assets/data/event-categories";

/**
 * Event-categories carousel. Softened for the cotton theme: a cool purple-tinted gradient
 * overlay (instead of a flat harsh black), plush corners and a soft shadow. Scrolls
 * horizontally with snap, arrow controls, and a right-edge fade hint so it's obvious there's
 * more to see - the arrows/fade appear only while there's something to scroll to.
 */
export default function CategoryCarousel() {
  const scroller = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = scroller.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    updateArrows();
    const el = scroller.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="relative w-full">
      <div
        ref={scroller}
        className="flex items-stretch gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none]"
      >
        {event_categories.map((event, i) => (
          <Link
            key={i}
            href={`/explore-events/${event.href}`}
            className="group relative shrink-0 snap-start overflow-hidden rounded-[28px] h-60 md:h-[300px] w-[80%] mobile:w-[46%] md:w-[30%] shadow-lg shadow-main-black/10 transition-shadow duration-300 hover:shadow-xl"
          >
            <Image
              className="absolute inset-0 size-full object-cover transition-transform duration-1000 ease-in group-hover:scale-110"
              src={event.img}
              alt={`${event.title} events`}
              width={400}
              height={400}
            />
            {/* Soft, cool-tinted overlay - readable text without harshly dimming the photo. */}
            <div className="absolute inset-0 bg-gradient-to-t from-main-black/70 via-main-purple/20 to-main-black/25" />
            <div className="absolute inset-0 flex-center p-6">
              <h4 className="text-main-white font-semibold md:font-bold text-lg md:text-xl lg:text-2xl [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]">
                {event.title}
              </h4>
            </div>
          </Link>
        ))}
      </div>

      {/* Right-edge fade hint - only while there's more to the right. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-main-grey-bg to-transparent transition-opacity duration-300 ${
          canRight ? "opacity-100" : "opacity-0"
        }`}
      />

      {canLeft && (
        <button
          type="button"
          aria-label="Scroll categories left"
          onClick={() => scrollBy(-1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 flex-center h-11 w-11 rounded-full bg-main-white/90 backdrop-blur text-main-purple shadow-lg shadow-main-black/10 hover:bg-main-white transition-colors"
        >
          <Arrow dir="left" />
        </button>
      )}
      {canRight && (
        <button
          type="button"
          aria-label="Scroll categories right"
          onClick={() => scrollBy(1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex-center h-11 w-11 rounded-full bg-main-white/90 backdrop-blur text-main-purple shadow-lg shadow-main-black/10 hover:bg-main-white transition-colors"
        >
          <Arrow dir="right" />
        </button>
      )}
    </div>
  );
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={dir === "left" ? "-ml-0.5" : "ml-0.5"}
    >
      {dir === "left" ? (
        <path d="M15 18l-6-6 6-6" />
      ) : (
        <path d="M9 18l6-6-6-6" />
      )}
    </svg>
  );
}
