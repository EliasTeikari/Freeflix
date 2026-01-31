import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth configuration for middleware/proxy.
 * This config does NOT include Credentials provider or any database imports
 * to avoid importing ioredis/postgres in the edge runtime.
 */
export const edgeAuthConfig: NextAuthConfig = {
  providers: [], // Providers are added in the full config
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtectedRoute =
        nextUrl.pathname.startsWith("/favorites") ||
        nextUrl.pathname.startsWith("/continue-watching");
      const isOnAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

      if (isOnProtectedRoute && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      if (isOnAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
};
