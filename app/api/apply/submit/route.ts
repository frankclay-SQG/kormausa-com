import { NextRequest, NextResponse } from "next/server";
import {
  DAN_LEVEL_COSTS,
  getDanLevelCost,
  getDanTestingRequirement,
  getMartialArt,
  getService,
} from "@/lib/application/catalog";
import type {
  ApplicationServiceId,
  DanLevelId,
  MartialArtId,
} from "@/lib/application/types";
import {
  hasGoogleMapsKey,
  validateGoogleAddress,
} from "@/lib/application/google-address";

const HS_BASE = "https://api.hubapi.com";
const PIPELINE_ID = "default";
const STAGE_ID = "appointmentscheduled";
const MASTER_KEY_ENV = "KORMA_APPLICATION_MASTER_KEY";
const TASK_ASSOCIATION_TYPE_IDS = {
  contacts: 204,
  deals: 216,
} as const;

interface ApplySubmission {
  applicationId?: string;
  registration: RegistrationStatus;
  submitterName: string;
  submitterEmail: string;
  certificationProfile: CertificationProfileStatus;
  selectedServices: ApplicationServiceId[];
  selectedArts: MartialArtId[];
  rankDanLevelId?: DanLevelId | "";
  masterKey?: string;
  schoolName?: string;
  schoolType?: string;
  schoolCity?: string;
  schoolState?: string;
  evidence: RankEvidenceStatus[];
  promotionHistory: PromotionHistoryStatus[];
  testingEligibility: TestingEligibilityStatus;
}

interface RegistrationStatus {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  formattedAddress: string;
  googlePlaceId: string;
  googleMapsUri: string;
  addressValidationStatus:
    | "unverified"
    | "validating"
    | "validated"
    | "needs-review"
    | "not-configured";
  addressValidationMessage: string;
  addressValidatedAt: string;
  phone: string;
  email: string;
  allowTexts: boolean;
  allowEmails: boolean;
}

interface RankEvidenceStatus {
  danLevelId: DanLevelId;
  danLevelLabel: string;
  photoUploaded: boolean;
  photoFileName?: string;
  certificatePdfCount: number;
  certificateFileNames: string[];
}

interface PromotionHistoryStatus {
  artId: MartialArtId | "";
  rankLabel: string;
  promotionDate: string;
  certifyingInstructor: string;
  certifyingOrganization: string;
  certificateNumber: string;
}

interface TestingEligibilityStatus {
  targetDanLevelId: DanLevelId | "";
  eligibleDate: string;
  reminderStatus: "watch" | "eligible" | "not-ready";
  manualOverride: boolean;
  entryAboveFirst: boolean;
  notes: string;
}

interface CertificationProfileStatus {
  currentRank: string;
  yearsTraining: string;
  currentOrg: string;
  instructorName: string;
  notes: string;
}

