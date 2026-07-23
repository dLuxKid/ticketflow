import { Metadata } from "next";
import Navbar from "@/components/navs/nav";

export const metadata: Metadata = {
  title: "Checkout",
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      <Navbar showNavItems />
      {children}
    </main>
  );
}
