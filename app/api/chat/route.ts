import { NextRequest, NextResponse } from "next/server";

const BOOKING_BOT_API_URL = process.env.BOOKING_BOT_API_URL;
const MAX_MESSAGE_LENGTH = 2000;

interface ChatRequestBody {
  session_id: string;
  message: string;
  channel: string;
  timezone: string;
}

function isValidChatRequest(body: unknown): body is ChatRequestBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.session_id === "string" &&
    b.session_id.length > 0 &&
    typeof b.message === "string" &&
    b.message.trim().length > 0 &&
    b.message.length <= MAX_MESSAGE_LENGTH &&
    typeof b.channel === "string" &&
    typeof b.timezone === "string"
  );
}

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

  if (!isValidChatRequest(body)) {
    return NextResponse.json(
      {
        error: `Message must be a non-empty string of at most ${MAX_MESSAGE_LENGTH} characters.`,
      },
      { status: 400 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BOOKING_BOT_API_URL}/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    return NextResponse.json(
      {
        error: timedOut
          ? "The booking service took too long to respond. Please try again."
          : "Could not reach the booking service. Please try again later.",
      },
      { status: timedOut ? 504 : 503 }
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
