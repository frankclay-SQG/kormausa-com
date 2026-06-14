export type AddressValidationStatus =
  | "unverified"
  | "validating"
  | "validated"
  | "needs-review"
  | "not-configured";

export interface MailingAddressInput {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  googlePlaceId?: string;
}

export interface GoogleAddressSuggestion {
  placeId: string;
  label: string;
  mainText: string;
  secondaryText: string;
}

export interface NormalizedGoogleAddress {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  formattedAddress: string;
  googlePlaceId: string;
  googleMapsUri?: string;
  latitude?: number;
  longitude?: number;
}

export interface GoogleAddressValidationResult {
  status: AddressValidationStatus;
  message: string;
  normalizedAddress?: NormalizedGoogleAddress;
  verdict?: {
    addressComplete?: boolean;
    validationGranularity?: string;
    geocodeGranularity?: string;
    hasUnconfirmedComponents?: boolean;
    hasInferredComponents?: boolean;
    hasReplacedComponents?: boolean;
  };
}

interface GoogleAddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

interface GooglePlaceDetailsResponse {
  id?: string;
  formattedAddress?: string;
  addressComponents?: GoogleAddressComponent[];
  googleMapsUri?: string;
  postalAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
  };
}

interface GoogleAddressValidationResponse {
  result?: {
    verdict?: GoogleAddressValidationResult["verdict"];
    address?: {
      formattedAddress?: string;
      postalAddress?: {
        addressLines?: string[];
        locality?: string;
        administrativeArea?: string;
        postalCode?: string;
      };
    };
    geocode?: {
      placeId?: string;
      location?: {
        latitude?: number;
        longitude?: number;
      };
    };
  };
  error?: {
    message?: string;
  };
}

const PLACES_AUTOCOMPLETE_URL =
  "https://places.googleapis.com/v1/places:autocomplete";
const ADDRESS_VALIDATION_URL =
  "https://addressvalidation.googleapis.com/v1:validateAddress";

export function hasGoogleMapsKey() {
  return Boolean(process.env.GOOGLE_MAPS_API_KEY);
}

export async function autocompleteGoogleAddresses({
  input,
  sessionToken,
}: {
  input: string;
  sessionToken: string;
}): Promise<GoogleAddressSuggestion[]> {
  const apiKey = getGoogleMapsKey();
  const trimmedInput = input.trim();
  if (!trimmedInput || trimmedInput.length < 3) return [];

  const response = await fetch(PLACES_AUTOCOMPLETE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text",
    },
    body: JSON.stringify({
      input: trimmedInput,
      sessionToken,
      includedRegionCodes: ["us"],
      languageCode: "en",
      regionCode: "us",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Places autocomplete failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string;
        text?: { text?: string };
        structuredFormat?: {
          mainText?: { text?: string };
          secondaryText?: { text?: string };
        };
      };
    }>;
  };

  return (data.suggestions ?? [])
    .map((suggestion) => suggestion.placePrediction)
    .filter((prediction): prediction is NonNullable<typeof prediction> => {
      return Boolean(prediction?.placeId && prediction.text?.text);
    })
    .map((prediction) => ({
      placeId: prediction.placeId ?? "",
      label: prediction.text?.text ?? "",
      mainText:
        prediction.structuredFormat?.mainText?.text ??
        prediction.text?.text ??
        "",
      secondaryText:
        prediction.structuredFormat?.secondaryText?.text ?? "",
    }))
    .slice(0, 5);
}

export async function validateGooglePlaceAddress({
  placeId,
  sessionToken,
}: {
  placeId: string;
  sessionToken: string;
}) {
  const place = await getGooglePlaceDetails(placeId, sessionToken);
  const parsedAddress = parseGooglePlaceAddress(place);
  const validation = await validateGoogleAddress(parsedAddress);

  return {
    ...validation,
    normalizedAddress: {
      ...parsedAddress,
      ...(validation.normalizedAddress ?? {}),
      googlePlaceId: parsedAddress.googlePlaceId,
      googleMapsUri: parsedAddress.googleMapsUri,
      latitude:
        validation.normalizedAddress?.latitude ?? parsedAddress.latitude,
      longitude:
        validation.normalizedAddress?.longitude ?? parsedAddress.longitude,
    },
  };
}

