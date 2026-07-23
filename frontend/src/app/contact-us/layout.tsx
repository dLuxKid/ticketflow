import Footer from "@/components/footer";
import Navbar from "@/components/navs/nav";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
};

export default function ContactUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      <Navbar showNavItems />
      {children}
      <Footer />
    </main>
  );
}
