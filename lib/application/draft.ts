import type {
  ApplicationDraft,
  ApplicationFlowId,
  ApplicationServiceId,
  DanLevelId,
  MartialArtId,
  ApplicationRegistration,
  PromotionHistoryEntry,
} from "@/lib/application/types";

const DEFAULT_DRAFT_ID = "local-application-draft";

export function createApplicationDraft(
  overrides: Partial<ApplicationDraft> = {}
): ApplicationDraft {
  return {
    id: DEFAULT_DRAFT_ID,
    status: "new",
    applicationFlowId: "standard",
    registration: {
      name: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "VA",
      postalCode: "",
      formattedAddress: "",
      googlePlaceId: "",
      googleMapsUri: "",
      addressValidationStatus: "unverified",
      addressValidationMessage: "",
      addressValidatedAt: "",
      phone: "",
      email: "",
      allowTexts: false,
      allowEmails: false,
    },
    submitterName: "",
    submitterEmail: "",
    certificationProfile: {
      dateOfBirth: "",
      nation: "",
      sex: "",
      citizenNumber: "",
      currentRank: "",
      currentRankIssueDate: "",
      currentRankNumber: "",
      yearsTraining: "",
      currentOrg: "",
      instructorName: "",
      recommenderName: "",
      notes: "",
    },
    selectedServices: [],
    selectedArts: [],
    rankDanLevelId: "",
    promotionHistory: [createPromotionHistoryEntry()],
    testingEligibility: {
      targetDanLevelId: "",
      eligibleDate: "",
      reminderStatus: "watch",
      manualOverride: false,
      entryAboveFirst: false,
      notes: "",
    },
    credentials: [],
    school: {
      schoolName: "",
      schoolType: "",
      city: "",
      state: "VA",
      artsTaught: [],
    },
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function toggleService(
  draft: ApplicationDraft,
  serviceId: ApplicationServiceId
): ApplicationDraft {
  const exists = draft.selectedServices.includes(serviceId);
  return markUpdated({
    ...draft,
    status: "draft",
    selectedServices: exists
      ? draft.selectedServices.filter((id) => id !== serviceId)
      : [...draft.selectedServices, serviceId],
  });
}

export function selectApplicationFlow(
  draft: ApplicationDraft,
  flowId: ApplicationFlowId
): ApplicationDraft {
  return markUpdated({
    ...draft,
    status: "draft",
    applicationFlowId: flowId,
  });
}

export function toggleArt(
  draft: ApplicationDraft,
  artId: MartialArtId
): ApplicationDraft {
  const exists = draft.selectedArts.includes(artId);
  return markUpdated({
    ...draft,
    status: "draft",
    selectedArts: exists
      ? draft.selectedArts.filter((id) => id !== artId)
      : [...draft.selectedArts, artId],
    school: {
      ...draft.school,
      artsTaught: exists
        ? draft.school.artsTaught.filter((id) => id !== artId)
        : Array.from(new Set([...draft.school.artsTaught, artId])),
    },
  });
}

export function isDraftReadyForReview(draft: ApplicationDraft) {
  if (!isRegistrationComplete(draft.registration)) return false;
  if (draft.selectedServices.length === 0) return false;
  if (!isValidSubmitterEmail(draft.submitterEmail)) return false;
  if (
    draft.selectedServices.includes("school-registration") &&
    !draft.school.schoolName.trim()
  ) {
    return false;
  }
  if (
    draft.selectedServices.includes("rank-registration") ||
    draft.selectedServices.includes("instructor-certification")
  ) {
    if (
      draft.selectedServices.includes("rank-registration") &&
      !draft.rankDanLevelId
    ) {
      return false;
    }
    return draft.selectedArts.length > 0;
  }
  return true;
}

export function isRegistrationComplete(registration: ApplicationRegistration) {
  return Boolean(
    registration.name.trim() &&
      registration.addressLine1.trim() &&
      registration.city.trim() &&
      registration.state.trim() &&
      registration.postalCode.trim() &&
      
      registration.phone.trim() &&
      isValidSubmitterEmail(registration.email) &&
      registration.allowTexts &&
      registration.allowEmails
  );
}

export function selectRankDanLevel(
  draft: ApplicationDraft,
  danLevelId: DanLevelId
): ApplicationDraft {
  return markUpdated({
    ...draft,
    status: "draft",
    rankDanLevelId: danLevelId,
  });
}

export function createPromotionHistoryEntry(): PromotionHistoryEntry {
  return {
    id: `promotion-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 7)}`,
    artId: "",
    rankLabel: "",
    promotionDate: "",
    certifyingInstructor: "",
    certifyingOrganization: "",
    certificateNumber: "",
  };
}

export function updateSubmitter(
  draft: ApplicationDraft,
  field: "submitterName" | "submitterEmail",
  value: string
): ApplicationDraft {
  return markUpdated({
    ...draft,
    status: "draft",
    [field]: value,
  });
}

export function updateRegistration(
  draft: ApplicationDraft,
  field: keyof ApplicationRegistration,
  value: string | boolean
): ApplicationDraft {
  const shouldResetAddressValidation = [
    "addressLine1",
    "addressLine2",
    "city",
    "state",
    "postalCode",
  ].includes(field);
  const registration = {
    ...draft.registration,
    [field]: value,
    ...(shouldResetAddressValidation
      ? {
          formattedAddress: "",
          googlePlaceId: "",
          googleMapsUri: "",
          addressValidationStatus: "unverified" as const,
          addressValidationMessage: "",
          addressValidatedAt: "",
        }
      : {}),
  };

  return markUpdated({
    ...draft,
    status: "draft",
    registration,
    submitterName: registration.name,
    submitterEmail: registration.email,
  });
}

export function markUpdated(draft: ApplicationDraft): ApplicationDraft {
  return {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
}

function isValidSubmitterEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
