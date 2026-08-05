import CategoryCarousel from "@/app/_components/category-carousel";
import FAQ from "@/app/_components/faq";
import TrendingEvents from "@/app/_components/trending-events";
import UpcomingEvents from "@/app/_components/upcoming-events";
import Container from "@/components/container";
import Footer from "@/components/footer";
import Navbar from "@/components/navs/nav";
import SignupSection from "@/components/signup-section";
import Button from "@/components/ui/cta-btn";
import Link from "next/link";

export default async function Home() {
  return (
    <>
      {/* overlay: the bar floats transparently over the hero and only turns solid, with its
          border line, once the page is scrolled. */}
      <Navbar showNavItems overlay />
      <main>
        {/* Opts into a full-viewport height. Sections no longer get this by default — see
            the `section` rule in globals.css — so the hero asks for it explicitly. */}
        <section className="flex-center relative min-h-[100svh] bg-[url('/hero-section-bg.webp')] bg-center bg-contain">
          <Container className="flex-center flex-col gap-8 md:gap-6 w-full">
            <div className="bg-black/80 absolute z-0 inset-x-0 inset-y-0" />
            <div className="inline-block w-full flex-center mt-4 md:mt-0 relative z-10">
              <h1 className="text-main-white text-center text-3xl sm:text-4xl md:text-6xl xl:text-7xl font-semibold">
                We are <span className="text-[#ff006e]">reinventing</span>{" "}
                <br /> the ticketing experience
              </h1>
            </div>
            <div className="inline-block w-full text-center my-2 md:my-6 relative z-10">
              <p className=" text-main-white/70 text-sm sm:text-lg md:text-xl font-normal">
                Get in on the excitement, Get started now.
              </p>
            </div>
            <div className="flex-center relative z-10">
              <Link href={"/explore-events"}>
                <Button title="events">Explore Events</Button>
              </Link>
            </div>
          </Container>
        </section>
        <section className="bg-main-white">
          <Container>
            <div className="flex flex-col gap-16 md:gap-24">
              <div className="flex-center flex-col gap-8 w-full">
                <h3 className="title-text text-main-black">Event Categories</h3>
                <CategoryCarousel />
              </div>
              <TrendingEvents />
              <UpcomingEvents />
            </div>
          </Container>
        </section>

        <section className="bg-main-white" id="faq">
          <Container>
            <div className="flex-center flex-col w-full mx-auto max-w-5xl">
              <div className="mb-12">
                <h3 className="title-text text-main-black text-center w-full">
                  Frequently asked questions
                </h3>
              </div>
              <FAQ />
            </div>
            <div className="mt-16 md:mt-24">
              <SignupSection />
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
