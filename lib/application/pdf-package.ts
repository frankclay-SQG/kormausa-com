import {
  getApplicationFlow,
  getDanLevelCost,
  getFlowService,
  getMartialArt,
  getService,
  orderServiceIdsForFlow,
} from "@/lib/application/catalog";
import type { ApplicationDraft } from "@/lib/application/types";
import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
  StandardFonts,
  rgb,
} from "pdf-lib";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const LEFT = 54;
const TOP = 746;
const LINE_HEIGHT = 14;
const MAX_LINE_CHARS = 88;

export function buildApplicationPackagePdf(draft: ApplicationDraft) {
  const lines = buildPackageLines(draft);
  const pages = paginate(lines);
  return createPdf(pages);
}

export async function buildCompletedSourceFormPdfs(
  draft: ApplicationDraft,
  sourceFiles: File[]
) {
  return Promise.all(
    sourceFiles.map(async (sourceFile) => {
      const pdfDoc = await PDFDocument.load(await sourceFile.arrayBuffer(), {
        ignoreEncryption: true,
      });
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      let filledFieldCount = 0;

      fields.forEach((field) => {
        const value = getFieldValue(draft, field.getName());
        if (!value) return;
        if (fillPdfField(field, value)) filledFieldCount += 1;
      });

      if (fields.length > 0) {
        form.updateFieldAppearances(font);
        form.flatten();
      }

      drawSignatureCertification(pdfDoc, draft, font, filledFieldCount);

      const bytes = await pdfDoc.save();
      return {
        fileName: completedFileName(sourceFile.name),
        bytes,
        filledFieldCount,
      };
    })
  );
}

