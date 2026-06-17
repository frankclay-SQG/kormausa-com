import { NextRequest, NextResponse } from "next/server";
import {
  CMK_INSTRUCTOR_TIERS,
  getCMKDanLevel,
  getCMKService,
  getDanTestingRequirement,
  deriveCMKInstructorTier,
} from "@/lib/changmookwan/catalog";
// CMK_DAN_LEVELS not imported — unused in this file
import type {
  CMKCertificationProfile,
  CMKDanLevelId,
  CMKPromotionEntry,
  CMKServiceId,
  CMKInstructorTier,
  CMKTestingEligibility,
} from "@/lib/changmookwan/types";
import {
  createHubSpotHeaders,
  ensureHubSpotContact,
  type HubSpotDuplicateCandidate,
} from "@/lib/hubspot/contacts";

const HS_BASE = "https://api.hubapi.com";
const PIPELINE_ID = "default";
const STAGE_ID = "appointmentscheduled";
const TASK_ASSOCIATION_TYPE_IDS = {
  contacts: 204,
  deals: 216,
} as const;

// ── Submission shape ──────────────────────────────────────────────────────

interface CMKSubmission {
  // Step 1
  selectedServices: CMKServiceId[];
  danLevelId: CMKDanLevelId | "";
  instructorTier: CMKInstructorTier | "";
  // Personal info
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  sex: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  allowTexts: boolean;
  allowEmails: boolean;
  // Dojang Registration (form 1)
  organizationName: string;
  masterName: string;
  masterDateOfBirth: string;
  dojangAddress: string;
  dojangPhone: string;
  dojangEmail: string;
  // Instructor Application (form 2)
  danCertNumber: string;
  danCertIssueDate: string;
  recommendingDojang: string;
  photoAttached: boolean;
  // Promotion Test (form 3)
  currentGrade: string;
  currentCertNumber: string;
  currentCertDate: string;
  targetDanLevelId: CMKDanLevelId | "";
  recommenderCountry: string;
  recommenderAssociation: string;
  recommenderName: string;
  recommenderAddress: string;
  recommenderCertOrDob: string;
  recommenderContact: string;
  promotionPhotoAttached: boolean;
  // New fields
  certificationProfile: CMKCertificationProfile;
  promotionHistory: CMKPromotionEntry[];
  testingEligibility: CMKTestingEligibility;
  masterKey: string;
  // Google Maps fields
  formattedAddress: string;
  googlePlaceId: string;
  googleMapsUri: string;
  addressValidationStatus: string;
  // Duplicate handling
  duplicateConfirmed?: boolean;
}

class PotentialDuplicateError extends Error {
  constructor(public duplicates: HubSpotDuplicateCandidate[]) {
    super("Potential duplicate contact found");
  }
}

