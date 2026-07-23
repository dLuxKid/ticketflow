import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-black">
      <div className="p-[10%] md:py-[5%] md:px-[5%] flex-center gap-8 md:gap-12 lg:gap-16 flex-col hold">
        <div className="flex justify-between items-start w-full gap-8 md:gap-16 flex-wrap ">
          <div className="flex-start flex-col gap-4 md:gap-6">
            <p className="sub-title-text text-main-white">Service</p>
            <ul className="flex-start gap-2 md:gap-4 flex-col text-main-white/70">
              <li className="body-text cursor-pointer">
                <Link href={"/"}>Home</Link>
              </li>
              <li className="body-text cursor-pointer">
                <Link href={"/about-us"}>About Us</Link>
              </li>
              <li className="body-text cursor-pointer">
                <Link href={"/#faq"}>FAQs</Link>
              </li>
              <li className="body-text cursor-pointer">
                <Link href={"/contact-us"}>Contact Us</Link>
              </li>
            </ul>
          </div>
          <div className="flex-start flex-col gap-4 md:gap-6">
            <p className="sub-title-text text-main-white">Others</p>
            <ul className="flex-start gap-2 md:gap-4 flex-col text-main-white/70">
              <li className="body-text cursor-pointer">
                <Link href={"/terms-and-conditions"}>Terms and Conditions</Link>
              </li>
              <li className="body-text cursor-pointer">
                <Link href={"/data-and-privacy"}>Privacy</Link>
              </li>
              <li className="body-text cursor-pointer">
                <Link href={"/refund-policy"}>Refund Policy</Link>
              </li>
            </ul>
          </div>

          <div className="flex-start flex-col gap-4 md:gap-6">
            <p className="sub-title-text text-main-white">Contact</p>
            <ul className="flex-start gap-2 md:gap-4 flex-col text-main-white/70">
              <li className="body-text cursor-pointer">
                <a
                  href="mailto:adetunjiboyz@gmail.com"
                  title="email"
                  rel="noopener noreferrer"
                  target="_blank"
                  className="cursor-pointer"
                >
                  adetunjiboyz@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="w-full border-t border-main-white/10 pt-6 flex-center">
          <p className="body-text text-main-white/50 text-center">
            © {new Date().getFullYear()} TicketFlow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
