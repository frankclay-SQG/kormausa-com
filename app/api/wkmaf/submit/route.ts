/**
 * /app/api/wkmaf/submit/route.ts
 *
 * Receives WKMAF intake form data and creates/updates the applicant's
 * HubSpot contact record.
 *
 * Required Vercel environment variable:
 * HUBSPOT_ACCESS_TOKEN — Private App token with CRM contacts write scope
 *
 * HubSpot custom properties that must be created in your portal
 * (Settings → Properties → Contact properties → Create):
 * wkmaf_sex (Single-line text)
 * wkmaf_disciplines (Multi-line text / semicolon-separated)
 * wkmaf_application_ref (Single-line text)
 * wkmaf_applied_certs (Single-line text)
 * wkmaf_applied_dan_rank (Number)
 * wkmaf_instructor_level (Number)
 * wkmaf_gym_name (Single-line text)
 */

import { NextRequest, NextResponse } from 'next/server';

const HS_API = 'https://api.hubapi.com';

interface SubmitPayload {
  ref: string;
  email: string;
  fullName: string;
  nation: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  sex: string;
  dobYear: string;
  dobMonth: string;
  dobDay: string;
  disciplines: string[];
  certs: { d: boolean; i: boolean; s: boolean };
  appliedRank?: string;
  instrLevel?: string;
  gymName?: string;
}

function splitName(fullName: string): { firstname: string; lastname: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstname: parts[0], lastname: '' };
  return {
    firstname: parts.slice(0, -1).join(' '),
    lastname: parts[parts.length - 1],
  };
}

function dobToMs(year: string, month: string, day: string): string | undefined {
  if (!year || !month || !day) return undefined;
  const d = new Date(Date.UTC(+year, +month - 1, +day));
  return isNaN(d.getTime()) ? undefined : String(d.getTime());
}

async function hsRequest(method: string, path: string, body?: object) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error('HUBSPOT_ACCESS_TOKEN environment variable is not set');

  const res = await fetch(`${HS_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.message || data?.error || `HubSpot ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

async function findContactByEmail(email: string): Promise<string | null> {
  try {
    const result = await hsRequest('POST', '/crm/v3/objects/contacts/search', {
      filterGroups: [{
        filters: [{ propertyName: 'email', operator: 'EQ', value: email }],
      }],
      properties: ['email'],
      limit: 1,
    });
    return (result.results?.[0]?.id as string) ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload: SubmitPayload = await req.json();

    if (!payload.email || !payload.fullName) {
      return NextResponse.json({ error: 'email and fullName are required' }, { status: 400 });
    }

    const { firstname, lastname } = splitName(payload.fullName);
    const dobMs = dobToMs(payload.dobYear, payload.dobMonth, payload.dobDay);

    const properties: Record<string, string> = {
      email: payload.email,
      firstname,
      lastname,
      country: payload.nation || '',
      address: payload.address || '',
      city: payload.city || '',
      state: payload.state || '',
      zip: payload.zip || '',
    };

    if (payload.sex) properties.wkmaf_sex = payload.sex;
    if (dobMs) properties.date_of_birth = dobMs;
    if (payload.disciplines?.length)
      properties.wkmaf_disciplines = payload.disciplines.join(';');
    if (payload.ref) properties.wkmaf_application_ref = payload.ref;

    const certLabels = [
      payload.certs.d && 'Dan',
      payload.certs.i && 'Instructor',
      payload.certs.s && 'Charter',
    ].filter(Boolean);
    if (certLabels.length) properties.wkmaf_applied_certs = certLabels.join(';');
    if (payload.appliedRank) properties.wkmaf_applied_dan_rank = payload.appliedRank;
    if (payload.instrLevel) properties.wkmaf_instructor_level = payload.instrLevel;
    if (payload.gymName) properties.wkmaf_gym_name = payload.gymName;

    const existingId = await findContactByEmail(payload.email);

    let contactId: string;
    let action: 'created' | 'updated';

    if (existingId) {
      await hsRequest('PATCH', `/crm/v3/objects/contacts/${existingId}`, { properties });
      contactId = existingId;
      action = 'updated';
    } else {
      const created = await hsRequest('POST', '/crm/v3/objects/contacts', { properties });
      contactId = created.id as string;
      action = 'created';
    }

    return NextResponse.json({ success: true, ref: payload.ref, contactId, action });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[WKMAF submit]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
