"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/search/search-bar";
import { MovieGrid } from "@/components/movie/movie-grid";
import { MovieGridSkeleton } from "@/components/ui/skeleton";
import type { Movie } from "@/types/movie";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (query) {
      searchMovies(query);
    }
  }, [query]);

  const searchMovies = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setMovies([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/movies/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setMovies(data.results || []);
    } catch (error) {
      console.error("Search error:", error);
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Search Movies</h1>
        <div className="max-w-2xl">
          <SearchBar
            onSearch={(q) => {
              if (q) {
                window.history.pushState({}, "", `/search?q=${encodeURIComponent(q)}`);
                searchMovies(q);
              }
            }}
            placeholder="Search for movies and TV shows..."
            autoFocus
            className="w-full"
          />
        </div>
      </div>

      {/* Results */}
      {query && (
        <p className="text-gray-400 mb-4">
          {isLoading
            ? "Searching..."
            : `${movies.length} results for "${query}"`}
        </p>
      )}

      {isLoading ? (
        <MovieGridSkeleton count={12} />
      ) : hasSearched ? (
        <MovieGrid
          movies={movies}
          emptyMessage={`No results found for "${query}"`}
        />
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">
            Enter a search term to find movies
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<MovieGridSkeleton count={12} />}>
      <SearchContent />
    </Suspense>
  );
}
