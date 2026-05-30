import { NextRequest, NextResponse } from "next/server";

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
  } = body;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // ── 1. Create or find contact ────────────────────────────────────────────
  let contactId: string;

  const contactRes = await fetch(`${HS_BASE}/crm/v3/objects/contacts`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      properties: {
        firstname: name.split(" ")[0] ?? name,
        lastname: name.split(" ").slice(1).join(" ") ?? "",
        email,
        phone: phone ?? "",
        korma_inquiry_type: "certification",
      },
    }),
  });

  if (contactRes.status === 409) {
    // Duplicate email — look up existing contact
    const searchRes = await fetch(
      `${HS_BASE}/crm/v3/objects/contacts/search`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                { propertyName: "email", operator: "EQ", value: email },
              ],
            },
          ],
          properties: ["email", "korma_inquiry_type"],
          limit: 1,
        }),
      }
    );
    const searchData = await searchRes.json();
    contactId = searchData.results?.[0]?.id;
    if (!contactId)
      return NextResponse.json(
        { error: "Contact lookup failed" },
        { status: 500 }
      );
    // Patch inquiry type on existing contact
    await fetch(`${HS_BASE}/crm/v3/objects/contacts/${contactId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        properties: { korma_inquiry_type: "certification" },
      }),
    });
  } else if (!contactRes.ok) {
    const err = await contactRes.json();
    return NextResponse.json(
      { error: "Contact creation failed", detail: err },
      { status: 500 }
    );
  } else {
    const contactData = await contactRes.json();
    contactId = contactData.id;
  }

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
