import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWatchProgressByMovie, deleteWatchProgress } from "@/lib/db/queries";

// GET progress for a specific movie
export async function GET(
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

    const progress = await getWatchProgressByMovie(session.user.id, movieId);

    if (!progress) {
      return NextResponse.json({
        movieId,
        progressSeconds: 0,
        totalDuration: null,
        progressPercent: 0,
        completed: false,
      });
    }

    return NextResponse.json({
      movieId: progress.movieId,
      movieTitle: progress.movieTitle,
      moviePoster: progress.moviePoster,
      progressSeconds: progress.progressSeconds,
      totalDuration: progress.totalDuration,
      progressPercent: progress.totalDuration
        ? Math.round((progress.progressSeconds / progress.totalDuration) * 100)
        : 0,
      lastWatched: progress.lastWatched.toISOString(),
      completed: progress.completed,
    });
  } catch (error) {
    console.error("Progress GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

// DELETE progress for a specific movie
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

    await deleteWatchProgress(session.user.id, movieId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Progress DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete progress" },
      { status: 500 }
    );
  }
}
