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
  try {
    const token = process.env.HUBSPOT_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Missing HubSpot token" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as {
      name: string;
      address: string;
      phone: string;
      email: string;
      allowTexts: boolean;
      allowEmails: boolean;
      previousExperience: string;
      duplicateConfirmed?: boolean;
    };

    const { firstName, lastName } = splitName(body.name ?? "");
    const headers = createHubSpotHeaders(token);

    const contactResult = await ensureHubSpotContact({
      token,
      firstName,
      lastName,
      email: body.email ?? "",
      phone: body.phone ?? "",
      duplicateConfirmed: body.duplicateConfirmed,
      properties: {
        firstname: firstName,
        lastname: lastName,
        email: body.email ?? "",
        phone: body.phone ?? "",
        address: body.address ?? "",
        korma_inquiry_type: "regular_class",
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

    const detailLines = [
      `Church Hill classes vacation inquiry`,
      `Name: ${body.name}`,
      `Email: ${body.email}`,
      body.phone ? `Phone: ${body.phone}` : null,
      body.address ? `Address: ${body.address}` : null,
      `Text permission: ${body.allowTexts ? "YES" : "NO"}`,
      `Email permission: ${body.allowEmails ? "YES" : "NO"}`,
      body.previousExperience
        ? `Previous martial arts experience: ${body.previousExperience}`
        : "Previous martial arts experience: None provided",
    ]
      .filter(Boolean)
      .join("\n");

    const dealRes = await fetch(`${HS_BASE}/crm/v3/objects/deals`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        properties: {
          dealname: `Church Hill classes - ${body.name || body.email}`,
          pipeline: PIPELINE_ID,
          dealstage: STAGE_ID,
          description: detailLines,
        },
      }),
    });

    if (!dealRes.ok) {
      const detail = await dealRes.text();
      return NextResponse.json(
        { error: "Deal creation failed", detail },
        { status: 500 }
      );
    }

    const dealData = (await dealRes.json()) as { id?: string };
    if (dealData.id) {
      await fetch(
        `${HS_BASE}/crm/v4/objects/deals/${dealData.id}/associations/contacts/${contactResult.contactId}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify([
            { associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 },
          ]),
        }
      );
    }

    return NextResponse.json({
      success: true,
      contactId: contactResult.contactId,
      dealId: dealData.id ?? null,
    });
  } catch (error) {
    console.error("[church-hill-interest] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
