"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useDebouncedCallback } from "use-debounce";
import type { ProgressItem, ProgressUpdate } from "@/types/progress";

export function useProgress(movieId?: string) {
  const { data: session } = useSession();
  const [progress, setProgress] = useState<ProgressItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch progress for a specific movie
  const fetchProgress = useCallback(async () => {
    if (!session?.user?.id || !movieId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/progress/${movieId}`);
      const data = await response.json();
      setProgress(data);
    } catch (error) {
      console.error("Failed to fetch progress:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, movieId]);

  // Save progress
  const saveProgress = useCallback(
    async (data: ProgressUpdate) => {
      if (!session?.user?.id) return;

      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch (error) {
        console.error("Failed to save progress:", error);
      }
    },
    [session?.user?.id]
  );

  // Debounced save for video player
  const debouncedSave = useDebouncedCallback(saveProgress, 10000);

  // Fetch progress on mount
  useEffect(() => {
    if (movieId) {
      fetchProgress();
    }
  }, [movieId, fetchProgress]);

  return {
    progress,
    isLoading,
    saveProgress,
    debouncedSave,
    refetch: fetchProgress,
  };
}

export function useAllProgress() {
  const { data: session } = useSession();
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/progress");
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Failed to fetch progress:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  const removeProgress = useCallback(
    async (movieId: string) => {
      if (!session?.user?.id) return;

      try {
        await fetch(`/api/progress/${movieId}`, { method: "DELETE" });
        setItems((prev) => prev.filter((item) => item.movieId !== movieId));
      } catch (error) {
        console.error("Failed to remove progress:", error);
      }
    },
    [session?.user?.id]
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    items,
    isLoading,
    removeProgress,
    refetch: fetchAll,
  };
}
