"use client";
import { motion } from "framer-motion";
import { Shield, Users, Star, Heart } from "lucide-react";
const values = [
  { icon: Shield, title: "Discipline", description: "Every class builds mental fortitude and self-control alongside physical technique." },
  { icon: Users, title: "Community", description: "A respectful, supportive environment where students push each other to grow." },
  { icon: Star, title: "Excellence", description: "Traditional Korean martial arts taught with authentic technique and modern instruction." },
  { icon: Heart, title: "Respect", description: "The foundation of all martial arts — for the art, the instructor, and fellow students." },
];
export function About() {
  return (
    <section id="about" className="bg-korma-navy-deeper py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-korma-gold/30 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(201,162,42,0.04)_0%,_transparent_70%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-3 mb-4"><div className="h-px w-10 bg-korma-gold" /><span className="text-korma-gold text-xs font-bold tracking-[0.3em] uppercase">Our Story</span></div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight leading-tight">Authentic Korean<br /><span className="gold-shimmer">Martial Arts Tradition</span></h2>
            <div className="space-y-4 text-white/60 leading-relaxed">
              <p>The Korean Martial Arts Association of the USA — KORMA-USA — was founded with a singular mission: to preserve and share the authentic martial arts heritage of Korea with students of all ages and backgrounds.</p>
              <p>Our instructors bring decades of experience under renowned Korean masters, ensuring that every technique, every form, and every lesson honors the centuries-old traditions from which these arts were born.</p>
              <p>Whether you're a complete beginner or an experienced martial artist, KORMA-USA welcomes you into a community built on discipline, respect, and the relentless pursuit of excellence.</p>
            </div>
            <div className="mt-8 flex gap-4">
              <a href="#contact" className="px-6 py-3 bg-korma-gold text-korma-dark font-bold text-sm rounded uppercase tracking-wider hover:bg-korma-gold-light transition-colors">Start Your Journey</a>
              <a href="#programs" className="px-6 py-3 border border-white/20 text-white/70 font-medium text-sm rounded uppercase tracking-wider hover:border-korma-gold hover:text-korma-gold transition-colors">View Programs</a>
            </div>
          </motion.div>
          <motion.div className="grid grid-cols-2 gap-5" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}>
            {values.map((value, i) => (
              <motion.div key={value.title} className="p-6 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:border-korma-gold/30 transition-colors group" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <div className="w-10 h-10 rounded-lg bg-korma-gold/10 flex items-center justify-center mb-4 group-hover:bg-korma-gold/20 transition-colors"><value.icon className="h-5 w-5 text-korma-gold" /></div>
                <h3 className="text-white font-bold mb-2">{value.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-korma-gold/30 to-transparent" />
    </section>
  );
}
