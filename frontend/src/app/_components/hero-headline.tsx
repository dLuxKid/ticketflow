"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Hero headline with a typed, cycling tail and a subheading that follows it.
 *
 * "We are" is fixed; the phrase after it types itself out, holds, deletes and moves on.
 * Only the keywords in each phrase take the accent colour - colouring the whole line would
 * emphasise nothing, so each phrase names the one or two words worth carrying.
 *
 * Two things the effect is careful about:
 *
 * - **Screen readers.** The animated node is aria-hidden, with a complete sentence exposed
 *   once in an sr-only element. Otherwise assistive tech announces a new string on every
 *   keystroke, which is unusable.
 * - **Reduced motion.** Under prefers-reduced-motion the first phrase renders whole and
 *   nothing animates (WCAG 2.2 SC 2.3.3); the headline never relies on movement to read.
 */

type Phrase = {
  /** Typed after the fixed "We are". */
  text: string;
  /** Substrings within `text` that take the accent colour. Matched case-insensitively. */
  keywords: string[];
  /** Subheading shown while this phrase is on screen. */
  sub: string;
};

const PHRASES: Phrase[] = [
  {
    text: "reinventing the ticketing experience",
    keywords: ["reinventing"],
    sub: "Get in on the excitement. Get started now.",
  },
  {
    text: "networking and making events lively",
    keywords: ["networking", "lively"],
    sub: "Meet the people in the room, not just the queue.",
  },
  {
    text: "getting guests in the door faster",
    keywords: ["faster"],
    sub: "Scan a QR, admit a guest, watch arrivals live.",
  },
  {
    text: "making tickets impossible to forge",
    keywords: ["impossible to forge"],
    sub: "Single-use codes, checked and logged at the door.",
  },
];

// Deliberately unhurried - the headline is meant to be read, not raced through.
const TYPE_MS = 95;
const DELETE_MS = 45; // deleting reads as tidying up, so it stays quicker than typing
const HOLD_MS = 2800; // long enough to finish the line and take in the subheading
const RESTART_MS = 500;

/**
 * Flags each character of `text` that falls inside a keyword. Done per character rather
 * than by splitting on whole words so a half-typed keyword is still highlighted as it
 * appears, instead of snapping to colour once complete.
 */
const keywordFlags = (text: string, keywords: string[]) => {
  const flags = new Array(text.length).fill(false);
  const haystack = text.toLowerCase();

  for (const keyword of keywords) {
    const needle = keyword.toLowerCase();
    let at = haystack.indexOf(needle);
    while (at !== -1) {
      for (let i = at; i < at + needle.length; i++) flags[i] = true;
      at = haystack.indexOf(needle, at + needle.length);
    }
  }
  return flags;
};

/** Groups the visible prefix into consecutive runs of same-colour characters. */
const runsFor = (visible: string, flags: boolean[]) => {
  const runs: { text: string; accent: boolean }[] = [];
  for (let i = 0; i < visible.length; i++) {
    const accent = flags[i] ?? false;
    const last = runs[runs.length - 1];
    if (last && last.accent === accent) last.text += visible[i];
    else runs.push({ text: visible[i], accent });
  }
  return runs;
};

export default function HeroHeadline() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [animate, setAnimate] = useState(false);

  const phrase = PHRASES[phraseIndex];

  // Motion preference is only knowable on the client. Starting at `false` also keeps the
  // server-rendered markup identical to the first client paint, avoiding a hydration mismatch.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setAnimate(!query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!animate) return;

    if (!deleting && text === phrase.text) {
      const timer = setTimeout(() => setDeleting(true), HOLD_MS);
      return () => clearTimeout(timer);
    }

    if (deleting && text === "") {
      const timer = setTimeout(() => {
        setDeleting(false);
        setPhraseIndex((i) => (i + 1) % PHRASES.length);
      }, RESTART_MS);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(
      () =>
        setText((current) =>
          deleting
            ? phrase.text.slice(0, current.length - 1)
            : phrase.text.slice(0, current.length + 1),
        ),
      deleting ? DELETE_MS : TYPE_MS,
    );
    return () => clearTimeout(timer);
  }, [text, deleting, phrase, animate]);

  const flags = useMemo(
    () => keywordFlags(phrase.text, phrase.keywords),
    [phrase],
  );

  const visible = animate ? text : PHRASES[0].text;
  const runs = runsFor(visible, animate ? flags : keywordFlags(PHRASES[0].text, PHRASES[0].keywords));

  return (
    <div className="flex w-full flex-col items-center">
      {/* Explicit leading so both lines share one rhythm - the default line-height at these
          display sizes is loose enough that "We are" and the phrase looked unrelated. */}
      <h1 className="text-center text-3xl font-semibold leading-[1.15] text-main-white sm:text-4xl md:text-6xl xl:text-7xl">
        {/* The single stable sentence assistive tech reads. */}
        <span className="sr-only">We are {PHRASES[0].text}</span>

        <span aria-hidden="true">
          We are
          {/* Every phrase is also rendered invisibly in the same grid cell, so the block is
              exactly as tall as the tallest phrase needs *at the current width* and never
              changes height mid-cycle. A fixed min-height cannot do this: too small and the
              hero jumps when a phrase wraps, too large and it leaves a dead line hanging
              under the shorter ones. */}
          <span className="grid">
            {PHRASES.map((item) => (
              <span
                key={item.text}
                className="invisible col-start-1 row-start-1"
              >
                {item.text}
              </span>
            ))}

            <span className="col-start-1 row-start-1">
              {runs.map((run, i) => (
                <span
                  key={i}
                  className={run.accent ? "text-[#ff2d78]" : "text-main-white"}
                >
                  {run.text}
                </span>
              ))}
              {animate && (
                <span
                  className="ml-1 inline-block w-[3px] animate-pulse bg-[#ff2d78] align-middle"
                  style={{ height: "0.8em" }}
                />
              )}
            </span>
          </span>
        </span>
      </h1>

      <p
        aria-hidden="true"
        // key forces a remount per phrase so the fade replays on every change
        key={phraseIndex}
        className="animate-chat-teaser mt-4 text-center text-sm font-normal text-main-white/70 sm:text-lg md:text-xl"
      >
        {phrase.sub}
      </p>
      <span className="sr-only">{PHRASES[0].sub}</span>
    </div>
  );
}
