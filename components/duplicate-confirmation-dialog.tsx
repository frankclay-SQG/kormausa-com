"use client";

import { AlertTriangle } from "lucide-react";
import type { HubSpotDuplicateCandidate } from "@/lib/hubspot/contacts";

export function DuplicateConfirmationDialog({
  open,
  duplicates,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  duplicates: HubSpotDuplicateCandidate[];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-korma-gold/20 bg-korma-navy-deeper p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-korma-gold/10">
            <AlertTriangle className="h-5 w-5 text-korma-gold" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">
              Possible Duplicate Found
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              We found an existing HubSpot contact that may already belong to
              this person. Review the possible match before creating a new
              record.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {duplicates.map((duplicate) => (
            <div
              key={duplicate.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="text-sm font-bold text-white">
                {[duplicate.firstName, duplicate.lastName]
                  .filter(Boolean)
                  .join(" ") || "Existing contact"}
              </div>
              <div className="mt-2 space-y-1 text-sm text-white/55">
                {duplicate.email && <div>Email: {maskEmail(duplicate.email)}</div>}
                {duplicate.phone && <div>Phone: {maskPhone(duplicate.phone)}</div>}
                <div>
                  Match reason:{" "}
                  {duplicate.matchReasons
                    .map((reason) =>
                      reason === "name"
                        ? "same name"
                        : reason === "phone"
                          ? "same phone"
                          : "same email"
                    )
                    .join(", ")}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-white/15 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white/70 transition-colors hover:border-korma-gold/30 hover:text-white"
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded bg-korma-gold px-4 py-3 text-sm font-bold uppercase tracking-wider text-korma-dark transition-colors hover:bg-korma-gold-light"
          >
            Create New Record Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const maskedLocal =
    local.length <= 2 ? `${local[0] ?? "*"}*` : `${local.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  return `***-***-${digits.slice(-4)}`;
}
