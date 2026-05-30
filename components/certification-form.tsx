"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Calendar,
  Loader2,
  Award,
  GraduationCap,
  Building2,
  ChevronDown,
} from "lucide-react";

const MEETINGS_URL = "https://meetings-na2.hubspot.com/frank-clay";

const CERT_TYPES = [
  {
    id: "belt-dan",
    icon: Award,
    label: "Belt / Dan Certification",
    desc: "Official rank recognition and promotion for black belt practitioners",
  },
  {
    id: "instructor",
    icon: GraduationCap,
    label: "Instructor Certification",
    desc: "Become a certified KORMA-USA instructor authorized to teach and lead classes",
  },
  {
    id: "school",
    icon: Building2,
    label: "School / Dojang Certification",
    desc: "Affiliate your martial arts school with the KORMA-USA organization",
  },
];

const DISCIPLINES = [
  { id: "taekwondo", label: "Taekwondo" },
  { id: "hapkido", label: "Hapkido" },
  { id: "kumdo", label: "KumDo" },
];

const RANKS = [
  "White Belt",
  "Yellow Belt",
  "Orange Belt",
  "Green Belt",
  "Blue Belt",
  "Purple Belt",
  "Brown Belt",
  "Red Belt",
  "Black Belt – 1st Dan",
  "Black Belt – 2nd Dan",
  "Black Belt – 3rd Dan",
  "Black Belt – 4th Dan",
  "Black Belt – 5th Dan",
  "6th Dan+",
];

const YEARS_OPTIONS = [
  "Less than 1 year",
  "1–3 years",
  "4–7 years",
  "8–15 years",
  "16–25 years",
  "25+ years",
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  certTypes: string[];
  disciplines: string[];
  currentRank: string;
  yearsTraining: string;
  currentOrg: string;
  instructorName: string;
  schoolName: string;
  message: string;
}