export async function POST(req: NextRequest) {
  try {
    const submission = await readSubmission(req);
    if (!isRegistrationComplete(submission.registration)) {
      return NextResponse.json(
        { error: "Completed registration and permissions are required" },
        { status: 400 }
      );
    }

    const addressValidationError = await getAddressValidationError(submission);
    if (addressValidationError) {
      return NextResponse.json(
        { error: addressValidationError.error },
        { status: addressValidationError.status }
      );
    }

    const masterOverrideError = getMasterOverrideError(submission);
    if (masterOverrideError) {
      return NextResponse.json(
        { error: masterOverrideError.error },
        { status: masterOverrideError.status }
      );
    }

    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "HubSpot is not configured" },
        { status: 500 }
      );
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const contactId = await createOrFindContact(submission, headers);
    if (!contactId) {
      return NextResponse.json(
        { error: "Could not create or find HubSpot contact" },
        { status: 500 }
      );
    }

    const dealId = await createApplicationDeal(submission, headers);
    if (!dealId) {
      return NextResponse.json(
        { error: "Could not create HubSpot deal" },
        { status: 500 }
      );
    }

    await associateDealWithContact(dealId, contactId, headers);
    const promotionHistoryNoteId = await createPromotionHistoryNote(
      submission,
      contactId,
      headers
    );
    const eligibilityTaskId = await createEligibilityPromptTask(
      submission,
      contactId,
      dealId,
      headers
    );

    return NextResponse.json({
      success: true,
      contactId,
      dealId,
      promotionHistoryNoteId,
      eligibilityTaskId,
      trackedEvidence: submission.evidence,
      trackedPromotionHistory: submission.promotionHistory,
    });
  } catch (error) {
    console.error("Application HubSpot submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function readSubmission(req: NextRequest): Promise<ApplySubmission> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    return readMultipartSubmission(await req.formData());
  }

  const body = (await req.json()) as Partial<ApplySubmission>;
  const registration = normalizeRegistration(body.registration, {
    name: body.submitterName,
    email: body.submitterEmail,
  });
  return {
    applicationId: body.applicationId,
    registration,
    submitterName: registration.name,
    submitterEmail: registration.email,
    certificationProfile: normalizeCertificationProfile(
      body.certificationProfile
    ),
    selectedServices: normalizeArray<ApplicationServiceId>(body.selectedServices),
    selectedArts: normalizeArray<MartialArtId>(body.selectedArts),
    rankDanLevelId: body.rankDanLevelId ?? "",
    masterKey: typeof body.masterKey === "string" ? body.masterKey : "",
    schoolName: body.schoolName,
    schoolType: body.schoolType,
    schoolCity: body.schoolCity,
    schoolState: body.schoolState,
    evidence: normalizeEvidence(body.evidence ?? [], body.rankDanLevelId ?? ""),
    promotionHistory: normalizePromotionHistory(body.promotionHistory ?? []),
    testingEligibility: normalizeTestingEligibility(body.testingEligibility),
  };
}

function readMultipartSubmission(form: FormData): ApplySubmission {
  const rankDanLevelId = getText(form, "rankDanLevelId") as DanLevelId | "";
  const registration = normalizeRegistration(getJson(form, "registration", {}), {
    name: getText(form, "submitterName"),
    email: getText(form, "submitterEmail"),
  });

  return {
    applicationId: getText(form, "applicationId"),
    registration,
    submitterName: registration.name,
    submitterEmail: registration.email,
    certificationProfile: normalizeCertificationProfile(
      getJson(form, "certificationProfile", {})
    ),
    selectedServices: parseFormArray<ApplicationServiceId>(form, "selectedServices"),
    selectedArts: parseFormArray<MartialArtId>(form, "selectedArts"),
    rankDanLevelId,
    masterKey: getText(form, "masterKey"),
    schoolName: getText(form, "schoolName"),
    schoolType: getText(form, "schoolType"),
    schoolCity: getText(form, "schoolCity"),
    schoolState: getText(form, "schoolState"),
    evidence: buildMultipartEvidence(form, rankDanLevelId),
    promotionHistory: normalizePromotionHistory(
      getJson(form, "promotionHistory", [])
    ),
    testingEligibility: normalizeTestingEligibility(
      getJson(form, "testingEligibility", {})
    ),
  };
}

function getMasterOverrideError(submission: ApplySubmission) {
  if (!requiresMasterKey(submission.testingEligibility)) return null;

  const configuredMasterKey = process.env[MASTER_KEY_ENV];
  if (!configuredMasterKey) {
    return {
      status: 503,
      error: "Master key is not configured for reviewer overrides",
    } as const;
  }

  if (submission.masterKey !== configuredMasterKey) {
    return {
      status: 403,
      error: "Master key is required for reviewer overrides",
    } as const;
  }

  return null;
}

function requiresMasterKey(eligibility: TestingEligibilityStatus) {
  return eligibility.manualOverride || eligibility.entryAboveFirst;
}

