import { NextRequest, NextResponse } from "next/server";

const HS_BASE = "https://api.hubapi.com";
const STRIPE_BASE = "https://api.stripe.com/v1";

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
    priceInCents,
    inquiryType,
    name,
    email,
    phone,
    participants,
    message,
    promotionCodeId,   // ← optional: validated Stripe promo code ID
  }: {
    programId: string;
    programLabel: string;
    programType: "free" | "payment" | "quote";
    priceInCents: number;
    inquiryType: string;
    name: string;
    email: string;
    phone: string;
    participants: string;
    message: string;
    promotionCodeId?: string | null;
  } = body;

  const headers = {
    Authorization: `Bearer ${hsToken}`,
    "Content-Type": "application/json",
  };

  // ── 1. Create or find HubSpot contact ───────────────────────────────────
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
        korma_inquiry_type: inquiryType,
      },
    }),
  });

  if (contactRes.status === 409) {
    const searchRes = await fetch(`${HS_BASE}/crm/v3/objects/contacts/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        filterGroups: [
          { filters: [{ propertyName: "email", operator: "EQ", value: email }] },
        ],
        properties: ["email", "korma_inquiry_type"],
        limit: 1,
      }),
    });
    const searchData = await searchRes.json();
    contactId = searchData.results?.[0]?.id;
    if (!contactId)
      return NextResponse.json({ error: "Contact lookup failed" }, { status: 500 });
    await fetch(`${HS_BASE}/crm/v3/objects/contacts/${contactId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ properties: { korma_inquiry_type: inquiryType } }),
    });
  } else if (!contactRes.ok) {
    const err = await contactRes.json();
    return NextResponse.json(
      { error: "Contact creation failed", detail: err },
      { status: 500 }
    );
  } else {
    contactId = (await contactRes.json()).id;
  }

  // ── 2. Free trial or quote → HubSpot deal + no Stripe ───────────────────
  if (programType === "free" || programType === "quote") {
    await createHubSpotDeal(headers, {
      name,
      programLabel,
      inquiryType,
      contactId,
      amount: 0,
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
    String(priceInCents)
  );
  stripeParams.append("line_items[0][quantity]", String(qty));
  stripeParams.append("metadata[hubspot_contact_id]", contactId);
  stripeParams.append("metadata[program_id]", programId);
  stripeParams.append("metadata[inquiry_type]", inquiryType);

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
