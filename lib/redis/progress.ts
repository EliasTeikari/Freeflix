import { redis, isRedisAvailable } from "./index";

// Cache key patterns
const PROGRESS_KEY = (userId: string, movieId: string) =>
  `progress:${userId}:${movieId}`;
const USER_PROGRESS_LIST_KEY = (userId: string) =>
  `progress:${userId}:all`;

// TTL in seconds (7 days for individual progress, 5 minutes for list)
const PROGRESS_TTL = 60 * 60 * 24 * 7; // 7 days
const LIST_TTL = 60 * 5; // 5 minutes

export interface CachedProgress {
  movieId: string;
  movieTitle: string | null;
  moviePoster: string | null;
  progressSeconds: number;
  totalDuration: number | null;
  lastWatched: string;
  completed: boolean;
}

/**
 * Get progress for a specific movie from cache
 */
export async function getProgressFromCache(
  userId: string,
  movieId: string
): Promise<CachedProgress | null> {
  try {
    if (!(await isRedisAvailable())) {
      return null;
    }

    const data = await redis.get(PROGRESS_KEY(userId, movieId));
    if (!data) {
      return null;
    }

    return JSON.parse(data) as CachedProgress;
  } catch (error) {
    console.error("Redis getProgressFromCache error:", error);
    return null;
  }
}

/**
 * Set progress in cache
 */
export async function setProgressInCache(
  userId: string,
  data: CachedProgress
): Promise<void> {
  try {
    if (!(await isRedisAvailable())) {
      return;
    }

    const key = PROGRESS_KEY(userId, data.movieId);
    await redis.setex(key, PROGRESS_TTL, JSON.stringify(data));

    // Invalidate the user's progress list cache since it's now stale
    await redis.del(USER_PROGRESS_LIST_KEY(userId));
  } catch (error) {
    console.error("Redis setProgressInCache error:", error);
  }
}

/**
 * Get all progress for a user from cache
 */
export async function getAllProgressFromCache(
  userId: string
): Promise<CachedProgress[] | null> {
  try {
    if (!(await isRedisAvailable())) {
      return null;
    }

    const data = await redis.get(USER_PROGRESS_LIST_KEY(userId));
    if (!data) {
      return null;
    }

    return JSON.parse(data) as CachedProgress[];
  } catch (error) {
    console.error("Redis getAllProgressFromCache error:", error);
    return null;
  }
}

/**
 * Set all progress for a user in cache (used after fetching from DB)
 */
export async function setAllProgressInCache(
  userId: string,
  items: CachedProgress[]
): Promise<void> {
  try {
    if (!(await isRedisAvailable())) {
      return;
    }

    // Cache the list with shorter TTL
    await redis.setex(
      USER_PROGRESS_LIST_KEY(userId),
      LIST_TTL,
      JSON.stringify(items)
    );

    // Also cache individual items for direct lookups
    const pipeline = redis.pipeline();
    for (const item of items) {
      pipeline.setex(
        PROGRESS_KEY(userId, item.movieId),
        PROGRESS_TTL,
        JSON.stringify(item)
      );
    }
    await pipeline.exec();
  } catch (error) {
    console.error("Redis setAllProgressInCache error:", error);
  }
}

/**
 * Delete progress from cache
 */
export async function deleteProgressFromCache(
  userId: string,
  movieId: string
): Promise<void> {
  try {
    if (!(await isRedisAvailable())) {
      return;
    }

    await redis.del(PROGRESS_KEY(userId, movieId));
    // Invalidate the list cache
    await redis.del(USER_PROGRESS_LIST_KEY(userId));
  } catch (error) {
    console.error("Redis deleteProgressFromCache error:", error);
  }
}
