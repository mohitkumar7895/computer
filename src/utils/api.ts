/**
 * Utility for making API requests with automatic token attachment.
 */

export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("auth_token");
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Optional: handle unauthorized globally
    // localStorage.removeItem("auth_token");
    // window.location.href = "/atc/login";
  }

  return response;
}
