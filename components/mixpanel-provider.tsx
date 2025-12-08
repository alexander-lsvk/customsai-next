"use client";

import { useEffect } from "react";
import mixpanel from "mixpanel-browser";

export function MixpanelProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    mixpanel.init("ae5913c729784773169183e50e54a611", {
      autocapture: true,
      record_sessions_percent: 100,
    });
  }, []);

  return <>{children}</>;
}
