import { eq, and, desc } from "drizzle-orm";
import { db, users, watchProgress, favorites } from "./index";
import type { NewUser, NewWatchProgress, NewFavorite } from "./schema";

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

// Watch progress queries
export async function getWatchProgressByUser(userId: string) {
  return db.query.watchProgress.findMany({
    where: eq(watchProgress.userId, userId),
    orderBy: [desc(watchProgress.lastWatched)],
  });
}

export async function getWatchProgressByMovie(userId: string, movieId: string) {
  return db.query.watchProgress.findFirst({
    where: and(
      eq(watchProgress.userId, userId),
      eq(watchProgress.movieId, movieId)
    ),
  });
}

export async function upsertWatchProgress(
  userId: string,
  data: Omit<NewWatchProgress, "userId" | "id">
) {
  const existing = await getWatchProgressByMovie(userId, data.movieId);

  if (existing) {
    const [updated] = await db
      .update(watchProgress)
      .set({
        ...data,
        lastWatched: new Date(),
        completed:
          data.totalDuration && data.progressSeconds
            ? data.progressSeconds / data.totalDuration > 0.9
            : false,
      })
      .where(eq(watchProgress.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(watchProgress)
    .values({
      ...data,
      userId,
      completed:
        data.totalDuration && data.progressSeconds
          ? data.progressSeconds / data.totalDuration > 0.9
          : false,
    })
    .returning();
  return created;
}

export async function deleteWatchProgress(userId: string, movieId: string) {
  await db
    .delete(watchProgress)
    .where(
      and(eq(watchProgress.userId, userId), eq(watchProgress.movieId, movieId))
    );
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
