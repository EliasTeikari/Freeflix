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
      // #region agent log
      fetch('http://127.0.0.1:7261/ingest/f6959da3-5263-4fea-98f1-fa4de831f1de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'movie/[id]/page.tsx:handlePlay',message:'Stream API response received',data:{id,responseStatus:response.status,responseOk:response.ok,data},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
      
      if (data.embedUrl) {
        setEmbedUrl(data.embedUrl);
        setIsPlaying(true);
      } else {
        // No stream available
        setStreamError(data.error || "No stream available for this movie. The content may have been removed.");
      }
    } catch (error) {
      console.error("Failed to get stream:", error);
      setStreamError("Failed to load stream. Please try again later.");
      // #region agent log
      fetch('http://127.0.0.1:7261/ingest/f6959da3-5263-4fea-98f1-fa4de831f1de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'movie/[id]/page.tsx:handlePlay:error',message:'Failed to get stream',data:{id,error:String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
      // #endregion
    } finally {
      setIsLoadingStream(false);
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
        </div>
      )}

      {/* Movie Details */}
      <MovieDetails movie={movie} onPlay={handlePlay} isLoading={isLoadingStream} />
    </div>
  );
}
