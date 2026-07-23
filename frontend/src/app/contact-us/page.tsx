import Image from "next/image";

import ContactUsForm from "./_component/contact-us";
import Container from "@/components/container";

export default function ContactUs() {
  return (
    <main className="flex-center">
      <div className="relative bg-main-grey-bg w-full">
        <div className="absolute inset-x-0 inset-y-0 z-0">
          <Image
            width={500}
            height={500}
            src={"/contact-us-bg.png"}
            alt="Contact us background"
            className="size-full"
          />
        </div>
        <Container>
          <div className="w-full relative z-10 p-[5%]">
            <div className="flex flex-col gap-8 bg-main-white py-[5%] px-[7.5%] rounded-[20px]">
              <div className="flex-center flex-col gap-2 md:gap-4">
                <h1 className="text-xl md:text-2xl font-bold text-main-purple">
                  Get in touch with us for more information
                </h1>
                <p className="text-sm md:text-base text-main-black">
                  If you need help or have any question, feel free to contact
                  us. Our support team is just a click away.
                </p>
              </div>
              <div className="mt-4 w-full">
                <ContactUsForm />
              </div>
            </div>
          </div>
        </Container>
      </div>
    </main>
  );
}
