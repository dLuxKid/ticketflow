import { Suspense } from "react";
import Container from "@/components/container";
import Search from "@/components/ui/searchbar";
import AllEvents from "./_components/all-events";
import Category from "./_components/category";
import SearchDate from "./_components/date";
import Location from "./_components/location";
import { FILTER_FIELD } from "./_components/field-styles";

export default async function ExploreEvents() {
  return (
    <Suspense fallback={<div />}>
      <>
      {/* A flat near-black block previously; the indigo wash gives it depth and ties the
          search header to the brand instead of reading as an unstyled dark bar. */}
      {/* No `overflow-hidden` here: it clipped the category dropdown at the band's edge.
          The gradient below is inset-0, so it cannot overflow and needs no clipping. */}
      <div className="relative bg-main-black px-[5%] py-12 md:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(50rem_24rem_at_20%_-20%,rgba(108,92,231,0.45),transparent),radial-gradient(40rem_22rem_at_90%_120%,rgba(108,92,231,0.25),transparent)]"
        />
        <Container>
          <div className="relative flex flex-col items-center gap-3 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-main-white sm:text-4xl">
              Explore events
            </h1>
            <p className="max-w-xl text-base text-main-white/70">
              Discover and select events that align with your interests
            </p>
          </div>

          <div className="relative mt-8 grid w-full gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4">
            <Search
              placeholder="Search for events"
              light={true}
              className={FILTER_FIELD}
            />
            <Category />
            <Location />
            <SearchDate />
          </div>
        </Container>
      </div>
      <section className="bg-main-white">
        <Container>
          <AllEvents />
        </Container>
      </section>
      </>
    </Suspense>
  );
}
