import { NextRequest, NextResponse } from "next/server";
import {
  type BirthdayContact,
  buildBirthdayDigestHtml,
  buildBirthdayDigestText,
  filterBirthdaysForMonth,
  getBirthdayDigestFrom,
  getBirthdayDigestRecipient,
  getBirthdayDigestSubject,
  getMonthWindow,
  normalizeBirthdayRecord,
} from "@/lib/birthdays";

const HUBSPOT_BASE = "https://api.hubapi.com";
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const BIRTHDAY_PROPERTIES = [
  "firstname",
  "lastname",
  "email",
  "phone",
  "korma_date_of_birth",
  "date_of_birth",
];

interface HubSpotSearchPage {
  results?: Array<{
    id: string;
    properties?: Record<string, string>;
  }>;
  paging?: {
    next?: {
      after?: string;
    };
  };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hubSpotToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!hubSpotToken) {
    return NextResponse.json(
      { error: "Missing HubSpot token" },
      { status: 500 }
    );
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json(
      { error: "Missing RESEND_API_KEY" },
      { status: 500 }
    );
  }

  try {
    const monthWindow = getMonthWindow({});
    const contacts = await fetchBirthdayContacts(hubSpotToken);
    const birthdays = filterBirthdaysForMonth(contacts, monthWindow.monthNumber);
    const subject = getBirthdayDigestSubject({
      monthLabel: monthWindow.monthLabel,
      count: birthdays.length,
    });

    const resendResponse = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getBirthdayDigestFrom(),
        to: [getBirthdayDigestRecipient()],
        subject,
        html: buildBirthdayDigestHtml({
          monthLabel: monthWindow.monthLabel,
          birthdays,
        }),
        text: buildBirthdayDigestText({
          monthLabel: monthWindow.monthLabel,
          birthdays,
        }),
      }),
    });

    const resendData = await resendResponse.json().catch(() => ({}));
    if (!resendResponse.ok) {
      return NextResponse.json(
        {
          error: "Birthday digest email failed",
          detail: resendData,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      month: monthWindow.monthLabel,
      count: birthdays.length,
      recipient: getBirthdayDigestRecipient(),
      birthdays,
      email: resendData,
    });
  } catch (error) {
    console.error("[cron/birthdays] failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function fetchBirthdayContacts(token: string) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const portalId = process.env.HUBSPOT_PORTAL_ID?.trim();
  const monthWindow = getMonthWindow({});
  let after: string | undefined;
  const contacts = new Map<string, BirthdayContact>();

  do {
    const response = await fetch(`${HUBSPOT_BASE}/crm/v3/objects/contacts/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: "korma_date_of_birth",
                operator: "HAS_PROPERTY",
              },
            ],
          },
          {
            filters: [
              {
                propertyName: "date_of_birth",
                operator: "HAS_PROPERTY",
              },
            ],
          },
        ],
        properties: BIRTHDAY_PROPERTIES,
        limit: 100,
        after,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`HubSpot birthday search failed: ${detail}`);
    }

    const page = (await response.json()) as HubSpotSearchPage;
    for (const result of page.results ?? []) {
      const normalized = normalizeBirthdayRecord({
        id: result.id,
        firstName: result.properties?.firstname,
        lastName: result.properties?.lastname,
        email: result.properties?.email,
        phone: result.properties?.phone,
        dateOfBirth:
          result.properties?.korma_date_of_birth ||
          result.properties?.date_of_birth,
        portalId,
        referenceYear: monthWindow.year,
      });

      if (normalized) contacts.set(normalized.id, normalized);
    }

    after = page.paging?.next?.after;
  } while (after);

  return [...contacts.values()];
}
