"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Sword,
  Star,
  Users,
  Building2,
  Check,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Calendar,
  Loader2,
  CheckCircle,
  MessageSquare,
  ArrowRight,
  Tag,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DuplicateConfirmationDialog } from "@/components/duplicate-confirmation-dialog";
import type { HubSpotDuplicateCandidate } from "@/lib/hubspot/contacts";

// ── Program catalog ───────────────────────────────────────────────────────

type ProgramType = "free" | "payment" | "quote";
type InquiryType = "regular_class" | "seminar";

interface Program {
  id: string;
  Icon: React.ElementType;
  label: string;
  description: string;
  price: number; // in cents
  priceLabel: string;
  type: ProgramType;
  inquiryType: InquiryType;
}

const PROGRAMS: Program[] = [
  {
    id: "trial",
    Icon: Star,
    label: "Free Trial Class",
    description:
      "Experience any of our programs at no cost. No commitment or equipment required.",
    price: 0,
    priceLabel: "FREE",
    type: "free",
    inquiryType: "regular_class",
  },
  {
    id: "test",
    Icon: CreditCard,
    label: "Test Enrollment",
    description:
      "Minimum Stripe checkout test to confirm payment processing is working.",
    price: 50,
    priceLabel: "$0.50",
    type: "payment",
    inquiryType: "regular_class",
  },
  {
    id: "taekwondo",
    Icon: Shield,
    label: "Taekwondo Changmookwan - Monthly",
    description:
      "Changmookwan Taekwondo lineage. Forms, striking, fast combinations, and discipline.",
    price: 15000,
    priceLabel: "$150 / mo",
    type: "payment",
    inquiryType: "regular_class",
  },
  {
    id: "hapkido",
    Icon: Shield,
    label: "Hapkido Migukyongkwan - Monthly",
    description:
      "Migukyongkwan Hapkido. Joint locks, throws, and redirecting force instead of meeting it.",
    price: 15000,
    priceLabel: "$150 / mo",
    type: "payment",
    inquiryType: "regular_class",
  },
  {
    id: "kumdo",
    Icon: Sword,
    label: "Kumdo - Monthly",
    description:
      "Korean sword art using bamboo shinai and wooden bokken practice swords.",
    price: 15000,
    priceLabel: "$150 / mo",
    type: "payment",
    inquiryType: "regular_class",
  },
  {
    id: "seminar-individual",
    Icon: Users,
    label: "Self-Defense Seminar",
    description:
      "Hands-on workshop covering situational awareness, strikes, and escape techniques.",
    price: 7500,
    priceLabel: "$75 / person",
    type: "payment",
    inquiryType: "seminar",
  },
  {
    id: "seminar-corporate",
    Icon: Building2,
    label: "Corporate Seminar",
    description:
      "Custom workplace safety and self-defense workshops for your business or organization.",
    price: 0,
    priceLabel: "Custom Quote",
    type: "quote",
    inquiryType: "seminar",
  },
];

// ── StepIndicator ─────────────────────────────────────────────────────────

