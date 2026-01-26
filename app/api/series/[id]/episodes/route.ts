import { NextRequest, NextResponse } from "next/server";
import { getSeriesSeasons, getSeasonEpisodes } from "@/lib/services/myflixer";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get("season");

    // If seasonId is provided, fetch episodes for that season
    if (seasonId) {
      const episodes = await getSeasonEpisodes(seasonId);
      return NextResponse.json({ episodes });
    }

    // Otherwise, fetch all seasons for the series
    const seasons = await getSeriesSeasons(id);

    // If we have seasons, also fetch episodes for the first season
    let firstSeasonEpisodes: Awaited<ReturnType<typeof getSeasonEpisodes>> = [];
    if (seasons.length > 0) {
      firstSeasonEpisodes = await getSeasonEpisodes(seasons[0].id);
    }

    return NextResponse.json({
      seasons,
      episodes: firstSeasonEpisodes,
    });
  } catch (error) {
    console.error("Series episodes API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch series episodes" },
      { status: 500 }
    );
  }
}
