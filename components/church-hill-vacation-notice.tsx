"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Mail, MapPin, Search, X } from "lucide-react";
import { DuplicateConfirmationDialog } from "@/components/duplicate-confirmation-dialog";
import type {
  AddressValidationStatus,
  GoogleAddressSuggestion,
  GoogleAddressValidationResult,
} from "@/lib/application/google-address";
import type { HubSpotDuplicateCandidate } from "@/lib/hubspot/contacts";
import { cn } from "@/lib/utils";

interface ChurchHillFormState {
  name: string;
  phone: string;
  email: string;
  allowTexts: boolean;
  allowEmails: boolean;
  previousExperience: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  formattedAddress: string;
  googlePlaceId: string;
  googleMapsUri: string;
  addressValidationStatus: AddressValidationStatus;
  addressValidationMessage: string;
  addressValidatedAt: string;
}

type AddressSearchState = "idle" | "searching" | "validating";

const INITIAL_FORM: ChurchHillFormState = {
  name: "",
  phone: "",
  email: "",
  allowTexts: false,
  allowEmails: false,
  previousExperience: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  formattedAddress: "",
  googlePlaceId: "",
  googleMapsUri: "",
  addressValidationStatus: "unverified",
  addressValidationMessage: "",
  addressValidatedAt: "",
};

