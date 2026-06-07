import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp } from "@/lib/access/client-ip";
import { registerOperatorForIp } from "@/lib/access/store";

export const runtime = "nodejs";

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
    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json(
        { error: "חיבור למסד נתונים לא מוגדר (DATABASE_URL)" },
        { status: 503 },
      );
    }
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
    if (error instanceof Error) {
      if (error.message === "DATABASE_URL is not set") {
        return NextResponse.json(
          { error: "חיבור למסד נתונים לא מוגדר — הוסף DATABASE_URL ב-Render" },
          { status: 503 },
        );
      }
      if (error.message.includes("localhost")) {
        return NextResponse.json(
          { error: "DATABASE_URL שגוי — צריך כתובת Neon, לא localhost" },
          { status: 503 },
        );
      }
    }
    console.error("register failed:", error);
    return NextResponse.json({ error: "רישום נכשל" }, { status: 500 });
  }
}
