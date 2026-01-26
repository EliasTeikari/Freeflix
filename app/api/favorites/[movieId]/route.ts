import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isFavorite, removeFavorite } from "@/lib/db/queries";

// GET to check if a movie is favorited
export async function GET(
  request: Request,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ isFavorite: false });
    }

    const { movieId } = await params;

    if (!movieId) {
      return NextResponse.json(
        { error: "Movie ID is required" },
        { status: 400 }
      );
    }

    const favorited = await isFavorite(session.user.id, movieId);

    return NextResponse.json({ isFavorite: favorited });
  } catch (error) {
    console.error("Favorite check error:", error);
    return NextResponse.json({ isFavorite: false });
  }
}

// DELETE to remove a favorite
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ movieId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { movieId } = await params;

    if (!movieId) {
      return NextResponse.json(
        { error: "Movie ID is required" },
        { status: 400 }
      );
    }

    await removeFavorite(session.user.id, movieId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Favorite DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}
