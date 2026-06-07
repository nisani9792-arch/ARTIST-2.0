import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/access/client-ip";
import { getAccessByIp, toStatus } from "@/lib/access/store";

export async function GET() {
  try {
    const ip = await getClientIp();
    const access = await getAccessByIp(ip);
    return NextResponse.json(toStatus(access));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאת גישה" }, { status: 500 });
  }
}
