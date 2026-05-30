"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Send, MapPin, Phone, Mail, CheckCircle } from "lucide-react";
export function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", interest: "", message: "" });
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(true); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { setForm((prev) => ({ ...prev, [e.target.name]: e.target.value })); };
  return (
    <section id="contact" className="bg-korma-navy-deeper py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-korma-gold/30 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(29,52,97,0.5)_0%,_transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-3 mb-4"><div className="h-px w-10 bg-korma-gold" /><span className="text-korma-gold text-xs font-bold tracking-[0.3em] uppercase">Get In Touch</span></div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">Begin Your<br /><span className="gold-shimmer">Training Today</span></h2>
            <p className="text-white/55 text-lg leading-relaxed mb-10">Ready to start your martial arts journey? Contact us to schedule a free trial class or learn more about our programs and seminars.</p>
            <div className="space-y-5">{[{ icon: MapPin, label: "Location", value: "Contact us for dojo address" }, { icon: Phone, label: "Phone", value: "Contact us for phone number" }, { icon: Mail, label: "Email", value: "info@kormausa.com" }].map((item) => (<div key={item.label} className="flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-korma-gold/10 flex items-center justify-center flex-shrink-0"><item.icon className="h-5 w-5 text-korma-gold" /></div><div><div className="text-white/40 text-xs uppercase tracking-wider">{item.label}</div><div className="text-white font-medium text-sm mt-0.5">{item.value}</div></div></div>))}</div>
            <div className="mt-10 p-6 rounded-xl border border-korma-gold/20 bg-korma-gold/5"><div className="text-korma-gold font-bold text-sm uppercase tracking-wider mb-2">🥋 Free Trial Class</div><p className="text-white/60 text-sm">New students are welcome to attend one free class in any discipline. No commitment required — just show up and experience it for yourself.</p></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}>
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-16 px-8 rounded-2xl border border-korma-gold/20 bg-white/[0.03] text-center"><CheckCircle className="h-14 w-14 text-korma-gold mb-4" /><h3 className="text-2xl font-black text-white mb-3">Message Received!</h3><p className="text-white/55">Thank you for reaching out. A KORMA-USA instructor will contact you within 24 hours to schedule your visit.</p></div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 p-8 rounded-2xl border border-white/10 bg-white/[0.03]">
                <h3 className="text-xl font-bold text-white mb-6">Send Us a Message</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Full Name *</label><input type="text" name="name" required value={form.name} onChange={handleChange} placeholder="Your full name" className="w-full px-4 py-3 rounded-lg bg-white/[0.06] border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-korma-gold/50 transition-colors" /></div>
                  <div><label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Email *</label><input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="your@email.com" className="w-full px-4 py-3 rounded-lg bg-white/[0.06] border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-korma-gold/50 transition-colors" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Phone</label><input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="(555) 000-0000" className="w-full px-4 py-3 rounded-lg bg-white/[0.06] border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-korma-gold/50 transition-colors" /></div>
                  <div><label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Interested In</label><select name="interest" value={form.interest} onChange={handleChange} className="w-full px-4 py-3 rounded-lg bg-white/[0.06] border border-white/10 text-white/70 text-sm focus:outline-none focus:border-korma-gold/50 transition-colors appearance-none"><option value="" className="bg-korma-navy-deeper">Select a program</option><option value="kumdo" className="bg-korma-navy-deeper">KumDo</option><option value="hapkido" className="bg-korma-navy-deeper">Hapkido</option><option value="taichi" className="bg-korma-navy-deeper">Tai Chi</option><option value="seminar-corporate" className="bg-korma-navy-deeper">Corporate Seminar</option><option value="seminar-individual" className="bg-korma-navy-deeper">Individual Seminar</option><option value="general" className="bg-korma-navy-deeper">General Inquiry</option></select></div>
                </div>
                <div><label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Message</label><textarea name="message" value={form.message} onChange={handleChange} rows={4} placeholder="Tell us about your goals or ask any questions..." className="w-full px-4 py-3 rounded-lg bg-white/[0.06] border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-korma-gold/50 transition-colors resize-none" /></div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-korma-gold text-korma-dark font-bold text-sm rounded uppercase tracking-wider hover:bg-korma-gold-light transition-colors"><Send className="h-4 w-4" />Send Message</button>
                <p className="text-white/30 text-xs text-center">Your information is kept private and will never be shared.</p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
