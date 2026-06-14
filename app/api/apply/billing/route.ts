import { NextRequest, NextResponse } from "next/server";
import {
  REFERENCE_BILLING_EMAIL,
  buildApplicationBill,
  buildBillingHtml,
  buildBillingSubject,
  isValidBillingEmail,
  type BillingRequest,
} from "@/lib/application/billing";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<BillingRequest>;
    const submitterEmail = body.submitterEmail?.trim() ?? "";

    if (!isValidBillingEmail(submitterEmail)) {
      return NextResponse.json(
        { error: "A valid submitter email is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.selectedServices) || !body.selectedServices.length) {
      return NextResponse.json(
        { error: "At least one selected service is required" },
        { status: 400 }
      );
    }

    const bill = buildApplicationBill({
      applicationId: body.applicationId,
      submitterEmail,
      submitterName: body.submitterName,
      selectedServices: body.selectedServices,
      rankDanLevelId: body.rankDanLevelId,
    });
    const subject = buildBillingSubject(bill);
    const html = buildBillingHtml(bill);
    const apiKey = process.env.RESEND_API_KEY;
    const from =
      process.env.BILLING_EMAIL_FROM ?? "KORMA-USA <billing@kormausa.com>";

    if (!apiKey) {
      return NextResponse.json(
        {
          success: true,
          configured: false,
          message:
            "Billing email backend is prepared, but RESEND_API_KEY is not configured.",
          to: bill.submitterEmail,
          cc: REFERENCE_BILLING_EMAIL,
          subject,
          bill,
        },
        { status: 202 }
      );
    }

    const resendResponse = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [bill.submitterEmail],
        cc: [REFERENCE_BILLING_EMAIL],
        subject,
        html,
      }),
    });

    const data = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      return NextResponse.json(
        {
          error: "Billing email could not be sent",
          detail: data,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      configured: true,
      to: bill.submitterEmail,
      cc: REFERENCE_BILLING_EMAIL,
      subject,
      bill,
      email: data,
    });
  } catch (error) {
    console.error("Application billing email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
