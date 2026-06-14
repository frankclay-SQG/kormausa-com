import { NextRequest, NextResponse } from "next/server";
import {
  createHubSpotHeaders,
  ensureHubSpotContact,
} from "@/lib/hubspot/contacts";

const HS_BASE = "https://api.hubapi.com";

export async function POST(req: NextRequest) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token)
    return NextResponse.json({ error: "Missing token" }, { status: 500 });

  const body = await req.json();
  const {
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    emergencyContactName,
    emergencyContactPhone,
    guardianName,
    guardianEmail,
    guardianSignature,
    photoConsent,
    signatureName,
    signatureDate,
    isMinor,
    duplicateConfirmed,
  } = body;

  const headers = createHubSpotHeaders(token);

  // ── 1. Create or resolve contact ─────────────────────────────────────────
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
      korma_date_of_birth: dateOfBirth ?? "",
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

  // ── 2. Build waiver note body ───────────────────────────────────────────
  const noteBody = [
    `╔${"═".repeat(47)}╗`,
    `  KORMA-USA LIABILITY WAIVER — SIGNED`,
    `╚${"═".repeat(47)}╝`,
    ``,
    `PARTICIPANT`,
    `  Name:  ${firstName} ${lastName}`,
    `  Email: ${email}`,
    phone ? `  Phone: ${phone}` : null,
    dateOfBirth ? `  DOB:   ${dateOfBirth}` : null,
    isMinor ? `  Status: MINOR — Guardian signature on file` : null,
    ``,
    `EMERGENCY CONTACT`,
    `  Name:  ${emergencyContactName}`,
    `  Phone: ${emergencyContactPhone}`,
    isMinor ? `` : null,
    isMinor ? `PARENT / GUARDIAN` : null,
    isMinor && guardianName ? `  Guardian Name:      ${guardianName}` : null,
    isMinor && guardianEmail ? `  Guardian Email:     ${guardianEmail}` : null,
    isMinor && guardianSignature
      ? `  Guardian Signature: ${guardianSignature}`
      : null,
    ``,
    `ELECTRONIC SIGNATURE`,
    `  Signed by: ${isMinor ? guardianSignature : signatureName}`,
    `  Date:      ${signatureDate}`,
    `  Photo/Video Consent: ${photoConsent ? "YES — Granted" : "NO — Not granted"}`,
    `  Agreed to Terms: YES`,
    ``,
    `Legal basis: Virginia Uniform Electronic Transactions Act`,
    `            Va. Code §§ 59.1-479 through 59.1-497`,
  ]
    .filter((v) => v !== null)
    .join("\n");

  // ── 3. Create engagement note (associates with contact in one call) ───────
  const engagementRes = await fetch(
    `${HS_BASE}/engagements/v1/engagements`,
    {
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
          body: noteBody,
        },
      }),
    }
  );

  if (!engagementRes.ok) {
    // Non-fatal — contact was created; note attachment failed
    console.error(
      "[waiver] engagement note failed:",
      await engagementRes.text()
    );
  }

  const engagementData = engagementRes.ok
    ? await engagementRes.json()
    : null;

  return NextResponse.json({
    success: true,
    contactId,
    engagementId: engagementData?.engagement?.id ?? null,
  });
}
