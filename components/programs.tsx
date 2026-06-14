"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";

const programs = [
  { id: "taekwondo", title: "Taekwondo Changmookwan", korean: "태권도", tagline: "The Way of Hand and Foot", description: "Taekwondo Changmookwan is a traditional Korean striking lineage known for dynamic kicking, forms, discipline, and explosive athleticism. Students develop speed, power, balance, and mental focus through structured practice.", image: "https://galaxy-prod.tlcdn.com/gen/user_34hHhppb2NuRvdy5opEyFBssEv2/fe3ff7e7-9703-44f8-89df-96d22b1be93e.jpg", highlights: ["Changmookwan lineage", "Dynamic kicking techniques", "Forms & sparring", "All ages & belt levels"], accent: "#1d3461" },
  { id: "hapkido", title: "Hapkido Migukyongkwan", korean: "합기도", tagline: "The Way of Coordinated Power", description: "Hapkido Migukyongkwan is a dynamic Korean self-defense lineage combining joint locks, throws, kicks, and strikes. Practitioners learn to redirect an opponent's force with practical control and precision.", image: "https://galaxy-prod.tlcdn.com/gen/user_34hHhppb2NuRvdy5opEyFBssEv2/2bd5b582-720e-453d-9a41-ee3fa6f3240e.jpg", highlights: ["Migukyongkwan lineage", "Joint locks & throws", "Self-defense applications", "Kick & strike combinations"], accent: "#C8102E" },
  { id: "kumdo", title: "Kumdo", korean: "검도", tagline: "The Way of the Sword", description: "Kumdo is the Korean art of sword fighting, emphasizing precision, mental discipline, and mastery of form. Students develop focus, coordination, and respect for the blade through structured sword practice.", image: "https://galaxy-prod.tlcdn.com/gen/user_34hHhppb2NuRvdy5opEyFBssEv2/a8e3f3c8-e473-4b48-9d2e-39940882bd30.jpg", highlights: ["Bokken & shinai training", "Traditional forms", "Competition preparation", "All ages welcome"], accent: "#C9A22A" },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function Programs() {
  return (
    <section id="programs" className="bg-korma-dark py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4"><div className="h-px w-10 bg-korma-gold" /><span className="text-korma-gold text-xs font-bold tracking-[0.3em] uppercase">Our Disciplines</span><div className="h-px w-10 bg-korma-gold" /></div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">Three Paths, One <span className="gold-shimmer">Legacy</span></h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">Whether you seek combat discipline, self-defense skills, or inner peace, KORMA-USA offers an authentic path rooted in centuries of Korean tradition.</p>
        </div>
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {programs.slice(0, 3).map((program) => (
              <motion.div key={program.id} id={program.id} variants={cardVariants} className="program-card group rounded-2xl overflow-hidden border border-white/10 bg-korma-navy-deeper/40">
                <div className="relative h-56 overflow-hidden">
                  <Image src={program.image} alt={`${program.title} — ${program.tagline}`} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 1024px) 100vw, 33vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-korma-navy-deeper via-korma-navy-deeper/40 to-transparent" />
                  <div className="absolute top-4 right-4 text-5xl font-black text-white/10 leading-none select-none">{program.korean}</div>
                </div>
                <div className="p-7">
                  <div className="text-xs font-bold tracking-[0.25em] uppercase mb-2" style={{ color: program.accent }}>{program.tagline}</div>
                  <h3 className="text-2xl font-black text-white mb-3">{program.title}</h3>
                  <p className="text-white/55 text-sm leading-relaxed mb-6">{program.description}</p>
                  <ul className="space-y-2 mb-7">{program.highlights.map((item) => (<li key={item} className="flex items-center gap-2 text-sm text-white/70"><div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: program.accent }} />{item}</li>))}</ul>
                  <Link href="#contact" className="inline-flex items-center gap-2 text-sm font-semibold text-korma-gold hover:text-korma-gold-light transition-colors group/link">Learn More<ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" /></Link>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
