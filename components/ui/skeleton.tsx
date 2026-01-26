"use client";

import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "rectangular" | "circular" | "text";
}

export function Skeleton({
  className,
  variant = "rectangular",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-md",
        variant === "text" && "rounded h-4",
        className
      )}
      {...props}
    />
  );
}

export function MovieCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="w-full aspect-[2/3]" />
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-1/2" />
    </div>
  );
}

export function MovieGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function MovieDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="w-full aspect-video max-h-[500px]" />
      <div className="space-y-4 px-4">
        <Skeleton variant="text" className="w-1/3 h-8" />
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-2/3" />
      </div>
    </div>
  );
}
