export interface Movie {
  id: string;
  title: string;
  poster: string;
  year: string;
  type: "movie" | "series";
  rating?: string;
}

export interface MovieDetails extends Movie {
  backdrop?: string;
  description: string;
  duration: string;
  genres: string[];
  cast: string[];
  streams: StreamSource[];
}

export interface StreamSource {
  server: string;
  quality: string;
  url: string;
}

export interface SearchResult {
  results: Movie[];
}
