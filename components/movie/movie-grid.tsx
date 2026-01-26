"use client";

import { MovieCard } from "./movie-card";
import { MovieGridSkeleton } from "@/components/ui/skeleton";
import type { Movie } from "@/types/movie";

interface MovieGridProps {
  movies: Movie[];
  isLoading?: boolean;
  progressMap?: Record<string, number>;
  emptyMessage?: string;
  showProgress?: boolean;
}

export function MovieGrid({
  movies,
  isLoading = false,
  progressMap = {},
  emptyMessage = "No movies found",
  showProgress = true,
}: MovieGridProps) {
  if (isLoading) {
    return <MovieGridSkeleton count={12} />;
  }

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-gray-400 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          progress={progressMap[movie.id]}
          showProgress={showProgress}
        />
      ))}
    </div>
  );
}
