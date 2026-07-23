export default function Button({
  children,
  ...props
}: {
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<"button">) {
  return (
    <button
      {...props}
      type="button"
      className="bg-main-purple text-main-white px-6 py-2 md:px-9 md:py-3 text-base rounded-big font-medium"
    >
      {children}
    </button>
  );
}