// ── POST handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<CMKSubmission>;
    const submission = normalizeSubmission(body);

    if (!isPersonalInfoComplete(submission)) {
      return NextResponse.json(
        { error: "Required personal information is missing" },
        { status: 400 }
      );
    }

    if (submission.selectedServices.length === 0) {
      return NextResponse.json(
        { error: "At least one service must be selected" },
        { status: 400 }
      );
    }

    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "HubSpot is not configured" },
        { status: 500 }
      );
    }

    const headers = createHubSpotHeaders(token);
    const fullName = buildFullName(submission);

    // Upsert contact
    const contactResult = await ensureHubSpotContact({
      token,
      firstName: submission.firstName,
      lastName: [submission.middleName, submission.lastName]
        .filter(Boolean)
        .join(" "),
      email: submission.email,
      phone: submission.phone,
      duplicateConfirmed: submission.duplicateConfirmed,
      properties: buildContactProperties(submission, fullName),
    });

    if (contactResult.status === "potential-duplicate") {
      throw new PotentialDuplicateError(contactResult.duplicates);
    }

    const contactId = contactResult.contactId;

    // Create deal
    const dealId = await createDeal(submission, fullName, headers);
    if (!dealId) {
      return NextResponse.json(
        { error: "Could not create HubSpot deal" },
        { status: 500 }
      );
    }

    await associateDealWithContact(dealId, contactId, headers);

    // Detailed note
    const noteId = await createDetailNote(submission, fullName, contactId, headers);

    // Eligibility task if rank selected
    const taskId = await maybeCreateEligibilityTask(
      submission,
      fullName,
      contactId,
      dealId,
      headers
    );

    return NextResponse.json({
      success: true,
      contactId,
      dealId,
      noteId,
      taskId,
    });
  } catch (error) {
    if (error instanceof PotentialDuplicateError) {
      return NextResponse.json(
        {
          error: "Potential duplicate contact found",
          errorCode: "POTENTIAL_DUPLICATE",
          duplicates: error.duplicates,
        },
        { status: 409 }
      );
    }
    console.error("[changmookwan/submit] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Deal ──────────────────────────────────────────────────────────────────

async function createDeal(
  s: CMKSubmission,
  fullName: string,
  headers: Record<string, string>
) {
  const res = await fetch(`${HS_BASE}/crm/v3/objects/deals`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      properties: {
        dealname: `WT Changmookwan Application – ${fullName || s.email}`,
        pipeline: PIPELINE_ID,
        dealstage: STAGE_ID,
        description: buildDealDescription(s, fullName),
      },
    }),
  });

  if (!res.ok) {
    console.error("[changmookwan/submit] deal create failed:", await res.text());
    return undefined;
  }

  const data = (await res.json()) as { id?: string };
  return data.id;
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

// ── Note ──────────────────────────────────────────────────────────────────

async function createDetailNote(
  s: CMKSubmission,
  fullName: string,
  contactId: string,
  headers: Record<string, string>
) {
  const res = await fetch(`${HS_BASE}/engagements/v1/engagements`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      engagement: { active: true, type: "NOTE", timestamp: Date.now() },
      associations: { contactIds: [parseInt(contactId, 10)] },
      metadata: { body: buildDetailNote(s, fullName) },
    }),
  });

  if (!res.ok) {
    console.error("[changmookwan/submit] note failed:", await res.text());
    return null;
  }

  const data = (await res.json()) as { engagement?: { id?: number | string } };
  return data.engagement?.id ?? null;
}

// ── Eligibility task ──────────────────────────────────────────────────────

async function maybeCreateEligibilityTask(
  s: CMKSubmission,
  fullName: string,
  contactId: string,
  dealId: string,
  headers: Record<string, string>
) {
  const targetId =
    s.selectedServices.includes("rank-registration") ? s.targetDanLevelId : "";
  if (!targetId) return null;

  const targetLevel = getCMKDanLevel(targetId);
  const res = await fetch(`${HS_BASE}/crm/v3/objects/tasks`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      properties: {
        hs_task_subject: `WT Changmookwan promotion review – ${fullName || s.email}`,
        hs_task_body: [
          `Review promotion test eligibility for ${fullName || s.email}.`,
          targetLevel ? `Target level: ${targetLevel.label}` : null,
          s.currentGrade ? `Current grade: ${s.currentGrade}` : null,
          s.currentCertNumber ? `Current cert #: ${s.currentCertNumber}` : null,
          s.currentCertDate ? `Current cert date: ${s.currentCertDate}` : null,
          s.recommenderName ? `Recommender: ${s.recommenderName}` : null,
          s.recommenderAssociation
            ? `Recommender's dojang: ${s.recommenderAssociation}`
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
        hs_task_status: "NOT_STARTED",
        hs_task_priority: "HIGH",
        hs_timestamp: new Date().toISOString(),
      },
    }),
  });

  if (!res.ok) {
    console.error("[changmookwan/submit] task failed:", await res.text());
    return null;
  }

  const task = (await res.json()) as { id?: string };
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

// ── Content builders ──────────────────────────────────────────────────────

