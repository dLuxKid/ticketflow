import { Suspense } from "react";
import Container from "@/components/container";
import Search from "@/components/ui/searchbar";
import AllEvents from "./_components/all-events";
import Category from "./_components/category";
import SearchDate from "./_components/date";
import Location from "./_components/location";

export default async function ExploreEvents() {
  return (
    <Suspense fallback={<div />}>
      <>
      <div className="bg-main-black p-[5%] py-[10%]">
        <Container>
          <div className="inline-block w-full">
            <h1 className="text-main-white text-center title-text">
              Explore Events
            </h1>
          </div>
          <div className="w-full my-3 md:my-4">
            <p className=" text-main-white/70 body-text text-center">
              Discover and Select events that align with your interests
            </p>
          </div>
          <div className="w-full grid sm:grid-cols-2 lg:grid-cols-4 my-2 md:my-4 gap-4 md:gap-8">
            <Search
              placeholder="Search for events"
              light={true}
              className="w-full bg-[#1f1f1f] text-main-white placeholder:font-normal placeholder:text-main-white h-12 rounded-sm pl-10 pr-3"
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