function buildPackageLines(draft: ApplicationDraft) {
  const flow = getApplicationFlow(draft.applicationFlowId);
  const selectedServices = orderServiceIdsForFlow(
    draft.applicationFlowId,
    draft.selectedServices
  )
    .map(
      (serviceId) =>
        getFlowService(draft.applicationFlowId, serviceId) ??
        getService(serviceId)
    )
    .filter(Boolean)
    .map((service) => service?.title ?? "");
  const selectedArts = draft.selectedArts
    .map((artId) => getMartialArt(artId)?.title ?? artId)
    .filter(Boolean);
  const selectedDanLevel = getDanLevelCost(
    draft.rankDanLevelId,
    draft.applicationFlowId
  );

  return [
    "KORMA-USA Completed Application Package",
    `Generated: ${formatDateTime(new Date().toISOString())}`,
    `Application ID: ${draft.id}`,
    "",
    "Submission Path",
    `Flow: ${flow?.title ?? draft.applicationFlowId}`,
    `Requested Services: ${selectedServices.join(", ") || "None selected"}`,
    `Martial Arts: ${selectedArts.join(", ") || "None selected"}`,
    selectedDanLevel ? `Selected Dan Level: ${selectedDanLevel.label}` : null,
    selectedDanLevel ? `Dan Level Cost: ${selectedDanLevel.costPlaceholder}` : null,
    "",
    "Applicant Registration",
    `Name: ${draft.registration.name || "Not provided"}`,
    `Email: ${draft.registration.email || "Not provided"}`,
    `Phone: ${draft.registration.phone || "Not provided"}`,
    `Address: ${formatAddress(draft) || "Not provided"}`,
    draft.registration.formattedAddress
      ? `Validated Address: ${draft.registration.formattedAddress}`
      : null,
    `Text Permission: ${draft.registration.allowTexts ? "Yes" : "No"}`,
    `Email Permission: ${draft.registration.allowEmails ? "Yes" : "No"}`,
    "",
    "Certification Intake",
    `Date of Birth: ${draft.certificationProfile.dateOfBirth || "Not provided"}`,
    `Nation: ${draft.certificationProfile.nation || "Not provided"}`,
    `Sex: ${draft.certificationProfile.sex || "Not provided"}`,
    `Current Rank: ${draft.certificationProfile.currentRank || "Not provided"}`,
    `Current Rank Issue Date: ${draft.certificationProfile.currentRankIssueDate || "Not provided"}`,
    `Current Rank Number: ${draft.certificationProfile.currentRankNumber || "Not provided"}`,
    `Years Training: ${draft.certificationProfile.yearsTraining || "Not provided"}`,
    `Current Organization: ${draft.certificationProfile.currentOrg || "Not provided"}`,
    `Instructor: ${draft.certificationProfile.instructorName || "Not provided"}`,
    `Recommender: ${draft.certificationProfile.recommenderName || "Not provided"}`,
    draft.certificationProfile.notes
      ? `Certification Notes: ${draft.certificationProfile.notes}`
      : null,
    "",
    "School Details",
    `School Name: ${draft.school.schoolName || "Not provided"}`,
    `School Type: ${draft.school.schoolType || "Not provided"}`,
    `School Location: ${[draft.school.city, draft.school.state].filter(Boolean).join(", ") || "Not provided"}`,
    "",
    "Promotion History",
    ...(draft.promotionHistory.some((entry) =>
      [
        entry.artId,
        entry.rankLabel,
        entry.promotionDate,
        entry.certifyingInstructor,
        entry.certifyingOrganization,
        entry.certificateNumber,
      ].some(Boolean)
    )
      ? draft.promotionHistory.flatMap((entry, index) => [
          `Promotion ${index + 1}: ${entry.rankLabel || "Rank not specified"}`,
          `  Art: ${entry.artId ? getMartialArt(entry.artId)?.title ?? entry.artId : "Not provided"}`,
          `  Date: ${entry.promotionDate || "Not provided"}`,
          `  Instructor: ${entry.certifyingInstructor || "Not provided"}`,
          `  Organization: ${entry.certifyingOrganization || "Not provided"}`,
          `  Certificate: ${entry.certificateNumber || "Not provided"}`,
        ])
      : ["No promotion history entered."]),
    "",
    "Testing Eligibility",
    `Target Level: ${getDanLevelCost(draft.testingEligibility.targetDanLevelId)?.label ?? "Not set"}`,
    `Eligible-To-Test Date: ${draft.testingEligibility.eligibleDate || "Not set"}`,
    `Prompt Status: ${draft.testingEligibility.reminderStatus}`,
    `Manual Override: ${draft.testingEligibility.manualOverride ? "Yes" : "No"}`,
    `Entry Above 1st Dan: ${draft.testingEligibility.entryAboveFirst ? "Yes" : "No"}`,
    draft.testingEligibility.notes
      ? `Eligibility Notes: ${draft.testingEligibility.notes}`
      : null,
    "",
    "Documentation Package Update",
    `Status: ${formatPackageStatus(draft.documentationPackage.status)}`,
    draft.documentationPackage.affectedItems
      ? `Affected Items: ${draft.documentationPackage.affectedItems}`
      : null,
    draft.documentationPackage.recoveryAction
      ? `Recovery Action: ${draft.documentationPackage.recoveryAction}`
      : null,
    draft.documentationPackage.replacementSource
      ? `Replacement Source: ${draft.documentationPackage.replacementSource}`
      : null,
    draft.documentationPackage.approverName
      ? `Package Approver: ${draft.documentationPackage.approverName}`
      : null,
    draft.documentationPackage.updatedAt
      ? `Package Update Date: ${draft.documentationPackage.updatedAt}`
      : null,
    draft.documentationPackage.notes
      ? `Package Notes: ${draft.documentationPackage.notes}`
      : null,
    "",
    "Applicant Digital Signature",
    `Typed Name: ${draft.applicantSignature.typedName || "Not signed"}`,
    `Attestation Accepted: ${draft.applicantSignature.attestationAccepted ? "Yes" : "No"}`,
    `Signed At: ${draft.applicantSignature.signedAt ? formatDateTime(draft.applicantSignature.signedAt) : "Not signed"}`,
    "",
    "Approver Digital Signature",
    `Decision: ${formatApproverDecision(draft.approverSignature.decision)}`,
    `Typed Name: ${draft.approverSignature.typedName || "Not signed"}`,
    `Attestation Accepted: ${draft.approverSignature.attestationAccepted ? "Yes" : "No"}`,
    `Signed At: ${draft.approverSignature.signedAt ? formatDateTime(draft.approverSignature.signedAt) : "Not signed"}`,
    draft.approverSignature.notes
      ? `Approval Notes: ${draft.approverSignature.notes}`
      : null,
  ].filter((line): line is string => line !== null);
}

