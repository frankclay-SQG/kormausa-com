const DEFAULT_DIGEST_TO = "masterclay@kormausa.com";

export interface BirthdayContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  birthdayMonth: number;
  birthdayDay: number;
  turningAge?: number;
  hubSpotUrl?: string;
}

export function getBirthdayDigestRecipient() {
  return process.env.BIRTHDAY_DIGEST_TO?.trim() || DEFAULT_DIGEST_TO;
}

export function getBirthdayDigestFrom() {
  return (
    process.env.BIRTHDAY_DIGEST_FROM?.trim() ||
    process.env.BILLING_EMAIL_FROM?.trim() ||
    "KORMA-USA <billing@kormausa.com>"
  );
}

export function getBirthdayDigestSubject({
  monthLabel,
  count,
}: {
  monthLabel: string;
  count: number;
}) {
  return count > 0
    ? `KORMA-USA Birthday Digest - ${monthLabel}`
    : `KORMA-USA Birthday Digest - ${monthLabel} (No birthdays)`;
}

export function buildBirthdayDigestHtml({
  monthLabel,
  birthdays,
}: {
  monthLabel: string;
  birthdays: BirthdayContact[];
}) {
  const listMarkup = birthdays.length
    ? birthdays
        .map((contact) => {
          const name = escapeHtml(getDisplayName(contact));
          const pieces = [
            `Birthday: ${escapeHtml(formatMonthDay(contact))}`,
            contact.turningAge
              ? `Turns: ${escapeHtml(String(contact.turningAge))}`
              : null,
            contact.email ? `Email: ${escapeHtml(contact.email)}` : null,
            contact.phone ? `Phone: ${escapeHtml(contact.phone)}` : null,
            contact.hubSpotUrl
              ? `<a href="${escapeAttribute(contact.hubSpotUrl)}" style="color:#c9a227;text-decoration:none;">Open HubSpot record</a>`
              : null,
          ].filter(Boolean);

          return `<tr>
            <td style="padding:16px 0;border-bottom:1px solid #e5e7eb;">
              <div style="font-size:16px;font-weight:700;color:#0f172a;">${name}</div>
              <div style="margin-top:6px;font-size:14px;line-height:1.7;color:#475569;">${pieces.join(
                " &nbsp;|&nbsp; "
              )}</div>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr>
        <td style="padding:18px 0;border-bottom:1px solid #e5e7eb;font-size:15px;line-height:1.7;color:#475569;">
          No client birthdays are recorded for ${escapeHtml(monthLabel)}.
        </td>
      </tr>`;

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <div style="max-width:680px;margin:0 auto;padding:32px 20px;">
      <div style="border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;background:#ffffff;">
        <div style="padding:28px 28px 20px;background:#08111d;color:#ffffff;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#d4af37;">KORMA-USA</div>
          <h1 style="margin:14px 0 0;font-size:30px;line-height:1.05;">Birthday Digest</h1>
          <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.72);">
            Birthday summary for ${escapeHtml(monthLabel)}.
          </p>
        </div>
        <div style="padding:24px 28px;">
          <div style="margin-bottom:16px;font-size:14px;line-height:1.7;color:#475569;">
            ${birthdays.length > 0
              ? `There ${birthdays.length === 1 ? "is" : "are"} <strong style="color:#0f172a;">${birthdays.length}</strong> client birthday${birthdays.length === 1 ? "" : "s"} recorded for ${escapeHtml(monthLabel)}.`
              : `No client birthdays are currently recorded for ${escapeHtml(monthLabel)}.`}
          </div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            ${listMarkup}
          </table>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

export function buildBirthdayDigestText({
  monthLabel,
  birthdays,
}: {
  monthLabel: string;
  birthdays: BirthdayContact[];
}) {
  const lines = [`KORMA-USA Birthday Digest - ${monthLabel}`, ""];

  if (!birthdays.length) {
    lines.push(`No client birthdays are recorded for ${monthLabel}.`);
    return lines.join("\n");
  }

  for (const contact of birthdays) {
    lines.push(getDisplayName(contact));
    lines.push(`Birthday: ${formatMonthDay(contact)}`);
    if (contact.turningAge) lines.push(`Turns: ${contact.turningAge}`);
    if (contact.email) lines.push(`Email: ${contact.email}`);
    if (contact.phone) lines.push(`Phone: ${contact.phone}`);
    if (contact.hubSpotUrl) lines.push(`HubSpot: ${contact.hubSpotUrl}`);
    lines.push("");
  }

  return lines.join("\n");
}

export function getMonthWindow({
  now = new Date(),
  timeZone = process.env.BIRTHDAY_DIGEST_TIMEZONE || "America/New_York",
}: {
  now?: Date;
  timeZone?: string;
}) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "long",
  });
  const parts = formatter.formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const monthName = parts.find((part) => part.type === "month")?.value ?? "";
  const monthNumber = monthNameToNumber(monthName);

  return {
    year,
    monthNumber,
    monthLabel: `${monthName} ${year}`,
    timeZone,
  };
}

export function normalizeBirthdayRecord(input: {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  portalId?: string;
  referenceYear?: number;
}) {
  const parsed = parseBirthdayValue(input.dateOfBirth);
  if (!parsed) return null;

  const turningAge =
    parsed.year && parsed.year > 1900
      ? (input.referenceYear ?? new Date().getUTCFullYear()) - parsed.year
      : undefined;

  return {
    id: input.id,
    firstName: input.firstName?.trim() ?? "",
    lastName: input.lastName?.trim() ?? "",
    email: input.email?.trim() ?? "",
    phone: input.phone?.trim() ?? "",
    dateOfBirth: input.dateOfBirth?.trim() ?? "",
    birthdayMonth: parsed.month,
    birthdayDay: parsed.day,
    turningAge,
    hubSpotUrl: input.portalId
      ? `https://app.hubspot.com/contacts/${input.portalId}/record/0-1/${input.id}`
      : undefined,
  } satisfies BirthdayContact;
}

export function filterBirthdaysForMonth(
  contacts: BirthdayContact[],
  monthNumber: number
) {
  return contacts
    .filter((contact) => contact.birthdayMonth === monthNumber)
    .sort((left, right) => {
      if (left.birthdayDay !== right.birthdayDay) {
        return left.birthdayDay - right.birthdayDay;
      }
      return getDisplayName(left).localeCompare(getDisplayName(right));
    });
}

function parseBirthdayValue(value?: string) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return {
      year: Number(isoMatch[1]),
      month: Number(isoMatch[2]),
      day: Number(isoMatch[3]),
    };
  }

  const numericMatch = trimmed.match(/^\d+$/);
  if (numericMatch) {
    const numeric = Number(trimmed);
    const date = new Date(numeric);
    if (!Number.isNaN(date.getTime())) {
      return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
      };
    }
  }

  const fallback = new Date(trimmed);
  if (Number.isNaN(fallback.getTime())) return null;

  return {
    year: fallback.getUTCFullYear(),
    month: fallback.getUTCMonth() + 1,
    day: fallback.getUTCDate(),
  };
}

function getDisplayName(contact: BirthdayContact) {
  return [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.email || "Unnamed contact";
}

function formatMonthDay(contact: BirthdayContact) {
  return `${monthNumberToName(contact.birthdayMonth)} ${contact.birthdayDay}`;
}

function monthNameToNumber(monthName: string) {
  return [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ].indexOf(monthName) + 1;
}

function monthNumberToName(monthNumber: number) {
  return (
    [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ][monthNumber - 1] ?? "Unknown"
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value);
}
