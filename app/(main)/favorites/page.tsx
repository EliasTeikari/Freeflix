"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { MovieGrid } from "@/components/movie/movie-grid";
import { MovieGridSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Movie } from "@/types/movie";

interface FavoriteItem {
  movieId: string;
  movieTitle: string;
  moviePoster: string;
  addedAt: string;
}

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchFavorites();
    }
  }, [status, router]);

  const fetchFavorites = async () => {
    try {
      const response = await fetch("/api/favorites");
      const data = await response.json();
      
      // Convert favorites to Movie format
      const movies: Movie[] = (data.items || []).map((fav: FavoriteItem) => ({
        id: fav.movieId,
        title: fav.movieTitle || `Movie ${fav.movieId}`,
        poster: fav.moviePoster || "",
        year: "",
        type: "movie" as const,
      }));
      
      setFavorites(movies);
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">My Favorites</h1>
        <MovieGridSkeleton count={12} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">My Favorites</h1>

      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-white mb-2">
            No favorites yet
          </h2>
          <p className="text-gray-400 mb-6">
            Add movies to your favorites to see them here
          </p>
          <Link href="/">
            <Button>Browse Movies</Button>
          </Link>
        </div>
      ) : (
        <MovieGrid
          movies={favorites}
          showProgress={false}
        />
      )}
    </div>
  );
}
