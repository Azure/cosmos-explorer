/* 

A general purpose fetch function for ARM resources. Not designed to be used directly
Instead, generate ARM clients that consume this function with stricter typing.

*/

import { stringifyError } from "Common/ErrorHandlingUtils";
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
    console.log(
      "{{cdbp}} in armRequestWithoutPolling(): condition '!userContext?.authorizationToken && !customHeaders?.['Authorization']' met, throwing 'No authority token provided' error",
    );
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
  console.log(
    `{{cdbp}} in armRequestWithoutPolling(): calling fetchWithRetry (method=${method}, timeoutMs=${effectiveTimeoutMs}, hasSignal=${!!signal})`,
  );
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
      console.log("{{cdbp}} in armRequestWithoutPolling(): ERROR: " + stringifyError(error));
      throw new Error(await response.text());
    }

    console.log("{{cdbp}} in armRequestWithoutPolling(): ERROR: " + stringifyError(error));
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
    return await promiseRetry(() => getOperationStatus(operationStatusUrl));
  }
  return armRequestResult.result;
}

/**
 * Calls `fetchWithTimeout` once for non-idempotent methods. For idempotent GETs, retries
 * up to {@link RETRY_TIMEOUT_MULTIPLIERS}.length attempts on timeout, escalating the timeout
 * on each attempt. HTTP error responses (4xx/5xx) are NOT retried — they are surfaced by the
 * caller's response.ok check. External `signal` cancellation aborts the retry loop immediately.
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

  return promiseRetry(
    (attemptNumber: number) => {
      const attemptTimeoutMs =
        timeoutMs * RETRY_TIMEOUT_MULTIPLIERS[Math.min(attemptNumber - 1, RETRY_TIMEOUT_MULTIPLIERS.length - 1)];
      console.log(`{{cdbp}} in fetchWithRetry(): calling fetchWithTimeout: attempt=${attemptNumber} url=${url}`);
      return fetchWithTimeout(url, fetchInit, attemptTimeoutMs);
    },
    {
      retries: RETRY_TIMEOUT_MULTIPLIERS.length - 1,
      factor: 1,
      minTimeout: RETRY_BACKOFF_MS,
      maxTimeout: RETRY_BACKOFF_MS,
      signal,
      // Only retry on timeout aborts. Caller cancellation (external signal aborted) stops retries.
      shouldRetry: (error) => isAbortError(error) && !signal?.aborted,
    },
  );
}

async function getOperationStatus(operationStatusUrl: string) {
  if (!userContext.authorizationToken) {
    throw new Error("No authority token provided");
  }

  const response = await window.fetch(operationStatusUrl, {
    headers: {
      Authorization: userContext.authorizationToken,
    },
  });

  if (!response.ok) {
    const errorResponse = (await response.json()) as ErrorResponse;
    const error = new Error(errorResponse.message) as ARMError;
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
