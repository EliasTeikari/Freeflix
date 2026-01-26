import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getWatchProgressByUser, upsertWatchProgress } from "@/lib/db/queries";

const progressSchema = z.object({
  movieId: z.string().min(1),
  movieTitle: z.string().optional(),
  moviePoster: z.string().optional(),
  progressSeconds: z.number().min(0),
  totalDuration: z.number().min(0).optional(),
});

// GET all progress for current user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = await getWatchProgressByUser(session.user.id);

    const items = progress.map((p) => ({
      movieId: p.movieId,
      movieTitle: p.movieTitle,
      moviePoster: p.moviePoster,
      progressSeconds: p.progressSeconds,
      totalDuration: p.totalDuration,
      progressPercent: p.totalDuration
        ? Math.round((p.progressSeconds / p.totalDuration) * 100)
        : 0,
      lastWatched: p.lastWatched.toISOString(),
      completed: p.completed,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Progress GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

// POST to save/update progress
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = progressSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { movieId, movieTitle, moviePoster, progressSeconds, totalDuration } =
      result.data;

    await upsertWatchProgress(session.user.id, {
      movieId,
      movieTitle: movieTitle || null,
      moviePoster: moviePoster || null,
      progressSeconds,
      totalDuration: totalDuration || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Progress POST error:", error);
    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    );
  }
}
