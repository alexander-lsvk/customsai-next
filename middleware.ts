import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
  // Handle Clerk proxy requests - forward to Clerk's Frontend API
  if (request.nextUrl.pathname.startsWith("/__clerk")) {
    const path = request.nextUrl.pathname.replace("/__clerk", "");
    const clerkUrl = new URL(path, "https://frontend-api.clerk.dev");
    clerkUrl.search = request.nextUrl.search;

    // Clone headers and add proxy header
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      // Skip host header as it should be the target host
      if (key.toLowerCase() !== "host") {
        headers.set(key, value);
      }
    });
    headers.set("Clerk-Proxy-Url", "https://customsai.co/__clerk");

    // Fetch from Clerk API
    const response = await fetch(clerkUrl.toString(), {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? await request.text() : undefined,
    });

    // Return the response with CORS headers
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
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
