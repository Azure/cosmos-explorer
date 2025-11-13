/**
 * Perform a fetch with an AbortController-based timeout. Returns the Response or throws (including AbortError on timeout).
 *
 * Usage: await fetchWithTimeout(url, { method: 'GET', headers: {...} }, 10000);
 *
 * A shared helper to remove duplicated inline implementations across the codebase.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = 5000,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Convenience wrapper that returns null instead of throwing on timeout / network error.
 * Useful for feature probing scenarios where failure should be treated as absence.
 */
export async function tryFetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = 5000,
): Promise<Response | null> {
  try {
    return await fetchWithTimeout(url, init, timeoutMs);
  } catch {
    return null;
  }
}