async function getAddressValidationError(submission: ApplySubmission) {
  if (!hasGoogleMapsKey()) {
    return {
      status: 503,
      error: "Google Maps is not configured for address validation",
    } as const;
  }

  try {
    const result = await validateGoogleAddress(submission.registration);
    if (result.status !== "validated" || !result.normalizedAddress) {
      return {
        status: 400,
        error: "A Google-validated mailing address is required",
      } as const;
    }

    submission.registration = {
      ...submission.registration,
      addressLine1: result.normalizedAddress.addressLine1,
      addressLine2: result.normalizedAddress.addressLine2,
      city: result.normalizedAddress.city,
      state: result.normalizedAddress.state,
      postalCode: result.normalizedAddress.postalCode,
      formattedAddress: result.normalizedAddress.formattedAddress,
      googlePlaceId: result.normalizedAddress.googlePlaceId,
      googleMapsUri:
        result.normalizedAddress.googleMapsUri ??
        submission.registration.googleMapsUri,
      addressValidationStatus: "validated",
      addressValidationMessage: result.message,
      addressValidatedAt: new Date().toISOString(),
    };
    return null;
  } catch (error) {
    console.error("[apply] address validation failed:", error);
    return {
      status: 400,
      error: "A Google-validated mailing address is required",
    } as const;
  }
}

async function createOrFindContact(
  submission: ApplySubmission,
  headers: Record<string, string>
) {
  const nameParts = submission.submitterName.trim().split(" ");
  const firstname = nameParts[0] ?? "";
  const lastname = nameParts.slice(1).join(" ");

  const contactRes = await fetch(`${HS_BASE}/crm/v3/objects/contacts`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      properties: {
        firstname,
        lastname,
        email: submission.submitterEmail,
        phone: submission.registration.phone,
        address: [
          submission.registration.addressLine1,
          submission.registration.addressLine2,
        ]
          .filter(Boolean)
          .join(", "),
        city: submission.registration.city,
        state: submission.registration.state,
        zip: submission.registration.postalCode,
        korma_inquiry_type: "certification",
      },
    }),
  });

  if (contactRes.status === 409) {
    const searchRes = await fetch(`${HS_BASE}/crm/v3/objects/contacts/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: "email",
                operator: "EQ",
                value: submission.submitterEmail,
              },
            ],
          },
        ],
        properties: ["email"],
        limit: 1,
      }),
    });
    const searchData = (await searchRes.json()) as {
      results?: Array<{ id: string }>;
    };
    const contactId = searchData.results?.[0]?.id;
    if (contactId) {
      await updateContactRegistration(contactId, submission, headers);
    }
    return contactId;
  }

  if (!contactRes.ok) return undefined;
  const contact = (await contactRes.json()) as { id?: string };
  return contact.id;
}

async function updateContactRegistration(
  contactId: string,
  submission: ApplySubmission,
  headers: Record<string, string>
) {
  await fetch(`${HS_BASE}/crm/v3/objects/contacts/${contactId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      properties: {
        phone: submission.registration.phone,
        address: [
          submission.registration.addressLine1,
          submission.registration.addressLine2,
        ]
          .filter(Boolean)
          .join(", "),
        city: submission.registration.city,
        state: submission.registration.state,
        zip: submission.registration.postalCode,
        korma_inquiry_type: "certification",
      },
    }),
  });
}

async function createApplicationDeal(
  submission: ApplySubmission,
  headers: Record<string, string>
) {
  const dealRes = await fetch(`${HS_BASE}/crm/v3/objects/deals`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      properties: {
        dealname: `KORMA-USA Application - ${submission.submitterName || submission.submitterEmail}`,
        pipeline: PIPELINE_ID,
        dealstage: STAGE_ID,
        description: buildDealDescription(submission),
      },
    }),
  });

  if (!dealRes.ok) return undefined;
  const deal = (await dealRes.json()) as { id?: string };
  return deal.id;
}