export async function validateGoogleAddress(
  address: MailingAddressInput
): Promise<GoogleAddressValidationResult> {
  const apiKey = getGoogleMapsKey();
  const response = await fetch(`${ADDRESS_VALIDATION_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: {
        regionCode: "US",
        locality: address.city,
        administrativeArea: address.state,
        postalCode: address.postalCode,
        addressLines: [address.addressLine1, address.addressLine2].filter(
          Boolean
        ),
      },
      enableUspsCass: true,
    }),
  });

  const data = (await response.json()) as GoogleAddressValidationResponse;
  if (!response.ok) {
    throw new Error(
      data.error?.message ??
        `Google Address Validation failed: ${response.status}`
    );
  }

  const result = data.result;
  const verdict = result?.verdict;
  const postalAddress = result?.address?.postalAddress;
  const normalized = postalAddress
    ? normalizePostalAddress(postalAddress, {
        fallbackPlaceId: result?.geocode?.placeId ?? address.googlePlaceId ?? "",
        fallbackFormattedAddress: result?.address?.formattedAddress ?? "",
        latitude: result?.geocode?.location?.latitude,
        longitude: result?.geocode?.location?.longitude,
      })
    : undefined;

  const preciseGranularity =
    verdict?.validationGranularity === "PREMISE" ||
    verdict?.validationGranularity === "SUB_PREMISE" ||
    verdict?.validationGranularity === "PREMISE_PROXIMITY";
  const validated = Boolean(
    normalized?.formattedAddress &&
      !verdict?.hasUnconfirmedComponents &&
      (verdict?.addressComplete || preciseGranularity)
  );

  return {
    status: validated ? "validated" : "needs-review",
    message: validated
      ? "Address validated with Google Maps."
      : "Google Maps could not fully validate this mailing address. Please review the address details.",
    normalizedAddress: normalized,
    verdict,
  };
}

async function getGooglePlaceDetails(
  rawPlaceId: string,
  sessionToken: string
): Promise<GooglePlaceDetailsResponse> {
  const apiKey = getGoogleMapsKey();
  const placeId = rawPlaceId.replace(/^places\//, "");
  const params = new URLSearchParams({
    sessionToken,
    languageCode: "en",
    regionCode: "us",
  });

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(
      placeId
    )}?${params.toString()}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "id,formattedAddress,addressComponents,postalAddress,location,googleMapsUri",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Google Place Details failed: ${response.status}`);
  }

  return (await response.json()) as GooglePlaceDetailsResponse;
}

function parseGooglePlaceAddress(
  place: GooglePlaceDetailsResponse
): NormalizedGoogleAddress {
  const components = place.addressComponents ?? [];
  const streetNumber = getComponent(components, "street_number", "shortText");
  const route = getComponent(components, "route", "longText");
  const subpremise = getComponent(components, "subpremise", "shortText");
  const city =
    getComponent(components, "locality", "longText") ||
    getComponent(components, "postal_town", "longText") ||
    getComponent(components, "sublocality", "longText");
  const state = getComponent(
    components,
    "administrative_area_level_1",
    "shortText"
  );
  const postalCode = [
    getComponent(components, "postal_code", "shortText"),
    getComponent(components, "postal_code_suffix", "shortText"),
  ]
    .filter(Boolean)
    .join("-");
  const postalAddress = place.postalAddress;

  return {
    addressLine1:
      postalAddress?.addressLines?.[0] ??
      [streetNumber, route].filter(Boolean).join(" "),
    addressLine2: subpremise ? `Unit ${subpremise}` : "",
    city: postalAddress?.locality ?? city,
    state: postalAddress?.administrativeArea ?? state,
    postalCode: postalAddress?.postalCode ?? postalCode,
    formattedAddress: place.formattedAddress ?? "",
    googlePlaceId: place.id?.replace(/^places\//, "") ?? "",
    googleMapsUri: place.googleMapsUri,
    latitude: place.location?.latitude,
    longitude: place.location?.longitude,
  };
}

function normalizePostalAddress(
  postalAddress: NonNullable<
    NonNullable<GoogleAddressValidationResponse["result"]>["address"]
  >["postalAddress"],
  fallback: {
    fallbackPlaceId: string;
    fallbackFormattedAddress: string;
    latitude?: number;
    longitude?: number;
  }
): NormalizedGoogleAddress {
  return {
    addressLine1: postalAddress?.addressLines?.[0] ?? "",
    addressLine2: postalAddress?.addressLines?.[1] ?? "",
    city: postalAddress?.locality ?? "",
    state: postalAddress?.administrativeArea ?? "",
    postalCode: postalAddress?.postalCode ?? "",
    formattedAddress: fallback.fallbackFormattedAddress,
    googlePlaceId: fallback.fallbackPlaceId,
    latitude: fallback.latitude,
    longitude: fallback.longitude,
  };
}

function getComponent(
  components: GoogleAddressComponent[],
  type: string,
  textKey: "longText" | "shortText"
) {
  return (
    components.find((component) => component.types?.includes(type))?.[
      textKey
    ] ?? ""
  );
}

function getGoogleMapsKey() {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }
  return apiKey;
}
