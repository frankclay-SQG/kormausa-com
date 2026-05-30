import { NextRequest, NextResponse } from "next/server";

const STRIPE_BASE = "https://api.stripe.com/v1";

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey)
    return NextResponse.json({ error: "Missing Stripe key" }, { status: 500 });

  const { code } = await req.json();
  if (!code?.trim())
    return NextResponse.json({ valid: false, error: "No code provided" });

  // Look up the promotion code by human-readable code string
  const params = new URLSearchParams({
    code: code.trim().toUpperCase(),
    active: "true",
    limit: "1",
  });

  const res = await fetch(`${STRIPE_BASE}/promotion_codes?${params}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("[validate-discount] Stripe error:", err);
    return NextResponse.json({ valid: false, error: "Stripe error" }, { status: 500 });
  }

  const data = await res.json();
  const promo = data.data?.[0];

  if (!promo) {
    return NextResponse.json({ valid: false, error: "Invalid or expired code" });
  }

  const coupon = promo.coupon;

  return NextResponse.json({
    valid: true,
    promotionCodeId: promo.id,
    percentOff: coupon.percent_off ?? null,  // e.g. 20 → 20%
    amountOff: coupon.amount_off ?? null,    // in cents, e.g. 1500 → $15 off
    name: coupon.name ?? code.trim(),
  });
}
