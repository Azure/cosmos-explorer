/**
 * Perform a fetch with an AbortController-based timeout. Returns the Response or throws (including AbortError on timeout).
 *
 * Usage: await fetchWithTimeout(url, { method: 'GET', headers: {...} }, 10000);
 *
 * If `init.signal` is provided, it is combined with the internal timeout: aborting
 * the caller's signal aborts the fetch (propagating the caller's abort reason), and
 * the timeout still applies. Pass `timeoutMs: Infinity` to disable the timeout entirely
 * (useful for long-running operations that should rely solely on caller cancellation).
 *
 * A shared helper to remove duplicated inline implementations across the codebase.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = 5000,
): Promise<Response> {
  const externalSignal = init.signal;
  if (externalSignal?.aborted) {
    throw externalSignal.reason ?? new DOMException("The operation was aborted.", "AbortError");
  }

  const controller = new AbortController();
  const hasTimeout = Number.isFinite(timeoutMs);
  const timeoutId = hasTimeout ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

  let onExternalAbort: (() => void) | undefined;
  if (externalSignal) {
    onExternalAbort = () => controller.abort(externalSignal.reason);
    externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    if (externalSignal && onExternalAbort) {
      externalSignal.removeEventListener("abort", onExternalAbort);
    }
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
