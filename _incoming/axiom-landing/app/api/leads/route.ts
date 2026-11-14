import { NextResponse } from "next/server";

// Demo endpoint for forms inside showcase builds (they POST to /api/leads).
// Prospects playing with a demo shouldn't create real client leads — acknowledge and drop.
export async function POST() {
  return NextResponse.json({ ok: true, demo: true });
}
