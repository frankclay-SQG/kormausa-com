const HS_BASE = "https://api.hubapi.com";

export interface HubSpotDuplicateCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  matchReasons: Array<"email" | "phone" | "name">;
}

export type EnsureHubSpotContactResult =
  | {
      status: "created" | "existing";
      contactId: string;
    }
  | {
      status: "potential-duplicate";
      duplicates: HubSpotDuplicateCandidate[];
    };

interface EnsureHubSpotContactOptions {
  token: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  properties: Record<string, string>;
  duplicateConfirmed?: boolean;
}

interface HubSpotSearchResult {
  id: string;
  properties?: Record<string, string>;
}

export function createHubSpotHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export async function ensureHubSpotContact(
  options: EnsureHubSpotContactOptions
): Promise<EnsureHubSpotContactResult> {
  const headers = createHubSpotHeaders(options.token);
  const duplicates = await findPotentialDuplicates(options.token, {
    firstName: options.firstName,
    lastName: options.lastName,
    email: options.email,
    phone: options.phone ?? "",
  });

  const exactEmailMatch = duplicates.find((candidate) =>
    candidate.matchReasons.includes("email")
  );

  if (exactEmailMatch) {
    await patchHubSpotContact(headers, exactEmailMatch.id, options.properties);
    return {
      status: "existing",
      contactId: exactEmailMatch.id,
    };
  }

  const potentialDuplicates = duplicates.filter(
    (candidate) => !candidate.matchReasons.includes("email")
  );
  if (potentialDuplicates.length > 0 && !options.duplicateConfirmed) {
    return {
      status: "potential-duplicate",
      duplicates: potentialDuplicates,
    };
  }

  const createRes = await fetch(`${HS_BASE}/crm/v3/objects/contacts`, {
    method: "POST",
    headers,
    body: JSON.stringify({ properties: options.properties }),
  });

  if (createRes.status === 409) {
    const retryDuplicates = await findPotentialDuplicates(options.token, {
      firstName: options.firstName,
      lastName: options.lastName,
      email: options.email,
      phone: options.phone ?? "",
    });
    const existing = retryDuplicates.find((candidate) =>
      candidate.matchReasons.includes("email")
    );
    if (existing) {
      await patchHubSpotContact(headers, existing.id, options.properties);
      return {
        status: "existing",
        contactId: existing.id,
      };
    }
    throw new Error("Contact create conflict could not be resolved");
  }

  if (!createRes.ok) {
    const detail = await createRes.text();
    throw new Error(`Contact creation failed: ${detail}`);
  }

  const created = (await createRes.json()) as { id?: string };
  if (!created.id) {
    throw new Error("Contact creation succeeded without an id");
  }

  return {
    status: "created",
    contactId: created.id,
  };
}

async function findPotentialDuplicates(
  token: string,
  input: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }
) {
  const headers = createHubSpotHeaders(token);
  const filterGroups: Array<{
    filters: Array<{ propertyName: string; operator: string; value: string }>;
  }> = [];

  if (input.email.trim()) {
    filterGroups.push({
      filters: [
        {
          propertyName: "email",
          operator: "EQ",
          value: input.email.trim(),
        },
      ],
    });
  }

  if (input.phone.trim()) {
    filterGroups.push({
      filters: [
        {
          propertyName: "phone",
          operator: "EQ",
          value: input.phone.trim(),
        },
      ],
    });
  }

  if (input.firstName.trim() && input.lastName.trim()) {
    filterGroups.push({
      filters: [
        {
          propertyName: "firstname",
          operator: "EQ",
          value: input.firstName.trim(),
        },
        {
          propertyName: "lastname",
          operator: "EQ",
          value: input.lastName.trim(),
        },
      ],
    });
  }

  if (filterGroups.length === 0) return [];

  const searchRes = await fetch(`${HS_BASE}/crm/v3/objects/contacts/search`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      filterGroups,
      properties: ["firstname", "lastname", "email", "phone"],
      limit: 10,
    }),
  });

  if (!searchRes.ok) {
    const detail = await searchRes.text();
    throw new Error(`Contact search failed: ${detail}`);
  }

  const data = (await searchRes.json()) as {
    results?: HubSpotSearchResult[];
  };

  const normalizedEmail = normalizeEmail(input.email);
  const normalizedPhone = normalizePhone(input.phone);
  const normalizedName = normalizeName(input.firstName, input.lastName);

  return (data.results ?? [])
    .map((result) => {
      const firstName = result.properties?.firstname ?? "";
      const lastName = result.properties?.lastname ?? "";
      const email = result.properties?.email ?? "";
      const phone = result.properties?.phone ?? "";

      const matchReasons: HubSpotDuplicateCandidate["matchReasons"] = [];
      if (normalizedEmail && normalizeEmail(email) === normalizedEmail) {
        matchReasons.push("email");
      }
      if (normalizedPhone && normalizePhone(phone) === normalizedPhone) {
        matchReasons.push("phone");
      }
      if (
        normalizedName &&
        normalizeName(firstName, lastName) === normalizedName
      ) {
        matchReasons.push("name");
      }

      if (matchReasons.length === 0) return null;
      return {
        id: result.id,
        firstName,
        lastName,
        email,
        phone,
        matchReasons,
      };
    })
    .filter(
      (candidate): candidate is HubSpotDuplicateCandidate => candidate !== null
    );
}

async function patchHubSpotContact(
  headers: Record<string, string>,
  contactId: string,
  properties: Record<string, string>
) {
  await fetch(`${HS_BASE}/crm/v3/objects/contacts/${contactId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ properties }),
  });
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim().toLowerCase().replace(/\s+/g, " ");
}