function buildContactProperties(
  s: CMKSubmission,
  fullName: string
): Record<string, string> {
  return {
    firstname: s.firstName,
    lastname: [s.middleName, s.lastName].filter(Boolean).join(" "),
    email: s.email,
    phone: s.phone,
    address: [s.addressLine1, s.addressLine2].filter(Boolean).join(", "),
    city: s.city,
    state: s.state,
    zip: s.postalCode,
    korma_inquiry_type: "wtc-certification",
  };
}

function buildDealDescription(s: CMKSubmission, fullName: string): string {
  const services = s.selectedServices
    .map((id) => getCMKService(id)?.title ?? id)
    .join(", ");
  const danLevel = getCMKDanLevel(s.danLevelId);
  const targetLevel = getCMKDanLevel(s.targetDanLevelId);
  const tierDef = CMK_INSTRUCTOR_TIERS.find((t) => t.id === s.instructorTier);

  return [
    "WT Changmookwan Application",
    "",
    `Applicant: ${fullName || "Unknown"} <${s.email}>`,
    `Phone: ${s.phone}`,
    `Address: ${formatAddress(s)}`,
    `Nationality: ${s.nationality}`,
    s.sex ? `Sex: ${s.sex}` : null,
    s.dateOfBirth ? `Date of Birth: ${s.dateOfBirth}` : null,
    "",
    `Services Requested: ${services || "None"}`,
    danLevel ? `Selected Dan Level: ${danLevel.label}` : null,
    danLevel ? `Cost Placeholder: ${danLevel.costPlaceholder}` : null,
    tierDef ? `Instructor Tier: ${tierDef.formLabel}` : null,
    "",
    // Dojang registration
    ...(s.selectedServices.includes("dojang-registration")
      ? [
          "── Dojang Registration ──",
          `Organisation: ${s.organizationName}`,
          `Master: ${s.masterName}`,
          s.masterDateOfBirth ? `Master DOB: ${s.masterDateOfBirth}` : null,
          s.dojangAddress ? `Dojang Address: ${s.dojangAddress}` : null,
          s.dojangPhone ? `Dojang Phone: ${s.dojangPhone}` : null,
          s.dojangEmail ? `Dojang Email: ${s.dojangEmail}` : null,
          "",
        ]
      : []),
    // Instructor application
    ...(s.selectedServices.includes("instructor-certification")
      ? [
          "── Instructor Application ──",
          tierDef ? `Applied For: ${tierDef.formLabel}` : null,
          danLevel ? `Dan Level: ${danLevel.label}` : null,
          s.danCertNumber ? `Dan Cert #: ${s.danCertNumber}` : null,
          s.danCertIssueDate ? `Cert Issue Date: ${s.danCertIssueDate}` : null,
          s.recommendingDojang ? `Recommending Dojang: ${s.recommendingDojang}` : null,
          `Photo Attached: ${s.photoAttached ? "Yes" : "No"}`,
          "",
        ]
      : []),
    // Promotion test
    ...(s.selectedServices.includes("rank-registration")
      ? [
          "── Promotion Test ──",
          targetLevel ? `Target Level: ${targetLevel.label}` : null,
          s.currentGrade ? `Current Grade: ${s.currentGrade}` : null,
          s.currentCertNumber ? `Current Cert #: ${s.currentCertNumber}` : null,
          s.currentCertDate ? `Current Cert Date: ${s.currentCertDate}` : null,
          s.recommenderName ? `Recommender: ${s.recommenderName}` : null,
          s.recommenderAssociation
            ? `Recommender's Dojang: ${s.recommenderAssociation}`
            : null,
          s.recommenderCountry ? `Recommender Country: ${s.recommenderCountry}` : null,
          s.recommenderAddress
            ? `Recommender Address: ${s.recommenderAddress}`
            : null,
          s.recommenderContact
            ? `Recommender Contact: ${s.recommenderContact}`
            : null,
          s.recommenderCertOrDob
            ? `Recommender Cert/DOB: ${s.recommenderCertOrDob}`
            : null,
          `Photo Attached: ${s.promotionPhotoAttached ? "Yes" : "No"}`,
          "",
        ]
      : []),
    // Certification profile
    "── Certification Profile ──",
    s.certificationProfile.currentRank ? `Current Rank: ${s.certificationProfile.currentRank}` : null,
    s.certificationProfile.yearsTraining ? `Years Training: ${s.certificationProfile.yearsTraining}` : null,
    s.certificationProfile.currentOrg ? `Current Org: ${s.certificationProfile.currentOrg}` : null,
    s.certificationProfile.instructorName ? `Instructor: ${s.certificationProfile.instructorName}` : null,
    s.certificationProfile.notes ? `Profile Notes: ${s.certificationProfile.notes}` : null,
    "",
    `Text Permission: ${s.allowTexts ? "YES" : "NO"}`,
    `Email Permission: ${s.allowEmails ? "YES" : "NO"}`,
    s.formattedAddress ? `Validated Address: ${s.formattedAddress}` : null,
    s.addressValidationStatus ? `Address Validation: ${s.addressValidationStatus}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function buildDetailNote(s: CMKSubmission, fullName: string): string {
  const sections: string[] = [
    `WT Changmookwan – Full Application Detail`,
    "",
    buildDealDescription(s, fullName),
  ];

  // Promotion history
  if (s.promotionHistory.length > 0) {
    sections.push("", "── Promotion History ──");
    s.promotionHistory.forEach((entry, index) => {
      sections.push(
        `Entry ${index + 1}:`,
        entry.rankLabel ? `  Rank: ${entry.rankLabel}` : "  Rank: (not specified)",
        entry.promotionDate ? `  Date: ${entry.promotionDate}` : "",
        entry.certifyingInstructor ? `  Instructor: ${entry.certifyingInstructor}` : "",
        entry.certifyingOrganization ? `  Organization: ${entry.certifyingOrganization}` : "",
        entry.certificateNumber ? `  Cert #: ${entry.certificateNumber}` : "",
      );
    });
  }

  // Testing eligibility
  const elig = s.testingEligibility;
  if (elig.targetDanLevelId || elig.eligibleDate || elig.notes) {
    const targetLevel = getCMKDanLevel(elig.targetDanLevelId);
    const testingReq = getDanTestingRequirement(elig.targetDanLevelId);
    sections.push(
      "",
      "── Testing Eligibility ──",
      targetLevel ? `Target Dan: ${targetLevel.label}` : "",
      testingReq ? `Default Requirement: ${testingReq.description}` : "",
      elig.eligibleDate ? `Eligible-To-Test Date: ${elig.eligibleDate}` : "",
      `Prompt Status: ${elig.reminderStatus}`,
      elig.manualOverride ? "Manual Override: YES" : "",
      elig.entryAboveFirst ? "Entry Above First Dan: YES" : "",
      elig.notes ? `Eligibility Notes: ${elig.notes}` : "",
    );
  }

  return sections.filter((l) => l !== null && l !== undefined).join("\n");
}

