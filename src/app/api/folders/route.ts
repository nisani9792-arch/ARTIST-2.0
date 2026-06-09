import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createFolder, listFolders } from "@/lib/artists";
import { requireAccess } from "@/lib/access/require-access";

export async function GET() {
  try {
    const access = await requireAccess();
    if (!access.ok) return access.response;
    const folders = await listFolders();
    return NextResponse.json({ folders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה בטעינת תיקיות" }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const access = await requireAccess();
    if (!access.ok) return access.response;
    const body = createSchema.parse(await request.json());
    const folder = await createFolder(body.name);
    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "שגיאה ביצירת תיקייה" }, { status: 500 });
  }
}
