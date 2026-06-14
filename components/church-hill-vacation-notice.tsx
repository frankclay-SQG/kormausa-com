"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Mail, X } from "lucide-react";
import { DuplicateConfirmationDialog } from "@/components/duplicate-confirmation-dialog";
import type { HubSpotDuplicateCandidate } from "@/lib/hubspot/contacts";

interface ChurchHillFormState {
  name: string;
  address: string;
  phone: string;
  email: string;
  allowTexts: boolean;
  allowEmails: boolean;
  previousExperience: string;
}

const INITIAL_FORM: ChurchHillFormState = {
  name: "",
  address: "",
  phone: "",
  email: "",
  allowTexts: false,
  allowEmails: false,
  previousExperience: "",
};

export function ChurchHillVacationNotice() {
  const [visible, setVisible] = useState(true);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [duplicates, setDuplicates] = useState<HubSpotDuplicateCandidate[]>([]);
  const [form, setForm] = useState<ChurchHillFormState>(INITIAL_FORM);

  const mailtoHref = useMemo(() => {
    const lines = [
      "I would like more information about Church Hill classes.",
      "",
      `Name: ${form.name}`,
      `Address: ${form.address}`,
      `Phone: ${form.phone}`,
      `Email: ${form.email}`,
      `Text permission: ${form.allowTexts ? "Yes" : "No"}`,
      `Email permission: ${form.allowEmails ? "Yes" : "No"}`,
      `Previous martial arts experience: ${form.previousExperience || "None provided"}`,
    ];

    return `mailto:masterclay@kormausa.com?subject=${encodeURIComponent(
      `Church Hill Classes Information Request - ${form.name || "New Inquiry"}`
    )}&body=${encodeURIComponent(lines.join("\n"))}`;
  }, [form]);

  async function submit(duplicateConfirmed = false) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/church-hill-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          duplicateConfirmed,
        }),
      });

      const result = await response.json();
      if (response.status === 409 && result.errorCode === "POTENTIAL_DUPLICATE") {
        setDuplicates(result.duplicates ?? []);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(result.error ?? "Submission failed");
      }

      setSubmitted(true);
      window.location.href = mailtoHref;
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-korma-gold/25 bg-korma-navy-deeper/95 p-5 shadow-2xl backdrop-blur"
          >
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="absolute right-3 top-3 rounded p-1 text-white/45 transition-colors hover:text-white"
              aria-label="Dismiss Church Hill notice"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="pr-8">
              <div className="text-xs font-bold uppercase tracking-[0.25em] text-korma-gold">
                Church Hill Update
              </div>
              <h3 className="mt-3 text-lg font-black text-white">
                Church Hill classes are on vacation and will return soon.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Click below for more information and to notify Master Clay that
                you want updates.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded bg-korma-gold px-4 py-3 text-sm font-bold uppercase tracking-wider text-korma-dark transition-colors hover:bg-korma-gold-light"
            >
              <Mail className="h-4 w-4" />
              More Information
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              className="relative w-full max-w-2xl rounded-2xl border border-korma-gold/25 bg-korma-navy-deeper p-6 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 rounded p-1 text-white/45 transition-colors hover:text-white"
                aria-label="Close Church Hill form"
              >
                <X className="h-5 w-5" />
              </button>

              {submitted ? (
                <div className="pr-8">
                  <div className="text-xs font-bold uppercase tracking-[0.25em] text-korma-gold">
                    Submitted
                  </div>
                  <h3 className="mt-3 text-2xl font-black text-white">
                    We saved your information.
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">
                    Your HubSpot record has been checked for duplicates and your
                    information was recorded. Your email draft to Master Clay
                    should open automatically.
                  </p>
                  <a
                    href={mailtoHref}
                    className="mt-5 inline-flex items-center gap-2 rounded bg-korma-gold px-4 py-3 text-sm font-bold uppercase tracking-wider text-korma-dark transition-colors hover:bg-korma-gold-light"
                  >
                    <Mail className="h-4 w-4" />
                    Open Email Draft Again
                  </a>
                </div>
              ) : (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submit(false);
                  }}
                  className="space-y-4"
                >
                  <div className="pr-8">
                    <div className="text-xs font-bold uppercase tracking-[0.25em] text-korma-gold">
                      Church Hill Update
                    </div>
                    <h3 className="mt-3 text-2xl font-black text-white">
                      Request More Information
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/60">
                      Fill this out and we will save your information, check for
                      duplicates in HubSpot, and draft an email to Master Clay.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Name">
                      <input
                        required
                        value={form.name}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        className={inputClass}
                        placeholder="Your full name"
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                        className={inputClass}
                        placeholder="you@example.com"
                      />
                    </Field>
                    <Field label="Phone">
                      <input
                        required
                        type="tel"
                        value={form.phone}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            phone: event.target.value,
                          }))
                        }
                        className={inputClass}
                        placeholder="(555) 555-5555"
                      />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Address">
                        <textarea
                          required
                          value={form.address}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              address: event.target.value,
                            }))
                          }
                          className={`${inputClass} min-h-24 resize-y`}
                          placeholder="Mailing address"
                        />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="Previous Martial Arts Experience">
                        <textarea
                          value={form.previousExperience}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              previousExperience: event.target.value,
                            }))
                          }
                          className={`${inputClass} min-h-28 resize-y`}
                          placeholder="Tell us about any past martial arts training."
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <PermissionCard
                      title="Text Permission"
                      description="Allow KORMA-USA to text you with Church Hill class updates."
                      checked={form.allowTexts}
                      onChange={(checked) =>
                        setForm((current) => ({ ...current, allowTexts: checked }))
                      }
                    />
                    <PermissionCard
                      title="Email Permission"
                      description="Allow KORMA-USA to email you with Church Hill class updates."
                      checked={form.allowEmails}
                      onChange={(checked) =>
                        setForm((current) => ({ ...current, allowEmails: checked }))
                      }
                    />
                  </div>

                  {error && <p className="text-sm text-red-400">{error}</p>}

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded border border-white/15 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white/70 transition-colors hover:border-korma-gold/30 hover:text-white"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={
                        loading || !form.allowTexts || !form.allowEmails
                      }
                      className="inline-flex items-center justify-center gap-2 rounded bg-korma-gold px-4 py-3 text-sm font-bold uppercase tracking-wider text-korma-dark transition-colors hover:bg-korma-gold-light disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          Submit and Draft Email
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DuplicateConfirmationDialog
        open={duplicates.length > 0}
        duplicates={duplicates}
        onCancel={() => setDuplicates([])}
        onConfirm={() => {
          setDuplicates([]);
          void submit(true);
        }}
      />
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/55">
        {label}
      </span>
      {children}
    </label>
  );
}

function PermissionCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
        checked
          ? "border-korma-gold/60 bg-korma-gold/10"
          : "border-white/10 bg-white/[0.03] hover:border-korma-gold/30"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 accent-yellow-400"
      />
      <span>
        <span className="block font-bold text-white">{title}</span>
        <span className="mt-2 block text-sm leading-relaxed text-white/55">
          {description}
        </span>
      </span>
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/25 transition-colors focus:outline-none focus:border-korma-gold/50";
