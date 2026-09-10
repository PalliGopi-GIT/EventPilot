/**
 * HTML and text sanitization to prevent XSS and injection attacks.
 */

export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .trim();
}

/**
 * Strips dangerous control characters and truncates long text payloads safely.
 */
export function sanitizeSafeText(input: string | null | undefined, maxLength: number = 10000): string {
  if (!input) return "";
  // Strip control characters except newline and tab
  const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return cleaned.slice(0, maxLength);
}

/**
 * Strips any sensitive fields (tokens, passwords, secrets) before logging into AuditLog.
 */
export function sanitizeAuditDetails(details: Record<string, any>): string {
  const safeDetails = { ...details };
  const sensitiveKeys = [
    "token",
    "access_token",
    "refresh_token",
    "password",
    "secret",
    "apiKey",
    "encryptedAccessToken",
    "encryptedRefreshToken",
  ];

  for (const key of Object.keys(safeDetails)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      safeDetails[key] = "[REDACTED]";
    }
  }

  return JSON.stringify(safeDetails);
}
