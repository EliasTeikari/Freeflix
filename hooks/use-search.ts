"use client";

import { useState, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import type { Movie } from "@/types/movie";

export function useSearch() {
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setQuery("");
      return;
    }

    setQuery(searchQuery);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/movies/search?q=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search for input fields
  const debouncedSearch = useDebouncedCallback(search, 300);

  const clear = useCallback(() => {
    setResults([]);
    setQuery("");
    setError(null);
  }, []);

  return {
    results,
    isLoading,
    query,
    error,
    search,
    debouncedSearch,
    clear,
  };
}
