export interface ProgressItem {
  movieId: string;
  movieTitle: string;
  moviePoster: string;
  progressSeconds: number;
  totalDuration: number;
  progressPercent: number;
  lastWatched: string;
  completed: boolean;
}

export interface ProgressUpdate {
  movieId: string;
  movieTitle: string;
  moviePoster: string;
  progressSeconds: number;
  totalDuration: number;
}
