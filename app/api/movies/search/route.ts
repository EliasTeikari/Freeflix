import { NextResponse } from "next/server";
import { searchMovies, getTrending } from "@/lib/services/myflixer";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      // Return trending movies if no query
      const trending = await getTrending();
      return NextResponse.json({ results: trending });
    }

    const results = await searchMovies(query);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search movies" },
      { status: 500 }
    );
  }
}
