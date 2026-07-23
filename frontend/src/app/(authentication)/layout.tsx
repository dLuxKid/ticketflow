import Navbar from "@/components/navs/nav";
import "@/styles/globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      <Navbar showNavItems={false} />
      {children}
    </main>
  );
}
