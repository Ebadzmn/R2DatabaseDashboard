/**
 * Resolves a screenshot or poster image URL to ensure it always renders properly in the browser.
 * Handles relative R2 keys, backend proxy URLs, and direct CDN endpoints.
 */
export function resolveImageUrl(url?: string, movieId?: string): string {
  if (!url) return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
  const backendHost = apiBase.replace(/\/api\/?$/, "");

  // If already full HTTP/HTTPS URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // If it's a backend relative API route e.g. /api/...
  if (trimmed.startsWith("/api/")) {
    return `${backendHost}${trimmed}`;
  }

  // If it's an R2 key or relative path containing /screenshots/
  if (trimmed.includes("/screenshots/")) {
    const filename = trimmed.split("/").pop() || "screenshot_1.jpg";
    if (movieId) {
      return `${apiBase}/movies/${movieId}/screenshots/${filename}`;
    }
  }

  // Fallback to streaming CDN base
  const streamingBase = "https://pub-978e7a5dcf1145aeb50d511ce8af7c14.r2.dev";
  return `${streamingBase}/${trimmed.replace(/^\/+/, "")}`;
}
