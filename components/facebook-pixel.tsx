"use client";

import Script from "next/script";
import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

const FB_PIXEL_ID = "1176646150689241";

export function FacebookPixel() {
  const { isSignedIn, userId } = useAuth();

  // Track Lead event when user signs up (transitions from signed out to signed in)
  useEffect(() => {
    if (isSignedIn && userId && typeof window !== "undefined" && window.fbq) {
      // Check if we already tracked this user's sign-up
      const trackedKey = `fb_lead_tracked_${userId}`;
      if (!localStorage.getItem(trackedKey)) {
        window.fbq("track", "Lead", {
          content_name: "Sign Up",
          content_category: "Registration",
        });
        localStorage.setItem(trackedKey, "true");
      }
    }
  }, [isSignedIn, userId]);

  return (
    <>
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

// Helper function to track custom events from anywhere in the app
export function trackFBEvent(
  eventName: string,
  params?: Record<string, unknown>
) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, params);
  }
}
