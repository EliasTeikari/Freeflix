import NextAuth from "next-auth";
import { edgeAuthConfig } from "@/lib/auth/edge-config";

// Use edge-compatible config that doesn't import ioredis/postgres
export default NextAuth(edgeAuthConfig).auth;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
