import Link from "next/link";

/**
 * Shared premium page header for the organiser surfaces (guest list, dashboard,
 * scanner, door staff). An eyebrow label + large title + subtitle over a soft purple wash,
 * with an optional right-aligned slot (e.g. a live status pill) and optional quick-nav tabs.
 * Uses the app's design tokens so it reads as one product with the rest of TicketFlow.
 */

type Tab = { label: string; href: string; active?: boolean };

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
  tabs,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  tabs?: Tab[];
}) {
  return (
    <div className="w-full rounded-big bg-gradient-to-br from-main-purple to-[#8b5cf6] text-main-white p-6 sm:p-8 shadow-lg shadow-main-purple/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs uppercase tracking-[0.14em] text-main-white/70 mb-2">
              {eyebrow}
            </p>
          )}
          <h1 className="title-text text-main-white text-balance">{title}</h1>
          {subtitle && (
            <p className="body-text text-main-white/80 mt-2 max-w-xl">{subtitle}</p>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>

      {tabs && tabs.length > 0 && (
        <nav className="flex flex-wrap gap-2 mt-6">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`rounded-big px-4 py-2 text-sm font-medium transition-colors ${
                t.active
                  ? "bg-main-white text-main-purple"
                  : "bg-main-white/15 text-main-white hover:bg-main-white/25"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
