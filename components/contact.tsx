"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Loader2,
  Calendar,
  FileText,
} from "lucide-react";

const CLASS_OPTIONS = ["taekwondo", "hapkido", "kumdo"];
const SEMINAR_OPTIONS = ["seminar-corporate", "seminar-individual"];
const MEETINGS_URL = "https://meetings-na2.hubspot.com/frank-clay";

export function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", interest: "", message: "",
    experience: "", schedule: "",
    organization: "", groupSize: "", preferredDate: "",
  });

  const isClass = CLASS_OPTIONS.includes(form.interest);
  const isSeminar = SEMINAR_OPTIONS.includes(form.interest);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setError(
        "Something went wrong. Please try again or email us at info@kormausa.com."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const fieldClass =
    "w-full px-4 py-3 rounded-lg bg-white/[0.06] border border-white/10 text-white placeholder-white/25 text-sm focus:outline-none focus:border-korma-gold/50 transition-colors";
  const labelClass =
    "block text-white/50 text-xs uppercase tracking-wider mb-1.5";

  return (
    <section
      id="contact"
      className="bg-korma-navy-deeper py-24 sm:py-32 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-korma-gold/30 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(29,52,97,0.5)_0%,_transparent_60%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-px w-10 bg-korma-gold" />
              <span className="text-korma-gold text-xs font-bold tracking-[0.3em] uppercase">
                Get In Touch
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">
              Begin Your
              <br />
              <span className="gold-shimmer">Training Today</span>
            </h2>
            <p className="text-white/55 text-lg leading-relaxed mb-10">
              Ready to start your martial arts journey? Contact us to schedule a
              free trial class or learn more about our programs and seminars.
            </p>
            <div className="space-y-5">
              {[
                { icon: MapPin, label: "Location", value: "Contact us for dojo address" },
                { icon: Phone, label: "Phone", value: "Contact us for phone number" },
                { icon: Mail, label: "Email", value: "info@kormausa.com" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-korma-gold/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-5 w-5 text-korma-gold" />
                  </div>
                  <div>
                    <div className="text-white/40 text-xs uppercase tracking-wider">
                      {item.label}
                    </div>
                    <div className="text-white font-medium text-sm mt-0.5">
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 p-6 rounded-xl border border-korma-gold/20 bg-korma-gold/5">
              <div className="text-korma-gold font-bold text-sm uppercase tracking-wider mb-2">
                🌻 Free Trial Class
              </div>
              <p className="text-white/60 text-sm">
                New students are welcome to attend one free class in any
                discipline. No commitment required — just show up and experience
                it for yourself.
              </p>
            </div>
          </motion.div>

          {/* Right column */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-14 px-8 rounded-2xl border border-korma-gold/20 bg-white/[0.03] text-center">
                <CheckCircle className="h-14 w-14 text-korma-gold mb-4" />
                <h3 className="text-2xl font-black text-white mb-3">
                  Message Received!
                </h3>
                <p className="text-white/55 mb-7">
                  Thank you for reaching out. A KORMA-USA instructor will
                  contact you within 24 hours — or skip the wait and book
                  your time slot right now.
                </p>

                {/* Book a session */}
                <a
                  href={MEETINGS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-korma-gold text-korma-dark font-bold text-sm rounded uppercase tracking-wider hover:bg-korma-gold-light transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  Schedule Your Visit Now
                </a>
                <p className="text-white/30 text-xs mt-3">
                  15 min · 30 min · 60 min — pick what fits
                </p>

                {/* Divider */}
                <div className="w-full flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/25 text-xs uppercase tracking-wider">also</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Waiver CTA */}
                <a
                  href="/waiver"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white/70 text-sm rounded uppercase tracking-wider hover:border-korma-gold/40 hover:text-white transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Sign Liability Waiver
                </a>
                <p className="text-white/30 text-xs mt-2">
                  Required before your first class
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-5 p-8 rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                <h3 className="text-xl font-bold text-white mb-6">
                  Send Us a Message
                </h3>

                {/* Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <input
                      type="text" name="name" required
                      value={form.name} onChange={handleChange}
                      placeholder="Your full name" className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email *</label>
                    <input
                      type="email" name="email" required
                      value={form.email} onChange={handleChange}
                      placeholder="your@email.com" className={fieldClass}
                    />
                  </div>
                </div>

                {/* Phone + Interest */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input
                      type="tel" name="phone"
                      value={form.phone} onChange={handleChange}
                      placeholder="(555) 000-0000" className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Interested In *</label>
                    <select
                      name="interest" required
                      value={form.interest} onChange={handleChange}
                      className={`${fieldClass} text-white/70 appearance-none`}
                    >
                      <option value="" className="bg-korma-navy-deeper">Select a program</option>
                      <optgroup label="Regular Classes" className="bg-korma-navy-deeper">
                        <option value="taekwondo" className="bg-korma-navy-deeper">Taekwondo Changmookwan</option>
                        <option value="hapkido" className="bg-korma-navy-deeper">Hapkido Migukyongkwan</option>
                        <option value="kumdo" className="bg-korma-navy-deeper">Kumdo</option>
                      </optgroup>
                      <optgroup label="Self Defense Seminars" className="bg-korma-navy-deeper">
                        <option value="seminar-corporate" className="bg-korma-navy-deeper">Corporate Seminar</option>
                        <option value="seminar-individual" className="bg-korma-navy-deeper">Individual Seminar</option>
                      </optgroup>
                      <option value="general" className="bg-korma-navy-deeper">General Inquiry</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic: Class fields */}
                <AnimatePresence>
                  {isClass && (
                    <motion.div
                      key="class-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div>
                          <label className={labelClass}>Experience Level</label>
                          <select name="experience" value={form.experience} onChange={handleChange}
                            className={`${fieldClass} text-white/70 appearance-none`}>
                            <option value="" className="bg-korma-navy-deeper">Select level</option>
                            <option value="beginner" className="bg-korma-navy-deeper">Beginner — No experience</option>
                            <option value="some" className="bg-korma-navy-deeper">Some experience (1–2 yrs)</option>
                            <option value="intermediate" className="bg-korma-navy-deeper">Intermediate (3–5 yrs)</option>
                            <option value="advanced" className="bg-korma-navy-deeper">Advanced (5+ yrs)</option>
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>Preferred Schedule</label>
                          <select name="schedule" value={form.schedule} onChange={handleChange}
                            className={`${fieldClass} text-white/70 appearance-none`}>
                            <option value="" className="bg-korma-navy-deeper">Select preference</option>
                            <option value="weekday-morning" className="bg-korma-navy-deeper">Weekday mornings</option>
                            <option value="weekday-evening" className="bg-korma-navy-deeper">Weekday evenings</option>
                            <option value="weekend-morning" className="bg-korma-navy-deeper">Weekend mornings</option>
                            <option value="weekend-afternoon" className="bg-korma-navy-deeper">Weekend afternoons</option>
                            <option value="flexible" className="bg-korma-navy-deeper">Flexible</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Dynamic: Seminar fields */}
                <AnimatePresence>
                  {isSeminar && (
                    <motion.div
                      key="seminar-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 pt-1">
                        {form.interest === "seminar-corporate" && (
                          <div>
                            <label className={labelClass}>Organization / Company Name</label>
                            <input type="text" name="organization"
                              value={form.organization} onChange={handleChange}
                              placeholder="Your organization" className={fieldClass}
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Group Size</label>
                            <select name="groupSize" value={form.groupSize} onChange={handleChange}
                              className={`${fieldClass} text-white/70 appearance-none`}>
                              <option value="" className="bg-korma-navy-deeper">Select size</option>
                              <option value="1" className="bg-korma-navy-deeper">Just me (1)</option>
                              <option value="2-5" className="bg-korma-navy-deeper">Small group (2–5)</option>
                              <option value="6-15" className="bg-korma-navy-deeper">Medium group (6–15)</option>
                              <option value="16-30" className="bg-korma-navy-deeper">Large group (16–30)</option>
                              <option value="30+" className="bg-korma-navy-deeper">30+ people</option>
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>Preferred Date</label>
                            <input type="date" name="preferredDate"
                              value={form.preferredDate} onChange={handleChange}
                              className={`${fieldClass} text-white/70`}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Message */}
                <div>
                  <label className={labelClass}>Message</label>
                  <textarea name="message" value={form.message} onChange={handleChange}
                    rows={4} placeholder="Tell us about your goals or ask any questions..."
                    className={`${fieldClass} resize-none`}
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-korma-gold text-korma-dark font-bold text-sm rounded uppercase tracking-wider hover:bg-korma-gold-light transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Sending...</>
                  ) : (
                    <><Send className="h-4 w-4" />Send Message</>
                  )}
                </button>
                <p className="text-white/30 text-xs text-center">
                  Your information is kept private and will never be shared.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
