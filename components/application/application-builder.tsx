"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import {
  Award,
  Bell,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  History,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
} from "lucide-react";
import {
  APPLICATION_FLOWS,
  APPLICATION_SERVICES,
  DAN_LEVEL_COSTS,
  formatUsd,
  getApplicationFlow,
  MARTIAL_ARTS,
  getDanTestingRequirement,
  getDanLevelCost,
  getFlowService,
  getServiceAmountCents,
  getMartialArt,
  getService,
  orderServiceIdsForFlow,
} from "@/lib/application/catalog";
import {
  createPromotionHistoryEntry,
  createApplicationDraft,
  isDraftReadyForReview,
  isRegistrationComplete,
  markUpdated,
  selectApplicationFlow,
  selectRankDanLevel,
  toggleArt,
  toggleService,
  updateRegistration,
} from "@/lib/application/draft";
import type {
  ApplicationFlow,
  ApplicationFlowId,
  ApplicationService,
  ApplicationDraft,
  ApplicationRegistration,
  ApplicationServiceId,
  CertificationProfileDraft,
  DanLevelId,
  MartialArt,
  MartialArtId,
  PromotionHistoryEntry,
  TestingEligibilityDraft,
} from "@/lib/application/types";
import type {
  GoogleAddressSuggestion,
  GoogleAddressValidationResult,
} from "@/lib/application/google-address";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "kormaApplicationDraft.v1";
type SchoolTextField = "schoolName" | "schoolType" | "city" | "state";
type RegistrationField = keyof ApplicationRegistration;
type CertificationField = keyof CertificationProfileDraft;
type PromotionField = keyof Omit<PromotionHistoryEntry, "id">;
type EligibilityField = keyof TestingEligibilityDraft;

const serviceIcons: Record<ApplicationServiceId, ElementType> = {
  "school-registration": Building2,
  "rank-registration": Award,
  "instructor-certification": GraduationCap,
};

const steps = [
  { id: 1, label: "Certification" },
  { id: 2, label: "Registration" },
  { id: 3, label: "Application" },
  { id: 4, label: "Review" },
];

const YEARS_TRAINING_OPTIONS = [
  "Less than 1 year",
  "1-3 years",
  "4-7 years",
  "8-15 years",
  "16-25 years",
  "25+ years",
];

const CERTIFICATION_RANK_OPTIONS = Array.from(
  new Set(MARTIAL_ARTS.flatMap((art) => art.rankLevels))
);

type SaveState = "idle" | "saving" | "saved";
type AddressSearchState = "idle" | "searching" | "validating";
type MasterKeyStatus =
  | "idle"
  | "checking"
  | "unlocked"
  | "denied"
  | "not-configured";

