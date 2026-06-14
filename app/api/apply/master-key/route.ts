import { NextRequest, NextResponse } from "next/server";

const MASTER_KEY_ENV = "KORMA_APPLICATION_MASTER_KEY";

export async function POST(req: NextRequest) {
  try {
    const configuredMasterKey = process.env[MASTER_KEY_ENV];
    if (!configuredMasterKey) {
      return NextResponse.json(
        {
          authorized: false,
          configured: false,
          error: "Master key is not configured",
        },
        { status: 503 }
      );
    }

    const body = (await req.json()) as { masterKey?: string };
    const authorized = body.masterKey === configuredMasterKey;

    return NextResponse.json(
      {
        authorized,
        configured: true,
      },
      { status: authorized ? 200 : 401 }
    );
  } catch {
    return NextResponse.json(
      { authorized: false, configured: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
