"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Movie } from "@/types/movie";

interface MovieCardProps {
  movie: Movie;
  progress?: number; // 0-100 percentage
  className?: string;
  showProgress?: boolean;
}

export function MovieCard({
  movie,
  progress,
  className,
  showProgress = true,
}: MovieCardProps) {
  const hasProgress = showProgress && progress !== undefined && progress > 0;

  return (
    <Link href={`/movie/${movie.id}`} className={cn("block group", className)}>
      <div className="movie-card relative rounded-lg overflow-hidden bg-dark-card">
        {/* Poster */}
        <div className="relative aspect-[2/3]">
          {movie.poster ? (
            <Image
              src={movie.poster}
              alt={movie.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
            />
          ) : (
            <div className="w-full h-full bg-dark-lighter flex items-center justify-center">
              <span className="text-gray-500 text-sm">No Image</span>
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
          </div>

          {/* Type badge */}
          <div className="absolute top-2 left-2">
            <span
              className={cn(
                "px-2 py-0.5 text-xs font-medium rounded",
                movie.type === "series"
                  ? "bg-blue-500 text-white"
                  : "bg-primary text-white"
              )}
            >
              {movie.type === "series" ? "TV" : "Movie"}
            </span>
          </div>

          {/* Rating badge */}
          {movie.rating && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 rounded px-1.5 py-0.5">
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-white">{movie.rating}</span>
            </div>
          )}

          {/* Progress bar */}
          {hasProgress && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-medium text-white truncate group-hover:text-primary transition-colors">
            {movie.title}
          </h3>
          <p className="text-sm text-gray-400 mt-0.5">{movie.year}</p>
        </div>
      </div>
    </Link>
  );
}
