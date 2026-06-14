import { NextRequest, NextResponse } from "next/server";
import {
  autocompleteGoogleAddresses,
  hasGoogleMapsKey,
} from "@/lib/application/google-address";

export async function POST(req: NextRequest) {
  try {
    if (!hasGoogleMapsKey()) {
      return NextResponse.json(
        {
          configured: false,
          suggestions: [],
          error: "Google Maps is not configured",
        },
        { status: 503 }
      );
    }

    const body = (await req.json()) as {
      input?: string;
      sessionToken?: string;
    };
    const input = body.input?.trim() ?? "";
    const sessionToken = body.sessionToken?.trim() ?? "";

    if (input.length < 3 || !sessionToken) {
      return NextResponse.json({ configured: true, suggestions: [] });
    }

    const suggestions = await autocompleteGoogleAddresses({
      input,
      sessionToken,
    });

    return NextResponse.json({ configured: true, suggestions });
  } catch (error) {
    console.error("[apply] Google address autocomplete error:", error);
    return NextResponse.json(
      { configured: true, suggestions: [], error: "Address search failed" },
      { status: 500 }
    );
  }
}
