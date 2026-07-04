import { NextRequest, NextResponse } from "next/server";

const BOOKING_BOT_API_URL = process.env.BOOKING_BOT_API_URL;

export async function GET() {
  if (!BOOKING_BOT_API_URL) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  try {
    const upstream = await fetch(`${BOOKING_BOT_API_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!upstream.ok) {
      return NextResponse.json({ ok: false }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  if (!BOOKING_BOT_API_URL) {
    return NextResponse.json(
      { error: "Booking service not configured. Set BOOKING_BOT_API_URL." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BOOKING_BOT_API_URL}/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the booking service. Please try again later." },
      { status: 503 }
    );
  }

  try {
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { error: "The booking service returned an unexpected response. Please try again later." },
      { status: 502 }
    );
  }
}