async function associateDealWithContact(
  dealId: string,
  contactId: string,
  headers: Record<string, string>
) {
  await fetch(
    `${HS_BASE}/crm/v4/objects/deals/${dealId}/associations/contacts/${contactId}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify([
        { associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 },
      ]),
    }
  );
}

async function createPromotionHistoryNote(
  submission: ApplySubmission,
  contactId: string,
  headers: Record<string, string>
) {
  const noteRes = await fetch(`${HS_BASE}/engagements/v1/engagements`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      engagement: {
        active: true,
        type: "NOTE",
        timestamp: Date.now(),
      },
      associations: {
        contactIds: [parseInt(contactId, 10)],
      },
      metadata: {
        body: buildPromotionHistoryNote(submission),
      },
    }),
  });

  if (!noteRes.ok) {
    console.error("[apply] promotion history note failed:", await noteRes.text());
    return null;
  }

  const note = (await noteRes.json()) as {
    engagement?: { id?: number | string };
  };
  return note.engagement?.id ?? null;
}

async function createEligibilityPromptTask(
  submission: ApplySubmission,
  contactId: string,
  dealId: string,
  headers: Record<string, string>
) {
  const eligibility = submission.testingEligibility;
  if (!eligibility.eligibleDate && eligibility.reminderStatus !== "eligible") {
    return null;
  }

  const timestamp = eligibility.eligibleDate
    ? new Date(`${eligibility.eligibleDate}T09:00:00`).toISOString()
    : new Date().toISOString();
  const targetDanLevel = getDanLevelCost(eligibility.targetDanLevelId);
  const testingRequirement = getDanTestingRequirement(
    eligibility.targetDanLevelId
  );

  const taskRes = await fetch(`${HS_BASE}/crm/v3/objects/tasks`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      properties: {
        hs_task_subject: `KORMA-USA test eligibility review - ${submission.submitterName || submission.submitterEmail}`,
        hs_task_body: [
          `Review student testing eligibility for ${submission.submitterName || submission.submitterEmail}.`,
          targetDanLevel ? `Target level: ${targetDanLevel.label}` : null,
          testingRequirement
            ? `Default time requirement: ${testingRequirement.description}`
            : null,
          eligibility.eligibleDate
            ? `Eligible-to-test date: ${eligibility.eligibleDate}`
            : null,
          `Status: ${eligibility.reminderStatus}`,
          `Manual override: ${eligibility.manualOverride ? "YES" : "NO"}`,
          `Entry above 1st Dan: ${eligibility.entryAboveFirst ? "YES" : "NO"}`,
          eligibility.notes ? `Notes: ${eligibility.notes}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
        hs_task_status: "NOT_STARTED",
        hs_task_priority: "HIGH",
        hs_timestamp: timestamp,
      },
    }),
  });

  if (!taskRes.ok) {
    console.error("[apply] eligibility task failed:", await taskRes.text());
    return null;
  }

  const task = (await taskRes.json()) as { id?: string };
  if (!task.id) return null;

  await Promise.allSettled([
    associateTask(task.id, "contacts", contactId, headers),
    associateTask(task.id, "deals", dealId, headers),
  ]);

  return task.id;
}

