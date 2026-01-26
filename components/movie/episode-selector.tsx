"use client";

import { useState, useEffect, useRef } from "react";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Season, Episode } from "@/types/movie";

interface EpisodeSelectorProps {
  seriesId: string;
  onEpisodeSelect: (episodeId: string, episodeNumber: number, seasonNumber: number) => void;
  currentEpisodeId?: string;
}

export function EpisodeSelector({
  seriesId,
  onEpisodeSelect,
  currentEpisodeId,
}: EpisodeSelectorProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(true);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Fetch seasons on mount
  useEffect(() => {
    fetchSeasons();
  }, [seriesId]);

  // Fetch episodes when season changes
  useEffect(() => {
    if (selectedSeason) {
      fetchEpisodes(selectedSeason.id);
    }
  }, [selectedSeason]);

  const fetchSeasons = async () => {
    setIsLoadingSeasons(true);
    setError(null);

    try {
      const response = await fetch(`/api/series/${seriesId}/episodes`);
      if (!response.ok) {
        throw new Error("Failed to fetch seasons");
      }
      const data = await response.json();

      if (data.seasons && data.seasons.length > 0) {
        setSeasons(data.seasons);
        setSelectedSeason(data.seasons[0]);
        // First season's episodes are included in the initial response
        if (data.episodes) {
          setEpisodes(data.episodes);
        }
      } else {
        setError("No seasons found for this series");
      }
    } catch (err) {
      console.error("Failed to fetch seasons:", err);
      setError("Failed to load seasons");
    } finally {
      setIsLoadingSeasons(false);
    }
  };

  const fetchEpisodes = async (seasonId: string) => {
    setIsLoadingEpisodes(true);

    try {
      const response = await fetch(`/api/series/${seriesId}/episodes?season=${seasonId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch episodes");
      }
      const data = await response.json();
      setEpisodes(data.episodes || []);
    } catch (err) {
      console.error("Failed to fetch episodes:", err);
      setEpisodes([]);
    } finally {
      setIsLoadingEpisodes(false);
    }
  };

  const handleSeasonSelect = (season: Season) => {
    if (season.id !== selectedSeason?.id) {
      setSelectedSeason(season);
    }
  };

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      tabsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (isLoadingSeasons) {
    return (
      <div className="mt-8">
        <div className="h-8 w-32 bg-dark-lighter rounded animate-pulse mb-4" />
        <div className="flex gap-3 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-24 bg-dark-lighter rounded animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-dark-lighter rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || seasons.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-white mb-4">Episodes</h2>

      {/* Season Tabs */}
      <div className="relative mb-6">
        {/* Scroll buttons */}
        {seasons.length > 4 && (
          <>
            <button
              onClick={() => scrollTabs("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-dark-card/90 rounded-full hover:bg-dark-lighter transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5 text-gray-400" />
            </button>
            <button
              onClick={() => scrollTabs("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-dark-card/90 rounded-full hover:bg-dark-lighter transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </>
        )}

        {/* Tabs container */}
        <div
          ref={tabsRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide px-1 py-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {seasons.map((season) => (
            <button
              key={season.id}
              onClick={() => handleSeasonSelect(season)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                selectedSeason?.id === season.id
                  ? "bg-primary text-white"
                  : "bg-dark-lighter text-gray-300 hover:bg-dark-border hover:text-white"
              )}
            >
              {season.name}
            </button>
          ))}
        </div>
      </div>

      {/* Episodes Grid */}
      {isLoadingEpisodes ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-dark-lighter rounded-lg animate-pulse" />
          ))}
        </div>
      ) : episodes.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No episodes found for this season
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {episodes.map((episode) => (
            <button
              key={episode.id}
              onClick={() => onEpisodeSelect(episode.id, episode.episodeNumber, selectedSeason?.seasonNumber || 1)}
              className={cn(
                "group relative p-4 rounded-lg border transition-all text-left",
                currentEpisodeId === episode.id
                  ? "bg-primary/20 border-primary"
                  : "bg-dark-card border-dark-border hover:border-primary/50 hover:bg-dark-lighter"
              )}
            >
              {/* Episode number */}
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  "text-lg font-bold",
                  currentEpisodeId === episode.id ? "text-primary" : "text-white"
                )}>
                  {episode.episodeNumber}
                </span>
                <div className={cn(
                  "p-1.5 rounded-full transition-colors",
                  currentEpisodeId === episode.id
                    ? "bg-primary text-white"
                    : "bg-dark-lighter text-gray-400 group-hover:bg-primary group-hover:text-white"
                )}>
                  <Play className="h-3 w-3 fill-current" />
                </div>
              </div>

              {/* Episode title */}
              <p className="text-sm text-gray-400 line-clamp-2" title={episode.title}>
                {episode.title}
              </p>

              {/* Currently playing indicator */}
              {currentEpisodeId === episode.id && (
                <div className="absolute top-2 right-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
