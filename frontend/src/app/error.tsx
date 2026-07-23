"use client";

import Link from "next/link";

import Container from "@/components/container";
import Navbar from "@/components/navs/nav";

export default function Error() {
  return (
    <main className="bg-[url('/contact-us-bg.png')] bg-center bg-fill bg-no-repeat">
      <Navbar showNavItems />
      <Container>
        <div className="size-full relative z-10 p-[5%]">
          <div className="flex-center size-full flex-col gap-12 md:gap-16 bg-main-white p-[5%] rounded-[20px]">
            <h1 className="bg-text font-black text-7xl md:text-9xl ">404</h1>
            <p className="text-lg sm:text-xl md:text-2xl font-semibold text-main-black">
              Oops! Looks like this page wandered off to a different dimension.
            </p>
            <div className="max-w-xs mx-auto w-full">
              <Link href={"/"}>
                <button
                  type="button"
                  className="w-full rounded-full bg-main-purple text-sec-grey text-base md:text-lg font-medium flex-center h-12 flex-center"
                >
                  Back to home
                </button>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
