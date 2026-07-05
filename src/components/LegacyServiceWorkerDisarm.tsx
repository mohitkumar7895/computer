"use client";

import { useEffect } from "react";

const DISARM_KEY = "legacy_sw_disarmed";

/** Remove stale service workers without reloading sibling tabs. */
export default function LegacyServiceWorkerDisarm() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    try {
      if (sessionStorage.getItem(DISARM_KEY) === "1") return;
      sessionStorage.setItem(DISARM_KEY, "1");
    } catch {
      return;
    }

    void navigator.serviceWorker.getRegistrations().then((registrations) =>
      Promise.all(registrations.map((registration) => registration.unregister())),
    );
  }, []);

  return null;
}
