import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const HS_BASE = "https://api.hubapi.com";

/** Verify Stripe webhook signature without the stripe npm package */
function verifyStripeSignature(
  rawBody: string,
  sigHeader: string,
  secret: string
): boolean {
  const parts = sigHeader.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.split("=")[1];
  const v1 = parts.find((p) => p.startsWith("v1="))?.split("=")[1];
  if (!timestamp || !v1) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(v1, "hex")
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Misconfigured" }, { status: 500 });
  }

  // Read raw body for signature verification
  const rawBody = await req.text();
  const sigHeader = req.headers.get("stripe-signature") ?? "";

  if (!verifyStripeSignature(rawBody, sigHeader, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    type: string;
    data: { object: Record<string, unknown> };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Handle checkout.session.completed ─────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id: string;
      client_reference_id?: string;
      customer_email?: string;
      amount_total?: number;
      payment_status?: string;
      metadata?: Record<string, string>;
    };

    const contactId =
      session.client_reference_id ?? session.metadata?.hubspot_contact_id;
    const programId = session.metadata?.program_id ?? "enrollment";
    const amountTotal = session.amount_total ?? 0;

    if (contactId && session.payment_status === "paid") {
      await syncPaidEnrollmentToHubSpot(contactId, programId, amountTotal);
    } else {
      console.warn(
        "[stripe-webhook] checkout.session.completed without contactId or not paid:",
        session.id
      );
    }
  }

  return NextResponse.json({ received: true });
}

/** Create a closed-won deal in HubSpot and associate it with the contact */
async function syncPaidEnrollmentToHubSpot(
  contactId: string,
  programId: string,
  amountCents: number
) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) return;

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const dealRes = await fetch(`${HS_BASE}/crm/v3/objects/deals`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      properties: {
        dealname: `Stripe Payment – ${programId} – Contact ${contactId}`,
        pipeline: "default",
        dealstage: "closedwon",
        amount: String(amountCents / 100),
      },
    }),
  });

  if (!dealRes.ok) {
    console.error(
      "[stripe-webhook] HubSpot deal creation failed:",
      await dealRes.text()
    );
    return;
  }

  const deal = await dealRes.json();
  const dealId = deal.id;
  if (!dealId) return;

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
