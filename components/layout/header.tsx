"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, User, LogOut, Heart, Play, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search/search-bar";

export function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-dark via-dark/80 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-primary">FREEFLIX</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Home
            </Link>
            {session && (
              <>
                <Link
                  href="/continue-watching"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-1"
                >
                  <Play className="h-4 w-4" />
                  Continue
                </Link>
                <Link
                  href="/favorites"
                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-1"
                >
                  <Heart className="h-4 w-4" />
                  Favorites
                </Link>
              </>
            )}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-md mx-6">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Mobile Search Toggle */}
            <button
              className="md:hidden p-2 text-gray-300 hover:text-white"
              onClick={() => router.push("/search")}
            >
              <Search className="h-5 w-5" />
            </button>

            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-dark-lighter animate-pulse" />
            ) : session ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-dark-lighter transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden sm:block text-sm text-gray-300">
                    {session.user?.name || session.user?.email?.split("@")[0]}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-dark-card border border-dark-border rounded-lg shadow-lg py-1">
                    <Link
                      href="/favorites"
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-lighter hover:text-white"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      My Favorites
                    </Link>
                    <Link
                      href="/continue-watching"
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-lighter hover:text-white"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Continue Watching
                    </Link>
                    <hr className="my-1 border-dark-border" />
                    <button
                      onClick={() => signOut()}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-dark-lighter hover:text-white"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register" className="hidden sm:block">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-gray-300 hover:text-white"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t border-dark-border">
            <nav className="flex flex-col space-y-2">
              <Link
                href="/"
                className="px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-lighter rounded-md"
                onClick={() => setShowMobileMenu(false)}
              >
                Home
              </Link>
              {session && (
                <>
                  <Link
                    href="/continue-watching"
                    className="px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-lighter rounded-md"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Continue Watching
                  </Link>
                  <Link
                    href="/favorites"
                    className="px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-lighter rounded-md"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    My Favorites
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
