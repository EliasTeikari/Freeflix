"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { MoviePlayer } from "@/components/movie/movie-player";
import { MovieDetails } from "@/components/movie/movie-details";
import { MovieDetailsSkeleton } from "@/components/ui/skeleton";
import type { MovieDetails as MovieDetailsType } from "@/types/movie";

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export default function MoviePage({ params }: MoviePageProps) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [movie, setMovie] = useState<MovieDetailsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [initialProgress, setInitialProgress] = useState(0);

  // Fetch movie details
  useEffect(() => {
    fetchMovie();
  }, [id]);

  // Fetch user progress
  useEffect(() => {
    if (session?.user?.id && id) {
      fetchProgress();
    }
  }, [session?.user?.id, id]);

  const fetchMovie = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/movies/${id}`);
      if (!response.ok) {
        throw new Error("Movie not found");
      }
      const data = await response.json();
      setMovie(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load movie");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/progress/${id}`);
      const data = await response.json();
      if (data.progressSeconds > 0) {
        setInitialProgress(data.progressSeconds);
      }
    } catch (error) {
      console.error("Failed to fetch progress:", error);
    }
  };

  const handlePlay = async () => {
    // Get the stream URL
    try {
      const response = await fetch(`/api/movies/stream?id=${id}`);
      const data = await response.json();
      if (data.embedUrl) {
        setEmbedUrl(data.embedUrl);
      }
    } catch (error) {
      console.error("Failed to get stream:", error);
    }
    setIsPlaying(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <MovieDetailsSkeleton />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold text-white mb-2">Movie Not Found</h1>
          <p className="text-gray-400">{error || "The requested movie could not be found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Video Player */}
      {isPlaying && (
        <div className="sticky top-16 z-40 bg-black">
          <MoviePlayer
            movieId={movie.id}
            title={movie.title}
            poster={movie.poster}
            embedUrl={embedUrl || undefined}
            initialProgress={initialProgress}
          />
        </div>
      )}

      {/* Movie Details */}
      <MovieDetails movie={movie} onPlay={handlePlay} />
    </div>
  );
}
