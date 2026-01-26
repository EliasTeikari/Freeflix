import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  getFavoritesByUser,
  addFavorite,
  removeFavorite,
  isFavorite,
} from "@/lib/db/queries";

const favoriteSchema = z.object({
  movieId: z.string().min(1),
  movieTitle: z.string().optional(),
  moviePoster: z.string().optional(),
});

// GET all favorites for current user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const favorites = await getFavoritesByUser(session.user.id);

    const items = favorites.map((f) => ({
      movieId: f.movieId,
      movieTitle: f.movieTitle,
      moviePoster: f.moviePoster,
      addedAt: f.addedAt.toISOString(),
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Favorites GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

// POST to add a favorite
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = favoriteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { movieId, movieTitle, moviePoster } = result.data;

    await addFavorite(session.user.id, {
      movieId,
      movieTitle: movieTitle || null,
      moviePoster: moviePoster || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Favorites POST error:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

// DELETE to remove a favorite
export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get("movieId");

    if (!movieId) {
      return NextResponse.json(
        { error: "Movie ID is required" },
        { status: 400 }
      );
    }

    await removeFavorite(session.user.id, movieId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Favorites DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}
