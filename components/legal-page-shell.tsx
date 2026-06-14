import Link from "next/link";
import type { ReactNode } from "react";
import { Footer } from "@/components/footer";

export function LegalPageShell({
  eyebrow,
  title,
  summary,
  effectiveDate,
  children,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  effectiveDate: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-korma-dark text-white">
      <section className="border-b border-white/10 bg-korma-navy-deeper/70">
        <div className="mx-auto max-w-5xl px-4 pb-14 pt-24 sm:px-6 sm:pt-28">
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
            <span>{eyebrow}</span>
            <span className="h-1 w-1 rounded-full bg-korma-gold/60" />
            <span>Effective {effectiveDate}</span>
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/60 sm:text-lg">
            {summary}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded border border-white/15 px-4 py-3 text-sm font-semibold text-white/75 transition-colors hover:border-korma-gold/40 hover:text-white"
            >
              Back to Home
            </Link>
            <Link
              href="/applications"
              className="inline-flex items-center justify-center rounded bg-korma-gold px-4 py-3 text-sm font-bold text-korma-dark transition-colors hover:bg-korma-gold-light"
            >
              Applications
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <div className="space-y-10">{children}</div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-white/8 pb-10 last:border-b-0 last:pb-0">
      <h2 className="text-2xl font-black tracking-tight text-white">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-white/65 sm:text-[15px]">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-korma-gold" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
