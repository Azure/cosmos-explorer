/* 

A general purpose fetch function for ARM resources. Not designed to be used directly
Instead, generate ARM clients that consume this function with stricter typing.

*/

import promiseRetry, { AbortError } from "p-retry";
import { HttpHeaders } from "../../Common/Constants";
import { configContext } from "../../ConfigContext";
import { userContext } from "../../UserContext";
import { fetchWithTimeout } from "../FetchWithTimeout";

interface ErrorResponse {
  code: string;
  message: string;
}

// ARM sometimes returns an error wrapped in a top level error object
// Example: 409 Conflict error when trying to delete a locked resource
interface WrappedErrorResponse {
  error: ErrorResponse;
}

type ParsedErrorResponse = ErrorResponse | WrappedErrorResponse;

export class ARMError extends Error {
  constructor(message: string) {
    super(message);
    // Set the prototype explicitly.
    // https://github.com/Microsoft/TypeScript/wiki/FAQ#why-doesnt-extending-built-ins-like-error-array-and-map-work
    Object.setPrototypeOf(this, ARMError.prototype);
  }

  public code?: string | number;
}

interface ARMQueryParams {
  filter?: string;
  metricNames?: string;
}

interface Options {
  host: string;
  path: string;
  apiVersion: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";
  body?: unknown;
  queryParams?: ARMQueryParams;
  contentType?: string;
  customHeaders?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

const DEFAULT_ARM_TIMEOUT_MS = 5000;

const isAbortError = (error: unknown): boolean => error instanceof Error && error.name === "AbortError";

export async function armRequestWithoutPolling<T>({
  host,
  path,
  apiVersion,
  method,
  body: requestBody,
  queryParams,
  contentType,
  customHeaders,
  signal,
  timeoutMs,
}: Options): Promise<{ result: T; operationStatusUrl: string }> {
  const url = new URL(path, host);
  url.searchParams.append("api-version", configContext.armAPIVersion || apiVersion);
  if (queryParams) {
    queryParams.filter && url.searchParams.append("$filter", queryParams.filter);
    queryParams.metricNames && url.searchParams.append("metricnames", queryParams.metricNames);
  }

  if (!userContext?.authorizationToken && !customHeaders?.["Authorization"]) {
    throw new Error("No authority token provided");
  }

  const headers: Record<string, string> = {
    Authorization: userContext.authorizationToken || customHeaders?.["Authorization"] || "",
    [HttpHeaders.contentType]: contentType || "application/json",
    ...(customHeaders || {}),
  };

  const fetchInit: RequestInit = {
    method,
    headers,
    body: requestBody ? JSON.stringify(requestBody) : undefined,
    signal,
  };

  const effectiveTimeoutMs = timeoutMs ?? DEFAULT_ARM_TIMEOUT_MS;
  const response = await fetchWithRetry(url.href, fetchInit, method, effectiveTimeoutMs, signal);

  if (!response.ok) {
    let error: ARMError;
    try {
      const errorResponse = (await response.json()) as ParsedErrorResponse;
      if ("error" in errorResponse) {
        error = new ARMError(errorResponse.error.message);
        error.code = errorResponse.error.code;
      } else {
        error = new ARMError(errorResponse.message);
        error.code = errorResponse.code;
      }
    } catch (error) {
      throw new Error(await response.text());
    }

    throw error;
  }

  const operationStatusUrl = (response.headers && response.headers.get("location")) || "";
  const responseBody = (await response.json()) as T;
  return { result: responseBody, operationStatusUrl: operationStatusUrl };
}

// TODO: This is very similar to what is happening in ResourceProviderClient.ts. Should probably merge them.
export async function armRequest<T>({
  host,
  path,
  apiVersion,
  method,
  body: requestBody,
  queryParams,
  contentType,
  customHeaders,
  signal,
  timeoutMs,
}: Options): Promise<T> {
  const armRequestResult = await armRequestWithoutPolling<T>({
    host,
    path,
    apiVersion,
    method,
    body: requestBody,
    queryParams,
    contentType,
    customHeaders,
    signal,
    timeoutMs,
  });
  const operationStatusUrl = armRequestResult.operationStatusUrl;
  if (operationStatusUrl) {
    if (signal?.aborted) {
      throw signal.reason ?? new DOMException("The operation was aborted.", "AbortError");
    }
    return await promiseRetry(() => getOperationStatus(operationStatusUrl, signal, timeoutMs), { signal });
  }
  return armRequestResult.result;
}

const getThrottleRetryDelay = (response: Response, attempt: number): number => {
  const retryAfter = response.headers?.get("Retry-After")?.trim();
  if (retryAfter) {
    if (/^\d+$/.test(retryAfter)) {
      return Number(retryAfter) * 1000;
    }
    if (Number.isNaN(Number(retryAfter))) {
      const retryAt = Date.parse(retryAfter);
      if (Number.isFinite(retryAt)) {
        return Math.max(0, retryAt - Date.now());
      }
    }
  }
  return Math.floor(1000 * 2 ** attempt * (1 + Math.random()));
};

const waitForRetry = (delayMs: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException("The operation was aborted.", "AbortError"));
      return;
    }
    const onAbort = (): void => {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onAbort);
      reject(signal?.reason ?? new DOMException("The operation was aborted.", "AbortError"));
    };
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);
    signal?.addEventListener("abort", onAbort, { once: true });
  });

