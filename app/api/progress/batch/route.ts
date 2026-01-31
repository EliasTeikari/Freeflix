import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getWatchProgressByUser } from "@/lib/db/queries";

const batchSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
});

// POST to fetch progress for multiple IDs at once
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = batchSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { ids } = result.data;

    // Get all progress for the user
    const allProgress = await getWatchProgressByUser(session.user.id);

    // Filter to only the requested IDs and build a map
    const progressMap: Record<string, {
      progressSeconds: number;
      totalDuration: number | null;
      progressPercent: number;
      completed: boolean;
      lastWatched: string;
    }> = {};

    for (const progress of allProgress) {
      if (ids.includes(progress.movieId)) {
        progressMap[progress.movieId] = {
          progressSeconds: progress.progressSeconds,
          totalDuration: progress.totalDuration,
          progressPercent: progress.totalDuration
            ? Math.round((progress.progressSeconds / progress.totalDuration) * 100)
            : 0,
          completed: progress.completed,
          lastWatched: progress.lastWatched.toISOString(),
        };
      }
    }

    return NextResponse.json({ progress: progressMap });
  } catch (error) {
    console.error("Progress batch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
