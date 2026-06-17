/**
 * /app/api/wkmaf/checkout/route.ts
 *
 * Creates a Stripe Checkout Session for a WKMAF certification application.
 * Pricing is TBD — amounts are left as 0 (billing will be configured later).
 *
 * Required Vercel environment variables:
 * STRIPE_SECRET_KEY — Stripe secret key (sk_live_... or sk_test_...)
 * NEXT_PUBLIC_BASE_URL — e.g. https://kormausa.com
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// WKMAF pricing mirrors WHMAF (WHMAF HQ list × 1.30), amounts in cents
const DAN_PRICES_CENTS = [0, 9100, 11700, 15600, 19500, 39000, 45500, 58500, 65000, 78000];
const INSTRUCTOR_PRICE_CENTS = 39000;
const CHARTER_PRICE_CENTS = 39000;

const DAN_RANK_LABELS = [
  '', '1st Dan', '2nd Dan', '3rd Dan', '4th Dan',
  '5th Dan', '6th Dan', '7th Dan', '8th Dan', '9th Dan',
];

interface CheckoutPayload {
  ref: string;
  email: string;
  fullName: string;
  certs: { d: boolean; i: boolean; s: boolean };
  appliedRank?: string;
}

export async function POST(req: NextRequest) {
  try {
    const payload: CheckoutPayload = await req.json();

    if (!payload.email || !payload.ref) {
      return NextResponse.json({ error: 'email and ref are required' }, { status: 400 });
    }

    if (!payload.certs.d && !payload.certs.i && !payload.certs.s) {
      return NextResponse.json({ error: 'No certifications selected' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://kormausa.com';
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    // Dan Certification
    if (payload.certs.d) {
      const rank = parseInt(payload.appliedRank || '0');
      const amount = DAN_PRICES_CENTS[rank] || 0;
      if (amount > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: `WKMAF Dan Certification — ${DAN_RANK_LABELS[rank] || `${rank}th Dan`}`,
              description: 'World Kumdo Martial Arts Federation certification fee',
            },
            unit_amount: amount,
          },
          quantity: 1,
        });
      }
    }

    // Instructor Certification
    if (payload.certs.i && INSTRUCTOR_PRICE_CENTS > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'WKMAF Instructor Certification',
            description: 'World Kumdo Martial Arts Federation certification fee',
          },
          unit_amount: INSTRUCTOR_PRICE_CENTS,
        },
        quantity: 1,
      });
    }

    // School Charter
    if (payload.certs.s && CHARTER_PRICE_CENTS > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'WKMAF School Charter / Organization Registration',
            description: 'World Kumdo Martial Arts Federation registration fee',
          },
          unit_amount: CHARTER_PRICE_CENTS,
        },
        quantity: 1,
      });
    }

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'No billable items — pricing not yet configured' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: payload.email,
      line_items: lineItems,
      metadata: {
        wkmaf_ref: payload.ref,
        applicant_name: payload.fullName,
      },
      success_url: `${baseUrl}/applications/wkmaf/?payment=success&ref=${encodeURIComponent(payload.ref)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/applications/wkmaf/?payment=cancelled&ref=${encodeURIComponent(payload.ref)}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[WKMAF checkout]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
