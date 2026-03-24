import { NextResponse } from "next/server";
import { fetchMetaRecommendationsForBlade } from "@/lib/meta-beys";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const blade = searchParams.get("blade") || "";

  if (!blade.trim()) {
    return NextResponse.json({ recommendations: [] });
  }

  try {
    const recommendations = await fetchMetaRecommendationsForBlade(blade);
    return NextResponse.json({ recommendations });
  } catch (error) {
    return NextResponse.json(
      {
        recommendations: [],
        error: error instanceof Error ? error.message : "Failed to load recommendations."
      },
      { status: 500 }
    );
  }
}
