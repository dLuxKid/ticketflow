import Navbar from "@/components/navs/nav";
import React from "react";

export default function EventLayout({
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
