import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp } from "@/lib/access/client-ip";
import { registerOperatorForIp } from "@/lib/access/store";

const bodySchema = z
  .object({
    displayName: z.string().trim().min(2).max(40).optional(),
    operatorName: z.string().trim().min(2).max(40).optional(),
  })
  .refine((d) => d.displayName || d.operatorName, {
    message: "שם מפעיל נדרש",
  });

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json());
    const name = body.displayName || body.operatorName || "";
    const ip = await getClientIp();
    const access = await registerOperatorForIp(ip, name);
    return NextResponse.json({
      state: "ready",
      operatorName: access.displayName,
      auth: "ip",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "רישום נכשל" }, { status: 500 });
  }
}
