/** Warm browser image cache before React paints the template. */
export function preloadImageUrl(url: string): void {
  if (typeof window === "undefined" || !url) return;
  const img = new Image();
  img.decoding = "async";
  img.fetchPriority = "high";
  img.src = url;
}
