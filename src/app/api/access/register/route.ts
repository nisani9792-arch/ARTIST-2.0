import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp } from "@/lib/access/client-ip";
import { requireGateUnlocked } from "@/lib/access/require-access";
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
    const gate = await requireGateUnlocked();
    if (!gate.ok) return gate.response;

    const body = bodySchema.parse(await request.json());
    const name = body.displayName || body.operatorName || "";
    const ip = await getClientIp();
    const access = await registerOperatorForIp(ip, name);
    return NextResponse.json({ access });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "רישום נכשל" }, { status: 500 });
  }
}
