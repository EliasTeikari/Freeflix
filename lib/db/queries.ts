import { eq, and, desc } from "drizzle-orm";
import { db, users, watchProgress, favorites } from "./index";
import type { NewUser, NewWatchProgress, NewFavorite } from "./schema";
import {
  getProgressFromCache,
  setProgressInCache,
  getAllProgressFromCache,
  setAllProgressInCache,
  deleteProgressFromCache,
  type CachedProgress,
} from "@/lib/redis/progress";

// User queries
export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

export async function getUserById(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
}

export async function createUser(data: NewUser) {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

// Helper to convert DB record to cache format
function toCachedProgress(record: {
  movieId: string;
  movieTitle: string | null;
  moviePoster: string | null;
  progressSeconds: number;
  totalDuration: number | null;
  lastWatched: Date;
  completed: boolean;
}): CachedProgress {
  return {
    movieId: record.movieId,
    movieTitle: record.movieTitle,
    moviePoster: record.moviePoster,
    progressSeconds: record.progressSeconds,
    totalDuration: record.totalDuration,
    lastWatched: record.lastWatched.toISOString(),
    completed: record.completed,
  };
}

// Watch progress queries (with Redis caching)
export async function getWatchProgressByUser(userId: string) {
  // Try cache first
  const cached = await getAllProgressFromCache(userId);
  if (cached) {
    return cached.map((item) => ({
      ...item,
      lastWatched: new Date(item.lastWatched),
    }));
  }

  // Fetch from database
  const results = await db.query.watchProgress.findMany({
    where: eq(watchProgress.userId, userId),
    orderBy: [desc(watchProgress.lastWatched)],
  });

  // Populate cache
  if (results.length > 0) {
    await setAllProgressInCache(
      userId,
      results.map(toCachedProgress)
    );
  }

  return results;
}

export async function getWatchProgressByMovie(userId: string, movieId: string) {
  // Try cache first
  const cached = await getProgressFromCache(userId, movieId);
  if (cached) {
    return {
      ...cached,
      id: "", // ID not stored in cache, but not needed for reads
      userId,
      lastWatched: new Date(cached.lastWatched),
    };
  }

  // Fetch from database
  const result = await db.query.watchProgress.findFirst({
    where: and(
      eq(watchProgress.userId, userId),
      eq(watchProgress.movieId, movieId)
    ),
  });

  // Populate cache if found
  if (result) {
    await setProgressInCache(userId, toCachedProgress(result));
  }

  return result;
}

export async function upsertWatchProgress(
  userId: string,
  data: Omit<NewWatchProgress, "userId" | "id">
) {
  const now = new Date();
  const completed =
    data.totalDuration && data.progressSeconds
      ? data.progressSeconds / data.totalDuration > 0.9
      : false;

  // Check if exists (skip cache for upsert to get actual DB state)
  const existing = await db.query.watchProgress.findFirst({
    where: and(
      eq(watchProgress.userId, userId),
      eq(watchProgress.movieId, data.movieId)
    ),
  });

  let result;
  if (existing) {
    const [updated] = await db
      .update(watchProgress)
      .set({
        ...data,
        lastWatched: now,
        completed,
      })
      .where(eq(watchProgress.id, existing.id))
      .returning();
    result = updated;
  } else {
    const [created] = await db
      .insert(watchProgress)
      .values({
        ...data,
        userId,
        completed,
      })
      .returning();
    result = created;
  }

  // Update cache
  await setProgressInCache(userId, toCachedProgress(result));

  return result;
}

export async function deleteWatchProgress(userId: string, movieId: string) {
  // Delete from database
  await db
    .delete(watchProgress)
    .where(
      and(eq(watchProgress.userId, userId), eq(watchProgress.movieId, movieId))
    );

  // Delete from cache
  await deleteProgressFromCache(userId, movieId);
}

// Favorites queries
export async function getFavoritesByUser(userId: string) {
  return db.query.favorites.findMany({
    where: eq(favorites.userId, userId),
    orderBy: [desc(favorites.addedAt)],
  });
}

export async function getFavorite(userId: string, movieId: string) {
  return db.query.favorites.findFirst({
    where: and(eq(favorites.userId, userId), eq(favorites.movieId, movieId)),
  });
}

export async function addFavorite(
  userId: string,
  data: Omit<NewFavorite, "userId" | "id">
) {
  const existing = await getFavorite(userId, data.movieId);
  if (existing) return existing;

  const [created] = await db
    .insert(favorites)
    .values({ ...data, userId })
    .returning();
  return created;
}

export async function removeFavorite(userId: string, movieId: string) {
  await db
    .delete(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.movieId, movieId)));
}

export async function isFavorite(userId: string, movieId: string) {
  const fav = await getFavorite(userId, movieId);
  return !!fav;
}
