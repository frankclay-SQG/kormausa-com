import { NextRequest, NextResponse } from "next/server";
import {
  hasGoogleMapsKey,
  validateGoogleAddress,
  validateGooglePlaceAddress,
} from "@/lib/application/google-address";

export async function POST(req: NextRequest) {
  try {
    if (!hasGoogleMapsKey()) {
      return NextResponse.json(
        {
          configured: false,
          status: "not-configured",
          message: "Google Maps is not configured",
        },
        { status: 503 }
      );
    }

    const body = (await req.json()) as {
      placeId?: string;
      sessionToken?: string;
      address?: {
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        googlePlaceId?: string;
      };
    };

    const result =
      body.placeId && body.sessionToken
        ? await validateGooglePlaceAddress({
            placeId: body.placeId,
            sessionToken: body.sessionToken,
          })
        : await validateGoogleAddress({
            addressLine1: body.address?.addressLine1 ?? "",
            addressLine2: body.address?.addressLine2 ?? "",
            city: body.address?.city ?? "",
            state: body.address?.state ?? "",
            postalCode: body.address?.postalCode ?? "",
            googlePlaceId: body.address?.googlePlaceId ?? "",
          });

    return NextResponse.json({ configured: true, ...result });
  } catch (error) {
    console.error("[apply] Google address validation error:", error);
    return NextResponse.json(
      {
        configured: true,
        status: "needs-review",
        message: "Address validation failed",
      },
      { status: 500 }
    );
  }
}
