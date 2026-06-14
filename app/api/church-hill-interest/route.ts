import { NextRequest, NextResponse } from "next/server";
import {
  hasGoogleMapsKey,
  validateGoogleAddress,
} from "@/lib/application/google-address";
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
      phone: string;
      email: string;
      allowTexts: boolean;
      allowEmails: boolean;
      previousExperience: string;
      duplicateConfirmed?: boolean;
      address?: {
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        formattedAddress?: string;
        googlePlaceId?: string;
        googleMapsUri?: string;
      };
    };

    if (!hasGoogleMapsKey()) {
      return NextResponse.json(
        { error: "Google Maps address validation is not configured" },
        { status: 503 }
      );
    }

    const addressValidation = await validateGoogleAddress({
      addressLine1: body.address?.addressLine1 ?? "",
      addressLine2: body.address?.addressLine2 ?? "",
      city: body.address?.city ?? "",
      state: body.address?.state ?? "",
      postalCode: body.address?.postalCode ?? "",
      googlePlaceId: body.address?.googlePlaceId ?? "",
    });

    if (addressValidation.status !== "validated") {
      return NextResponse.json(
        {
          error:
            addressValidation.message ||
            "A Google-validated mailing address is required",
        },
        { status: 400 }
      );
    }

    const normalizedAddress = addressValidation.normalizedAddress;
    const formattedAddress =
      normalizedAddress?.formattedAddress ??
      [
        normalizedAddress?.addressLine1 ?? body.address?.addressLine1 ?? "",
        normalizedAddress?.addressLine2 ?? body.address?.addressLine2 ?? "",
        normalizedAddress?.city ?? body.address?.city ?? "",
        normalizedAddress?.state ?? body.address?.state ?? "",
        normalizedAddress?.postalCode ?? body.address?.postalCode ?? "",
      ]
        .filter(Boolean)
        .join(", ");

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
        address: normalizedAddress?.addressLine1 ?? body.address?.addressLine1 ?? "",
        city: normalizedAddress?.city ?? body.address?.city ?? "",
        state: normalizedAddress?.state ?? body.address?.state ?? "",
        zip: normalizedAddress?.postalCode ?? body.address?.postalCode ?? "",
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
      formattedAddress ? `Address: ${formattedAddress}` : null,
      normalizedAddress?.googlePlaceId
        ? `Google Place ID: ${normalizedAddress.googlePlaceId}`
        : body.address?.googlePlaceId
          ? `Google Place ID: ${body.address.googlePlaceId}`
          : null,
      body.address?.googleMapsUri
        ? `Google Maps: ${body.address.googleMapsUri}`
        : null,
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
