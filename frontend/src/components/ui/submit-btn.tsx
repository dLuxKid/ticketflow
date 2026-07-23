export default function Button({
  children,
  ...props
}: { children: React.ReactNode } & React.ComponentPropsWithoutRef<"button">) {
  return (
    <button
      {...props}
      type="submit"
      className="w-full rounded-sm bg-main-purple text-sec-grey text-base md:text-lg font-semibold flex-center h-12 flex-center"
    >
      {children}
    </button>
  );
}
