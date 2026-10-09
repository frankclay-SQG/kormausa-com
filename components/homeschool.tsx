"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, Shield, ArrowRight } from "lucide-react";

const highlights = [
  "Daytime classes built around the homeschool schedule",
  "Taekwondo, Hapkido, and Kumdo fundamentals",
  "Physical fitness, focus, and confidence",
  "Respect, discipline, and Korean tradition",
  "Siblings and mixed ages welcome",
  "Belt ranks recognized through KORMA-USA",
];

export function Homeschool() {
  return (
    <section id="homeschool" className="bg-korma-dark py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(201,162,42,0.08)_0%,_transparent_60%)]" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-px w-10 bg-korma-gold" />
            <span className="text-korma-gold text-xs font-bold tracking-[0.3em] uppercase">Now Enrolling</span>
            <div className="h-px w-10 bg-korma-gold" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
            RVA <span className="gold-shimmer">Homeschoolers</span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            A martial arts program for Richmond-area homeschool families. Students train during the school day and build strength, coordination, and character alongside their studies.
          </p>
        </div>

        <motion.div
          className="p-8 sm:p-10 rounded-2xl border border-korma-gold/25 bg-korma-navy-deeper/40"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col md:flex-row gap-8 md:items-center">
            <div className="w-14 h-14 rounded-xl bg-korma-gold/10 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="h-7 w-7 text-korma-gold" />
            </div>
            <ul className="grid sm:grid-cols-2 gap-3 flex-1">
              {highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-sm text-white/70">
                  <Shield className="h-3.5 w-3.5 text-korma-gold flex-shrink-0 mt-0.5" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Link
              href="/enroll?program=rva-homeschool"
              className="inline-flex items-center gap-2 rounded bg-korma-gold px-6 py-3 text-sm font-bold uppercase tracking-wider text-korma-dark transition-colors hover:bg-korma-gold-light"
            >
              Enroll Your Student
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-white/40 text-sm">
              We&apos;ll follow up with the schedule, location, and tuition details.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
