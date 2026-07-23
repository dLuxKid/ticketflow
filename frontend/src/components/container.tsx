export default function Container({
  children,
}: { children: React.ReactNode } & React.ComponentPropsWithoutRef<"div">) {
  return <div className="max-w-screen-2xl mx-auto">{children}</div>;
}
