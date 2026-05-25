/**
 * Resolve relative photo/image URLs against the API base URL.
 * Active Storage returns paths like `/rails/active_storage/blobs/redirect/...`
 * which need to be prefixed with the API host to work on device.
 */

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
const API_HOST = API_BASE.replace(/\/api\/v1\/?$/, '');

/**
 * Given a photo URL (possibly relative), return a fully qualified URL.
 * If the URL is already absolute, return it as-is.
 */
export function resolvePhotoUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Relative path — prefix with API host
  return `${API_HOST}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Resolve an array of photo URLs.
 */
export function resolvePhotoUrls(urls: string[]): string[] {
  return urls.map((u) => resolvePhotoUrl(u) ?? u);
}

/**
 * Android emulator uses 10.0.2.2 for host machine localhost.
 * iOS simulator uses localhost directly.
 * Physical devices need the network-accessible IP (Tailscale or LAN).
 */
export function getApiHost(): string {
  return API_HOST;
}