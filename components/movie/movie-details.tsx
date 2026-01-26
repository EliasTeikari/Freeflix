"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Heart, Star, Clock, Calendar, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { MovieDetails as MovieDetailsType } from "@/types/movie";

interface MovieDetailsProps {
  movie: MovieDetailsType;
  onPlay?: () => void;
}

export function MovieDetails({ movie, onPlay }: MovieDetailsProps) {
  const { data: session } = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if movie is favorited
  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/favorites/${movie.id}`)
        .then((res) => res.json())
        .then((data) => setIsFavorite(data.isFavorite))
        .catch(() => {});
    }
  }, [session?.user?.id, movie.id]);

  const toggleFavorite = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      if (isFavorite) {
        await fetch(`/api/favorites/${movie.id}`, { method: "DELETE" });
        setIsFavorite(false);
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            movieId: movie.id,
            movieTitle: movie.title,
            moviePoster: movie.poster,
          }),
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Backdrop */}
      {movie.backdrop && (
        <div className="absolute inset-0 h-[400px]">
          <Image
            src={movie.backdrop}
            alt={movie.title}
            fill
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/80 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 pt-24">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <div className="relative w-64 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
              {movie.poster ? (
                <Image
                  src={movie.poster}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-dark-lighter flex items-center justify-center">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {movie.title}
            </h1>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-6">
              {movie.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white font-medium">{movie.rating}</span>
                </div>
              )}
              {movie.year && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{movie.year}</span>
                </div>
              )}
              {movie.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{movie.duration}</span>
                </div>
              )}
              <span
                className={cn(
                  "px-2 py-0.5 text-sm font-medium rounded",
                  movie.type === "series"
                    ? "bg-blue-500 text-white"
                    : "bg-primary text-white"
                )}
              >
                {movie.type === "series" ? "TV Series" : "Movie"}
              </span>
            </div>

            {/* Genres */}
            {movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-dark-lighter border border-dark-border rounded-full text-sm text-gray-300"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <p className="text-gray-300 leading-relaxed mb-6">
              {movie.description}
            </p>

            {/* Cast */}
            {movie.cast.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Cast</h3>
                <p className="text-gray-300">{movie.cast.join(", ")}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button onClick={onPlay} size="lg" className="gap-2">
                <Play className="h-5 w-5 fill-current" />
                Watch Now
              </Button>

              {session && (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={toggleFavorite}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Heart
                    className={cn(
                      "h-5 w-5",
                      isFavorite && "fill-primary text-primary"
                    )}
                  />
                  {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                </Button>
              )}
            </div>

            {/* Available streams */}
            {movie.streams.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-400 mb-3">
                  Available Servers
                </h3>
                <div className="flex flex-wrap gap-2">
                  {movie.streams.map((stream, index) => (
                    <button
                      key={index}
                      onClick={onPlay}
                      className="px-4 py-2 bg-dark-lighter border border-dark-border rounded-md text-sm text-gray-300 hover:bg-dark-border hover:text-white transition-colors"
                    >
                      {stream.server} - {stream.quality}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
