"use client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
export function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-korma-dark">
      <div className="absolute inset-0 bg-gradient-to-br from-korma-navy-deeper via-korma-dark to-korma-navy-dark opacity-95" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(29,52,97,0.6)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(201,162,42,0.08)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(201,162,42,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,42,1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-32 flex flex-col lg:flex-row items-center gap-16">
        <motion.div className="flex-1 text-center lg:text-left" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
          <div className="inline-flex items-center gap-3 mb-6"><div className="h-px w-10 bg-korma-gold" /><span className="text-korma-gold text-xs font-bold tracking-[0.3em] uppercase">Korean Martial Arts Association</span><div className="h-px w-10 bg-korma-gold" /></div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 tracking-tight">Master the<br /><span className="gold-shimmer">Ancient Arts</span><br />of Korea</h1>
          <p className="text-white/60 text-lg sm:text-xl max-w-xl leading-relaxed mb-10">Discover authentic Korean martial arts — KumDo, Hapkido, Tai Chi, and Taekwondo — taught by experienced masters in a disciplined, welcoming environment.</p>
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
            <Link href="#programs" className="px-8 py-4 bg-korma-gold text-korma-dark font-bold rounded text-sm uppercase tracking-wider hover:bg-korma-gold-light transition-all hover:shadow-lg hover:shadow-korma-gold/30">Explore Programs</Link>
            <Link href="#contact" className="px-8 py-4 border border-white/20 text-white font-medium rounded text-sm uppercase tracking-wider hover:border-korma-gold hover:text-korma-gold transition-all">Free Trial Class</Link>
          </div>
          <div className="mt-14 flex gap-10 justify-center lg:justify-start">
            {[{ value: "30+", label: "Years of Excellence" }, { value: "4", label: "Disciplines" }, { value: "All", label: "Skill Levels" }].map((stat) => (
              <div key={stat.label} className="text-center lg:text-left"><div className="text-3xl font-black text-korma-gold">{stat.value}</div><div className="text-white/40 text-xs uppercase tracking-wider mt-1">{stat.label}</div></div>
            ))}
          </div>
        </motion.div>
        <motion.div className="flex-shrink-0 relative" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}>
          <div className="relative w-72 h-72 sm:w-96 sm:h-96">
            <div className="absolute inset-0 rounded-full bg-korma-gold/10 blur-3xl scale-110" />
            <div className="absolute inset-4 rounded-full border border-korma-gold/20" />
            <div className="absolute inset-0 rounded-full border border-korma-gold/10" />
            <Image src="https://galaxy-prod.tlcdn.com/gen/user_34hHhppb2NuRvdy5opEyFBssEv2/d9ba3e4f-cb21-4341-86c8-118efeaa9365.jpg" alt="KORMA-USA — Korean Martial Arts Association" fill className="object-contain drop-shadow-2xl" priority sizes="(max-width: 640px) 288px, 384px" />
          </div>
        </motion.div>
      </div>
      <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30" animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <ChevronDown className="h-4 w-4" />
      </motion.div>
    </section>
  );
}
