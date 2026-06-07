import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, service: "artist-2.0" });
}
