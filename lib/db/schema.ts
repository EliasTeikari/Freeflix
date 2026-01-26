import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const watchProgress = pgTable(
  "watch_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    movieId: varchar("movie_id", { length: 255 }).notNull(),
    movieTitle: varchar("movie_title", { length: 500 }),
    moviePoster: varchar("movie_poster", { length: 500 }),
    progressSeconds: integer("progress_seconds").default(0).notNull(),
    totalDuration: integer("total_duration"),
    lastWatched: timestamp("last_watched").defaultNow().notNull(),
    completed: boolean("completed").default(false).notNull(),
  },
  (table) => [
    uniqueIndex("watch_progress_user_movie_idx").on(table.userId, table.movieId),
    index("watch_progress_user_idx").on(table.userId),
    index("watch_progress_last_watched_idx").on(table.lastWatched),
  ]
);

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    movieId: varchar("movie_id", { length: 255 }).notNull(),
    movieTitle: varchar("movie_title", { length: 500 }),
    moviePoster: varchar("movie_poster", { length: 500 }),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("favorites_user_movie_idx").on(table.userId, table.movieId),
    index("favorites_user_idx").on(table.userId),
  ]
);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type WatchProgress = typeof watchProgress.$inferSelect;
export type NewWatchProgress = typeof watchProgress.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
