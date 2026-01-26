"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Play, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ProgressItem } from "@/types/progress";

interface ContinueWatchingRowProps {
  title?: string;
  showViewAll?: boolean;
  limit?: number;
}

export function ContinueWatchingRow({
  title = "Continue Watching",
  showViewAll = true,
  limit = 10,
}: ContinueWatchingRowProps) {
  const { data: session } = useSession();
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProgress();
    } else {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  const fetchProgress = async () => {
    try {
      const response = await fetch("/api/progress");
      const data = await response.json();
      // Filter out completed items and limit
      const inProgress = data.items
        ?.filter((item: ProgressItem) => !item.completed && item.progressPercent < 90)
        .slice(0, limit) || [];
      setItems(inProgress);
    } catch (error) {
      console.error("Failed to fetch progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (movieId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await fetch(`/api/progress/${movieId}`, { method: "DELETE" });
      setItems(items.filter((item) => item.movieId !== movieId));
    } catch (error) {
      console.error("Failed to remove progress:", error);
    }
  };

  if (!session || isLoading) {
    return null;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {showViewAll && (
          <Link
            href="/continue-watching"
            className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
          >
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        )}
      </div>

      {/* Horizontal scroll container */}
      <div className="relative -mx-4 px-4">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
          {items.map((item) => (
            <Link
              key={item.movieId}
              href={`/movie/${item.movieId}`}
              className="flex-shrink-0 w-64 group"
            >
              <div className="relative rounded-lg overflow-hidden bg-dark-card">
                {/* Thumbnail */}
                <div className="relative aspect-video">
                  {item.moviePoster ? (
                    <Image
                      src={item.moviePoster}
                      alt={item.movieTitle || "Movie"}
                      fill
                      className="object-cover"
                      sizes="256px"
                    />
                  ) : (
                    <div className="w-full h-full bg-dark-lighter" />
                  )}

                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      <Play className="h-6 w-6 text-white fill-white" />
                    </div>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={(e) => removeItem(item.movieId, e)}
                    className="absolute top-2 right-2 p-1 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>

                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-medium text-white truncate group-hover:text-primary transition-colors">
                    {item.movieTitle || `Movie ${item.movieId}`}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {item.progressPercent}% watched
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
