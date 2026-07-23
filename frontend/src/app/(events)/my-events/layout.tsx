import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Events",
};

export default async function MyEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
