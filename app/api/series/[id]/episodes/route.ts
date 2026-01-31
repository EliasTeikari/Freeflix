import { NextRequest, NextResponse } from "next/server";
import { getSeriesSeasons, getSeasonEpisodes } from "@/lib/services/myflixer";
import { apiCache } from "@/lib/utils/cache";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
      const cacheKey = `episodes:${seasonId}`;
      const episodes = await apiCache.getOrSet(
        cacheKey,
        () => getSeasonEpisodes(seasonId),
        CACHE_TTL
      );
      return NextResponse.json({ episodes });
    }

    // Otherwise, fetch all seasons for the series
    const seasonsCacheKey = `seasons:${id}`;
    const seasons = await apiCache.getOrSet(
      seasonsCacheKey,
      () => getSeriesSeasons(id),
      CACHE_TTL
    );

    // If we have seasons, also fetch episodes for the first season
    let firstSeasonEpisodes: Awaited<ReturnType<typeof getSeasonEpisodes>> = [];
    if (seasons.length > 0) {
      const episodesCacheKey = `episodes:${seasons[0].id}`;
      firstSeasonEpisodes = await apiCache.getOrSet(
        episodesCacheKey,
        () => getSeasonEpisodes(seasons[0].id),
        CACHE_TTL
      );
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
