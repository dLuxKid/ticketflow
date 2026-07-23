import { Metadata } from "next";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: {
    default: "Explore Events",
    template: "Connect - %s",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      <Footer />
    </div>
  );
}
