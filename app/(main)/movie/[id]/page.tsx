"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { MoviePlayer } from "@/components/movie/movie-player";
import { MovieDetails } from "@/components/movie/movie-details";
import { MovieDetailsSkeleton } from "@/components/ui/skeleton";
import type { MovieDetails as MovieDetailsType } from "@/types/movie";

interface EmbedSource {
  url: string;
  serverName: string;
  serverId: string;
}

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
  const [embedUrls, setEmbedUrls] = useState<EmbedSource[]>([]);
  const [currentServerIndex, setCurrentServerIndex] = useState(0);
  const [initialProgress, setInitialProgress] = useState(0);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isLoadingStream, setIsLoadingStream] = useState(false);

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
    setStreamError(null);
    setIsLoadingStream(true);
    
    // Get the stream URL
    try {
      const response = await fetch(`/api/movies/stream?id=${id}`);
      const data = await response.json();
      
      if (data.embedUrls && data.embedUrls.length > 0) {
        setEmbedUrls(data.embedUrls);
        setCurrentServerIndex(0);
        setEmbedUrl(data.embedUrls[0].url);
        setIsPlaying(true);
      } else if (data.embedUrl) {
        setEmbedUrl(data.embedUrl);
        setIsPlaying(true);
      } else {
        // No stream available
        setStreamError(data.error || "No stream available for this movie. The content may have been removed.");
      }
    } catch (error) {
      console.error("Failed to get stream:", error);
      setStreamError("Failed to load stream. Please try again later.");
    } finally {
      setIsLoadingStream(false);
    }
  };

  const handleServerChange = (index: number) => {
    if (embedUrls[index]) {
      setCurrentServerIndex(index);
      setEmbedUrl(embedUrls[index].url);
    }
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
      {/* Stream Error Message */}
      {streamError && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 mx-4 mt-4 rounded-lg">
          <p className="font-medium">Stream Unavailable</p>
          <p className="text-sm mt-1">{streamError}</p>
          <button 
            onClick={() => setStreamError(null)}
            className="mt-2 text-sm underline hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading Stream Indicator */}
      {isLoadingStream && (
        <div className="bg-gray-800 text-gray-200 px-4 py-3 mx-4 mt-4 rounded-lg flex items-center gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-white rounded-full"></div>
          <p>Finding available stream...</p>
        </div>
      )}

      {/* Video Player */}
      {isPlaying && embedUrl && (
        <div className="sticky top-16 z-40 bg-black">
          <MoviePlayer
            movieId={movie.id}
            title={movie.title}
            poster={movie.poster}
            embedUrl={embedUrl}
            initialProgress={initialProgress}
          />
          {/* Server Selection */}
          {embedUrls.length > 1 && (
            <div className="bg-gray-900 px-4 py-3 border-t border-gray-800">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-gray-400 text-sm">Video not working? Try another server:</span>
                {embedUrls.map((source, index) => (
                  <button
                    key={source.serverId}
                    onClick={() => handleServerChange(index)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      index === currentServerIndex
                        ? "bg-red-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {source.serverName.replace('Server ', '')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Movie Details */}
      <MovieDetails movie={movie} onPlay={handlePlay} isLoading={isLoadingStream} />
    </div>
  );
}
