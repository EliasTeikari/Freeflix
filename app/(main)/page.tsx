import { Suspense } from "react";
import { getTrending } from "@/lib/services/myflixer";
import { MovieGrid } from "@/components/movie/movie-grid";
import { ContinueWatchingRow } from "@/components/progress/continue-watching-row";
import { MovieGridSkeleton } from "@/components/ui/skeleton";

async function TrendingMovies() {
  const movies = await getTrending();
  
  return (
    <MovieGrid 
      movies={movies} 
      emptyMessage="No trending movies available at the moment" 
    />
  );
}

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <section className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Welcome to Freeflix
        </h1>
        <p className="text-gray-400 text-lg">
          Stream your favorite movies and TV shows for free
        </p>
      </section>

      {/* Continue Watching */}
      <Suspense fallback={null}>
        <ContinueWatchingRow />
      </Suspense>

      {/* Trending Movies */}
      <section className="py-6">
        <h2 className="text-xl font-semibold text-white mb-4">Trending Now</h2>
        <Suspense fallback={<MovieGridSkeleton count={12} />}>
          <TrendingMovies />
        </Suspense>
      </section>
    </div>
  );
}
