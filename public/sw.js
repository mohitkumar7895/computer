// Legacy service worker cleanup.
// Old installs may still be registered. This version unregisters quietly and
// must NEVER reload other open tabs (e.g. admin panel while marksheet opens).

self.addEventListener("install", () => {
  // Do not call skipWaiting() — immediate activation used to reload every tab.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      } catch {
        /* ignore */
      }
      try {
        await self.registration.unregister();
      } catch {
        /* ignore */
      }
      // Never call client.navigate() here — that forced a full panel refresh.
    })(),
  );
});