const STEP_LABELS = ["Choose Program", "Your Details", "Review & Pay"];

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const isPast = n < step;
        const isCurrent = n === step;
        return (
          <div key={n} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300",
                  isCurrent
                    ? "bg-korma-gold border-korma-gold text-korma-dark"
                    : isPast
                    ? "bg-korma-gold/20 border-korma-gold/50 text-korma-gold"
                    : "bg-white/5 border-white/15 text-white/25"
                )}
              >
                {isPast ? <Check className="h-3.5 w-3.5" /> : n}
              </div>
              <span
                className={cn(
                  "hidden sm:block text-[10px] uppercase tracking-wider whitespace-nowrap",
                  isCurrent
                    ? "text-korma-gold"
                    : isPast
                    ? "text-korma-gold/50"
                    : "text-white/20"
                )}
              >
                {label}
              </span>
            </div>
            {n < STEP_LABELS.length && (
              <div
                className={cn(
                  "w-10 md:w-16 h-px mb-4 transition-all duration-300",
                  n < step ? "bg-korma-gold/40" : "bg-white/10"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Discount types ────────────────────────────────────────────────────────

interface AppliedDiscount {
  promotionCodeId: string;
  percentOff: number | null;
  amountOff: number | null; // in cents
  name: string;
}

// ── Main component ────────────────────────────────────────────────────────

export function EnrollForm() {
  const [step, setStep] = useState(1);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    participants: "1",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<
    null | { type: "free"; meetingUrl: string } | { type: "quote" }
  >(null);
  const [duplicates, setDuplicates] = useState<HubSpotDuplicateCandidate[]>([]);

  // ── Discount state ────────────────────────────────────────────────────
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountStatus, setDiscountStatus] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);

  const canGoStep2 = !!selectedProgram;
  const canGoStep3 =
    form.name.trim().length > 1 &&
    form.email.includes("@") &&
    form.phone.trim().length > 7 &&
    form.dateOfBirth.trim().length > 0;

  function field(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function changeProgram(prog: Program) {
    setSelectedProgram(prog);
    // Reset discount when program changes
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountStatus("idle");
    setShowDiscountInput(false);
  }

  const seminarQty = Math.max(1, parseInt(form.participants || "1", 10));

  /** Base price in cents for the current selection */
  function basePriceCents(): number {
    if (!selectedProgram) return 0;
    if (selectedProgram.id === "seminar-individual") return 7500 * seminarQty;
    return selectedProgram.price;
  }

  /** Final price after discount in cents */
  function finalPriceCents(): number {
    const base = basePriceCents();
    if (!appliedDiscount) return base;
    if (appliedDiscount.percentOff !== null) {
      return Math.round(base * (1 - appliedDiscount.percentOff / 100));
    }
    if (appliedDiscount.amountOff !== null) {
      return Math.max(0, base - appliedDiscount.amountOff);
    }
    return base;
  }

  function discountAmountCents(): number {
    return basePriceCents() - finalPriceCents();
  }

  function fmt(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  // ── Apply discount code ───────────────────────────────────────────────
  async function applyDiscountCode() {
    if (!discountCode.trim()) return;
    setDiscountStatus("checking");
    setAppliedDiscount(null);

    try {
      const res = await fetch("/api/enroll/validate-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode }),
      });
      const data = await res.json();

      if (data.valid) {
        setAppliedDiscount(data);
        setDiscountStatus("valid");
      } else {
        setDiscountStatus("invalid");
      }
    } catch {
      setDiscountStatus("invalid");
    }
  }

  function removeDiscount() {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountStatus("idle");
    setShowDiscountInput(false);
  }

  // ── Submit ────────────────────────────────────────────────────────────
  async function handleSubmit(duplicateConfirmed = false) {
    if (!selectedProgram) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/enroll/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: selectedProgram.id,
          programLabel: selectedProgram.label,
          programType: selectedProgram.type,
          priceInCents: selectedProgram.price,
          inquiryType: selectedProgram.inquiryType,
          name: form.name,
          email: form.email,
          phone: form.phone,
          dateOfBirth: form.dateOfBirth,
          participants: form.participants,
          message: form.message,
          promotionCodeId: appliedDiscount?.promotionCodeId ?? null,
          duplicateConfirmed,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.errorCode === "POTENTIAL_DUPLICATE") {
        setDuplicates(data.duplicates ?? []);
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      if (data.type === "stripe") {
        window.location.href = data.sessionUrl;
        return;
      }
      if (data.type === "free") {
        setSuccess({ type: "free", meetingUrl: data.meetingUrl });
        return;
      }
      if (data.type === "quote") {
        setSuccess({ type: "quote" });
        return;
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Success screens ────────────────────────────────────────────────────
  if (success) {
    return (
      <>
      <section className="pt-32 pb-24 px-4 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-full bg-korma-gold/10 border border-korma-gold/30 flex items-center justify-center mb-8"
        >
          <CheckCircle className="h-10 w-10 text-korma-gold" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col items-center"
        >
          {success.type === "free" ? (
            <>
              <h2 className="font-cinzel text-3xl text-white mb-3">
                You&apos;re Registered!
              </h2>
              <p className="text-white/55 max-w-md mb-8">
                Your free trial class is confirmed. Book your preferred time
                below and we&apos;ll see you on the mat.
              </p>
              <a
                href={success.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3 bg-korma-gold text-korma-dark font-bold text-sm uppercase tracking-wider hover:bg-korma-gold/90 transition-colors mb-4"
              >
                <Calendar className="h-4 w-4" />
                Schedule Your Trial Class
              </a>
            </>
          ) : (
            <>
              <h2 className="font-cinzel text-3xl text-white mb-3">
                Request Received!
              </h2>
              <p className="text-white/55 max-w-md mb-8">
                Thank you for your interest in our corporate seminar program.
                We&apos;ll reach out within one business day with a custom proposal.
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 border border-korma-gold/40 text-korma-gold text-sm uppercase tracking-wider hover:bg-korma-gold/10 transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
                Back to Home
              </a>
            </>
          )}
        </motion.div>
      </section>
      <DuplicateConfirmationDialog
        open={duplicates.length > 0}
        duplicates={duplicates}
        onCancel={() => setDuplicates([])}
        onConfirm={() => {
          setDuplicates([]);
          void handleSubmit(true);
        }}
      />
      </>
    );
  }

  // ── Step panels ────────────────────────────────────────────────────────
  return (
    <>
    <section className="pt-28 pb-24 px-4">
      {/* Hero */}
      <div className="text-center mb-12">
        <p className="text-korma-gold text-xs font-semibold uppercase tracking-[0.3em] mb-3">
          Begin Your Journey
        </p>
        <h1 className="font-cinzel text-4xl md:text-5xl text-white mb-4">
          Enroll at KORMA-USA
        </h1>
        <p className="text-white/50 max-w-xl mx-auto">
          Choose a program, tell us about yourself, and secure your spot on the
          mat — all in under two minutes.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <StepIndicator step={step} />

        <AnimatePresence mode="wait">
          {/* ── Step 1: Choose Program ──────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {PROGRAMS.map((prog) => {
                  const isSelected = selectedProgram?.id === prog.id;
                  return (
                    <button
                      key={prog.id}
                      onClick={() => changeProgram(prog)}
                      className={cn(
                        "relative text-left p-5 border rounded-sm transition-all duration-200 group",
                        isSelected
                          ? "border-korma-gold bg-korma-gold/5"
                          : "border-white/10 hover:border-white/25 hover:bg-white/5"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-korma-gold flex items-center justify-center">
                          <Check className="h-3 w-3 text-korma-dark" />
                        </div>
                      )}
                      <prog.Icon
                        className={cn(
                          "h-6 w-6 mb-3 transition-colors",
                          isSelected
                            ? "text-korma-gold"
                            : "text-white/40 group-hover:text-white/70"
                        )}
                      />
                      <div className="font-semibold text-white text-sm mb-1 pr-6">
                        {prog.label}
                      </div>
                      <div className="text-white/45 text-xs leading-relaxed mb-3">
                        {prog.description}
                      </div>
                      <div
                        className={cn(
                          "text-sm font-bold",
                          prog.type === "free"
                            ? "text-green-400"
                            : prog.type === "quote"
                            ? "text-blue-400"
                            : "text-korma-gold"
                        )}
                      >
                        {prog.priceLabel}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => canGoStep2 && setStep(2)}
                  disabled={!canGoStep2}
                  className={cn(
                    "flex items-center gap-2 px-8 py-3 text-sm font-bold uppercase tracking-wider transition-all",
                    canGoStep2
                      ? "bg-korma-gold text-korma-dark hover:bg-korma-gold/90"
                      : "bg-white/10 text-white/30 cursor-not-allowed"
                  )}
                >
                  Next: Your Details
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Your Details ──────────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <div className="max-w-lg mx-auto space-y-5">
                {/* Selected program badge */}
                {selectedProgram && (
                  <div className="flex items-center gap-3 p-4 border border-korma-gold/20 bg-korma-gold/5 mb-2">
                    <selectedProgram.Icon className="h-5 w-5 text-korma-gold flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">
                        {selectedProgram.label}
                      </div>
                      <div className="text-korma-gold text-xs">
                        {selectedProgram.priceLabel}
                      </div>
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      className="text-white/30 text-xs hover:text-white/60 transition-colors flex-shrink-0"
                    >
                      Change
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-white/60 text-xs uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => field("name", e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-white/5 border border-white/15 text-white placeholder:text-white/25 px-4 py-3 text-sm focus:outline-none focus:border-korma-gold/60 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-xs uppercase tracking-wider mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => field("email", e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full bg-white/5 border border-white/15 text-white placeholder:text-white/25 px-4 py-3 text-sm focus:outline-none focus:border-korma-gold/60 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-xs uppercase tracking-wider mb-1.5">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => field("phone", e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full bg-white/5 border border-white/15 text-white placeholder:text-white/25 px-4 py-3 text-sm focus:outline-none focus:border-korma-gold/60 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-xs uppercase tracking-wider mb-1.5">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => field("dateOfBirth", e.target.value)}
                    className="w-full bg-white/5 border border-white/15 text-white placeholder:text-white/25 px-4 py-3 text-sm focus:outline-none focus:border-korma-gold/60 transition-colors"
                    required
                  />
                </div>

                <AnimatePresence>
                  {selectedProgram?.id === "seminar-individual" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 20 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label className="block text-white/60 text-xs uppercase tracking-wider mb-1.5">
                        Number of Participants
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={form.participants}
                        onChange={(e) => field("participants", e.target.value)}
                        className="w-full bg-white/5 border border-white/15 text-white placeholder:text-white/25 px-4 py-3 text-sm focus:outline-none focus:border-korma-gold/60 transition-colors"
                      />
                      <p className="text-white/30 text-xs mt-1.5">
                        Total: ${(7500 * seminarQty / 100).toFixed(2)} ({seminarQty} × $75.00)
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {(selectedProgram?.type === "quote" ||
                  selectedProgram?.type === "free") && (
                  <div>
                    <label className="block text-white/60 text-xs uppercase tracking-wider mb-1.5">
                      Message (optional)
                    </label>
                    <textarea
                      rows={3}
                      value={form.message}
                      onChange={(e) => field("message", e.target.value)}
                      placeholder="Tell us about your goals, experience level, or schedule preferences…"
                      className="w-full bg-white/5 border border-white/15 text-white placeholder:text-white/25 px-4 py-3 text-sm focus:outline-none focus:border-korma-gold/60 transition-colors resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between max-w-lg mx-auto mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-white/40 text-sm hover:text-white/70 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={() => canGoStep3 && setStep(3)}
                  disabled={!canGoStep3}
                  className={cn(
                    "flex items-center gap-2 px-8 py-3 text-sm font-bold uppercase tracking-wider transition-all",
                    canGoStep3
                      ? "bg-korma-gold text-korma-dark hover:bg-korma-gold/90"
                      : "bg-white/10 text-white/30 cursor-not-allowed"
                  )}
                >
                  Review Order
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Review & Pay ──────────────────────────────── */}
          {step === 3 && selectedProgram && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <div className="max-w-md mx-auto">
                {/* Order summary card */}
                <div className="border border-white/10 bg-white/[0.02] p-6 mb-5">
                  <h3 className="text-white/50 text-xs uppercase tracking-wider mb-4">
                    Order Summary
                  </h3>

                  {/* Program row */}
                  <div className="flex items-start gap-3 pb-4 border-b border-white/8">
                    <selectedProgram.Icon className="h-5 w-5 text-korma-gold mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm">
                        {selectedProgram.label}
                      </div>
                      <div className="text-white/40 text-xs mt-0.5">KORMA-USA</div>
                    </div>
                    <div className="text-korma-gold font-bold text-sm flex-shrink-0">
                      {selectedProgram.priceLabel}
                    </div>
                  </div>

                  {/* Quantity row (seminars) */}
                  {selectedProgram.id === "seminar-individual" && (
                    <div className="flex justify-between text-sm py-2 border-b border-white/8">
                      <span className="text-white/50">
                        {seminarQty} person{seminarQty !== 1 ? "s" : ""} × $75.00
                      </span>
                      <span className="text-white/80">{fmt(7500 * seminarQty)}</span>
                    </div>
                  )}

                  {/* Participant info */}
                  <div className="pt-3 space-y-2 border-b border-white/8 pb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Name</span>
                      <span className="text-white/70">{form.name}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Email</span>
                      <span className="text-white/70">{form.email}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Phone</span>
                      <span className="text-white/70">{form.phone}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Date of Birth</span>
                      <span className="text-white/70">{form.dateOfBirth}</span>
                    </div>
                  </div>

                  {/* Discount row */}
                  {appliedDiscount && selectedProgram.price > 0 && (
                    <div className="flex justify-between text-sm py-2 border-b border-white/8">
                      <span className="text-green-400 flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" />
                        {appliedDiscount.name}
                        {appliedDiscount.percentOff !== null && ` (${appliedDiscount.percentOff}% off)`}
                      </span>
                      <span className="text-green-400">−{fmt(discountAmountCents())}</span>
                    </div>
                  )}

                  {/* Total */}
                  {selectedProgram.price > 0 && (
                    <div className="mt-3 flex justify-between items-baseline">
                      <span className="text-white/50 text-sm font-medium">Total</span>
                      <div className="text-right">
                        {appliedDiscount && (
                          <div className="text-white/30 text-xs line-through">
                            {fmt(basePriceCents())}
                          </div>
                        )}
                        <span className="text-white font-bold text-lg">
                          {fmt(finalPriceCents())}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Discount code input (paid programs only) ──── */}
                {selectedProgram.type === "payment" && (
                  <div className="mb-5">
                    {/* Applied badge */}
                    <AnimatePresence>
                      {appliedDiscount ? (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="flex items-center justify-between px-4 py-2.5 bg-green-900/20 border border-green-500/30 rounded"
                        >
                          <div className="flex items-center gap-2 text-green-400 text-sm">
                            <Tag className="h-4 w-4" />
                            <span className="font-medium">{appliedDiscount.name}</span>
                            <span className="text-green-400/70">
                              {appliedDiscount.percentOff !== null
                                ? `${appliedDiscount.percentOff}% off`
                                : `${fmt(appliedDiscount.amountOff ?? 0)} off`}
                            </span>
                          </div>
                          <button
                            onClick={removeDiscount}
                            className="text-green-400/50 hover:text-green-400 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </motion.div>
                      ) : showDiscountInput ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={discountCode}
                              onChange={(e) => {
                                setDiscountCode(e.target.value.toUpperCase());
                                if (discountStatus !== "idle") setDiscountStatus("idle");
                              }}
                              onKeyDown={(e) => e.key === "Enter" && applyDiscountCode()}
                              placeholder="DISCOUNT CODE"
                              className="flex-1 bg-white/5 border border-white/15 text-white placeholder:text-white/20 px-4 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:border-korma-gold/60 transition-colors uppercase"
                            />
                            <button
                              onClick={applyDiscountCode}
                              disabled={discountStatus === "checking" || !discountCode.trim()}
                              className={cn(
                                "px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0",
                                discountStatus === "checking"
                                  ? "bg-white/10 text-white/30 cursor-not-allowed"
                                  : "bg-korma-gold/20 text-korma-gold border border-korma-gold/30 hover:bg-korma-gold/30"
                              )}
                            >
                              {discountStatus === "checking" ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                "Apply"
                              )}
                            </button>
                          </div>

                          <AnimatePresence>
                            {discountStatus === "invalid" && (
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-red-400 text-xs mt-1.5"
                              >
                                Invalid or expired code. Please try again.
                              </motion.p>
                            )}
                          </AnimatePresence>

                          <button
                            onClick={() => {
                              setShowDiscountInput(false);
                              setDiscountCode("");
                              setDiscountStatus("idle");
                            }}
                            className="text-white/25 text-xs mt-1.5 hover:text-white/50 transition-colors"
                          >
                            Cancel
                          </button>
                        </motion.div>
                      ) : (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => setShowDiscountInput(true)}
                          className="flex items-center gap-1.5 text-white/35 text-xs hover:text-korma-gold transition-colors"
                        >
                          <Tag className="h-3.5 w-3.5" />
                          Have a discount code?
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mb-4 p-3 bg-red-900/20 border border-red-500/30 text-red-400 text-sm rounded"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Stripe security notice */}
                {selectedProgram.type === "payment" && (
                  <p className="text-white/25 text-xs text-center mb-4">
                    You&apos;ll be redirected to Stripe&apos;s secure checkout. We never
                    store card details on our servers.
                  </p>
                )}

                <button
                  onClick={() => void handleSubmit(false)}
                  disabled={isSubmitting}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-4 text-sm font-bold uppercase tracking-wider transition-all",
                    isSubmitting
                      ? "bg-korma-gold/60 text-korma-dark/60 cursor-not-allowed"
                      : "bg-korma-gold text-korma-dark hover:bg-korma-gold/90"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing…
                    </>
                  ) : selectedProgram.type === "payment" ? (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Pay {fmt(finalPriceCents())}
                    </>
                  ) : selectedProgram.type === "free" ? (
                    <>
                      <Calendar className="h-4 w-4" />
                      Reserve My Free Class
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4" />
                      Request a Quote
                    </>
                  )}
                </button>

                <button
                  onClick={() => setStep(2)}
                  className="w-full flex items-center justify-center gap-2 mt-3 py-2 text-white/30 text-sm hover:text-white/60 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Edit Details
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
    <DuplicateConfirmationDialog
      open={duplicates.length > 0}
      duplicates={duplicates}
      onCancel={() => setDuplicates([])}
      onConfirm={() => {
        setDuplicates([]);
        void handleSubmit(true);
      }}
    />
    </>
  );
}
