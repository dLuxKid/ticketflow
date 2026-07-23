export function AboutEvent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-center flex-col w-full max-w-screen-md gap-4 md:gap-6 relative">
      <h3 className="text-main-black sub-title-text capitalize">
        Event details
      </h3>
      {children}
    </div>
  );
}
