/**
 * A list of allowed URL protocols.
 * We explicitly disallow 'javascript:' and other potentially harmful protocols.
 * Only HTTPS and data URLs are allowed for security.
 */
const ALLOWED_PROTOCOLS = ['https://', 'data:'];

/**
 * Sanitizes a URL to ensure it's safe to use in contexts like `src` or `backgroundImage`.
 * It prevents XSS attacks by disallowing protocols like `javascript:`.
 *
 * @param url The URL to sanitize.
 * @returns The sanitized URL if it's safe, otherwise an empty string.
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return '';

  const trimmedUrl = url.trim();
  if (ALLOWED_PROTOCOLS.some(protocol => trimmedUrl.startsWith(protocol))) {
    return trimmedUrl;
  }

  // For local assets, allow paths that start with '/'
  if (trimmedUrl.startsWith('/')) {
    return trimmedUrl;
  }

  return '';
}
