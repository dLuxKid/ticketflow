"use client";

import { useEffect, useState } from "react";

/**
 * Chrome for the navbar, split out because `Navbar` is an async server component (it awaits
 * the user) and scroll state needs the client.
 *
 * In `overlay` mode the bar floats transparently over the hero and only becomes a solid,
 * bordered header once the page is scrolled - so the hero reads full-bleed from the very top
 * instead of starting under a white strip. Every other page keeps the existing solid sticky
 * bar, so nothing shifts outside the home page.
 *
 * The solid/transparent state is published as `data-solid` on the <nav>, which carries the
 * `group` class. Children (DeskopNav, MobileNav) style themselves against it with
 * `group-data-[solid=false]:…` rather than each taking a prop and re-rendering.
 */

/** Past this many pixels the bar commits to its solid state. */
const SCROLL_THRESHOLD = 24;

export default function NavShell({
  overlay = false,
  children,
}: {
  overlay?: boolean;
  children: React.ReactNode;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!overlay) return;

    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    // Run once on mount: a reload partway down the page, or a browser restoring scroll
    // position, would otherwise render transparent over content until the first scroll.
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  const solid = !overlay || scrolled;

  return (
    <>
      <nav
        data-solid={solid}
        className={`group/nav fixed top-0 z-50 flex-center h-[3.125rem] w-full transition-[background-color,border-color,box-shadow] duration-300 md:h-20 ${
          solid
            ? "border-b border-main-light-grey bg-main-white/80 shadow-sm backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="relative mx-auto flex-between w-full max-w-screen-2xl px-[5%]">
          {children}
        </div>
      </nav>

      {/* The bar is `fixed`, not `sticky`, on purpose. Every layout except the home page
          renders <Navbar> INSIDE <main>, and globals.css gives main `overflow-x-hidden`;
          an overflow-hidden element becomes a scroll container, so a sticky descendant
          sticks to that container's scrollport rather than the viewport - which is why the
          bar used to scroll away and disappear. Fixed positioning is not affected by
          ancestor overflow, so it behaves identically on every page.

          Fixed elements leave no layout space, so this spacer stands in for the bar's
          height. Not needed in overlay mode, where the hero is meant to run underneath. */}
      {!overlay && (
        <div aria-hidden="true" className="h-[3.125rem] md:h-20" />
      )}
    </>
  );
}
