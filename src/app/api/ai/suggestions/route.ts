import { NextResponse } from "next/server";
import {
  analyzeStuckArtists,
  isGeminiConfigured,
} from "@/lib/gemini";
import { findStuckArtists, listArtists } from "@/lib/artists";

export async function GET() {
  try {
    const all = await listArtists();
    const fallbackStuck = await findStuckArtists(14);
    const fallbackIds = new Set(fallbackStuck.map((a) => a.id));

    let stuckIds = [...fallbackIds];

    if (isGeminiConfigured() && all.length > 0) {
      try {
        const geminiIds = await analyzeStuckArtists(all);
        stuckIds = [...new Set([...fallbackIds, ...geminiIds])];
      } catch (error) {
        console.error("Gemini suggestions failed, using fallback:", error);
      }
    }

    return NextResponse.json({ stuckIds });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה בהמלצות AI" }, { status: 500 });
  }
}