// ── Normalization ─────────────────────────────────────────────────────────

function normalizeSubmission(body: Partial<CMKSubmission>): CMKSubmission {
  const danLevelId = str(body.danLevelId) as CMKDanLevelId | "";
  // Auto-derive tier if not supplied
  const instructorTier =
    (str(body.instructorTier) as CMKInstructorTier | "") ||
    (deriveCMKInstructorTier(danLevelId) as CMKInstructorTier | "");

  return {
    selectedServices: normalizeArray<CMKServiceId>(body.selectedServices),
    danLevelId,
    instructorTier,
    firstName: str(body.firstName),
    middleName: str(body.middleName),
    lastName: str(body.lastName),
    dateOfBirth: str(body.dateOfBirth),
    nationality: str(body.nationality),
    sex: str(body.sex),
    email: str(body.email),
    phone: str(body.phone),
    addressLine1: str(body.addressLine1),
    addressLine2: str(body.addressLine2),
    city: str(body.city),
    state: str(body.state),
    postalCode: str(body.postalCode),
    allowTexts: body.allowTexts === true,
    allowEmails: body.allowEmails === true,
    organizationName: str(body.organizationName),
    masterName: str(body.masterName),
    masterDateOfBirth: str(body.masterDateOfBirth),
    dojangAddress: str(body.dojangAddress),
    dojangPhone: str(body.dojangPhone),
    dojangEmail: str(body.dojangEmail),
    danCertNumber: str(body.danCertNumber),
    danCertIssueDate: str(body.danCertIssueDate),
    recommendingDojang: str(body.recommendingDojang),
    photoAttached: body.photoAttached === true,
    currentGrade: str(body.currentGrade),
    currentCertNumber: str(body.currentCertNumber),
    currentCertDate: str(body.currentCertDate),
    targetDanLevelId: str(body.targetDanLevelId) as CMKDanLevelId | "",
    recommenderCountry: str(body.recommenderCountry),
    recommenderAssociation: str(body.recommenderAssociation),
    recommenderName: str(body.recommenderName),
    recommenderAddress: str(body.recommenderAddress),
    recommenderCertOrDob: str(body.recommenderCertOrDob),
    recommenderContact: str(body.recommenderContact),
    promotionPhotoAttached: body.promotionPhotoAttached === true,
    certificationProfile: normalizeCertProfile(body.certificationProfile),
    promotionHistory: normalizePromotionHistory(body.promotionHistory),
    testingEligibility: normalizeTestingEligibility(body.testingEligibility),
    masterKey: str(body.masterKey),
    formattedAddress: str(body.formattedAddress),
    googlePlaceId: str(body.googlePlaceId),
    googleMapsUri: str(body.googleMapsUri),
    addressValidationStatus: str(body.addressValidationStatus),
    duplicateConfirmed: body.duplicateConfirmed === true,
  };
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeArray<T extends string>(value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is T => typeof v === "string");
}

