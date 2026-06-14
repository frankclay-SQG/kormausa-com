"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Shield,
  AlertTriangle,
  Loader2,
  FileText,
  PenLine,
  User,
} from "lucide-react";
import { DuplicateConfirmationDialog } from "@/components/duplicate-confirmation-dialog";
import type { HubSpotDuplicateCandidate } from "@/lib/hubspot/contacts";

// ─────────────────────────────────────────────────────────────────────────────
// Waiver content
// ─────────────────────────────────────────────────────────────────────────────
const WAIVER_SECTIONS = [
  {
    num: "1",
    title: "ASSUMPTION OF RISK",
    body: `I understand and acknowledge that martial arts training involves inherent and significant risks of bodily injury, including but not limited to: bruises, cuts, muscle sprains and strains, dislocations, fractures, concussions, dental injury, and in extreme cases, permanent disability or death. These risks may result from physical contact with other participants, sparring, throws, takedowns, falls, kicks, strikes, joint-manipulation techniques, conditioning exercises, and use of training equipment. I voluntarily accept and assume all such risks associated with my participation in KORMA-USA Activities.`,
  },
  {
    num: "2",
    title: "RELEASE OF LIABILITY",
    body: `In consideration of being permitted to participate in KORMA-USA Activities, I, on behalf of myself, my heirs, executors, administrators, assigns, and personal representatives, hereby release, waive, discharge, and covenant not to sue KORMA-USA, the Korean Martial Arts Association USA, its owners, directors, officers, instructors, employees, agents, volunteers, facility owners, and each of their respective heirs, assigns, and successors (collectively, "Released Parties") from any and all liability, claims, demands, actions, and causes of action of any nature arising from or related to bodily injury, property damage, or death that may result from my participation in KORMA-USA Activities, whether caused by the negligence of the Released Parties or any other cause.`,
  },
  {
    num: "3",
    title: "INDEMNIFICATION",
    body: `I agree to indemnify, defend, and hold harmless the Released Parties from and against any and all claims, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or related to my participation in KORMA-USA Activities or any breach of this Agreement.`,
  },
  {
    num: "4",
    title: "MEDICAL AUTHORIZATION AND EMERGENCY TREATMENT",
    body: `I authorize KORMA-USA and its representatives to obtain or render emergency medical treatment on my behalf if I am incapacitated and unable to consent at the time of an emergency. I understand that KORMA-USA is not responsible for any costs of medical treatment. I certify that I have no medical condition that would prevent safe participation without prior medical clearance, or that I have obtained such clearance from a licensed medical professional.`,
  },
  {
    num: "5",
    title: "PHOTO AND VIDEO RELEASE",
    body: `If I provide photo/video consent (selected in the signature section below), I grant KORMA-USA a perpetual, worldwide, royalty-free license to use photographs, videos, and other media featuring me taken during KORMA-USA activities for promotional, educational, social media, and marketing purposes, without further compensation or notice.`,
  },
  {
    num: "6",
    title: "GOVERNING LAW AND VENUE",
    body: `This Agreement shall be governed by and construed in accordance with the laws of the Commonwealth of Virginia, without regard to conflict-of-law principles. Any legal proceeding arising from this Agreement shall be brought exclusively in the courts of competent jurisdiction in the Commonwealth of Virginia.`,
  },
  {
    num: "7",
    title: "ELECTRONIC SIGNATURE",
    body: `I intend that my typed name in the signature section constitutes my legal electronic signature on this Agreement, with the same force and effect as a handwritten signature, pursuant to the Virginia Uniform Electronic Transactions Act, Va. Code §§ 59.1-479 through 59.1-497. If I am signing on behalf of a minor participant, I affirm that I am the minor's parent or legal guardian and have authority to bind the minor to this Agreement.`,
  },
  {
    num: "8",
    title: "SEVERABILITY AND ENTIRE AGREEMENT",
    body: `If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall remain in full force and effect. This Agreement constitutes the entire agreement between the parties regarding the subject matter herein.`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function getAge(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  )
    age--;
  return age;
}

const todayISO = new Date().toISOString().split("T")[0];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  guardianName: string;
  guardianEmail: string;
  guardianSignature: string;
  signatureName: string;
  signatureDate: string;
  photoConsent: boolean;
  hasReadWaiver: boolean;
  agreesToTerms: boolean;
}

