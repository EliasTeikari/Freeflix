"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-400 mb-8 max-w-md">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="secondary" onClick={() => window.location.href = "/"}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