export function ChurchHillVacationNotice() {
  const [visible, setVisible] = useState(true);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [duplicates, setDuplicates] = useState<HubSpotDuplicateCandidate[]>([]);
  const [form, setForm] = useState<ChurchHillFormState>(INITIAL_FORM);
  const [addressQuery, setAddressQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GoogleAddressSuggestion[]>([]);
  const [addressSearchState, setAddressSearchState] =
    useState<AddressSearchState>("idle");
  const [addressSessionToken, setAddressSessionToken] = useState(() =>
    createAddressSessionToken()
  );

  const mailingAddress = useMemo(
    () => form.formattedAddress || formatMailingAddress(form),
    [form]
  );

  useEffect(() => {
    if (form.formattedAddress && form.formattedAddress !== addressQuery) {
      setAddressQuery(form.formattedAddress);
    }
  }, [addressQuery, form.formattedAddress]);

  useEffect(() => {
    const query = addressQuery.trim();
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    if (
      form.addressValidationStatus === "validated" &&
      query === form.formattedAddress.trim()
    ) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setAddressSearchState("searching");
      try {
        const response = await fetch("/api/apply/address/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: query,
            sessionToken: addressSessionToken,
          }),
        });
        const result = (await response.json()) as {
          configured?: boolean;
          suggestions?: GoogleAddressSuggestion[];
        };

        if (result.configured === false) {
          setForm((current) => ({
            ...current,
            addressValidationStatus: "not-configured",
            addressValidationMessage:
              "Google Maps address validation is not configured.",
          }));
          setSuggestions([]);
          return;
        }

        setSuggestions(result.suggestions ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setAddressSearchState("idle");
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [
    addressQuery,
    addressSessionToken,
    form.addressValidationStatus,
    form.formattedAddress,
  ]);

  const mailtoHref = useMemo(() => {
    const lines = [
      "I would like more information about Church Hill classes.",
      "",
      `Name: ${form.name}`,
      `Address: ${mailingAddress}`,
      `Phone: ${form.phone}`,
      `Email: ${form.email}`,
      `Text permission: ${form.allowTexts ? "Yes" : "No"}`,
      `Email permission: ${form.allowEmails ? "Yes" : "No"}`,
      `Previous martial arts experience: ${form.previousExperience || "None provided"}`,
    ];

    return `mailto:masterclay@kormausa.com?subject=${encodeURIComponent(
      `Church Hill Classes Information Request - ${form.name || "New Inquiry"}`
    )}&body=${encodeURIComponent(lines.join("\n"))}`;
  }, [form, mailingAddress]);

  function updateAddressField(
    field: "addressLine1" | "addressLine2" | "city" | "state" | "postalCode",
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
      formattedAddress: "",
      googlePlaceId: "",
      googleMapsUri: "",
      addressValidationStatus: "unverified",
      addressValidationMessage: "",
      addressValidatedAt: "",
    }));
  }

  function applyAddressValidationResult(
    result: GoogleAddressValidationResult & { configured?: boolean }
  ) {
    const normalized = result.normalizedAddress;
    const nextStatus =
      result.configured === false ? "not-configured" : result.status;
    const nextMessage =
      result.message ||
      (nextStatus === "validated"
        ? "Address validated with Google Maps."
        : "Google Maps could not fully validate this mailing address.");

    setForm((current) => ({
      ...current,
      addressLine1: normalized?.addressLine1 ?? current.addressLine1,
      addressLine2: normalized?.addressLine2 ?? current.addressLine2,
      city: normalized?.city ?? current.city,
      state: normalized?.state ?? current.state,
      postalCode: normalized?.postalCode ?? current.postalCode,
      formattedAddress: normalized?.formattedAddress ?? current.formattedAddress,
      googlePlaceId: normalized?.googlePlaceId ?? current.googlePlaceId,
      googleMapsUri: normalized?.googleMapsUri ?? current.googleMapsUri,
      addressValidationStatus: nextStatus,
      addressValidationMessage: nextMessage,
      addressValidatedAt:
        nextStatus === "validated" ? new Date().toISOString() : "",
    }));
  }

  async function validateAddress(options: { placeId?: string } = {}) {
    setAddressSearchState("validating");
    setForm((current) => ({
      ...current,
      addressValidationStatus: "validating",
      addressValidationMessage: "Validating mailing address with Google Maps.",
    }));

    try {
      const response = await fetch("/api/apply/address/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          options.placeId
            ? {
                placeId: options.placeId,
                sessionToken: addressSessionToken,
              }
            : {
                address: {
                  addressLine1: form.addressLine1,
                  addressLine2: form.addressLine2,
                  city: form.city,
                  state: form.state,
                  postalCode: form.postalCode,
                  googlePlaceId: form.googlePlaceId,
                },
              }
        ),
      });
      const result = (await response.json()) as GoogleAddressValidationResult & {
        configured?: boolean;
      };

      applyAddressValidationResult(result);
      setAddressSessionToken(createAddressSessionToken());
    } catch {
      setForm((current) => ({
        ...current,
        addressValidationStatus: "needs-review",
        addressValidationMessage: "Address validation failed.",
      }));
    } finally {
      setAddressSearchState("idle");
    }
  }

  async function selectAddressSuggestion(suggestion: GoogleAddressSuggestion) {
    setAddressQuery(suggestion.label);
    setSuggestions([]);
    await validateAddress({ placeId: suggestion.placeId });
  }

  async function submit(duplicateConfirmed = false) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/church-hill-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          allowTexts: form.allowTexts,
          allowEmails: form.allowEmails,
          previousExperience: form.previousExperience,
          address: {
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            formattedAddress: form.formattedAddress,
            googlePlaceId: form.googlePlaceId,
            googleMapsUri: form.googleMapsUri,
            addressValidationStatus: form.addressValidationStatus,
            addressValidationMessage: form.addressValidationMessage,
            addressValidatedAt: form.addressValidatedAt,
          },
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
                    Your HubSpot record has been checked for duplicates, your
                    address was validated with Google Maps, and your email draft
                    to Master Clay should open automatically.
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
                      duplicates in HubSpot, validate the address with Google
                      Maps, and draft an email to Master Clay.
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
                    <div className="relative md:col-span-2">
                      <Field label="Find Mailing Address">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                          <input
                            value={addressQuery}
                            onChange={(event) =>
                              setAddressQuery(event.target.value)
                            }
                            className={cn(inputClass, "pl-10")}
                            placeholder="Start typing an address to select it from Google Maps"
                            autoComplete="street-address"
                          />
                        </div>
                      </Field>
                      {suggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-korma-gold/25 bg-korma-navy-deeper shadow-2xl">
                          {suggestions.map((suggestion) => (
                            <button
                              key={suggestion.placeId}
                              type="button"
                              onClick={() => void selectAddressSuggestion(suggestion)}
                              className="block w-full border-b border-white/10 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-korma-gold/10"
                            >
                              <span className="block text-sm font-bold text-white">
                                {suggestion.mainText}
                              </span>
                              <span className="mt-1 block text-xs text-white/45">
                                {suggestion.secondaryText}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Field label="Address Line 1">
                      <input
                        required
                        value={form.addressLine1}
                        onChange={(event) =>
                          updateAddressField("addressLine1", event.target.value)
                        }
                        className={inputClass}
                        placeholder="Street address"
                      />
                    </Field>
                    <Field label="Address Line 2">
                      <input
                        value={form.addressLine2}
                        onChange={(event) =>
                          updateAddressField("addressLine2", event.target.value)
                        }
                        className={inputClass}
                        placeholder="Apartment, suite, unit"
                      />
                    </Field>
                    <Field label="City">
                      <input
                        required
                        value={form.city}
                        onChange={(event) =>
                          updateAddressField("city", event.target.value)
                        }
                        className={inputClass}
                        placeholder="City"
                      />
                    </Field>
                    <Field label="State">
                      <input
                        required
                        value={form.state}
                        onChange={(event) =>
                          updateAddressField(
                            "state",
                            event.target.value.toUpperCase()
                          )
                        }
                        className={inputClass}
                        placeholder="VA"
                        maxLength={2}
                      />
                    </Field>
                    <Field label="Postal Code">
                      <input
                        required
                        value={form.postalCode}
                        onChange={(event) =>
                          updateAddressField("postalCode", event.target.value)
                        }
                        className={inputClass}
                        placeholder="24251"
                      />
                    </Field>
                    <div className="md:col-span-2">
                      <div
                        className={cn(
                          "rounded-lg border px-4 py-3 text-sm",
                          form.addressValidationStatus === "validated"
                            ? "border-korma-gold/30 bg-korma-gold/10 text-korma-gold"
                            : "border-white/10 bg-white/[0.03] text-white/45"
                        )}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {form.addressValidationStatus === "validated"
                                ? "Google Maps mailing address validated."
                                : form.addressValidationMessage ||
                                  "Select an address from Google Maps or validate the typed address."}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => void validateAddress()}
                            disabled={addressSearchState === "validating"}
                            className="inline-flex w-fit items-center justify-center rounded bg-korma-gold px-3 py-2 text-xs font-bold uppercase tracking-wider text-korma-dark transition-colors hover:bg-korma-gold-light disabled:cursor-not-allowed disabled:opacity-55"
                          >
                            {addressSearchState === "validating"
                              ? "Validating"
                              : "Validate Address"}
                          </button>
                        </div>
                        {mailingAddress && (
                          <div className="mt-2 text-xs text-white/50">
                            Standardized: {mailingAddress}
                          </div>
                        )}
                      </div>
                      {addressSearchState === "searching" && (
                        <div className="mt-2 text-xs text-white/35">
                          Searching Google Maps addresses.
                        </div>
                      )}
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
                        loading ||
                        !form.allowTexts ||
                        !form.allowEmails ||
                        form.addressValidationStatus !== "validated"
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

function formatMailingAddress(form: ChurchHillFormState) {
  return [
    form.addressLine1,
    form.addressLine2,
    form.city,
    form.state,
    form.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

function createAddressSessionToken() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `address-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 10)}`
  );
}
