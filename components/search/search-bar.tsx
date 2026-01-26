"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { cn } from "@/lib/utils/cn";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export function SearchBar({
  onSearch,
  placeholder = "Search movies...",
  autoFocus = false,
  className,
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [isFocused, setIsFocused] = useState(false);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    if (onSearch) {
      onSearch(value);
    } else if (value.trim()) {
      router.push(`/search?q=${encodeURIComponent(value)}`);
    }
  }, 300);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (onSearch) {
        onSearch(query);
      } else {
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }
    }
  };

  const handleClear = () => {
    setQuery("");
    if (onSearch) {
      onSearch("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-center bg-dark-lighter border rounded-md transition-all",
          isFocused
            ? "border-primary ring-1 ring-primary"
            : "border-dark-border"
        )}
      >
        <Search className="h-4 w-4 text-gray-500 ml-3" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent text-white placeholder-gray-500 px-3 py-2 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="p-2 text-gray-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
}
