import { NextRequest, NextResponse } from "next/server";
import {
  createHubSpotHeaders,
  ensureHubSpotContact,
  splitName,
} from "@/lib/hubspot/contacts";

const HS_BASE = "https://api.hubapi.com";
const STRIPE_BASE = "https://api.stripe.com/v1";

const PROGRAM_UNIT_AMOUNTS_CENTS: Record<string, number> = {
  test: 50,
  taekwondo: 15000,
  hapkido: 15000,
  kumdo: 15000,
  "seminar-individual": 7500,
};

// Set NEXT_PUBLIC_BASE_URL in Vercel env vars (e.g. https://kormausa.com)
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://kormausa.com");

export async function POST(req: NextRequest) {
  const hsToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!hsToken)
    return NextResponse.json({ error: "Missing HubSpot token" }, { status: 500 });

  const body = await req.json();
  const {
    programId,
    programLabel,
    programType,
    inquiryType,
    name,
    email,
    phone,
    dateOfBirth,
    participants,
    message,
    promotionCodeId,   // ← optional: validated Stripe promo code ID
    duplicateConfirmed,
  }: {
    programId: string;
    programLabel: string;
    programType: "free" | "payment" | "quote";
    inquiryType: string;
    name: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    participants: string;
    message: string;
    promotionCodeId?: string | null;
    duplicateConfirmed?: boolean;
  } = body;

  const headers = createHubSpotHeaders(hsToken);

  if (!dateOfBirth?.trim()) {
    return NextResponse.json(
      { error: "Date of birth is required" },
      { status: 400 }
    );
  }

  // ── 1. Create or resolve HubSpot contact ────────────────────────────────
  const { firstName, lastName } = splitName(name);
  const contactResult = await ensureHubSpotContact({
    token: hsToken,
    firstName,
    lastName,
    email,
    phone: phone ?? "",
    duplicateConfirmed,
    properties: {
      firstname: firstName,
      lastname: lastName,
      email,
      phone: phone ?? "",
      korma_date_of_birth: dateOfBirth ?? "",
      korma_inquiry_type: inquiryType,
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

  // ── 2. Free trial or quote → HubSpot deal + no Stripe ───────────────────
  if (programType === "free" || programType === "quote") {
    await createHubSpotDeal(headers, {
      name,
      programLabel,
      inquiryType,
      contactId,
      amount: 0,
      dateOfBirth,
    });

    if (programType === "free") {
      return NextResponse.json({
        type: "free",
        meetingUrl: "https://meetings-na2.hubspot.com/frank-clay",
      });
    }
    return NextResponse.json({ type: "quote" });
  }

  // ── 3. Paid → Stripe Checkout Session ────────────────────────────────────
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey)
    return NextResponse.json({ error: "Missing Stripe key" }, { status: 500 });

  const qty =
    programId === "seminar-individual"
      ? Math.max(1, parseInt(participants || "1", 10))
      : 1;
  const unitAmountCents = PROGRAM_UNIT_AMOUNTS_CENTS[programId];

  if (!unitAmountCents) {
    return NextResponse.json(
      { error: "Invalid paid program selected" },
      { status: 400 }
    );
  }

  const stripeParams = new URLSearchParams();
  stripeParams.append(
    "success_url",
    `${BASE_URL}/enroll/success?session_id={CHECKOUT_SESSION_ID}`
  );
  stripeParams.append("cancel_url", `${BASE_URL}/enroll/cancel`);
  stripeParams.append("mode", "payment");
  stripeParams.append("customer_email", email);
  stripeParams.append("client_reference_id", contactId);
  stripeParams.append("line_items[0][price_data][currency]", "usd");
  stripeParams.append(
    "line_items[0][price_data][product_data][name]",
    programLabel
  );
  stripeParams.append(
    "line_items[0][price_data][product_data][description]",
    `KORMA-USA – ${programLabel}`
  );
  stripeParams.append(
    "line_items[0][price_data][unit_amount]",
    String(unitAmountCents)
  );
  stripeParams.append("line_items[0][quantity]", String(qty));
  stripeParams.append("metadata[hubspot_contact_id]", contactId);
  stripeParams.append("metadata[program_id]", programId);
  stripeParams.append("metadata[inquiry_type]", inquiryType);
  stripeParams.append("metadata[date_of_birth]", dateOfBirth);

  // Apply promo code if provided; otherwise allow Stripe to show a code field
  if (promotionCodeId) {
    stripeParams.append("discounts[0][promotion_code]", promotionCodeId);
  } else {
    stripeParams.append("allow_promotion_codes", "true");
  }

  const stripeRes = await fetch(`${STRIPE_BASE}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: stripeParams.toString(),
  });

  if (!stripeRes.ok) {
    const err = await stripeRes.json();
    return NextResponse.json(
      { error: "Stripe session failed", detail: err },
      { status: 500 }
    );
  }

  const session = await stripeRes.json();
  return NextResponse.json({ type: "stripe", sessionUrl: session.url });
}

// ── Helper: create HubSpot deal + associate with contact ──────────────────
async function createHubSpotDeal(
  headers: Record<string, string>,
  opts: {
    name: string;
    programLabel: string;
    inquiryType: string;
    contactId: string;
    amount: number;
    dateOfBirth: string;
  }
) {
  const dealRes = await fetch(`${HS_BASE}/crm/v3/objects/deals`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      properties: {
        dealname: `Enrollment – ${opts.programLabel} – ${opts.name}`,
        pipeline: "default",
        dealstage: "appointmentscheduled",
        amount: opts.amount > 0 ? String(opts.amount / 100) : "0",
        description: opts.dateOfBirth
          ? `Date of Birth: ${opts.dateOfBirth}`
          : undefined,
      },
    }),
  });
  if (!dealRes.ok) return;

  const deal = await dealRes.json();
  const dealId = deal.id;
  if (!dealId) return;

  await fetch(
    `${HS_BASE}/crm/v4/objects/deals/${dealId}/associations/contacts/${opts.contactId}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify([
        { associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 },
      ]),
    }
  );
}
