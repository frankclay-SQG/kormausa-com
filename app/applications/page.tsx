import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Applications | KORMA-USA",
  description:
    "Apply for certification through World Taekwondo Changmookwan, World Hapkido Martial Arts Federation, or World Kumdo Martial Arts Federation.",
  keywords: "Korean martial arts,Taekwondo Changmookwan,Hapkido,Kumdo,KORMA-USA,certification application",
};

const federations = [
  {
    id: "wtc",
    name: "World Taekwondo Changmookwan",
    korean: "세계 창문관 태권도",
    abbr: "WTC",
    icon: "🥋",
    description:
      "Dan certification, instructor credentials, and school charters under the Changmookwan Taekwondo lineage.",
    href: null, // coming soon
    active: false,
  },
  {
    id: "whmaf",
    name: "World Hapkido Martial Arts Federation",
    korean: "세계 합기도 무술 연맹",
    abbr: "WHMAF",
    icon: "🤼",
    description:
      "Dan certification, instructor credentials, and school charters for Hapkido Migukyongkwan practitioners.",
    href: "/applications/whmaf/",
    active: true,
  },
  {
    id: "wkmaf",
    name: "World Kumdo Martial Arts Federation",
    korean: "세계 검도 무술 연맹",
    abbr: "WKMAF",
    icon: "⚔️",
    description:
      "Dan certification, instructor credentials, and school charters under the Korean sword tradition.",
    href: null, // coming soon
    active: false,
  },
];

export default function ApplicationsPage() {
  return (
    <main className="min-h-screen bg-korma-dark">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-10 px-6 text-center">
        <p className="text-xs tracking-[0.2em] uppercase text-korma-gold font-medium mb-3">
          KORMA-USA · Certification Applications
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
          Choose Your Pathway
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto text-base">
          Select the martial arts federation through which you are applying for
          certification. Each federation manages its own Dan ranks, instructor
          credentials, and school charters.
        </p>
      </section>

      {/* Cards */}
      <section className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {federations.map((fed) => {
          const inner = (
            <div
              className={[
                "relative flex flex-col h-full rounded-2xl border p-7 transition-all duration-200",
                fed.active
                  ? "border-korma-gold/40 bg-[#0d0d00] hover:border-korma-gold hover:shadow-[0_0_32px_rgba(201,162,42,0.15)] cursor-pointer"
                  : "border-white/8 bg-[#0c0c0c] opacity-55 cursor-not-allowed",
              ].join(" ")}
            >
              {/* Coming soon badge */}
              {!fed.active && (
                <span className="absolute top-4 right-4 text-[10px] tracking-widest uppercase font-semibold text-gray-500 border border-white/10 rounded-full px-3 py-1">
                  Coming Soon
                </span>
              )}

              {/* Icon */}
              <div
                className={[
                  "w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5",
                  fed.active ? "bg-korma-gold/15" : "bg-white/5",
                ].join(" ")}
              >
                {fed.icon}
              </div>

              {/* Abbr */}
              <p
                className={[
                  "text-xs tracking-[0.18em] uppercase font-semibold mb-1",
                  fed.active ? "text-korma-gold" : "text-gray-600",
                ].join(" ")}
              >
                {fed.abbr}
              </p>

              {/* Name */}
              <h2 className="text-white font-bold text-lg leading-snug mb-1">
                {fed.name}
              </h2>

              {/* Korean */}
              <p className="text-gray-600 text-sm mb-4">{fed.korean}</p>

              {/* Description */}
              <p className="text-gray-400 text-sm leading-relaxed flex-1">
                {fed.description}
              </p>

              {/* CTA */}
              {fed.active && (
                <div className="mt-6 flex items-center gap-2 text-korma-gold font-medium text-sm">
                  Begin Application
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              )}
            </div>
          );

          return fed.active && fed.href ? (
            <Link key={fed.id} href={fed.href} className="flex flex-col">
              {inner}
            </Link>
          ) : (
            <div key={fed.id} className="flex flex-col">
              {inner}
            </div>
          );
        })}
      </section>

      <Footer />
    </main>
  );
}
