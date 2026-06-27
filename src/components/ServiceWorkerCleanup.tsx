"use client";

import { useEffect } from "react";

export default function ServiceWorkerCleanup() {
  useEffect(() => {
    const cleanup = async () => {
      if (typeof window === "undefined") return;

      try {
        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
        }
      } catch {
        // Ignore cleanup errors.
      }

      try {
        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((name) => caches.delete(name)));
        }
      } catch {
        // Ignore cleanup errors.
      }
    };

    cleanup();
  }, []);

  return null;
}
