"use client";
import { motion } from "framer-motion";
import { Users, Building, Shield, ArrowRight } from "lucide-react";
const audiences = [
  { icon: Building, title: "Corporate Programs", description: "Tailored self-defense and situational awareness workshops for organizations. Builds team confidence, awareness, and personal safety skills in a professional setting.", features: ["Half-day & full-day formats", "Customizable curriculum", "Certificate of completion", "Group rates available"] },
  { icon: Users, title: "Individual Training", description: "Personal self-defense courses designed for real-world scenarios. Learn practical techniques that work regardless of size, strength, or prior experience.", features: ["One-on-one instruction", "Flexible scheduling", "Real-world scenarios", "Ongoing coaching available"] },
];
export function Seminars() {
  return (
    <section id="seminars" className="bg-korma-dark py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(200,16,46,0.08)_0%,_transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4"><div className="h-px w-10 bg-korma-red" /><span className="text-korma-red text-xs font-bold tracking-[0.3em] uppercase">Special Programs</span><div className="h-px w-10 bg-korma-red" /></div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">Self-Defense <span className="gold-shimmer">Seminars</span></h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">Practical, no-nonsense self-defense training for corporations and individuals. Taught by certified KORMA-USA instructors with real-world experience.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {audiences.map((item, i) => (
            <motion.div key={item.title} className="p-8 rounded-2xl border border-white/10 bg-korma-navy-deeper/40 hover:border-korma-gold/30 transition-colors group" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.15 }}>
              <div className="w-12 h-12 rounded-xl bg-korma-gold/10 flex items-center justify-center mb-6 group-hover:bg-korma-gold/20 transition-colors"><item.icon className="h-6 w-6 text-korma-gold" /></div>
              <h3 className="text-xl font-black text-white mb-3">{item.title}</h3>
              <p className="text-white/55 text-sm leading-relaxed mb-6">{item.description}</p>
              <ul className="space-y-2 mb-6">{item.features.map((f) => (<li key={f} className="flex items-center gap-2 text-sm text-white/70"><Shield className="h-3.5 w-3.5 text-korma-gold flex-shrink-0" />{f}</li>))}</ul>
              <a href="#contact" className="inline-flex items-center gap-2 text-sm font-semibold text-korma-gold hover:text-korma-gold-light transition-colors group/link">Inquire Now<ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" /></a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
