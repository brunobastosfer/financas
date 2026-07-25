const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

function resolveApiBaseUrl() {
  if (configuredApiUrl) return configuredApiUrl;

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3333/api";
  }

  return "/api";
}

export function apiUrl(path: string) {
  const baseUrl = resolveApiBaseUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}