export function CertificationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    certTypes: [],
    disciplines: [],
    currentRank: "",
    yearsTraining: "",
    currentOrg: "",
    instructorName: "",
    schoolName: "",
    message: "",
  });

  const toggleArray = (field: "certTypes" | "disciplines", value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/certification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setError(
        "Something went wrong. Please try again or email info@kormausa.com."
      );
    } finally {
      setLoading(false);
    }
  };

  const showSchoolName = form.certTypes.includes("school");

  // ── Success screen ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <section className="min-h-screen flex items-center justify-center px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 px-8 rounded-2xl border border-korma-gold/20 bg-white/[0.03] text-center max-w-xl w-full"
        >
          <CheckCircle className="h-16 w-16 text-korma-gold mb-5" />
          <h3 className="text-3xl font-black text-white mb-4">Application Received!</h3>
          <p className="text-white/55 mb-10 leading-relaxed">
            Thank you for applying for KORMA-USA certification. A master instructor
            will review your application and contact you within 48 hours — or book
            your evaluation session right now.
          </p>
          <a
            href={MEETINGS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-korma-gold text-korma-dark font-bold text-sm rounded uppercase tracking-wider hover:bg-korma-gold-light transition-colors"
          >
            <Calendar className="h-4 w-4" />
            Schedule Your Evaluation
          </a>
          <p className="text-white/30 text-xs mt-4">
            Select the 60-minute option when booking
          </p>
        </motion.div>
      </section>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-korma-gold/30 bg-korma-gold/10 mb-6">
            <Award className="h-4 w-4 text-korma-gold" />
            <span className="text-korma-gold text-sm font-semibold tracking-wider uppercase">
              Official Certification
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            KORMA-USA{" "}
            <span className="text-korma-gold">Certification</span>
          </h1>
          <p className="text-white/60 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Earn internationally recognized certification for black belts, instructors,
            and martial arts schools through the Korean Martial Arts Association.
          </p>
        </div>
      </section>

      {/* Cert type cards */}
      <section className="pb-16 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {CERT_TYPES.map((cert) => {
            const Icon = cert.icon;
            return (
              <div
                key={cert.id}
                className="rounded-xl border border-korma-gold/20 bg-white/[0.03] p-6 text-center"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-korma-gold/10 border border-korma-gold/20 mb-4">
                  <Icon className="h-7 w-7 text-korma-gold" />
                </div>
                <h3 className="text-white font-bold text-base mb-2">{cert.label}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{cert.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Application form */}
      <section className="pb-24 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-korma-gold/20 bg-white/[0.03] p-8 md:p-10">
            <h2 className="text-2xl font-black text-white mb-2">
              Certification Application
            </h2>
            <p className="text-white/45 text-sm mb-8">
              Complete all fields to begin the certification review process.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-xs uppercase tracking-wider mb-2">
                    Full Name <span className="text-korma-gold">*</span>
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="John Kim"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:border-korma-gold/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-xs uppercase tracking-wider mb-2">
                    Email <span className="text-korma-gold">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="john@email.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:border-korma-gold/50 transition-colors"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-white/70 text-xs uppercase tracking-wider mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="(555) 000-0000"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:border-korma-gold/50 transition-colors"
                />
              </div>

              {/* Certification Types */}
              <div>
                <label className="block text-white/70 text-xs uppercase tracking-wider mb-3">
                  Certification Type(s) <span className="text-korma-gold">*</span>
                </label>
                <div className="space-y-2">
                  {CERT_TYPES.map((cert) => (
                    <label
                      key={cert.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        form.certTypes.includes(cert.id)
                          ? "border-korma-gold/50 bg-korma-gold/10"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.certTypes.includes(cert.id)}
                        onChange={() => toggleArray("certTypes", cert.id)}
                        className="mt-0.5 accent-yellow-400"
                      />
                      <div>
                        <span className="block text-white text-sm font-semibold">
                          {cert.label}
                        </span>
                        <span className="block text-white/45 text-xs mt-0.5">
                          {cert.desc}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Conditional: School Name */}
              <AnimatePresence>
                {showSchoolName && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <label className="block text-white/70 text-xs uppercase tracking-wider mb-2">
                      School / Dojang Name
                    </label>
                    <input
                      name="schoolName"
                      value={form.schoolName}
                      onChange={handleChange}
                      placeholder="Virginia Taekwondo Academy"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:border-korma-gold/50 transition-colors"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Disciplines */}
              <div>
                <label className="block text-white/70 text-xs uppercase tracking-wider mb-3">
                  Discipline(s) <span className="text-korma-gold">*</span>
                </label>
                <div className="flex gap-3 flex-wrap">
                  {DISCIPLINES.map((d) => (
                    <label
                      key={d.id}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                        form.disciplines.includes(d.id)
                          ? "border-korma-gold/50 bg-korma-gold/10 text-white"
                          : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.disciplines.includes(d.id)}
                        onChange={() => toggleArray("disciplines", d.id)}
                        className="accent-yellow-400"
                      />
                      {d.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Current Rank + Years Training */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/70 text-xs uppercase tracking-wider mb-2">
                    Current Rank <span className="text-korma-gold">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="currentRank"
                      value={form.currentRank}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-korma-gold/50 transition-colors appearance-none"
                    >
                      <option value="" className="bg-gray-900">
                        Select rank…
                      </option>
                      {RANKS.map((r) => (
                        <option key={r} value={r} className="bg-gray-900">
                          {r}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-white/70 text-xs uppercase tracking-wider mb-2">
                    Years Training <span className="text-korma-gold">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="yearsTraining"
                      value={form.yearsTraining}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-korma-gold/50 transition-colors appearance-none"
                    >
                      <option value="" className="bg-gray-900">
                        Select years…
                      </option>
                      {YEARS_OPTIONS.map((y) => (
                        <option key={y} value={y} className="bg-gray-900">
                          {y}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Current Org */}
              <div>
                <label className="block text-white/70 text-xs uppercase tracking-wider mb-2">
                  Current Organization / Lineage
                </label>
                <input
                  name="currentOrg"
                  value={form.currentOrg}
                  onChange={handleChange}
                  placeholder="e.g. World Taekwondo, ITF, WTF, independent…"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:border-korma-gold/50 transition-colors"
                />
              </div>

              {/* Instructor Name */}
              <div>
                <label className="block text-white/70 text-xs uppercase tracking-wider mb-2">
                  Instructor / Grandmaster Name
                </label>
                <input
                  name="instructorName"
                  value={form.instructorName}
                  onChange={handleChange}
                  placeholder="Grand Master Kim"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:border-korma-gold/50 transition-colors"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-white/70 text-xs uppercase tracking-wider mb-2">
                  Additional Notes
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe your training background, competition history, or specific certification goals…"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:border-korma-gold/50 transition-colors resize-none"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  form.certTypes.length === 0 ||
                  form.disciplines.length === 0
                }
                className="w-full py-4 bg-korma-gold text-korma-dark font-bold text-sm rounded uppercase tracking-wider hover:bg-korma-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>

              <p className="text-white/25 text-xs text-center">
                A master instructor will contact you within 48 hours to schedule
                your evaluation.
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
