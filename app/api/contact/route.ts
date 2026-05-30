import { NextRequest, NextResponse } from "next/server";

const HS_BASE = "https://api.hubapi.com";
const PIPELINE_ID = "default";
const STAGE_ID = "appointmentscheduled"; // "New Inquiry"

function hsHeaders() {
  return {
    Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

// Map interest values → korma_inquiry_type enum value
const INQUIRY_TYPE_MAP: Record<string, string> = {
  taekwondo: "regular_class",
  hapkido: "regular_class",
  taichi: "regular_class",
  kumdo: "regular_class",
  "seminar-corporate": "seminar",
  "seminar-individual": "seminar",
};

// Human-readable labels for deal name
const INTEREST_LABEL: Record<string, string> = {
  taekwondo: "Taekwondo",
  hapkido: "Hapkido",
  taichi: "Tai Chi",
  kumdo: "KumDo",
  "seminar-corporate": "Corporate Seminar",
  "seminar-individual": "Individual Seminar",
  general: "General Inquiry",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      interest,
      message,
      experience,
      schedule,
      organization,
      groupSize,
      preferredDate,
    } = body as Record<string, string>;

    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!token) {
      console.error("HUBSPOT_ACCESS_TOKEN not set");
      return NextResponse.json(
        { error: "Server not configured" },
        { status: 500 }
      );
    }

    // ── 1. Create contact (handle duplicate 409) ──────────────────────────
    const nameParts = (name ?? "").trim().split(" ");
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ");

    const inquiryType = INQUIRY_TYPE_MAP[interest] ?? null;

    const contactProps: Record<string, string> = {
      firstname: firstName,
      lastname: lastName,
      email,
      phone: phone ?? "",
    };
    if (inquiryType) contactProps.korma_inquiry_type = inquiryType;

    let contactId: string | undefined;

    const createContactRes = await fetch(`${HS_BASE}/crm/v3/objects/contacts`, {
      method: "POST",
      headers: hsHeaders(),
      body: JSON.stringify({ properties: contactProps }),
    });

    if (createContactRes.status === 409) {
      // Contact already exists — find by email
      const searchRes = await fetch(
        `${HS_BASE}/crm/v3/objects/contacts/search`,
        {
          method: "POST",
          headers: hsHeaders(),
          body: JSON.stringify({
            filterGroups: [
              {
                filters: [
                  { propertyName: "email", operator: "EQ", value: email },
                ],
              },
            ],
            properties: ["hs_object_id"],
            limit: 1,
          }),
        }
      );
      const searchData = (await searchRes.json()) as {
        results?: Array<{ id: string }>;
      };
      contactId = searchData.results?.[0]?.id;

      // Update inquiry type on existing contact if applicable
      if (contactId && inquiryType) {
        await fetch(
          `${HS_BASE}/crm/v3/objects/contacts/${contactId}`,
          {
            method: "PATCH",
            headers: hsHeaders(),
            body: JSON.stringify({
              properties: { korma_inquiry_type: inquiryType },
            }),
          }
        );
      }
    } else {
      const contactData = (await createContactRes.json()) as { id?: string };
      contactId = contactData.id;
    }

    if (!contactId) {
      return NextResponse.json(
        { error: "Could not create or locate contact" },
        { status: 500 }
      );
    }

    // ── 2. Build deal description from all submitted fields ───────────────
    const interestLabel = INTEREST_LABEL[interest] ?? interest ?? "General";
    const lines: string[] = [
      `Inquiry from: ${name} <${email}>`,
    ];
    if (phone) lines.push(`Phone: ${phone}`);
    if (interest) lines.push(`Interest: ${interestLabel}`);
    if (experience) lines.push(`Experience Level: ${experience}`);
    if (schedule) lines.push(`Preferred Schedule: ${schedule}`);
    if (organization) lines.push(`Organization: ${organization}`);
    if (groupSize) lines.push(`Group Size: ${groupSize}`);
    if (preferredDate) lines.push(`Preferred Date: ${preferredDate}`);
    if (message) lines.push(`\nMessage:\n${message}`);
    const description = lines.join("\n");

    // ── 3. Create deal ────────────────────────────────────────────────────
    const dealName = `${name} — ${interestLabel} Inquiry`;

    const createDealRes = await fetch(`${HS_BASE}/crm/v3/objects/deals`, {
      method: "POST",
      headers: hsHeaders(),
      body: JSON.stringify({
        properties: {
          dealname: dealName,
          pipeline: PIPELINE_ID,
          dealstage: STAGE_ID,
          description,
        },
      }),
    });

    const dealData = (await createDealRes.json()) as { id?: string; message?: string };
    const dealId = dealData.id;

    if (!dealId) {
      console.error("Deal creation failed:", dealData);
      return NextResponse.json(
        { error: "Could not create deal" },
        { status: 500 }
      );
    }

    // ── 4. Associate deal ↔ contact (HUBSPOT_DEFINED type 3) ──────────────
    await fetch(
      `${HS_BASE}/crm/v4/objects/deals/${dealId}/associations/contacts/${contactId}/batch/create`,
      {
        method: "POST",
        headers: hsHeaders(),
        body: JSON.stringify({
          inputs: [
            { associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 },
          ],
        }),
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