export function ApplicationBuilder() {
  const [draft, setDraft] = useState<ApplicationDraft>(() =>
    createApplicationDraft()
  );
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(1);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [masterKey, setMasterKey] = useState("");
  const [masterKeyStatus, setMasterKeyStatus] =
    useState<MasterKeyStatus>("idle");

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<ApplicationDraft>;
        const defaults = createApplicationDraft();
        setDraft({
          ...defaults,
          ...parsed,
          registration: {
            ...defaults.registration,
            ...(parsed.registration ?? {}),
          },
          certificationProfile: {
            ...defaults.certificationProfile,
            ...(parsed.certificationProfile ?? {}),
          },
          school: {
            ...defaults.school,
            ...(parsed.school ?? {}),
          },
          testingEligibility: {
            ...defaults.testingEligibility,
            ...(parsed.testingEligibility ?? {}),
          },
        });
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setSaveState("saved");
    }, 350);
    return () => window.clearTimeout(timer);
  }, [draft, hydrated]);

  useEffect(() => {
    if (!hydrated || masterKeyStatus === "unlocked") return;

    setDraft((current) => {
      if (
        !current.testingEligibility.manualOverride &&
        !current.testingEligibility.entryAboveFirst
      ) {
        return current;
      }

      return markUpdated({
        ...current,
        status: "draft",
        testingEligibility: {
          ...current.testingEligibility,
          manualOverride: false,
          entryAboveFirst: false,
        },
      });
    });
  }, [hydrated, masterKeyStatus]);

  const selectedServices = useMemo(
    () =>
      orderServiceIdsForFlow(draft.applicationFlowId, draft.selectedServices)
        .map(
          (serviceId) =>
            getFlowService(draft.applicationFlowId, serviceId) ??
            getService(serviceId)
        )
        .filter((service): service is ApplicationService => Boolean(service)),
    [draft.applicationFlowId, draft.selectedServices]
  );

  const selectedArts = useMemo(
    () =>
      draft.selectedArts
        .map((artId) => getMartialArt(artId))
        .filter((art): art is MartialArt => Boolean(art)),
    [draft.selectedArts]
  );

  const currentFlow = useMemo(
    () => getApplicationFlow(draft.applicationFlowId),
    [draft.applicationFlowId]
  );

  const selectedDanLevel = useMemo(
    () => getDanLevelCost(draft.rankDanLevelId, draft.applicationFlowId),
    [draft.applicationFlowId, draft.rankDanLevelId]
  );

  const certificationReady =
    draft.selectedServices.length > 0 && draft.selectedArts.length > 0;
  const registrationComplete = isRegistrationComplete(draft.registration);
  const readyForReview = isDraftReadyForReview(draft);
  const minutes = selectedServices.reduce(
    (sum, service) => sum + (service?.estimatedMinutes ?? 0),
    0
  );

  function chooseApplicationFlow(flowId: ApplicationFlowId) {
    setDraft((current) => {
      const next = selectApplicationFlow(current, flowId);
      const flow = getApplicationFlow(flowId);

      if (flowId === "whmaf-promotion" && flow) {
        return markUpdated({
          ...next,
          selectedServices: [...flow.serviceOrder],
          selectedArts: ["hapkido"],
          school: {
            ...next.school,
            artsTaught: ["hapkido"],
          },
        });
      }

      return next;
    });
  }

  function selectService(serviceId: ApplicationServiceId) {
    if (currentFlow?.lockedServices?.length) return;
    const removing = draft.selectedServices.includes(serviceId);
    if (removing) {
      const service = getService(serviceId);
      const confirmed = window.confirm(
        `Remove ${service?.title ?? "this service"} from this draft? Service-specific draft data may no longer be used in the application.`
      );
      if (!confirmed) return;
    }
    setDraft((current) => toggleService(current, serviceId));
  }

  function selectArt(artId: MartialArtId) {
    if (currentFlow?.lockedArts?.length) return;
    setDraft((current) => toggleArt(current, artId));
  }

  function selectDanLevel(danLevelId: DanLevelId) {
    setDraft((current) => selectRankDanLevel(current, danLevelId));
  }

  const updateRegistrationField = useCallback((
    field: RegistrationField,
    value: string | boolean
  ) => {
    setDraft((current) => updateRegistration(current, field, value));
  }, []);

  const patchRegistrationFields = useCallback((
    updates: Partial<ApplicationRegistration>
  ) => {
    setDraft((current) =>
      markUpdated({
        ...current,
        status: "draft",
        registration: {
          ...current.registration,
          ...updates,
        },
        submitterName:
          typeof updates.name === "string" ? updates.name : current.submitterName,
        submitterEmail:
          typeof updates.email === "string"
            ? updates.email
            : current.submitterEmail,
      })
    );
  }, []);

  const updateCertificationProfile = useCallback((
    field: CertificationField,
    value: string
  ) => {
    setDraft((current) =>
      markUpdated({
        ...current,
        status: "draft",
        certificationProfile: {
          ...current.certificationProfile,
          [field]: value,
        },
      })
    );
  }, []);

  function updateSchool(field: SchoolTextField, value: string) {
    setDraft((current) =>
      markUpdated({
        ...current,
        status: "draft",
        school: {
          ...current.school,
          [field]:
            field === "schoolType"
              ? (value as ApplicationDraft["school"]["schoolType"])
              : value,
        },
      })
    );
  }

  function addPromotionHistory() {
    setDraft((current) =>
      markUpdated({
        ...current,
        status: "draft",
        promotionHistory: [
          ...current.promotionHistory,
          createPromotionHistoryEntry(),
        ],
      })
    );
  }

  function updatePromotionHistory(
    entryId: string,
    field: PromotionField,
    value: string
  ) {
    setDraft((current) =>
      markUpdated({
        ...current,
        status: "draft",
        promotionHistory: current.promotionHistory.map((entry) =>
          entry.id === entryId
            ? ({ ...entry, [field]: value } as PromotionHistoryEntry)
            : entry
        ),
      })
    );
  }

  function removePromotionHistory(entryId: string) {
    setDraft((current) =>
      markUpdated({
        ...current,
        status: "draft",
        promotionHistory:
          current.promotionHistory.length > 1
            ? current.promotionHistory.filter((entry) => entry.id !== entryId)
            : current.promotionHistory,
      })
    );
  }

  function updateTestingEligibility(
    field: EligibilityField,
    value: string | boolean
  ) {
    setDraft((current) =>
      markUpdated({
        ...current,
        status: "draft",
        testingEligibility: {
          ...current.testingEligibility,
          [field]: value,
        } as TestingEligibilityDraft,
      })
    );
  }

  async function verifyMasterKey() {
    if (!masterKey.trim()) {
      setMasterKeyStatus("denied");
      return;
    }

    setMasterKeyStatus("checking");
    try {
      const response = await fetch("/api/apply/master-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterKey }),
      });
      const result = (await response.json()) as {
        authorized?: boolean;
        configured?: boolean;
      };

      if (result.authorized) {
        setMasterKeyStatus("unlocked");
        return;
      }

      setMasterKeyStatus(result.configured === false ? "not-configured" : "denied");
    } catch {
      setMasterKeyStatus("denied");
    }
  }

  function resetDraft() {
    const confirmed = window.confirm("Clear this application draft?");
    if (!confirmed) return;
    const next = createApplicationDraft();
    setDraft(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6">
      <div className="mb-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
        <div>
          <div className="mb-4 inline-flex items-center gap-3">
            <div className="h-px w-10 bg-korma-gold" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-korma-gold">
              KORMA-USA Applications
            </span>
          </div>
          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
            Ready to Start the Process?
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
            Start with certification review, then complete registration and
            build the application package with the same applicant details.
          </p>
        </div>
        <DraftStatusPanel
          draft={draft}
          minutes={minutes}
          saveState={saveState}
          readyForReview={readyForReview}
          certificationReady={certificationReady}
          registrationComplete={registrationComplete}
          onReset={resetDraft}
        />
      </div>

      <StepIndicator currentStep={step} />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-h-[520px] rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-8">
          {step === 1 && (
            <CertificationStep
              draft={draft}
              currentFlow={currentFlow}
              complete={certificationReady}
              onSelectFlow={chooseApplicationFlow}
              onSelectService={selectService}
              onSelectArt={selectArt}
              onUpdateCertificationProfile={updateCertificationProfile}
              onUpdateSchool={updateSchool}
            />
          )}
          {step === 2 && (
            <RegistrationStep
              registration={draft.registration}
              complete={registrationComplete}
              onUpdateRegistration={updateRegistrationField}
              onPatchRegistration={patchRegistrationFields}
            />
          )}
          {step === 3 && (
            <DetailsStep
              draft={draft}
              currentFlow={currentFlow}
              onSelectRankDanLevel={selectDanLevel}
              onUpdateSchool={updateSchool}
              onAddPromotionHistory={addPromotionHistory}
              onUpdatePromotionHistory={updatePromotionHistory}
              onRemovePromotionHistory={removePromotionHistory}
              onUpdateTestingEligibility={updateTestingEligibility}
              masterKey={masterKey}
              masterKeyStatus={masterKeyStatus}
              onUpdateMasterKey={setMasterKey}
              onVerifyMasterKey={verifyMasterKey}
            />
          )}
          {step === 4 && (
            <ReviewStep
              draft={draft}
              currentFlow={currentFlow}
              readyForReview={readyForReview}
              selectedDanLevel={selectedDanLevel}
              selectedServices={selectedServices}
              selectedArts={selectedArts}
            />
          )}
        </div>

        <aside className="rounded-2xl border border-korma-gold/20 bg-korma-navy-deeper/70 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Draft Summary
          </h2>
          <div className="mt-5 space-y-5">
            <SummaryGroup
              title="Certification"
              empty="Certification intake required"
              values={[
                currentFlow?.title ?? "",
                ...selectedServices.map((service) => service?.title ?? ""),
                ...selectedArts.map((art) => art?.title ?? ""),
                draft.certificationProfile.currentRank
                  ? `Current rank: ${draft.certificationProfile.currentRank}`
                  : "",
                draft.certificationProfile.yearsTraining
                  ? `Training: ${draft.certificationProfile.yearsTraining}`
                  : "",
              ].filter(Boolean)}
            />
            <SummaryGroup
              title="Registration"
              empty="Registration required"
              values={[
                draft.registration.name,
                draft.registration.email,
                draft.registration.phone,
                [draft.registration.addressLine1, draft.registration.city, draft.registration.state]
                  .filter(Boolean)
                  .join(", "),
                draft.registration.allowTexts ? "Text permission granted" : "",
                draft.registration.allowEmails ? "Email permission granted" : "",
              ].filter(Boolean)}
            />
            {draft.selectedServices.includes("rank-registration") && (
              <SummaryGroup
                title="Rank Level"
                empty="No Dan level selected"
                values={
                  selectedDanLevel
                    ? [selectedDanLevel.label, selectedDanLevel.costPlaceholder]
                    : []
                }
              />
            )}
            <SummaryGroup
              title="Submitter"
              empty="No submitter email yet"
              values={[
                draft.submitterName,
                draft.submitterEmail
                  ? `Bill recipient: ${draft.submitterEmail}`
                  : "",
                "Reference copy: masterclay@kormausa.com",
              ].filter(Boolean)}
            />
            <SummaryGroup
              title="School"
              empty="No school details yet"
              values={[
                draft.school.schoolName,
                [draft.school.city, draft.school.state]
                  .filter(Boolean)
                  .join(", "),
              ].filter(Boolean)}
            />
          </div>
        </aside>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(1, current - 1))}
          disabled={step === 1}
          className="inline-flex items-center justify-center gap-2 rounded border border-white/15 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white/70 transition-colors hover:border-korma-gold/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <button
          type="button"
          onClick={() => setStep((current) => Math.min(4, current + 1))}
          disabled={
            step === 4 ||
            (step === 1 && !certificationReady) ||
            (step === 2 && !registrationComplete)
          }
          className="inline-flex items-center justify-center gap-2 rounded bg-korma-gold px-6 py-3 text-sm font-bold uppercase tracking-wider text-korma-dark transition-colors hover:bg-korma-gold-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8 flex items-center justify-center">
      {steps.map((item, index) => {
        const isCurrent = item.id === currentStep;
        const isPast = item.id < currentStep;
        return (
          <div key={item.id} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                  isCurrent
                    ? "border-korma-gold bg-korma-gold text-korma-dark"
                    : isPast
                      ? "border-korma-gold/50 bg-korma-gold/20 text-korma-gold"
                      : "border-white/15 bg-white/5 text-white/30"
                )}
              >
                {isPast ? <Check className="h-4 w-4" /> : item.id}
              </div>
              <span
                className={cn(
                  "text-xs uppercase tracking-wider",
                  isCurrent ? "text-korma-gold" : "text-white/35"
                )}
              >
                {item.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="mb-6 h-px w-14 bg-white/10 sm:w-24" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DraftStatusPanel({
  draft,
  minutes,
  saveState,
  readyForReview,
  certificationReady,
  registrationComplete,
  onReset,
}: {
  draft: ApplicationDraft;
  minutes: number;
  saveState: SaveState;
  readyForReview: boolean;
  certificationReady: boolean;
  registrationComplete: boolean;
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-korma-navy-deeper/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-white/60">
          <Save className="h-4 w-4 text-korma-gold" />
          {saveState === "saving" ? "Saving draft" : "Draft saved"}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold uppercase tracking-wider text-white/35 transition-colors hover:text-white"
        >
          Clear
        </button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Metric label="Tracks" value={String(draft.selectedServices.length)} />
        <Metric label="Arts" value={String(draft.selectedArts.length)} />
        <Metric label="Minutes" value={minutes ? String(minutes) : "-"} />
      </div>
      <div
        className={cn(
          "mt-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
          certificationReady
            ? "border-korma-gold/30 bg-korma-gold/10 text-korma-gold"
            : "border-white/10 bg-white/[0.03] text-white/45"
        )}
      >
        <Award className="h-4 w-4" />
        {certificationReady
          ? "Certification intake started"
          : "Certification choices required"}
      </div>
      <div
        className={cn(
          "mt-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
          registrationComplete
            ? "border-korma-gold/30 bg-korma-gold/10 text-korma-gold"
            : "border-white/10 bg-white/[0.03] text-white/45"
        )}
      >
        <UserCheck className="h-4 w-4" />
        {registrationComplete ? "Registration complete" : "Registration required"}
      </div>
      <div
        className={cn(
          "mt-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
          readyForReview
            ? "border-korma-gold/30 bg-korma-gold/10 text-korma-gold"
            : "border-white/10 bg-white/[0.03] text-white/45"
        )}
      >
        <ShieldCheck className="h-4 w-4" />
        {readyForReview ? "Draft has the core fields" : "Core fields needed"}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.04] px-3 py-3 text-center">
      <div className="text-lg font-black text-white">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-white/35">
        {label}
      </div>
    </div>
  );
}

function CertificationStep({
  draft,
  currentFlow,
  complete,
  onSelectFlow,
  onSelectService,
  onSelectArt,
  onUpdateCertificationProfile,
  onUpdateSchool,
}: {
  draft: ApplicationDraft;
  currentFlow?: ApplicationFlow;
  complete: boolean;
  onSelectFlow: (flowId: ApplicationFlowId) => void;
  onSelectService: (serviceId: ApplicationServiceId) => void;
  onSelectArt: (artId: MartialArtId) => void;
  onUpdateCertificationProfile: (
    field: CertificationField,
    value: string
  ) => void;
  onUpdateSchool: (field: SchoolTextField, value: string) => void;
}) {
  const needsSchoolName = draft.selectedServices.includes("school-registration");
  const flowLockedServices = currentFlow?.lockedServices?.length
    ? new Set(currentFlow.lockedServices)
    : null;
  const flowLockedArts = currentFlow?.lockedArts?.length
    ? new Set(currentFlow.lockedArts)
    : null;

  return (
    <section>
      <SectionHeader
        eyebrow="Step 1"
        title="Certification Review"
        description={
          currentFlow?.helperText ??
          "Start with the certification tracks and martial arts involved. This profile feeds the shared application record and HubSpot submission."
        }
      />

      <div className="mt-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
          Submission Path
        </h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {APPLICATION_FLOWS.map((flow) => {
            const selected = draft.applicationFlowId === flow.id;
            return (
              <button
                key={flow.id}
                type="button"
                onClick={() => onSelectFlow(flow.id)}
                className={cn(
                  "rounded-xl border p-5 text-left transition-colors",
                  selected
                    ? "border-korma-gold/60 bg-korma-gold/10"
                    : "border-white/10 bg-white/[0.03] hover:border-korma-gold/30"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-lg font-black text-white">{flow.title}</h4>
                  {selected && <Check className="h-4 w-4 text-korma-gold" />}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {flow.description}
                </p>
                <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-korma-gold">
                  {flow.helperText}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
          Requested Tracks
        </h3>
        <div className="mt-4 grid gap-5 lg:grid-cols-3">
          {APPLICATION_SERVICES.map((service) => {
            const flowService =
              getFlowService(draft.applicationFlowId, service.id) ?? service;
            const Icon = serviceIcons[service.id];
            const selected = draft.selectedServices.includes(service.id);
            const locked = Boolean(flowLockedServices?.has(service.id));
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => onSelectService(service.id)}
                disabled={locked}
                className={cn(
                  "group flex h-full flex-col rounded-xl border p-5 text-left transition-all",
                  selected
                    ? "border-korma-gold/60 bg-korma-gold/10"
                    : "border-white/10 bg-white/[0.03] hover:border-korma-gold/30",
                  locked && "cursor-default"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-korma-gold/10">
                    <Icon className="h-6 w-6 text-korma-gold" />
                  </div>
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border",
                      selected
                        ? "border-korma-gold bg-korma-gold text-korma-dark"
                        : "border-white/20 text-transparent"
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-black text-white">
                  {flowService.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {flowService.description}
                </p>
                <div className="mt-5 rounded-lg border border-korma-gold/20 bg-korma-gold/10 px-3 py-2 text-xs font-semibold text-korma-gold">
                  Price: {flowService.pricePlaceholder}
                </div>
                {locked && (
                  <div className="mt-3 text-xs font-semibold uppercase tracking-wider text-white/45">
                    Included in this submission path
                  </div>
                )}
                {!locked && (
                  <div className="mt-3 text-xs font-semibold uppercase tracking-wider text-white/45">
                    {flowService.idealFor}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
          Martial Arts
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {MARTIAL_ARTS.map((art) => {
            const selected = draft.selectedArts.includes(art.id);
            const locked = Boolean(flowLockedArts?.has(art.id));
            return (
              <button
                key={art.id}
                type="button"
                onClick={() => onSelectArt(art.id)}
                disabled={Boolean(flowLockedArts) && !locked}
                className={cn(
                  "rounded-xl border p-5 text-left transition-colors",
                  selected
                    ? "border-korma-gold/60 bg-korma-gold/10"
                    : "border-white/10 bg-white/[0.03] hover:border-korma-gold/30",
                  Boolean(flowLockedArts) && !locked && "cursor-not-allowed opacity-45"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-black text-white">{art.title}</h4>
                  {selected && <Check className="h-4 w-4 text-korma-gold" />}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  {art.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Field label="Current Rank">
          <select
            value={draft.certificationProfile.currentRank}
            onChange={(event) =>
              onUpdateCertificationProfile("currentRank", event.target.value)
            }
            className={inputClass}
          >
            <option value="">Select rank</option>
            {CERTIFICATION_RANK_OPTIONS.map((rank) => (
              <option key={rank} value={rank}>
                {rank}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date of Birth">
          <input
            type="date"
            value={draft.certificationProfile.dateOfBirth}
            onChange={(event) =>
              onUpdateCertificationProfile("dateOfBirth", event.target.value)
            }
            className={inputClass}
          />
        </Field>
        <Field label="Nation">
          <input
            value={draft.certificationProfile.nation}
            onChange={(event) =>
              onUpdateCertificationProfile("nation", event.target.value)
            }
            className={inputClass}
            placeholder="United States"
          />
        </Field>
        <Field label="Sex">
          <select
            value={draft.certificationProfile.sex}
            onChange={(event) =>
              onUpdateCertificationProfile("sex", event.target.value)
            }
            className={inputClass}
          >
            <option value="">Select</option>
            <option value="M">Male (M)</option>
            <option value="F">Female (F)</option>
          </select>
        </Field>
        <Field label="Citizen No.">
          <input
            value={draft.certificationProfile.citizenNumber}
            onChange={(event) =>
              onUpdateCertificationProfile("citizenNumber", event.target.value)
            }
            className={inputClass}
            placeholder="Citizen or government ID number"
          />
        </Field>
        <Field label="Years Training">
          <select
            value={draft.certificationProfile.yearsTraining}
            onChange={(event) =>
              onUpdateCertificationProfile("yearsTraining", event.target.value)
            }
            className={inputClass}
          >
            <option value="">Select years</option>
            {YEARS_TRAINING_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Current Organization / Lineage">
          <input
            value={draft.certificationProfile.currentOrg}
            onChange={(event) =>
              onUpdateCertificationProfile("currentOrg", event.target.value)
            }
            className={inputClass}
            placeholder="Changmookwan, Migukyongkwan, KORMA-USA"
          />
        </Field>
        <Field label="Instructor / Grandmaster">
          <input
            value={draft.certificationProfile.instructorName}
            onChange={(event) =>
              onUpdateCertificationProfile("instructorName", event.target.value)
            }
            className={inputClass}
            placeholder="Instructor or certifying master"
          />
        </Field>
        {needsSchoolName && (
          <Field label="School / Dojang Name">
            <input
              value={draft.school.schoolName}
              onChange={(event) =>
                onUpdateSchool("schoolName", event.target.value)
              }
              className={inputClass}
              placeholder="Virginia Changmookwan Academy"
            />
          </Field>
        )}
        <Field label="Current Rank Issue Date">
          <input
            type="date"
            value={draft.certificationProfile.currentRankIssueDate}
            onChange={(event) =>
              onUpdateCertificationProfile(
                "currentRankIssueDate",
                event.target.value
              )
            }
            className={inputClass}
          />
        </Field>
        <Field label="Current Rank Number">
          <input
            value={draft.certificationProfile.currentRankNumber}
            onChange={(event) =>
              onUpdateCertificationProfile(
                "currentRankNumber",
                event.target.value
              )
            }
            className={inputClass}
            placeholder="Rank certificate or ledger number"
          />
        </Field>
        <Field label="Recommender">
          <input
            value={draft.certificationProfile.recommenderName}
            onChange={(event) =>
              onUpdateCertificationProfile(
                "recommenderName",
                event.target.value
              )
            }
            className={inputClass}
            placeholder="Recommending master or branch director"
          />
        </Field>
        <div className={cn(needsSchoolName ? "" : "md:col-span-2")}>
          <Field label="Additional Notes">
            <textarea
              value={draft.certificationProfile.notes}
              onChange={(event) =>
                onUpdateCertificationProfile("notes", event.target.value)
              }
              className={cn(inputClass, "min-h-28 resize-y")}
              placeholder="Training background, review goals, lineage notes, or context for the application team."
            />
          </Field>
        </div>
      </div>

      <div
        className={cn(
          "mt-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm",
          complete
            ? "border-korma-gold/30 bg-korma-gold/10 text-korma-gold"
            : "border-white/10 bg-white/[0.03] text-white/45"
        )}
      >
        <ShieldCheck className="h-4 w-4" />
        {complete
          ? "Certification details are ready to carry into registration and application review."
          : "Choose at least one requested track and one martial art to continue."}
      </div>
    </section>
  );
}

function RegistrationStep({
  registration,
  complete,
  onUpdateRegistration,
  onPatchRegistration,
}: {
  registration: ApplicationRegistration;
  complete: boolean;
  onUpdateRegistration: (
    field: RegistrationField,
    value: string | boolean
  ) => void;
  onPatchRegistration: (updates: Partial<ApplicationRegistration>) => void;
}) {
  const [addressQuery, setAddressQuery] = useState(() =>
    registration.formattedAddress || formatRegistrationAddress(registration)
  );
  const [suggestions, setSuggestions] = useState<GoogleAddressSuggestion[]>([]);
  const [addressSearchState, setAddressSearchState] =
    useState<AddressSearchState>("idle");
  const [addressSessionToken, setAddressSessionToken] = useState(() =>
    createAddressSessionToken()
  );

  useEffect(() => {
    const formatted = registration.formattedAddress;
    if (formatted && formatted !== addressQuery) {
      setAddressQuery(formatted);
    }
  }, [addressQuery, registration.formattedAddress]);

  useEffect(() => {
    const query = addressQuery.trim();
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    if (
      registration.addressValidationStatus === "validated" &&
      query === registration.formattedAddress.trim()
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
          error?: string;
        };

        if (result.configured === false) {
          onPatchRegistration({
            addressValidationStatus: "not-configured",
            addressValidationMessage: "Google Maps is not configured.",
          });
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
    onPatchRegistration,
    registration.addressValidationStatus,
    registration.formattedAddress,
  ]);

  async function selectAddressSuggestion(suggestion: GoogleAddressSuggestion) {
    setAddressQuery(suggestion.label);
    setSuggestions([]);
    await validateAddress({ placeId: suggestion.placeId });
  }

  async function validateTypedAddress() {
    await validateAddress();
  }

  async function validateAddress(options: { placeId?: string } = {}) {
    setAddressSearchState("validating");
    onPatchRegistration({
      addressValidationStatus: "validating",
      addressValidationMessage: "Validating mailing address with Google Maps.",
    });

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
                  addressLine1: registration.addressLine1,
                  addressLine2: registration.addressLine2,
                  city: registration.city,
                  state: registration.state,
                  postalCode: registration.postalCode,
                  googlePlaceId: registration.googlePlaceId,
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
      onPatchRegistration({
        addressValidationStatus: "needs-review",
        addressValidationMessage: "Address validation failed.",
      });
    } finally {
      setAddressSearchState("idle");
    }
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

    onPatchRegistration({
      addressLine1: normalized?.addressLine1 ?? registration.addressLine1,
      addressLine2: normalized?.addressLine2 ?? registration.addressLine2,
      city: normalized?.city ?? registration.city,
      state: normalized?.state ?? registration.state,
      postalCode: normalized?.postalCode ?? registration.postalCode,
      formattedAddress:
        normalized?.formattedAddress ?? registration.formattedAddress,
      googlePlaceId: normalized?.googlePlaceId ?? registration.googlePlaceId,
      googleMapsUri: normalized?.googleMapsUri ?? registration.googleMapsUri,
      addressValidationStatus: nextStatus,
      addressValidationMessage: nextMessage,
      addressValidatedAt:
        nextStatus === "validated" ? new Date().toISOString() : "",
    });
  }

  return (
    <section>
      <SectionHeader
        eyebrow="Step 2"
        title="KORMA-USA Registration"
        description="Registration is required before submitting the application package. Confirm the mailing address and communication permissions here."
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Field label="Full Name">
          <input
            value={registration.name}
            onChange={(event) =>
              onUpdateRegistration("name", event.target.value)
            }
            className={inputClass}
            placeholder="Applicant name"
            required
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={registration.email}
            onChange={(event) =>
              onUpdateRegistration("email", event.target.value)
            }
            className={inputClass}
            placeholder="applicant@example.com"
            required
          />
        </Field>
        <Field label="Phone">
          <input
            type="tel"
            value={registration.phone}
            onChange={(event) =>
              onUpdateRegistration("phone", event.target.value)
            }
            className={inputClass}
            placeholder="(555) 555-5555"
            required
          />
        </Field>
        <div className="relative md:col-span-2">
          <Field label="Find Mailing Address">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                value={addressQuery}
                onChange={(event) => setAddressQuery(event.target.value)}
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
                  onClick={() => selectAddressSuggestion(suggestion)}
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
            value={registration.addressLine1}
            onChange={(event) =>
              onUpdateRegistration("addressLine1", event.target.value)
            }
            className={inputClass}
            placeholder="Street address"
            required
          />
        </Field>
        <Field label="Address Line 2">
          <input
            value={registration.addressLine2}
            onChange={(event) =>
              onUpdateRegistration("addressLine2", event.target.value)
            }
            className={inputClass}
            placeholder="Apartment, suite, unit"
          />
        </Field>
        <Field label="City">
          <input
            value={registration.city}
            onChange={(event) =>
              onUpdateRegistration("city", event.target.value)
            }
            className={inputClass}
            placeholder="Virginia Beach"
            required
          />
        </Field>
        <Field label="State">
          <input
            value={registration.state}
            onChange={(event) =>
              onUpdateRegistration("state", event.target.value)
            }
            className={inputClass}
            placeholder="VA"
            maxLength={2}
            required
          />
        </Field>
        <Field label="Postal Code">
          <input
            value={registration.postalCode}
            onChange={(event) =>
              onUpdateRegistration("postalCode", event.target.value)
            }
            className={inputClass}
            placeholder="23451"
            required
          />
        </Field>
        <div className="md:col-span-2 hidden">
          <div
            className={cn(
              "rounded-lg border px-4 py-3 text-sm",
              registration.addressValidationStatus === "validated"
                ? "border-korma-gold/30 bg-korma-gold/10 text-korma-gold"
                : "border-white/10 bg-white/[0.03] text-white/45"
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>
                  {registration.addressValidationStatus === "validated"
                    ? "Google Maps mailing address validated."
                    : registration.addressValidationMessage ||
                      "Select an address from Google Maps or validate the typed address."}
                </span>
              </div>
              <button
                type="button"
                onClick={validateTypedAddress}
                disabled={addressSearchState === "validating"}
                className="inline-flex w-fit items-center justify-center rounded bg-korma-gold px-3 py-2 text-xs font-bold uppercase tracking-wider text-korma-dark transition-colors hover:bg-korma-gold-light disabled:cursor-not-allowed disabled:opacity-55"
              >
                {addressSearchState === "validating"
                  ? "Validating"
                  : "Validate Address"}
              </button>
            </div>
            {registration.formattedAddress && (
              <div className="mt-2 text-xs text-white/50">
                Standardized: {registration.formattedAddress}
              </div>
            )}
          </div>
          {addressSearchState === "searching" && (
            <div className="mt-2 text-xs text-white/35">
              Searching Google Maps addresses.
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <RegistrationConsent
          icon={Phone}
          title="Text Permission"
          description="I agree to receive text messages about applications, billing, testing eligibility, and KORMA-USA account updates."
          checked={registration.allowTexts}
          onChange={(checked) => onUpdateRegistration("allowTexts", checked)}
        />
        <RegistrationConsent
          icon={Mail}
          title="Email Permission"
          description="I agree to receive emails about applications, billing, testing eligibility, and KORMA-USA account updates."
          checked={registration.allowEmails}
          onChange={(checked) => onUpdateRegistration("allowEmails", checked)}
        />
      </div>

      <div
        className={cn(
          "mt-6 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm",
          complete
            ? "border-korma-gold/30 bg-korma-gold/10 text-korma-gold"
            : "border-white/10 bg-white/[0.03] text-white/45"
        )}
      >
        <ShieldCheck className="h-4 w-4" />
        {complete
          ? "Registration is complete."
          : "Complete all required registration fields, validate the mailing address, and select both permissions to continue."}
      </div>
    </section>
  );
}

function RegistrationConsent({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: ElementType;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
        checked
          ? "border-korma-gold/60 bg-korma-gold/10"
          : "border-white/10 bg-white/[0.03] hover:border-korma-gold/30"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 accent-yellow-400"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-2 font-bold text-white">
          <Icon className="h-4 w-4 text-korma-gold" />
          {title}
        </span>
        <span className="mt-2 block text-sm leading-relaxed text-white/50">
          {description}
        </span>
      </span>
    </label>
  );
}

function formatRegistrationAddress(registration: ApplicationRegistration) {
  return [
    registration.addressLine1,
    registration.addressLine2,
    registration.city,
    registration.state,
    registration.postalCode,
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

function InheritedRegistrationItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
        <Icon className="h-3.5 w-3.5 text-korma-gold" />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-white">
        {value || "Not provided yet"}
      </div>
    </div>
  );
}

function DetailsStep({
  draft,
  currentFlow,
  onSelectRankDanLevel,
  onUpdateSchool,
  onAddPromotionHistory,
  onUpdatePromotionHistory,
  onRemovePromotionHistory,
  onUpdateTestingEligibility,
  masterKey,
  masterKeyStatus,
  onUpdateMasterKey,
  onVerifyMasterKey,
}: {
  draft: ApplicationDraft;
  currentFlow?: ApplicationFlow;
  onSelectRankDanLevel: (danLevelId: DanLevelId) => void;
  onUpdateSchool: (field: SchoolTextField, value: string) => void;
  onAddPromotionHistory: () => void;
  onUpdatePromotionHistory: (
    entryId: string,
    field: PromotionField,
    value: string
  ) => void;
  onRemovePromotionHistory: (entryId: string) => void;
  onUpdateTestingEligibility: (
    field: EligibilityField,
    value: string | boolean
  ) => void;
  masterKey: string;
  masterKeyStatus: MasterKeyStatus;
  onUpdateMasterKey: (value: string) => void;
  onVerifyMasterKey: () => void;
}) {
  const needsRankLevel = draft.selectedServices.includes("rank-registration");
  const needsSchool = draft.selectedServices.includes("school-registration");
  const rankSectionTitle =
    draft.applicationFlowId === "whmaf-promotion"
      ? "Promotion Dan Level"
      : "Rank Registration Dan Level";
  const rankSectionDescription =
    draft.applicationFlowId === "whmaf-promotion"
      ? "Select the Dan level for the WHMAF promotion packet. Pricing changes by Dan level and applies the 40% markup to your internal cost."
      : "Select the Dan level being registered. Each level carries its own billable registration cost.";

  return (
    <section>
      <SectionHeader
        eyebrow="Step 3"
        title="Add the core details"
        description="These fields establish the application package before uploads, signatures, and final submission."
      />

      <div className="mt-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
          Registered Applicant
        </h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InheritedRegistrationItem
            icon={UserCheck}
            label="Name"
            value={draft.registration.name}
          />
          <InheritedRegistrationItem
            icon={Mail}
            label="Email"
            value={draft.registration.email}
          />
          <InheritedRegistrationItem
            icon={Phone}
            label="Phone"
            value={draft.registration.phone}
          />
          <InheritedRegistrationItem
            icon={MapPin}
            label="Address"
            value={[
              draft.registration.addressLine1,
              draft.registration.addressLine2,
              draft.registration.city,
              draft.registration.state,
              draft.registration.postalCode,
            ]
              .filter(Boolean)
              .join(", ")}
          />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
          Certification Profile
        </h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InheritedRegistrationItem
            icon={Award}
            label="Requested Tracks"
            value={draft.selectedServices
              .map((serviceId) => getService(serviceId)?.title ?? serviceId)
              .join(", ")}
          />
          <InheritedRegistrationItem
            icon={Award}
            label="Martial Arts"
            value={draft.selectedArts
              .map((artId) => getMartialArt(artId)?.title ?? artId)
              .join(", ")}
          />
          <InheritedRegistrationItem
            icon={History}
            label="Current Rank"
            value={draft.certificationProfile.currentRank}
          />
          <InheritedRegistrationItem
            icon={Clock}
            label="Years Training"
            value={draft.certificationProfile.yearsTraining}
          />
          <InheritedRegistrationItem
            icon={Building2}
            label="Current Organization"
            value={draft.certificationProfile.currentOrg}
          />
          <InheritedRegistrationItem
            icon={GraduationCap}
            label="Instructor"
            value={draft.certificationProfile.instructorName}
          />
        </div>
        {draft.certificationProfile.notes && (
          <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-white/65">
            {draft.certificationProfile.notes}
          </div>
        )}
      </div>

      {needsRankLevel && (
        <div className="mt-10">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            {rankSectionTitle}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">
            {rankSectionDescription}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DAN_LEVEL_COSTS.map((level) => {
              const pricedLevel = getDanLevelCost(
                level.id,
                draft.applicationFlowId
              );
              const selected = draft.rankDanLevelId === level.id;
              return (
                <label
                  key={level.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                    selected
                      ? "border-korma-gold/60 bg-korma-gold/10"
                      : "border-white/10 bg-white/[0.03] hover:border-korma-gold/30"
                  )}
                >
                  <input
                    type="radio"
                    name="rankDanLevel"
                    value={level.id}
                    checked={selected}
                    onChange={() => onSelectRankDanLevel(level.id)}
                    className="mt-1 accent-yellow-400"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-white">
                      {level.label}
                    </span>
                    <span className="mt-1 block text-sm text-korma-gold">
                      {pricedLevel?.costPlaceholder ?? level.costPlaceholder}
                    </span>
                    <span className="mt-4 grid gap-3">
                      <DanUploadField
                        id={`${level.id}-photo`}
                        name={`rankPhoto_${level.id}`}
                        label="Photo required"
                        accept="image/*"
                      />
                      <DanUploadField
                        id={`${level.id}-certificate`}
                        name={`rankCertificates_${level.id}`}
                        label="Certificate PDF"
                        accept="application/pdf"
                        optional
                        multiple
                      />
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {needsRankLevel && (
        <PromotionHistorySection
          draft={draft}
          onAddPromotionHistory={onAddPromotionHistory}
          onUpdatePromotionHistory={onUpdatePromotionHistory}
          onRemovePromotionHistory={onRemovePromotionHistory}
          onUpdateTestingEligibility={onUpdateTestingEligibility}
          masterKey={masterKey}
          masterKeyStatus={masterKeyStatus}
          onUpdateMasterKey={onUpdateMasterKey}
          onVerifyMasterKey={onVerifyMasterKey}
        />
      )}

      {needsSchool && (
        <div className="mt-10">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            School Details
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="School or Dojang Name">
              <input
                value={draft.school.schoolName}
                onChange={(event) =>
                  onUpdateSchool("schoolName", event.target.value)
                }
                className={inputClass}
                placeholder="KORMA-USA Virginia"
              />
            </Field>
            <Field label="School Type">
              <select
                value={draft.school.schoolType}
                onChange={(event) =>
                  onUpdateSchool("schoolType", event.target.value)
                }
                className={inputClass}
              >
                <option value="" className="bg-korma-navy-deeper">
                  Select type
                </option>
                <option value="physical" className="bg-korma-navy-deeper">
                  Physical location
                </option>
                <option value="mobile" className="bg-korma-navy-deeper">
                  Mobile program
                </option>
                <option value="online" className="bg-korma-navy-deeper">
                  Online
                </option>
                <option value="hybrid" className="bg-korma-navy-deeper">
                  Hybrid
                </option>
              </select>
            </Field>
            <Field label="City">
              <input
                value={draft.school.city}
                onChange={(event) => onUpdateSchool("city", event.target.value)}
                className={inputClass}
                placeholder="Virginia Beach"
              />
            </Field>
            <Field label="State">
              <input
                value={draft.school.state}
                onChange={(event) => onUpdateSchool("state", event.target.value)}
                className={inputClass}
                placeholder="VA"
                maxLength={2}
              />
            </Field>
          </div>
        </div>
      )}

      <ApplicationCompletionPlaceholders draft={draft} />
    </section>
  );
}

function PromotionHistorySection({
  draft,
  onAddPromotionHistory,
  onUpdatePromotionHistory,
  onRemovePromotionHistory,
  onUpdateTestingEligibility,
  masterKey,
  masterKeyStatus,
  onUpdateMasterKey,
  onVerifyMasterKey,
}: {
  draft: ApplicationDraft;
  onAddPromotionHistory: () => void;
  onUpdatePromotionHistory: (
    entryId: string,
    field: PromotionField,
    value: string
  ) => void;
  onRemovePromotionHistory: (entryId: string) => void;
  onUpdateTestingEligibility: (
    field: EligibilityField,
    value: string | boolean
  ) => void;
  masterKey: string;
  masterKeyStatus: MasterKeyStatus;
  onUpdateMasterKey: (value: string) => void;
  onVerifyMasterKey: () => void;
}) {
  const testingRequirement = getDanTestingRequirement(
    draft.testingEligibility.targetDanLevelId
  );
  const masterUnlocked = masterKeyStatus === "unlocked";

  return (
    <div className="mt-10 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
            <History className="h-4 w-4 text-korma-gold" />
            Promotion History
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">
            These entries are written into the HubSpot record so prior
            promotions stay visible with future testing eligibility.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddPromotionHistory}
          className="inline-flex w-fit items-center gap-2 rounded border border-korma-gold/30 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-korma-gold transition-colors hover:bg-korma-gold/10"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Promotion
        </button>
      </div>

      <div className="space-y-4">
        {draft.promotionHistory.map((entry, index) => (
          <div
            key={entry.id}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="text-sm font-bold text-white">
                Promotion {index + 1}
              </h4>
              <button
                type="button"
                onClick={() => onRemovePromotionHistory(entry.id)}
                disabled={draft.promotionHistory.length === 1}
                className="inline-flex items-center gap-2 rounded border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/45 transition-colors hover:border-korma-gold/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Art">
                <select
                  value={entry.artId}
                  onChange={(event) =>
                    onUpdatePromotionHistory(
                      entry.id,
                      "artId",
                      event.target.value
                    )
                  }
                  className={inputClass}
                >
                  <option value="" className="bg-korma-navy-deeper">
                    Select art
                  </option>
                  {MARTIAL_ARTS.map((art) => (
                    <option
                      key={art.id}
                      value={art.id}
                      className="bg-korma-navy-deeper"
                    >
                      {art.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Rank Awarded">
                <input
                  value={entry.rankLabel}
                  onChange={(event) =>
                    onUpdatePromotionHistory(
                      entry.id,
                      "rankLabel",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="2nd Dan"
                />
              </Field>
              <Field label="Promotion Date">
                <input
                  type="date"
                  value={entry.promotionDate}
                  onChange={(event) =>
                    onUpdatePromotionHistory(
                      entry.id,
                      "promotionDate",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Certifying Instructor">
                <input
                  value={entry.certifyingInstructor}
                  onChange={(event) =>
                    onUpdatePromotionHistory(
                      entry.id,
                      "certifyingInstructor",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="Master instructor"
                />
              </Field>
              <Field label="Certifying Organization">
                <input
                  value={entry.certifyingOrganization}
                  onChange={(event) =>
                    onUpdatePromotionHistory(
                      entry.id,
                      "certifyingOrganization",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="KORMA-USA"
                />
              </Field>
              <Field label="Certificate Number">
                <input
                  value={entry.certificateNumber}
                  onChange={(event) =>
                    onUpdatePromotionHistory(
                      entry.id,
                      "certificateNumber",
                      event.target.value
                    )
                  }
                  className={inputClass}
                  placeholder="Optional"
                />
              </Field>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-korma-gold/25 bg-korma-gold/10 p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
          <Bell className="h-4 w-4 text-korma-gold" />
          Testing Eligibility Prompt
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Target Dan Level">
            <select
              value={draft.testingEligibility.targetDanLevelId}
              onChange={(event) =>
                onUpdateTestingEligibility(
                  "targetDanLevelId",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="" className="bg-korma-navy-deeper">
                Select target level
              </option>
              {DAN_LEVEL_COSTS.map((level) => (
                <option
                  key={level.id}
                  value={level.id}
                  className="bg-korma-navy-deeper"
                >
                  {level.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Eligible-To-Test Date">
            <input
              type="date"
              value={draft.testingEligibility.eligibleDate}
              onChange={(event) =>
                onUpdateTestingEligibility("eligibleDate", event.target.value)
              }
              className={inputClass}
            />
          </Field>
          <div className="rounded-lg border border-korma-gold/20 bg-korma-dark/30 px-4 py-3 md:col-span-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Default Time Requirement
            </div>
            <div className="mt-2 text-sm font-semibold text-white">
              {testingRequirement
                ? testingRequirement.description
                : "Select a target Dan level to show the minimum time requirement."}
            </div>
            {testingRequirement && testingRequirement.minimumYearsAtCurrentRank > 0 && (
              <div className="mt-1 text-sm text-white/50">
                Current rank basis: {testingRequirement.requiredCurrentLabel}
              </div>
            )}
          </div>
          <Field label="Prompt Status">
            <select
              value={draft.testingEligibility.reminderStatus}
              onChange={(event) =>
                onUpdateTestingEligibility(
                  "reminderStatus",
                  event.target.value
                )
              }
              className={inputClass}
            >
              <option value="watch" className="bg-korma-navy-deeper">
                Watch for eligibility
              </option>
              <option value="eligible" className="bg-korma-navy-deeper">
                Eligible now
              </option>
              <option value="not-ready" className="bg-korma-navy-deeper">
                Not ready
              </option>
            </select>
          </Field>
          <Field label="Eligibility Notes">
            <input
              value={draft.testingEligibility.notes}
              onChange={(event) =>
                onUpdateTestingEligibility("notes", event.target.value)
              }
              className={inputClass}
              placeholder="Minimum time, hours, or review notes"
            />
          </Field>
          <div className="rounded-lg border border-white/10 bg-korma-dark/30 p-4 md:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Field label="Master Key">
                <input
                  type="password"
                  value={masterKey}
                  onChange={(event) => onUpdateMasterKey(event.target.value)}
                  className={inputClass}
                  placeholder="Required for reviewer overrides"
                  disabled={masterUnlocked}
                />
              </Field>
              <button
                type="button"
                onClick={onVerifyMasterKey}
                disabled={masterUnlocked || masterKeyStatus === "checking"}
                className="inline-flex h-[46px] items-center justify-center gap-2 rounded bg-korma-gold px-4 text-xs font-bold uppercase tracking-wider text-korma-dark transition-colors hover:bg-korma-gold-light disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Lock className="h-3.5 w-3.5" />
                {masterUnlocked ? "Unlocked" : "Unlock"}
              </button>
            </div>
            <div
              className={cn(
                "mt-3 rounded border px-3 py-2 text-sm",
                masterUnlocked
                  ? "border-korma-gold/30 bg-korma-gold/10 text-korma-gold"
                  : "border-white/10 bg-white/[0.03] text-white/45"
              )}
            >
              {masterUnlocked && "Override controls are available."}
              {masterKeyStatus === "checking" && "Checking master key."}
              {masterKeyStatus === "denied" && "Master key was not accepted."}
              {masterKeyStatus === "not-configured" &&
                "Master key is not configured on the server."}
              {masterKeyStatus === "idle" &&
                "Master key required for manual override and entry above 1st Dan."}
            </div>
          </div>
          <EligibilityOption
            title="Manual override"
            description="Allow an authorized reviewer to override the default time requirement for this applicant."
            checked={masterUnlocked && draft.testingEligibility.manualOverride}
            disabled={!masterUnlocked}
            onChange={(checked) =>
              onUpdateTestingEligibility("manualOverride", checked)
            }
          />
          <EligibilityOption
            title="Entry above 1st Dan"
            description="Allow the applicant to enter the application process at a Dan level above 1st when prior credentials support it."
            checked={masterUnlocked && draft.testingEligibility.entryAboveFirst}
            disabled={!masterUnlocked}
            onChange={(checked) =>
              onUpdateTestingEligibility("entryAboveFirst", checked)
            }
          />
        </div>
      </div>
    </div>
  );
}

function EligibilityOption({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
        disabled
          ? "cursor-not-allowed border-white/10 bg-korma-dark/20 opacity-55"
          : checked
            ? "border-korma-gold/50 bg-korma-gold/10"
            : "border-white/10 bg-korma-dark/25 hover:border-korma-gold/30"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="mt-1 accent-yellow-400"
      />
      <span>
        <span className="block text-sm font-bold text-white">{title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-white/50">
          {description}
        </span>
      </span>
    </label>
  );
}

function DanUploadField({
  id,
  name,
  label,
  accept,
  optional = false,
  multiple = false,
}: {
  id: string;
  name: string;
  label: string;
  accept: string;
  optional?: boolean;
  multiple?: boolean;
}) {
  return (
    <span className="block rounded-lg border border-white/10 bg-korma-dark/25 p-3">
      <span className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/55">
          <Upload className="h-3.5 w-3.5 text-korma-gold" />
          {label}
        </span>
        {optional && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
            If needed
          </span>
        )}
      </span>
      <input
        id={id}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        onClick={(event) => event.stopPropagation()}
        className="mt-2 block w-full text-xs text-white/45 file:mr-3 file:rounded file:border-0 file:bg-korma-gold file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-korma-dark"
      />
    </span>
  );
}

function ApplicationCompletionPlaceholders({
  draft,
}: {
  draft: ApplicationDraft;
}) {
  const selectedServices = orderServiceIdsForFlow(
    draft.applicationFlowId,
    draft.selectedServices
  );
  if (selectedServices.length === 0) return null;

  const isWhmaf = draft.applicationFlowId === "whmaf-promotion";

  return (
    <div className="mt-10 space-y-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white">
        Application Sections
      </h3>

      {isWhmaf && selectedServices.includes("rank-registration") && (
        <PlaceholderCard
          title="1. Application for Promotion Test (WHMAF)"
          status="To be completed"
          fields={[
            "Nation, sex, and date of birth",
            "Present rank, issue date, and rank number",
            "Applied Dan level and fee",
            "Passport-size photo upload",
            "Copy of current certificate",
            "Dojang name and recommender",
          ]}
        />
      )}

      {isWhmaf && selectedServices.includes("instructor-certification") && (
        <PlaceholderCard
          title="2. Instructor Promotion Test (WHMAF)"
          status="To be completed"
          fields={[
            "Instructor promotion form details",
            "Applicant signature",
            "Phone number",
            "Dojang name",
            "Recommender details",
            "Supporting rank history",
          ]}
        />
      )}

      {isWhmaf && selectedServices.includes("school-registration") && (
        <PlaceholderCard
          title="3. Organization Registration Forms (WHMAF)"
          status="To be completed"
          fields={[
            "Nation",
            "Gymnasium name",
            "Master name",
            "Citizen number",
            "Gym address and telephone",
            "Organization registration signature",
          ]}
        />
      )}

      {!isWhmaf && selectedServices.includes("school-registration") && (
        <PlaceholderCard
          title="School Registration Application"
          status="To be completed"
          fields={[
            "School legal name",
            "Public school name",
            "Physical, mobile, online, or hybrid location",
            "Owner and head instructor",
            "Additional instructors",
            "Arts taught and estimated enrollment",
          ]}
        />
      )}

      {!isWhmaf && selectedServices.includes("rank-registration") && (
        <PlaceholderCard
          title="Rank Registration Application"
          status="To be completed"
          fields={[
            "Dan level and cost selection",
            "Photo upload for selected Dan level",
            "Certificate PDF upload if needed",
            "Promotion history",
            "Eligible-to-test prompt date",
            "Art and current rank",
            "Issuing instructor",
            "Issuing organization",
            "Award date",
            "Certificate number and lineage notes",
          ]}
        />
      )}

      {!isWhmaf && selectedServices.includes("instructor-certification") && (
        <PlaceholderCard
          title="Instructor Certification Application"
          status="To be completed"
          fields={[
            "Art and requested instructor level",
            "Years training",
            "Years teaching",
            "Current school",
            "Primary instructor",
            "Supporting rank or credential",
          ]}
        />
      )}

      <PlaceholderCard
        title="Required Documents and Signatures"
        status="Prepared"
        fields={[
          "Headshot upload",
          "Rank certificate upload",
          "Supporting evidence upload",
          "Generated forms",
          "Digital signature packet",
          "Final submission attestation",
        ]}
      />

      <BillingPlaceholder draft={draft} />
    </div>
  );
}

function BillingPlaceholder({
  draft,
}: {
  draft: ApplicationDraft;
}) {
  const services = orderServiceIdsForFlow(
    draft.applicationFlowId,
    draft.selectedServices
  )
    .map(
      (serviceId) =>
        getFlowService(draft.applicationFlowId, serviceId) ??
        getService(serviceId)
    )
    .filter((service): service is ApplicationService => Boolean(service));
  const selectedDanLevel = getDanLevelCost(
    draft.rankDanLevelId,
    draft.applicationFlowId
  );
  const knownLineAmounts = services.map((service) =>
    service.id === "rank-registration"
      ? selectedDanLevel?.amountCents
      : getServiceAmountCents(draft.applicationFlowId, service.id)
  );
  const totalAmountCents = knownLineAmounts.every(
    (amount) => typeof amount === "number"
  )
    ? knownLineAmounts.reduce((sum, amount) => sum + (amount ?? 0), 0)
    : undefined;
  const downPayment = totalAmountCents
    ? Math.round(totalAmountCents * 0.1)
    : undefined;
  const interest = totalAmountCents
    ? Math.round(totalAmountCents * 0.05)
    : undefined;
  const subscriptionBalance =
    typeof totalAmountCents === "number" &&
    typeof downPayment === "number" &&
    typeof interest === "number"
      ? totalAmountCents + interest - downPayment
      : undefined;

  return (
    <div className="rounded-xl border border-korma-gold/25 bg-korma-gold/10 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-bold text-white">Post-Submission Bill</h4>
          <p className="mt-1 text-sm text-white/50">
            A bill will be produced after the completed application package is
            submitted and validated, then emailed to the submitter with a
            reference copy to KORMA-USA.
          </p>
        </div>
        <span className="w-fit rounded-full border border-korma-gold/25 bg-korma-dark/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-korma-gold">
          Billing placeholder
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex flex-col gap-1 rounded-lg border border-korma-gold/15 bg-korma-dark/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="text-sm font-semibold text-white">
              {service.id === "rank-registration" && selectedDanLevel
                ? `${service.title} - ${selectedDanLevel.label}`
                : service.title}
            </span>
            <span className="text-sm text-korma-gold">
              {service.id === "rank-registration"
                ? selectedDanLevel?.costPlaceholder ?? "Select Dan level"
                : getServiceAmountCents(draft.applicationFlowId, service.id)
                  ? formatUsd(
                      getServiceAmountCents(
                        draft.applicationFlowId,
                        service.id
                      ) ?? 0
                    )
                  : service.pricePlaceholder}
            </span>
          </div>
        ))}
        <div className="flex flex-col gap-1 rounded-lg border border-korma-gold/15 bg-korma-dark/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold text-white">
            Bill sent to
          </span>
          <span className="text-sm text-korma-gold">
            {draft.submitterEmail || "Submitter email required"}
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-korma-gold/15 bg-korma-dark/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold text-white">
            Reference copy
          </span>
          <span className="text-sm text-korma-gold">
            masterclay@kormausa.com
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-dashed border-korma-gold/25 bg-korma-dark/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold text-white">
            Estimated total
          </span>
          <span className="text-sm text-korma-gold">
            {typeof totalAmountCents === "number"
              ? formatUsd(totalAmountCents)
              : "Calculated after remaining pricing is configured"}
          </span>
        </div>
        <div className="rounded-lg border border-korma-gold/20 bg-korma-dark/30 px-4 py-4">
          <div className="text-sm font-semibold text-white">
            Multiple-payment subscription
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <PaymentPlanLine
              label="Down payment"
              value={
                typeof downPayment === "number"
                  ? formatUsd(downPayment)
                  : "10% of approved bill subtotal"
              }
            />
            <PaymentPlanLine
              label="Interest"
              value={
                typeof interest === "number"
                  ? formatUsd(interest)
                  : "5% added to approved bill subtotal"
              }
            />
            <PaymentPlanLine
              label="Subscription balance"
              value={
                typeof subscriptionBalance === "number"
                  ? formatUsd(subscriptionBalance)
                  : "Subtotal + interest - down payment"
              }
            />
            <PaymentPlanLine
              label="Disclosure"
              value="Shown before applicant accepts"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentPlanLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-korma-gold/15 bg-korma-dark/30 px-3 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
        {label}
      </div>
      <div className="mt-1 text-sm text-korma-gold">{value}</div>
    </div>
  );
}

function PlaceholderCard({
  title,
  status,
  fields,
}: {
  title: string;
  status: string;
  fields: string[];
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="font-bold text-white">{title}</h4>
          <p className="mt-1 text-sm text-white/40">
            Fields reserved for the full application workflow.
          </p>
        </div>
        <span className="w-fit rounded-full border border-korma-gold/20 bg-korma-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-korma-gold">
          {status}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field}
            className="rounded-lg border border-dashed border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/45"
          >
            {field}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewStep({
  draft,
  currentFlow,
  readyForReview,
  selectedDanLevel,
  selectedServices,
  selectedArts,
}: {
  draft: ApplicationDraft;
  currentFlow?: ApplicationFlow;
  readyForReview: boolean;
  selectedDanLevel?: ReturnType<typeof getDanLevelCost>;
  selectedServices: ApplicationService[];
  selectedArts: MartialArt[];
}) {
  return (
    <section>
      <SectionHeader
        eyebrow="Step 4"
        title="Review the draft"
        description="This combines the certification intake, KORMA-USA registration, and application details into the package that will be tracked in HubSpot."
      />
      <div className="mt-8 space-y-5">
        <ReviewBlock
          icon={Award}
          title="Certification intake"
          values={[
            currentFlow?.title ? `Flow: ${currentFlow.title}` : "",
            ...selectedServices.map((service) => service?.title ?? ""),
            ...selectedArts.map((art) => art?.title ?? ""),
            draft.certificationProfile.dateOfBirth
              ? `Date of birth: ${draft.certificationProfile.dateOfBirth}`
              : "",
            draft.certificationProfile.nation
              ? `Nation: ${draft.certificationProfile.nation}`
              : "",
            draft.certificationProfile.sex
              ? `Sex: ${draft.certificationProfile.sex}`
              : "",
            draft.certificationProfile.citizenNumber
              ? `Citizen No.: ${draft.certificationProfile.citizenNumber}`
              : "",
            draft.certificationProfile.currentRank
              ? `Current rank: ${draft.certificationProfile.currentRank}`
              : "",
            draft.certificationProfile.currentRankIssueDate
              ? `Issue date: ${draft.certificationProfile.currentRankIssueDate}`
              : "",
            draft.certificationProfile.currentRankNumber
              ? `Rank number: ${draft.certificationProfile.currentRankNumber}`
              : "",
            draft.certificationProfile.yearsTraining
              ? `Years training: ${draft.certificationProfile.yearsTraining}`
              : "",
            draft.certificationProfile.currentOrg
              ? `Organization: ${draft.certificationProfile.currentOrg}`
              : "",
            draft.certificationProfile.instructorName
              ? `Instructor: ${draft.certificationProfile.instructorName}`
              : "",
            draft.certificationProfile.recommenderName
              ? `Recommender: ${draft.certificationProfile.recommenderName}`
              : "",
            draft.certificationProfile.notes
              ? `Notes: ${draft.certificationProfile.notes}`
              : "",
          ].filter(Boolean)}
        />
        <ReviewBlock
          icon={UserCheck}
          title="Registration"
          values={[
            draft.registration.name,
            draft.registration.email,
            draft.registration.phone,
            [
              draft.registration.addressLine1,
              draft.registration.addressLine2,
              draft.registration.city,
              draft.registration.state,
              draft.registration.postalCode,
            ]
              .filter(Boolean)
              .join(", "),
            draft.registration.allowTexts ? "Text permission granted" : "",
            draft.registration.allowEmails ? "Email permission granted" : "",
          ].filter(Boolean)}
        />
        <ReviewBlock
          icon={Mail}
          title="Billing recipient"
          values={[
            draft.submitterName,
            draft.submitterEmail
              ? `Bill sent to ${draft.submitterEmail}`
              : "",
            "Reference copy to masterclay@kormausa.com",
          ].filter(Boolean)}
        />
        <ReviewBlock
          icon={FileText}
          title="Requested services"
          values={selectedServices.map((service) => service?.title ?? "")}
        />
        {draft.selectedServices.includes("rank-registration") && (
          <ReviewBlock
            icon={Award}
            title="Rank registration level"
            values={
              selectedDanLevel
                ? [
                    selectedDanLevel.label,
                    selectedDanLevel.costPlaceholder,
                  ]
                : []
            }
          />
        )}
        <ReviewBlock
          icon={Building2}
          title="School details"
          values={[
            draft.school.schoolName,
            draft.school.schoolType,
            [draft.school.city, draft.school.state].filter(Boolean).join(", "),
          ].filter(Boolean)}
        />
      </div>
      <div
        className={cn(
          "mt-8 rounded-xl border p-5",
          readyForReview
            ? "border-korma-gold/30 bg-korma-gold/10"
            : "border-white/10 bg-white/[0.03]"
        )}
      >
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-korma-gold" />
          <div>
            <h3 className="font-bold text-white">
              {readyForReview
                ? "Draft ready for the next step"
                : "Draft needs more detail"}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-white/55">
              {readyForReview
                ? "The core selections are present. Account verification, required uploads, signatures, and server validation come next."
                : "Select at least one service and complete the required service details before moving forward."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewBlock({
  icon: Icon,
  title,
  values,
}: {
  icon: ElementType;
  title: string;
  values: string[];
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-korma-gold" />
        <h3 className="font-bold text-white">{title}</h3>
      </div>
      {values.length ? (
        <ul className="mt-4 space-y-2">
          {values.map((value) => (
            <li
              key={value}
              className="flex items-center gap-2 text-sm text-white/65"
            >
              <Check className="h-3.5 w-3.5 text-korma-gold" />
              {value}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-white/35">No details added.</p>
      )}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-[0.3em] text-korma-gold">
        {eyebrow}
      </div>
      <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
        {description}
      </p>
    </div>
  );
}

function SummaryGroup({
  title,
  empty,
  values,
}: {
  title: string;
  empty: string;
  values: string[];
}) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-white/35">
        {title}
      </h3>
      {values.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="rounded-full border border-korma-gold/20 bg-korma-gold/10 px-3 py-1 text-xs font-semibold text-korma-gold"
            >
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-white/35">{empty}</p>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
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

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-korma-gold/50";