function fillPdfField(field: unknown, value: string) {
  try {
    if (field instanceof PDFTextField) {
      field.setText(value);
      return true;
    }
    if (field instanceof PDFDropdown) {
      field.select(value);
      return true;
    }
    if (field instanceof PDFOptionList) {
      field.select(value);
      return true;
    }
    if (field instanceof PDFRadioGroup) {
      field.select(value);
      return true;
    }
    if (field instanceof PDFCheckBox && isTruthyPdfValue(value)) {
      field.check();
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

function getFieldValue(draft: ApplicationDraft, fieldName: string) {
  const key = normalizeFieldName(fieldName);
  const selectedDanLevel = getDanLevelCost(
    draft.rankDanLevelId,
    draft.applicationFlowId
  );
  const address = formatAddress(draft);
  const signedDate = dateOnly(draft.applicantSignature.signedAt);
  const approverSignedDate = dateOnly(draft.approverSignature.signedAt);
  const packageDate = draft.documentationPackage.updatedAt;
  const requestedServices = orderServiceIdsForFlow(
    draft.applicationFlowId,
    draft.selectedServices
  )
    .map(
      (serviceId) =>
        getFlowService(draft.applicationFlowId, serviceId)?.title ??
        getService(serviceId)?.title ??
        serviceId
    )
    .join(", ");
  const martialArts = draft.selectedArts
    .map((artId) => getMartialArt(artId)?.title ?? artId)
    .join(", ");

  const exactValues: Record<string, string> = {
    name: draft.registration.name,
    fullname: draft.registration.name,
    applicantname: draft.registration.name,
    studentname: draft.registration.name,
    email: draft.registration.email,
    emailaddress: draft.registration.email,
    phone: draft.registration.phone,
    telephone: draft.registration.phone,
    phonenumber: draft.registration.phone,
    address,
    mailingaddress: address,
    city: draft.registration.city,
    state: draft.registration.state,
    zip: draft.registration.postalCode,
    zipcode: draft.registration.postalCode,
    postalcode: draft.registration.postalCode,
    dateofbirth: draft.certificationProfile.dateOfBirth,
    dob: draft.certificationProfile.dateOfBirth,
    birthdate: draft.certificationProfile.dateOfBirth,
    nation: draft.certificationProfile.nation,
    country: draft.certificationProfile.nation,
    sex: draft.certificationProfile.sex,
    gender: draft.certificationProfile.sex,
    currentrank: draft.certificationProfile.currentRank,
    presentrank: draft.certificationProfile.currentRank,
    currentrankissuedate: draft.certificationProfile.currentRankIssueDate,
    rankissuedate: draft.certificationProfile.currentRankIssueDate,
    issuedate: draft.certificationProfile.currentRankIssueDate,
    currentranknumber: draft.certificationProfile.currentRankNumber,
    ranknumber: draft.certificationProfile.currentRankNumber,
    danlevel: selectedDanLevel?.label ?? "",
    applieddan: selectedDanLevel?.label ?? "",
    targetdan: selectedDanLevel?.label ?? "",
    requestedservices: requestedServices,
    martialarts: martialArts,
    art: martialArts,
    school: draft.school.schoolName,
    schoolname: draft.school.schoolName,
    dojang: draft.school.schoolName,
    dojangname: draft.school.schoolName,
    gymnasium: draft.school.schoolName,
    gymnasiumname: draft.school.schoolName,
    schoolcity: draft.school.city,
    schoolstate: draft.school.state,
    organization: draft.certificationProfile.currentOrg,
    currentorganization: draft.certificationProfile.currentOrg,
    lineage: draft.certificationProfile.currentOrg,
    instructor: draft.certificationProfile.instructorName,
    instructorname: draft.certificationProfile.instructorName,
    master: draft.certificationProfile.instructorName,
    mastername: draft.certificationProfile.instructorName,
    recommender: draft.certificationProfile.recommenderName,
    recommendername: draft.certificationProfile.recommenderName,
    yearstraining: draft.certificationProfile.yearsTraining,
    notes: draft.certificationProfile.notes,
    applicantsignature: draft.applicantSignature.typedName,
    studentsignature: draft.applicantSignature.typedName,
    signature: draft.applicantSignature.typedName,
    applicantdate: signedDate,
    signeddate: signedDate,
    signaturedate: signedDate,
    approversignature: draft.approverSignature.typedName,
    approvalsignature: draft.approverSignature.typedName,
    approvername: draft.approverSignature.typedName,
    approvaldate: approverSignedDate,
    approversigneddate: approverSignedDate,
    approvaldecision: formatApproverDecision(draft.approverSignature.decision),
    packagestatus: formatPackageStatus(draft.documentationPackage.status),
    packageupdatedate: packageDate,
    packageapprover: draft.documentationPackage.approverName,
    affecteditems: draft.documentationPackage.affectedItems,
    recoveryaction: draft.documentationPackage.recoveryAction,
    replacementsource: draft.documentationPackage.replacementSource,
  };

  if (exactValues[key]) return exactValues[key];

  const containsValues: Array<[string, string]> = [
    ["applicant", draft.registration.name],
    ["student", draft.registration.name],
    ["birth", draft.certificationProfile.dateOfBirth],
    ["phone", draft.registration.phone],
    ["email", draft.registration.email],
    ["address", address],
    ["ranknumber", draft.certificationProfile.currentRankNumber],
    ["rank", draft.certificationProfile.currentRank],
    ["issuedate", draft.certificationProfile.currentRankIssueDate],
    ["dan", selectedDanLevel?.label ?? ""],
    ["dojang", draft.school.schoolName],
    ["school", draft.school.schoolName],
    ["gymnasium", draft.school.schoolName],
    ["instructor", draft.certificationProfile.instructorName],
    ["master", draft.certificationProfile.instructorName],
    ["recommender", draft.certificationProfile.recommenderName],
    ["organization", draft.certificationProfile.currentOrg],
    ["lineage", draft.certificationProfile.currentOrg],
    ["approver", draft.approverSignature.typedName],
    ["approvaldate", approverSignedDate],
    ["signaturedate", signedDate],
    ["signature", draft.applicantSignature.typedName],
  ];

  return containsValues.find(([token, value]) => key.includes(token) && value)?.[1] ?? "";
}

function drawSignatureCertification(
  pdfDoc: PDFDocument,
  draft: ApplicationDraft,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  filledFieldCount: number
) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  page.drawText("KORMA-USA Digital Signature Certification", {
    x: LEFT,
    y: TOP,
    size: 16,
    font,
    color: rgb(0.06, 0.09, 0.16),
  });

  const lines = [
    `Source form fields completed: ${filledFieldCount}`,
    `Applicant signature: ${draft.applicantSignature.typedName || "Not signed"}`,
    `Applicant signed at: ${
      draft.applicantSignature.signedAt
        ? formatDateTime(draft.applicantSignature.signedAt)
        : "Not signed"
    }`,
    `Applicant attestation accepted: ${
      draft.applicantSignature.attestationAccepted ? "Yes" : "No"
    }`,
    "",
    `Approver decision: ${formatApproverDecision(draft.approverSignature.decision)}`,
    `Approver signature: ${draft.approverSignature.typedName || "Not signed"}`,
    `Approver signed at: ${
      draft.approverSignature.signedAt
        ? formatDateTime(draft.approverSignature.signedAt)
        : "Not signed"
    }`,
    `Approver attestation accepted: ${
      draft.approverSignature.attestationAccepted ? "Yes" : "No"
    }`,
  ].flatMap(wrapLine);

  lines.forEach((line, index) => {
    page.drawText(line, {
      x: LEFT,
      y: TOP - 34 - index * LINE_HEIGHT,
      size: 10,
      font,
      color: rgb(0.12, 0.16, 0.24),
    });
  });
}

function normalizeFieldName(fieldName: string) {
  return fieldName.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isTruthyPdfValue(value: string) {
  return ["yes", "true", "1", "checked", "x"].includes(value.toLowerCase());
}

function dateOnly(value: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

function completedFileName(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1) return `${fileName}-completed.pdf`;
  return `${fileName.slice(0, dotIndex)}-completed${fileName.slice(dotIndex)}`;
}

function paginate(lines: string[]) {
  const wrapped = lines.flatMap(wrapLine);
  const pages: string[][] = [];
  let current: string[] = [];
  const maxLines = Math.floor((TOP - 58) / LINE_HEIGHT);

  for (const line of wrapped) {
    if (current.length >= maxLines) {
      pages.push(current);
      current = [];
    }
    current.push(line);
  }

  if (current.length) pages.push(current);
  return pages.length ? pages : [["KORMA-USA Completed Application Package"]];
}

function wrapLine(line: string) {
  if (!line) return [""];
  const normalized = line.replace(/\s+/g, " ").trim();
  if (normalized.length <= MAX_LINE_CHARS) return [normalized];

  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > MAX_LINE_CHARS && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function createPdf(pages: string[][]) {
  const encoder = new TextEncoder();
  const objects: string[] = [];
  const pageObjectIds: number[] = [];

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("");

  pages.forEach((pageLines) => {
    const pageObjectId = objects.length + 1;
    const contentObjectId = pageObjectId + 1;
    pageObjectIds.push(pageObjectId);
    const stream = buildContentStream(pageLines);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${pages.length * 2 + 3} 0 R >> >> /Contents ${contentObjectId} 0 R >>`
    );
    objects.push(`<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}\nendstream`);
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds
    .map((id) => `${id} 0 R`)
    .join(" ")}] /Count ${pageObjectIds.length} >>`;
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return encoder.encode(pdf);
}

function buildContentStream(lines: string[]) {
  const content = [
    "BT",
    "/F1 10 Tf",
    `${LEFT} ${TOP} Td`,
    "14 TL",
    ...lines.map((line, index) =>
      index === 0 ? `(${escapePdfText(line)}) Tj` : `T* (${escapePdfText(line)}) Tj`
    ),
    "ET",
  ];
  return content.join("\n");
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function formatAddress(draft: ApplicationDraft) {
  return [
    draft.registration.addressLine1,
    draft.registration.addressLine2,
    draft.registration.city,
    draft.registration.state,
    draft.registration.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatPackageStatus(status: ApplicationDraft["documentationPackage"]["status"]) {
  switch (status) {
    case "missing-data":
      return "Missing data";
    case "lost":
      return "Lost package";
    case "restored":
      return "Restored or rebuilt";
    default:
      return "Current";
  }
}

function formatApproverDecision(
  decision: ApplicationDraft["approverSignature"]["decision"]
) {
  switch (decision) {
    case "approved":
      return "Approved";
    case "needs-correction":
      return "Needs correction";
    default:
      return "Pending";
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
