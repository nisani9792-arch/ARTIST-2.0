import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/access/client-ip";
import { verifyGateUnlock } from "@/lib/access/gate";
import { getAccessByIp, unlockGateForIp } from "@/lib/access/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    verifyGateUnlock(body);
    const ip = await getClientIp();
    await unlockGateForIp(ip);
    const access = await getAccessByIp(ip);
    return NextResponse.json({ access });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid gate secret") {
      return NextResponse.json({ error: "קוד שגוי" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "פתיחה נכשלה" }, { status: 500 });
  }
}
