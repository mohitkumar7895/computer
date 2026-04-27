/**
 * Browser API requests with same-origin cookies (httpOnly session) and optional Bearer from localStorage.
 */

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const raw =
    typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : null;
  const bearer = raw?.trim() || "";

  const headers = new Headers(options.headers);
  if (bearer && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${bearer}`);
  }

  return fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });
}
