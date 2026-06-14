import { NextRequest, NextResponse } from "next/server";
import {
  createHubSpotHeaders,
  ensureHubSpotContact,
  splitName,
} from "@/lib/hubspot/contacts";

const HS_BASE = "https://api.hubapi.com";
const PIPELINE_ID = "default";
const STAGE_ID = "appointmentscheduled";

export async function POST(req: NextRequest) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token)
    return NextResponse.json({ error: "Missing token" }, { status: 500 });

  const body = await req.json();
  const {
    name,
    email,
    phone,
    certTypes,
    disciplines,
    currentRank,
    yearsTraining,
    currentOrg,
    instructorName,
    schoolName,
    message,
    duplicateConfirmed,
  } = body;

  const headers = createHubSpotHeaders(token);

  // ── 1. Create or resolve contact ─────────────────────────────────────────
  const { firstName, lastName } = splitName(name ?? "");
  const contactResult = await ensureHubSpotContact({
    token,
    firstName,
    lastName,
    email,
    phone: phone ?? "",
    duplicateConfirmed:
      duplicateConfirmed === true || duplicateConfirmed === "true",
    properties: {
      firstname: firstName,
      lastname: lastName,
      email,
      phone: phone ?? "",
      korma_inquiry_type: "certification",
    },
  });

  if (contactResult.status === "potential-duplicate") {
    return NextResponse.json(
      {
        error: "Potential duplicate contact found",
        errorCode: "POTENTIAL_DUPLICATE",
        duplicates: contactResult.duplicates,
      },
      { status: 409 }
    );
  }
  const contactId = contactResult.contactId;

  // ── 2. Build deal description ────────────────────────────────────────────
  const descLines = [
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    Array.isArray(certTypes) && certTypes.length
      ? `Certification Types: ${certTypes.join(", ")}`
      : null,
    Array.isArray(disciplines) && disciplines.length
      ? `Disciplines: ${disciplines.join(", ")}`
      : null,
    currentRank ? `Current Rank: ${currentRank}` : null,
    yearsTraining ? `Years Training: ${yearsTraining}` : null,
    currentOrg ? `Current Org / Lineage: ${currentOrg}` : null,
    instructorName ? `Instructor: ${instructorName}` : null,
    schoolName ? `School Name: ${schoolName}` : null,
    message ? `Notes: ${message}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  // ── 3. Create deal ───────────────────────────────────────────────────────
  const dealRes = await fetch(`${HS_BASE}/crm/v3/objects/deals`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      properties: {
        dealname: `Certification – ${name}`,
        pipeline: PIPELINE_ID,
        dealstage: STAGE_ID,
        description: descLines,
      },
    }),
  });

  if (!dealRes.ok) {
    const err = await dealRes.json();
    return NextResponse.json(
      { error: "Deal creation failed", detail: err },
      { status: 500 }
    );
  }

  const dealData = await dealRes.json();
  const dealId = dealData.id;

  // ── 4. Associate deal ↔ contact ──────────────────────────────────────────
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

  return NextResponse.json({ success: true, contactId, dealId });
}