/**
 * GET timeout and HTTP 429 retries share three attempts and a 30-second backoff budget.
 * Other responses and non-GET requests are not retried. Caller cancellation stops retries.
 */
async function fetchWithRetry(
  url: string,
  fetchInit: RequestInit,
  method: Options["method"],
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<Response> {
  if (method !== "GET") {
    return fetchWithTimeout(url, fetchInit, timeoutMs);
  }

  const RETRY_TIMEOUT_MULTIPLIERS = [1, 2, 4];
  const RETRY_BACKOFF_MS = 100;
  const MAX_BACKOFF_MS = 30000;
  let backoffMs = 0;

  for (let attempt = 0; ; attempt += 1) {
    const lastAttempt = attempt === RETRY_TIMEOUT_MULTIPLIERS.length - 1;
    let delayMs: number;
    try {
      const response = await fetchWithTimeout(url, fetchInit, timeoutMs * RETRY_TIMEOUT_MULTIPLIERS[attempt]);
      if (response.status !== 429 || lastAttempt) {
        return response;
      }
      delayMs = getThrottleRetryDelay(response, attempt);
      if (backoffMs + delayMs > MAX_BACKOFF_MS) {
        return response;
      }
    } catch (error) {
      if (lastAttempt || !isAbortError(error) || signal?.aborted || backoffMs + RETRY_BACKOFF_MS > MAX_BACKOFF_MS) {
        throw error;
      }
      delayMs = RETRY_BACKOFF_MS;
    }
    backoffMs += delayMs;
    await waitForRetry(delayMs, signal);
  }
}

async function getOperationStatus(
  operationStatusUrl: string,
  signal?: AbortSignal,
  timeoutMs = DEFAULT_ARM_TIMEOUT_MS,
) {
  if (!userContext.authorizationToken) {
    throw new Error("No authority token provided");
  }

  let response: Response;
  try {
    response = await fetchWithRetry(
      operationStatusUrl,
      {
        method: "GET",
        headers: { Authorization: userContext.authorizationToken },
        signal,
      },
      "GET",
      timeoutMs,
      signal,
    );
  } catch (error) {
    if (isAbortError(error)) {
      throw new AbortError(error as Error);
    }
    throw error;
  }

  if (!response.ok) {
    const parsedError = (await response.json()) as ParsedErrorResponse;
    const errorResponse = "error" in parsedError ? parsedError.error : parsedError;
    const error = new ARMError(errorResponse.message);
    error.code = errorResponse.code;
    throw new AbortError(error);
  }

  if (response.status === 204) {
    return;
  }

  const body = await response.json();
  const status = body.status;
  if (status === "Canceled" || status === "Failed") {
    const errorMessage = body.error ? JSON.stringify(body.error) : "Operation could not be completed";
    const error = new Error(errorMessage);
    throw new AbortError(error);
  }
  if (response.status === 200) {
    return body;
  }
  throw new Error(`Operation Response: ${JSON.stringify(body)}. Retrying.`);
}

export async function getOfferingIdsRequest<T>({
  host,
  path,
  apiVersion,
  method,
  body: requestBody,
  queryParams,
}: Options): Promise<{ result: T; operationStatusUrl: string }> {
  const url = new URL(path, host);
  url.searchParams.append("api-version", configContext.armAPIVersion || apiVersion);
  if (queryParams) {
    queryParams.filter && url.searchParams.append("$filter", queryParams.filter);
    queryParams.metricNames && url.searchParams.append("metricnames", queryParams.metricNames);
  }

  if (!configContext.CATALOG_API_KEY) {
    throw new Error("No catalog API key provided");
  }

  const response = await window.fetch(url.href, {
    method,
    headers: {
      [HttpHeaders.xAPIKey]: configContext.CATALOG_API_KEY,
    },
    body: requestBody ? JSON.stringify(requestBody) : undefined,
  });
  if (!response.ok) {
    let error: ARMError;
    try {
      const errorResponse = (await response.json()) as ParsedErrorResponse;
      if ("error" in errorResponse) {
        error = new ARMError(errorResponse.error.message);
        error.code = errorResponse.error.code;
      } else {
        error = new ARMError(errorResponse.message);
        error.code = errorResponse.code;
      }
    } catch (error) {
      throw new Error(await response.text());
    }

    throw error;
  }

  const operationStatusUrl = (response.headers && response.headers.get("location")) || "";
  const responseBody = (await response.json()) as T;
  return { result: responseBody, operationStatusUrl: operationStatusUrl };
}