function normalizeCertProfile(v: unknown): CMKCertificationProfile {
  const d = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return {
    currentRank: str(d.currentRank),
    yearsTraining: str(d.yearsTraining),
    currentOrg: str(d.currentOrg),
    instructorName: str(d.instructorName),
    notes: str(d.notes),
  };
}

function normalizePromotionHistory(v: unknown): CMKPromotionEntry[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((e): e is Record<string, unknown> => e && typeof e === "object")
    .map((e) => ({
      id: str(e.id) || `entry-${Date.now()}`,
      rankLabel: str(e.rankLabel),
      promotionDate: str(e.promotionDate),
      certifyingInstructor: str(e.certifyingInstructor),
      certifyingOrganization: str(e.certifyingOrganization),
      certificateNumber: str(e.certificateNumber),
    }));
}

function normalizeTestingEligibility(v: unknown): CMKTestingEligibility {
  const d = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const reminderStatus = str(d.reminderStatus);
  return {
    targetDanLevelId: str(d.targetDanLevelId) as CMKDanLevelId | "",
    eligibleDate: str(d.eligibleDate),
    reminderStatus: (["watch", "eligible", "not-ready"].includes(reminderStatus)
      ? reminderStatus
      : "watch") as CMKTestingEligibility["reminderStatus"],
    manualOverride: d.manualOverride === true,
    entryAboveFirst: d.entryAboveFirst === true,
    notes: str(d.notes),
  };
}

function isPersonalInfoComplete(s: CMKSubmission): boolean {
  return Boolean(
    s.firstName.trim() &&
      s.lastName.trim() &&
      s.email.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email) &&
      s.phone.trim() &&
      s.addressLine1.trim() &&
      s.city.trim() &&
      s.state.trim() &&
      s.postalCode.trim()
  );
}

function buildFullName(s: CMKSubmission): string {
  return [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ");
}

function formatAddress(s: CMKSubmission): string {
  return [s.addressLine1, s.addressLine2, s.city, s.state, s.postalCode]
    .filter(Boolean)
    .join(", ");
}