async function associateTask(
  taskId: string,
  objectType: "contacts" | "deals",
  objectId: string,
  headers: Record<string, string>
) {
  await fetch(
    `${HS_BASE}/crm/v4/objects/tasks/${taskId}/associations/${objectType}/${objectId}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify([
        {
          associationCategory: "HUBSPOT_DEFINED",
          associationTypeId: TASK_ASSOCIATION_TYPE_IDS[objectType],
        },
      ]),
    }
  );
}

function buildPromotionHistoryNote(submission: ApplySubmission) {
  const targetDanLevel = getDanLevelCost(
    submission.testingEligibility.targetDanLevelId
  );
  const testingRequirement = getDanTestingRequirement(
    submission.testingEligibility.targetDanLevelId
  );
  return [
    "KORMA-USA Promotion History",
    "",
    `Student: ${submission.submitterName || "Unknown"} <${submission.submitterEmail}>`,
    `Phone: ${submission.registration.phone}`,
    `Address: ${formatRegistrationAddress(submission.registration)}`,
    submission.registration.formattedAddress
      ? `Google Validated Address: ${submission.registration.formattedAddress}`
      : null,
    submission.registration.googlePlaceId
      ? `Google Place ID: ${submission.registration.googlePlaceId}`
      : null,
    submission.registration.googleMapsUri
      ? `Google Maps: ${submission.registration.googleMapsUri}`
      : null,
    `Text Permission: ${submission.registration.allowTexts ? "YES" : "NO"}`,
    `Email Permission: ${submission.registration.allowEmails ? "YES" : "NO"}`,
    "",
    "Certification Intake:",
    submission.selectedServices.length
      ? `Requested Tracks: ${submission.selectedServices
          .map((serviceId) => getService(serviceId)?.title ?? serviceId)
          .join(", ")}`
      : "Requested Tracks: None selected",
    submission.selectedArts.length
      ? `Martial Arts: ${submission.selectedArts
          .map((artId) => getMartialArt(artId)?.title ?? artId)
          .join(", ")}`
      : "Martial Arts: None selected",
    submission.certificationProfile.currentRank
      ? `Current Rank: ${submission.certificationProfile.currentRank}`
      : null,
    submission.certificationProfile.yearsTraining
      ? `Years Training: ${submission.certificationProfile.yearsTraining}`
      : null,
    submission.certificationProfile.currentOrg
      ? `Current Organization: ${submission.certificationProfile.currentOrg}`
      : null,
    submission.certificationProfile.instructorName
      ? `Instructor: ${submission.certificationProfile.instructorName}`
      : null,
    submission.certificationProfile.notes
      ? `Certification Notes: ${submission.certificationProfile.notes}`
      : null,
    "",
    "Promotion History:",
    ...(submission.promotionHistory.length
      ? submission.promotionHistory.map(formatPromotionHistoryLine)
      : ["No prior promotion history submitted"]),
    "",
    "Testing Eligibility:",
    targetDanLevel ? `Target Level: ${targetDanLevel.label}` : null,
    testingRequirement
      ? `Default Time Requirement: ${testingRequirement.description}`
      : null,
    submission.testingEligibility.eligibleDate
      ? `Eligible-To-Test Date: ${submission.testingEligibility.eligibleDate}`
      : "Eligible-To-Test Date: Not set",
    `Prompt Status: ${submission.testingEligibility.reminderStatus}`,
    `Manual Override: ${
      submission.testingEligibility.manualOverride ? "YES" : "NO"
    }`,
    `Entry Above 1st Dan: ${
      submission.testingEligibility.entryAboveFirst ? "YES" : "NO"
    }`,
    submission.testingEligibility.notes
      ? `Eligibility Notes: ${submission.testingEligibility.notes}`
      : null,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function buildDealDescription(submission: ApplySubmission) {
  const selectedDanLevel = getDanLevelCost(submission.rankDanLevelId ?? "");
  const targetDanLevel = getDanLevelCost(
    submission.testingEligibility.targetDanLevelId
  );
  const testingRequirement = getDanTestingRequirement(
    submission.testingEligibility.targetDanLevelId
  );
  const lines = [
    `Application ID: ${submission.applicationId || "Pending"}`,
    `Submitter: ${submission.submitterName || "Unknown"} <${submission.submitterEmail}>`,
    `Phone: ${submission.registration.phone}`,
    `Address: ${formatRegistrationAddress(submission.registration)}`,
    submission.registration.formattedAddress
      ? `Google Validated Address: ${submission.registration.formattedAddress}`
      : null,
    submission.registration.googlePlaceId
      ? `Google Place ID: ${submission.registration.googlePlaceId}`
      : null,
    submission.registration.googleMapsUri
      ? `Google Maps: ${submission.registration.googleMapsUri}`
      : null,
    `Text Permission: ${submission.registration.allowTexts ? "YES" : "NO"}`,
    `Email Permission: ${submission.registration.allowEmails ? "YES" : "NO"}`,
    submission.selectedServices.length
      ? `Requested Tracks: ${submission.selectedServices
          .map((serviceId) => getService(serviceId)?.title ?? serviceId)
          .join(", ")}`
      : null,
    submission.selectedArts.length
      ? `Martial Arts: ${submission.selectedArts
          .map((artId) => getMartialArt(artId)?.title ?? artId)
          .join(", ")}`
      : null,
    submission.certificationProfile.currentRank
      ? `Current Rank: ${submission.certificationProfile.currentRank}`
      : null,
    submission.certificationProfile.yearsTraining
      ? `Years Training: ${submission.certificationProfile.yearsTraining}`
      : null,
    submission.certificationProfile.currentOrg
      ? `Current Organization: ${submission.certificationProfile.currentOrg}`
      : null,
    submission.certificationProfile.instructorName
      ? `Instructor: ${submission.certificationProfile.instructorName}`
      : null,
    submission.certificationProfile.notes
      ? `Certification Notes: ${submission.certificationProfile.notes}`
      : null,
    selectedDanLevel
      ? `Rank Registration Dan Level: ${selectedDanLevel.label}`
      : null,
    selectedDanLevel
      ? `Rank Registration Cost Placeholder: ${selectedDanLevel.costPlaceholder}`
      : null,
    submission.schoolName ? `School: ${submission.schoolName}` : null,
    [submission.schoolCity, submission.schoolState].filter(Boolean).length
      ? `School Location: ${[submission.schoolCity, submission.schoolState]
          .filter(Boolean)
          .join(", ")}`
      : null,
    submission.schoolType ? `School Type: ${submission.schoolType}` : null,
    "",
    "Rank Evidence Tracking:",
    ...submission.evidence.map(formatEvidenceLine),
    "",
    "Promotion History:",
    ...(submission.promotionHistory.length
      ? submission.promotionHistory.map(formatPromotionHistoryLine)
      : ["No prior promotion history submitted"]),
    "",
    "Testing Eligibility Prompt:",
    targetDanLevel ? `Target Level: ${targetDanLevel.label}` : null,
    testingRequirement
      ? `Default Time Requirement: ${testingRequirement.description}`
      : null,
    submission.testingEligibility.eligibleDate
      ? `Eligible-To-Test Date: ${submission.testingEligibility.eligibleDate}`
      : "Eligible-To-Test Date: Not set",
    `Prompt Status: ${submission.testingEligibility.reminderStatus}`,
    `Manual Override: ${
      submission.testingEligibility.manualOverride ? "YES" : "NO"
    }`,
    `Entry Above 1st Dan: ${
      submission.testingEligibility.entryAboveFirst ? "YES" : "NO"
    }`,
    submission.testingEligibility.notes
      ? `Eligibility Notes: ${submission.testingEligibility.notes}`
      : null,
  ];

  return lines.filter((line) => line !== null).join("\n");
}

function formatPromotionHistoryLine(entry: PromotionHistoryStatus) {
  const art = entry.artId ? getMartialArt(entry.artId)?.title ?? entry.artId : "";
  return [
    entry.rankLabel || "Rank not specified",
    art ? `art=${art}` : null,
    entry.promotionDate ? `date=${entry.promotionDate}` : null,
    entry.certifyingInstructor
      ? `instructor=${entry.certifyingInstructor}`
      : null,
    entry.certifyingOrganization
      ? `organization=${entry.certifyingOrganization}`
      : null,
    entry.certificateNumber ? `certificate=${entry.certificateNumber}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function formatEvidenceLine(evidence: RankEvidenceStatus) {
  const certificateNames = evidence.certificateFileNames.length
    ? evidence.certificateFileNames.join(", ")
    : "None";
  return [
    `${evidence.danLevelLabel}:`,
    `photo=${evidence.photoUploaded ? "yes" : "no"}`,
    evidence.photoFileName ? `photoFile=${evidence.photoFileName}` : null,
    `certificatePdfCount=${evidence.certificatePdfCount}`,
    `certificateFiles=${certificateNames}`,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildMultipartEvidence(form: FormData, selectedDanLevelId: DanLevelId | "") {
  return DAN_LEVEL_COSTS.map((level) => {
    const photo = getFirstFile(form, `rankPhoto_${level.id}`);
    const certificates = getFiles(form, `rankCertificates_${level.id}`);
    const selected = selectedDanLevelId === level.id;

    return {
      danLevelId: level.id,
      danLevelLabel: level.label,
      photoUploaded: selected ? Boolean(photo) : false,
      photoFileName: selected && photo ? photo.name : undefined,
      certificatePdfCount: selected ? certificates.length : 0,
      certificateFileNames: selected
        ? certificates.map((certificate) => certificate.name)
        : [],
    };
  }).filter(
    (evidence) =>
      evidence.danLevelId === selectedDanLevelId ||
      evidence.photoUploaded ||
      evidence.certificatePdfCount > 0
  );
}

function normalizeEvidence(
  evidence: ApplySubmission["evidence"],
  selectedDanLevelId: DanLevelId | ""
) {
  if (evidence.length) return evidence;
  const selectedDanLevel = getDanLevelCost(selectedDanLevelId);
  if (!selectedDanLevel) return [];
  return [
    {
      danLevelId: selectedDanLevel.id,
      danLevelLabel: selectedDanLevel.label,
      photoUploaded: false,
      certificatePdfCount: 0,
      certificateFileNames: [],
    },
  ];
}

function normalizeCertificationProfile(
  profile: unknown
): CertificationProfileStatus {
  const value =
    profile && typeof profile === "object"
      ? (profile as Partial<CertificationProfileStatus>)
      : {};

  return {
    currentRank:
      typeof value.currentRank === "string" ? value.currentRank : "",
    yearsTraining:
      typeof value.yearsTraining === "string" ? value.yearsTraining : "",
    currentOrg: typeof value.currentOrg === "string" ? value.currentOrg : "",
    instructorName:
      typeof value.instructorName === "string" ? value.instructorName : "",
    notes: typeof value.notes === "string" ? value.notes : "",
  };
}

function normalizePromotionHistory(value: unknown): PromotionHistoryStatus[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is Partial<PromotionHistoryStatus> => {
      return Boolean(entry) && typeof entry === "object";
    })
    .map((entry) => ({
      artId:
        typeof entry.artId === "string"
          ? (entry.artId as MartialArtId | "")
          : "",
      rankLabel: typeof entry.rankLabel === "string" ? entry.rankLabel : "",
      promotionDate:
        typeof entry.promotionDate === "string" ? entry.promotionDate : "",
      certifyingInstructor:
        typeof entry.certifyingInstructor === "string"
          ? entry.certifyingInstructor
          : "",
      certifyingOrganization:
        typeof entry.certifyingOrganization === "string"
          ? entry.certifyingOrganization
          : "",
      certificateNumber:
        typeof entry.certificateNumber === "string"
          ? entry.certificateNumber
          : "",
    }))
    .filter((entry) => {
      return [
        entry.artId,
        entry.rankLabel,
        entry.promotionDate,
        entry.certifyingInstructor,
        entry.certifyingOrganization,
        entry.certificateNumber,
      ].some(Boolean);
    });
}

function normalizeTestingEligibility(value: unknown): TestingEligibilityStatus {
  const source =
    value && typeof value === "object"
      ? (value as Partial<TestingEligibilityStatus>)
      : {};
  const reminderStatus =
    source.reminderStatus === "eligible" ||
    source.reminderStatus === "not-ready" ||
    source.reminderStatus === "watch"
      ? source.reminderStatus
      : "watch";

  return {
    targetDanLevelId:
      typeof source.targetDanLevelId === "string"
        ? (source.targetDanLevelId as DanLevelId | "")
        : "",
    eligibleDate:
      typeof source.eligibleDate === "string" ? source.eligibleDate : "",
    reminderStatus,
    manualOverride: source.manualOverride === true,
    entryAboveFirst: source.entryAboveFirst === true,
    notes: typeof source.notes === "string" ? source.notes : "",
  };
}

function normalizeRegistration(
  value: unknown,
  fallback: { name?: string; email?: string } = {}
): RegistrationStatus {
  const source =
    value && typeof value === "object" ? (value as Partial<RegistrationStatus>) : {};

  return {
    name:
      typeof source.name === "string"
        ? source.name
        : fallback.name ?? "",
    addressLine1:
      typeof source.addressLine1 === "string" ? source.addressLine1 : "",
    addressLine2:
      typeof source.addressLine2 === "string" ? source.addressLine2 : "",
    city: typeof source.city === "string" ? source.city : "",
    state: typeof source.state === "string" ? source.state : "",
    postalCode:
      typeof source.postalCode === "string" ? source.postalCode : "",
    formattedAddress:
      typeof source.formattedAddress === "string"
        ? source.formattedAddress
        : "",
    googlePlaceId:
      typeof source.googlePlaceId === "string" ? source.googlePlaceId : "",
    googleMapsUri:
      typeof source.googleMapsUri === "string" ? source.googleMapsUri : "",
    addressValidationStatus:
      source.addressValidationStatus === "validated" ||
      source.addressValidationStatus === "needs-review" ||
      source.addressValidationStatus === "not-configured" ||
      source.addressValidationStatus === "validating" ||
      source.addressValidationStatus === "unverified"
        ? source.addressValidationStatus
        : "unverified",
    addressValidationMessage:
      typeof source.addressValidationMessage === "string"
        ? source.addressValidationMessage
        : "",
    addressValidatedAt:
      typeof source.addressValidatedAt === "string"
        ? source.addressValidatedAt
        : "",
    phone: typeof source.phone === "string" ? source.phone : "",
    email:
      typeof source.email === "string"
        ? source.email
        : fallback.email ?? "",
    allowTexts: source.allowTexts === true,
    allowEmails: source.allowEmails === true,
  };
}

function isRegistrationComplete(registration: RegistrationStatus) {
  return Boolean(
    registration.name.trim() &&
      registration.addressLine1.trim() &&
      registration.city.trim() &&
      registration.state.trim() &&
      registration.postalCode.trim() &&
      registration.addressValidationStatus === "validated" &&
      registration.phone.trim() &&
      isValidEmail(registration.email) &&
      registration.allowTexts &&
      registration.allowEmails
  );
}

function formatRegistrationAddress(registration: RegistrationStatus) {
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

function parseFormArray<T extends string>(form: FormData, key: string) {
  const all = form.getAll(key).filter((value): value is string => {
    return typeof value === "string" && value.length > 0;
  });
  if (all.length > 1) return all as T[];
  if (!all.length) return [];

  try {
    const parsed = JSON.parse(all[0]) as unknown;
    return normalizeArray<T>(parsed);
  } catch {
    return all[0].split(",").map((value) => value.trim()).filter(Boolean) as T[];
  }
}

function normalizeArray<T extends string>(value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is T => typeof item === "string");
}

function getJson<T>(form: FormData, key: string, fallback: T): T {
  const value = form.get(key);
  if (typeof value !== "string") return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getText(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

function getFirstFile(form: FormData, key: string) {
  return getFiles(form, key)[0];
}

function getFiles(form: FormData, key: string) {
  return form.getAll(key).filter((value): value is File => {
    return value instanceof File && value.size > 0;
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
