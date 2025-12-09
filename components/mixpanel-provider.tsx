"use client";

import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import mixpanel from "mixpanel-browser";

export function MixpanelProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    mixpanel.init("ae5913c729784773169183e50e54a611", {
      autocapture: true,
      record_sessions_percent: 100,
    });
  }, []);

  // Identify user when signed in
  useEffect(() => {
    if (isSignedIn && userId) {
      mixpanel.identify(userId);
      mixpanel.people.set({
        $email: user?.primaryEmailAddress?.emailAddress,
        $name: user?.fullName || user?.firstName,
        $created: user?.createdAt,
      });
    } else if (isSignedIn === false) {
      // Reset when user signs out
      mixpanel.reset();
    }
  }, [isSignedIn, userId, user]);

  return <>{children}</>;
}
