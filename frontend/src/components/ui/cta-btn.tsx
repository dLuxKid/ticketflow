export default function Button({
  children,
  className = "",
  ...props
}: {
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<"button">) {
  return (
    <button
      {...props}
      type="button"
      // Caller classes are appended rather than dropped. Previously the hardcoded className
      // sat after the props spread, so any className a caller passed was silently discarded.
      // Appending means later utilities win, letting a caller adjust size or colour while
      // every existing call site keeps its current appearance.
      className={`inline-flex items-center justify-center rounded-big bg-main-purple px-6 py-2 text-base font-medium text-main-white transition-all hover:bg-main-purple/90 disabled:cursor-not-allowed disabled:opacity-60 md:px-9 md:py-3 ${className}`}
    >
      {children}
    </button>
  );
}
