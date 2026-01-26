"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-dark-card border-t border-dark-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold text-primary">FREEFLIX</h2>
            <p className="text-gray-500 text-sm mt-1">
              Stream movies and TV shows for free
            </p>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/search" className="hover:text-white transition-colors">
              Browse
            </Link>
          </nav>

          <p className="text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} Freeflix. For educational purposes
            only.
          </p>
        </div>
      </div>
    </footer>
  );
}
