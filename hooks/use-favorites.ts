"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface FavoriteItem {
  movieId: string;
  movieTitle: string | null;
  moviePoster: string | null;
  addedAt: string;
}

interface AddFavoriteData {
  movieId: string;
  movieTitle?: string;
  moviePoster?: string;
}

export function useFavorites() {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/favorites");
      const data = await response.json();
      setFavorites(data.items || []);
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  const addFavorite = useCallback(
    async (data: AddFavoriteData) => {
      if (!session?.user?.id) return false;

      try {
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          setFavorites((prev) => [
            {
              movieId: data.movieId,
              movieTitle: data.movieTitle || null,
              moviePoster: data.moviePoster || null,
              addedAt: new Date().toISOString(),
            },
            ...prev,
          ]);
          return true;
        }
        return false;
      } catch (error) {
        console.error("Failed to add favorite:", error);
        return false;
      }
    },
    [session?.user?.id]
  );

  const removeFavorite = useCallback(
    async (movieId: string) => {
      if (!session?.user?.id) return false;

      try {
        const response = await fetch(`/api/favorites/${movieId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setFavorites((prev) =>
            prev.filter((fav) => fav.movieId !== movieId)
          );
          return true;
        }
        return false;
      } catch (error) {
        console.error("Failed to remove favorite:", error);
        return false;
      }
    },
    [session?.user?.id]
  );

  const isFavorite = useCallback(
    (movieId: string) => {
      return favorites.some((fav) => fav.movieId === movieId);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (data: AddFavoriteData) => {
      if (isFavorite(data.movieId)) {
        return removeFavorite(data.movieId);
      }
      return addFavorite(data);
    },
    [isFavorite, removeFavorite, addFavorite]
  );

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites,
  };
}

export function useFavoriteStatus(movieId: string) {
  const { data: session } = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkFavorite = useCallback(async () => {
    if (!session?.user?.id || !movieId) return;

    try {
      const response = await fetch(`/api/favorites/${movieId}`);
      const data = await response.json();
      setIsFavorite(data.isFavorite);
    } catch (error) {
      console.error("Failed to check favorite status:", error);
    }
  }, [session?.user?.id, movieId]);

  const toggle = useCallback(
    async (data: AddFavoriteData) => {
      if (!session?.user?.id) return false;

      setIsLoading(true);
      try {
        if (isFavorite) {
          const response = await fetch(`/api/favorites/${movieId}`, {
            method: "DELETE",
          });
          if (response.ok) {
            setIsFavorite(false);
            return true;
          }
        } else {
          const response = await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (response.ok) {
            setIsFavorite(true);
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user?.id, isFavorite, movieId]
  );

  useEffect(() => {
    checkFavorite();
  }, [checkFavorite]);

  return {
    isFavorite,
    isLoading,
    toggle,
    refetch: checkFavorite,
  };
}
