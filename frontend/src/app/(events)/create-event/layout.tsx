import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Event",
};

export default async function CreateEventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex items-center h-24 px-[5%] bg-main-black">
        <h1 className="sub-title-text text-main-white">Create Event</h1>
      </div>
      <div className="flex-between flex-col gap-8 md:gap-12 pt-8 pb-12 px-[5%] relative">
        {children}
      </div>
    </>
  );
}
