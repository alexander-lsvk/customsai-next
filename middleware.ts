import { NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

function proxyMiddleware(req: NextRequest) {
  if (req.nextUrl.pathname.match("__clerk")) {
    const proxyHeaders = new Headers(req.headers);
    proxyHeaders.set(
      "Clerk-Proxy-Url",
      process.env.NEXT_PUBLIC_CLERK_PROXY_URL || "https://customsai.co/__clerk"
    );
    proxyHeaders.set("Clerk-Secret-Key", process.env.CLERK_SECRET_KEY || "");

    // Set X-Forwarded-For header
    const forwardedFor = req.headers.get("X-Forwarded-For") || req.ip || "";
    if (forwardedFor) {
      proxyHeaders.set("X-Forwarded-For", forwardedFor);
    }

    const proxyUrl = new URL(req.url);
    proxyUrl.host = "frontend-api.clerk.dev";
    proxyUrl.port = "443";
    proxyUrl.protocol = "https";
    proxyUrl.pathname = proxyUrl.pathname.replace("/__clerk", "");

    return NextResponse.rewrite(proxyUrl, {
      request: {
        headers: proxyHeaders,
      },
    });
  }

  return null;
}

const clerkHandler = clerkMiddleware();

export default function middleware(req: NextRequest) {
  const proxyResponse = proxyMiddleware(req);
  if (proxyResponse) {
    return proxyResponse;
  }

  return clerkHandler(req, {} as any);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc|__clerk)(.*)",
  ],
};
