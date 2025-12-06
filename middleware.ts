import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
  // Handle Clerk proxy requests
  if (request.nextUrl.pathname.startsWith("/__clerk")) {
    const clerkUrl = new URL(
      request.nextUrl.pathname.replace("/__clerk", ""),
      "https://clerk.customsai.co"
    );
    clerkUrl.search = request.nextUrl.search;

    return NextResponse.rewrite(clerkUrl, {
      headers: {
        "Clerk-Proxy-Url": "https://customsai.co/__clerk",
      },
    });
  }

  // Run Clerk middleware for all other requests
  return clerkMiddleware()(request, {} as any);
}

export const config = {
  matcher: [
    // Include __clerk proxy path
    "/__clerk/(.*)",
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
