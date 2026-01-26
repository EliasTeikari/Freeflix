"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Play, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProgressItem } from "@/types/progress";

export default function ContinueWatchingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchProgress();
    }
  }, [status, router]);

  const fetchProgress = async () => {
    try {
      const response = await fetch("/api/progress");
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Failed to fetch progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (movieId: string) => {
    try {
      await fetch(`/api/progress/${movieId}`, { method: "DELETE" });
      setItems(items.filter((item) => item.movieId !== movieId));
    } catch (error) {
      console.error("Failed to remove progress:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Continue Watching</h1>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Continue Watching</h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Clock className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-white mb-2">
            No watch history yet
          </h2>
          <p className="text-gray-400 mb-6">
            Start watching movies and your progress will be saved here
          </p>
          <Link href="/">
            <Button>Browse Movies</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.movieId}
              className="flex gap-4 bg-dark-card border border-dark-border rounded-lg overflow-hidden hover:border-dark-lighter transition-colors"
            >
              {/* Thumbnail */}
              <Link
                href={`/movie/${item.movieId}`}
                className="relative flex-shrink-0 w-40 md:w-48 aspect-video group"
              >
                {item.moviePoster ? (
                  <Image
                    src={item.moviePoster}
                    alt={item.movieTitle || "Movie"}
                    fill
                    className="object-cover"
                    sizes="192px"
                  />
                ) : (
                  <div className="w-full h-full bg-dark-lighter" />
                )}

                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Play className="h-5 w-5 text-white fill-white" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${item.progressPercent}%` }}
                  />
                </div>
              </Link>

              {/* Info */}
              <div className="flex-1 py-3 pr-4">
                <Link href={`/movie/${item.movieId}`}>
                  <h3 className="font-medium text-white hover:text-primary transition-colors">
                    {item.movieTitle || `Movie ${item.movieId}`}
                  </h3>
                </Link>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-400">
                  <span>{item.progressPercent}% watched</span>
                  <span>
                    {formatDuration(item.progressSeconds)} /{" "}
                    {item.totalDuration
                      ? formatDuration(item.totalDuration)
                      : "Unknown"}
                  </span>
                  <span>Last watched: {formatDate(item.lastWatched)}</span>
                </div>

                {item.completed && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                    Completed
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center pr-4">
                <button
                  onClick={() => removeItem(item.movieId)}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  title="Remove from history"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