const INITIAL: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  guardianName: "",
  guardianEmail: "",
  guardianSignature: "",
  signatureName: "",
  signatureDate: todayISO,
  photoConsent: false,
  hasReadWaiver: false,
  agreesToTerms: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────────────────────────────────────
const inputCls =
  "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:border-korma-gold/50 transition-colors";
const labelCls =
  "block text-white/70 text-xs uppercase tracking-wider mb-2";

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1 as const, label: "Your Info" },
    { n: 2 as const, label: "Read Waiver" },
    { n: 3 as const, label: "Sign" },
  ];
  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map(({ n, label }, i) => (
        <div key={n} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                current === n
                  ? "bg-korma-gold border-korma-gold text-korma-dark"
                  : current > n
                  ? "bg-korma-gold/20 border-korma-gold/50 text-korma-gold"
                  : "bg-white/5 border-white/20 text-white/30"
              }`}
            >
              {current > n ? "✓" : n}
            </div>
            <span
              className={`text-xs whitespace-nowrap ${
                current === n
                  ? "text-korma-gold"
                  : current > n
                  ? "text-korma-gold/60"
                  : "text-white/30"
              }`}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-16 h-px mx-2 mb-5 transition-colors ${
                current > n ? "bg-korma-gold/40" : "bg-white/10"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export function WaiverForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [duplicates, setDuplicates] = useState<HubSpotDuplicateCandidate[]>([]);
  const [form, setForm] = useState<FormState>(INITIAL);

  const age = getAge(form.dateOfBirth);
  const isMinor = age !== null && age < 18;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const t = e.target as HTMLInputElement;
    const value = t.type === "checkbox" ? t.checked : t.value;
    setForm((prev) => ({ ...prev, [t.name]: value }));
  };

  const submitWaiver = async (duplicateConfirmed = false) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/waiver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, isMinor, duplicateConfirmed }),
      });
      const result = await res.json();
      if (res.status === 409 && result.errorCode === "POTENTIAL_DUPLICATE") {
        setDuplicates(result.duplicates ?? []);
        return;
      }
      if (!res.ok) throw new Error(result.error ?? "failed");
      setSubmitted(true);
    } catch {
      setError(
        "Something went wrong. Please try again or contact info@kormausa.com."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    await submitWaiver(false);
  };

  // ── Success screen ───────────────────────────────────────────────────────────
  if (submitted) {
    const signerName = isMinor ? form.guardianSignature : form.signatureName;
    const participantName = `${form.firstName} ${form.lastName}`.trim();
    return (
      <>
      <section className="min-h-screen flex items-center justify-center px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center py-16 px-8 rounded-2xl border border-korma-gold/20 bg-white/[0.03] text-center max-w-lg w-full"
        >
          <div className="w-16 h-16 rounded-full bg-korma-gold/10 border border-korma-gold/30 flex items-center justify-center mb-5">
            <CheckCircle className="h-9 w-9 text-korma-gold" />
          </div>
          <h3 className="text-3xl font-black text-white mb-3">Waiver Signed!</h3>
          <p className="text-white/55 mb-7 leading-relaxed">
            The liability waiver for{" "}
            <strong className="text-white">{participantName}</strong> has been
            electronically signed and recorded in the KORMA-USA system.
          </p>

          {/* Summary card */}
          <div className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-5 py-4 text-left space-y-2 mb-8">
            {[
              ["Participant", participantName],
              ["Signed by", signerName],
              ["Date", form.signatureDate],
              ["Photo consent", form.photoConsent ? "Granted" : "Not granted"],
              ["Legal basis", "Virginia UETA §§ 59.1-479–497"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs gap-4">
                <span className="text-white/40 uppercase tracking-wider flex-shrink-0">
                  {k}
                </span>
                <span className="text-white font-medium text-right">{v}</span>
              </div>
            ))}
          </div>

          <p className="text-white/30 text-xs">
            Questions?{" "}
            <a
              href="mailto:info@kormausa.com"
              className="text-korma-gold hover:underline"
            >
              info@kormausa.com
            </a>
          </p>
        </motion.div>
      </section>
      <DuplicateConfirmationDialog
        open={duplicates.length > 0}
        duplicates={duplicates}
        onCancel={() => setDuplicates([])}
        onConfirm={() => {
          setDuplicates([]);
          void submitWaiver(true);
        }}
      />
      </>
    );
  }

  return (
    <>
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-korma-gold/30 bg-korma-gold/10 mb-5">
            <Shield className="h-4 w-4 text-korma-gold" />
            <span className="text-korma-gold text-sm font-semibold tracking-wider uppercase">
              Legal Document
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Liability{" "}
            <span className="text-korma-gold">Waiver</span>
          </h1>
          <p className="text-white/50 text-sm max-w-lg mx-auto leading-relaxed">
            All KORMA-USA participants must complete this waiver before their first
            class. Electronically signed and legally binding under Virginia law.
          </p>
        </div>

        <StepIndicator current={step} />

        <AnimatePresence mode="wait">
          {/* ────────────── STEP 1: Participant Info ───────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
            >
              <div className="rounded-2xl border border-korma-gold/20 bg-white/[0.03] p-8">
                <div className="flex items-center gap-2 mb-6">
                  <User className="h-5 w-5 text-korma-gold" />
                  <h2 className="text-xl font-bold text-white">
                    Participant Information
                  </h2>
                </div>

                <div className="space-y-5">
                  {/* Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>
                        First Name{" "}
                        <span className="text-korma-gold">*</span>
                      </label>
                      <input
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        required
                        placeholder="John"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>
                        Last Name <span className="text-korma-gold">*</span>
                      </label>
                      <input
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        required
                        placeholder="Kim"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Email + Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>
                        Email <span className="text-korma-gold">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="john@email.com"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="(555) 000-0000"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* DOB */}
                  <div>
                    <label className={labelCls}>
                      Date of Birth <span className="text-korma-gold">*</span>
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      required
                      className={`${inputCls} text-white/70`}
                    />
                    <AnimatePresence>
                      {isMinor && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <span className="flex items-center gap-1.5 mt-2 text-xs text-amber-400">
                            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                            Minor participant — a parent or legal guardian must
                            complete the signature in Step 3.
                          </span>
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Emergency contact */}
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-white/40 text-xs uppercase tracking-wider font-medium mb-4">
                      Emergency Contact
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>
                          Contact Name{" "}
                          <span className="text-korma-gold">*</span>
                        </label>
                        <input
                          name="emergencyContactName"
                          value={form.emergencyContactName}
                          onChange={handleChange}
                          required
                          placeholder="Jane Kim"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>
                          Contact Phone{" "}
                          <span className="text-korma-gold">*</span>
                        </label>
                        <input
                          type="tel"
                          name="emergencyContactPhone"
                          value={form.emergencyContactPhone}
                          onChange={handleChange}
                          required
                          placeholder="(555) 000-0000"
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  )}

                  <button
                    onClick={() => {
                      if (
                        !form.firstName ||
                        !form.lastName ||
                        !form.email ||
                        !form.dateOfBirth ||
                        !form.emergencyContactName ||
                        !form.emergencyContactPhone
                      ) {
                        setError("Please fill in all required fields.");
                        return;
                      }
                      setError("");
                      setStep(2);
                    }}
                    className="w-full py-4 bg-korma-gold text-korma-dark font-bold text-sm rounded uppercase tracking-wider hover:bg-korma-gold-light transition-colors"
                  >
                    Continue to Waiver →
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ────────────── STEP 2: Read Waiver ────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
            >
              <div className="rounded-2xl border border-korma-gold/20 bg-white/[0.03] p-8">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-korma-gold" />
                  <h2 className="text-xl font-bold text-white">Liability Waiver</h2>
                </div>
                <p className="text-white/40 text-[11px] uppercase tracking-wider mb-1">
                  Korean Martial Arts Association USA — Commonwealth of Virginia
                </p>
                <p className="text-korma-gold text-[11px] font-bold uppercase tracking-wider mb-5">
                  Please read this entire agreement carefully. It is a legally binding document.
                </p>

                {/* Scrollable waiver text */}
                <div className="h-[26rem] overflow-y-auto rounded-lg border border-white/10 bg-white/[0.02] p-5 mb-5 space-y-5">
                  {WAIVER_SECTIONS.map(({ num, title, body }) => (
                    <div key={num}>
                      <h4 className="text-white/80 font-bold text-[11px] uppercase tracking-wider mb-2">
                        {num}. {title}
                      </h4>
                      <p className="text-white/55 text-xs leading-relaxed">{body}</p>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-white/70 text-xs font-semibold leading-relaxed">
                      BY SIGNING IN THE NEXT STEP, I ACKNOWLEDGE THAT I HAVE READ THIS
                      ENTIRE AGREEMENT, UNDERSTAND ITS TERMS, AND FREELY ACCEPT THEM.
                    </p>
                  </div>
                </div>

                {/* Confirm read */}
                <label className="flex items-start gap-3 cursor-pointer mb-6 p-4 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                  <input
                    type="checkbox"
                    name="hasReadWaiver"
                    checked={form.hasReadWaiver}
                    onChange={handleChange}
                    className="mt-0.5 accent-yellow-400"
                  />
                  <span className="text-white/70 text-sm leading-relaxed">
                    I have read and fully understand this Liability Waiver in its
                    entirety.
                  </span>
                </label>

                {error && (
                  <p className="text-red-400 text-sm text-center mb-4">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setError("");
                      setStep(1);
                    }}
                    className="px-6 py-3 border border-white/20 text-white/60 text-sm rounded hover:border-white/40 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      if (!form.hasReadWaiver) {
                        setError(
                          "Please confirm you have read the waiver before continuing."
                        );
                        return;
                      }
                      setError("");
                      setStep(3);
                    }}
                    className="flex-1 py-3 bg-korma-gold text-korma-dark font-bold text-sm rounded uppercase tracking-wider hover:bg-korma-gold-light transition-colors"
                  >
                    Proceed to Sign →
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ────────────── STEP 3: Sign ────────────────────────────── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
            >
              <div className="rounded-2xl border border-korma-gold/20 bg-white/[0.03] p-8 space-y-6">
                <div className="flex items-center gap-2">
                  <PenLine className="h-5 w-5 text-korma-gold" />
                  <h2 className="text-xl font-bold text-white">Electronic Signature</h2>
                </div>

                {/* Minor alert */}
                {isMinor && (
                  <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-400/30 bg-amber-400/10">
                    <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-400 font-bold text-sm">
                        Minor Participant
                      </p>
                      <p className="text-amber-400/70 text-xs mt-1">
                        {form.firstName} {form.lastName} is under 18 years of age. A
                        parent or legal guardian must complete the fields below and
                        provide their signature.
                      </p>
                    </div>
                  </div>
                )}

                {/* Guardian fields (minor only) */}
                {isMinor && (
                  <div className="space-y-4 p-5 rounded-lg border border-amber-400/20 bg-amber-400/5">
                    <p className="text-white/70 text-xs uppercase tracking-wider font-semibold">
                      Parent / Legal Guardian
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>
                          Guardian Full Name{" "}
                          <span className="text-korma-gold">*</span>
                        </label>
                        <input
                          name="guardianName"
                          value={form.guardianName}
                          onChange={handleChange}
                          placeholder="Parent / Guardian name"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Guardian Email</label>
                        <input
                          type="email"
                          name="guardianEmail"
                          value={form.guardianEmail}
                          onChange={handleChange}
                          placeholder="parent@email.com"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>
                        Guardian Typed Signature{" "}
                        <span className="text-korma-gold">*</span>
                      </label>
                      <input
                        name="guardianSignature"
                        value={form.guardianSignature}
                        onChange={handleChange}
                        placeholder="Type your full legal name"
                        className={`${inputCls} font-serif italic text-base tracking-wide`}
                      />
                      <p className="text-white/30 text-xs mt-1">
                        Type your full legal name exactly as it appears on your ID
                      </p>
                    </div>
                  </div>
                )}

                {/* Adult signature */}
                {!isMinor && (
                  <div>
                    <label className={labelCls}>
                      Your Typed Signature{" "}
                      <span className="text-korma-gold">*</span>
                    </label>
                    <input
                      name="signatureName"
                      value={form.signatureName}
                      onChange={handleChange}
                      placeholder="Type your full legal name"
                      className={`${inputCls} font-serif italic text-base tracking-wide`}
                    />
                    <p className="text-white/30 text-xs mt-1">
                      Please type:{" "}
                      <strong className="text-white/50">
                        {form.firstName} {form.lastName}
                      </strong>
                    </p>
                  </div>
                )}

                {/* Date */}
                <div>
                  <label className={labelCls}>Date Signed</label>
                  <input
                    type="date"
                    name="signatureDate"
                    value={form.signatureDate}
                    onChange={handleChange}
                    className={`${inputCls} text-white/70`}
                  />
                </div>

                {/* Photo consent (optional) */}
                <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                  <input
                    type="checkbox"
                    name="photoConsent"
                    checked={form.photoConsent}
                    onChange={handleChange}
                    className="mt-0.5 accent-yellow-400"
                  />
                  <div>
                    <span className="block text-white/80 text-sm font-medium">
                      Photo &amp; Video Consent{" "}
                      <span className="text-white/30 font-normal text-xs">(optional)</span>
                    </span>
                    <span className="block text-white/40 text-xs mt-0.5">
                      I consent to KORMA-USA using photos/videos of me taken during
                      classes or events for promotional and educational purposes.
                    </span>
                  </div>
                </label>

                {/* Final agreement */}
                <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border border-korma-gold/20 bg-korma-gold/5 hover:border-korma-gold/30 transition-colors">
                  <input
                    type="checkbox"
                    name="agreesToTerms"
                    checked={form.agreesToTerms}
                    onChange={handleChange}
                    className="mt-0.5 accent-yellow-400"
                  />
                  <span className="text-white/70 text-sm leading-relaxed">
                    I confirm that I have read the entire Liability Waiver, understand
                    its terms, and am signing it freely and voluntarily. I understand
                    this is a legally binding agreement governed by the laws of the
                    Commonwealth of Virginia.
                  </span>
                </label>

                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setError("");
                      setStep(2);
                    }}
                    className="px-6 py-3 border border-white/20 text-white/60 text-sm rounded hover:border-white/40 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={
                      loading ||
                      !form.agreesToTerms ||
                      (isMinor
                        ? !form.guardianSignature || !form.guardianName
                        : !form.signatureName)
                    }
                    className="flex-1 py-3 bg-korma-gold text-korma-dark font-bold text-sm rounded uppercase tracking-wider hover:bg-korma-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      "Submit Signed Waiver"
                    )}
                  </button>
                </div>

                <p className="text-white/20 text-xs text-center">
                  Electronically signed pursuant to the Virginia Uniform Electronic
                  Transactions Act, Va. Code §§ 59.1-479–497.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    <DuplicateConfirmationDialog
      open={duplicates.length > 0}
      duplicates={duplicates}
      onCancel={() => setDuplicates([])}
      onConfirm={() => {
        setDuplicates([]);
        void submitWaiver(true);
      }}
    />
    </>
  );
}
