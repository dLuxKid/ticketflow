import Navbar from "@/components/navs/nav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <Navbar showNavItems />
      {children}
    </main>
  );
}
