"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";

const programs = [
  { id: "kumdo", title: "KumDo", korean: "검도", tagline: "The Way of the Sword", description: "KumDo is the Korean art of sword fighting, emphasizing precision, mental discipline, and the mastery of form. Students develop focus, coordination, and a profound respect for the blade — from basic bokken practice to advanced forms.", image: "https://galaxy-prod.tlcdn.com/gen/user_34hHhppb2NuRvdy5opEyFBssEv2/a8e3f3c8-e473-4b48-9d2e-39940882bd30.jpg", highlights: ["Bokken & Shinai training", "Traditional forms (kata)", "Competition preparation", "All ages welcome"], accent: "#C9A22A" },
  { id: "hapkido", title: "Hapkido", korean: "합기도", tagline: "The Way of Coordinated Power", description: "Hapkido is a dynamic self-defense art combining joint locks, throws, kicks, and strikes. Practitioners learn to redirect an opponent's force with minimal effort — making it effective for all body types and fitness levels.", image: "https://galaxy-prod.tlcdn.com/gen/user_34hHhppb2NuRvdy5opEyFBssEv2/2bd5b582-720e-453d-9a41-ee3fa6f3240e.jpg", highlights: ["Joint locks & throws", "Self-defense applications", "Kick & strike combinations", "Black dobok curriculum"], accent: "#C8102E" },
  { id: "taichi", title: "Tai Chi", korean: "태극권", tagline: "The Supreme Ultimate Art", description: "Tai Chi combines slow, flowing movements with deep breathing and meditation to cultivate internal energy (chi). Known for its health benefits, it reduces stress, improves balance, and enhances overall wellbeing for practitioners of any age.", image: "https://galaxy-prod.tlcdn.com/gen/user_34hHhppb2NuRvdy5opEyFBssEv2/10c15719-310f-47d4-a259-e4c4977b8ad9.jpg", highlights: ["Yang-style forms", "Breathing & meditation", "Balance & flexibility", "Senior-friendly classes"], accent: "#C9A22A" },
  { id: "taekwondo", title: "Taekwondo", korean: "태권도", tagline: "The Way of Hand and Foot", description: "Taekwondo is Korea's most widely practiced martial art, renowned for its dynamic kicking techniques and explosive athleticism. Students develop speed, power, balance, and mental discipline through forms (poomsae), sparring, and breaking techniques.", image: "https://galaxy-prod.tlcdn.com/gen/user_34hHhppb2NuRvdy5opEyFBssEv2/fe3ff7e7-9703-44f8-89df-96d22b1be93e.jpg", highlights: ["Olympic-recognized sport", "Dynamic kicking techniques", "Poomsae & sparring", "All ages & belt levels"], accent: "#1d3461" },
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
        <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-8" variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          {programs.map((program) => (
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
        </motion.div>
      </div>
    </section>
  );
}
