/* 

A general purpose fetch function for ARM resources. Not designed to be used directly
Instead, generate ARM clients that consume this function with stricter typing.

*/

import promiseRetry, { AbortError } from "p-retry";
import { userContext } from "../../UserContext";

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

  public code: string | number;
}

interface Options {
  host: string;
  path: string;
  apiVersion: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";
  body?: unknown;
}

// TODO: This is very similar to what is happening in ResourceProviderClient.ts. Should probably merge them.
export async function armRequest<T>({ host, path, apiVersion, method, body: requestBody }: Options): Promise<T> {
  const url = new URL(path, host);
  url.searchParams.append("api-version", apiVersion);
  const response = await window.fetch(url.href, {
    method,
    headers: {
      Authorization: userContext.authorizationToken
    },
    body: requestBody ? JSON.stringify(requestBody) : undefined
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

  const operationStatusUrl = response.headers && response.headers.get("azure-asyncoperation");
  if (operationStatusUrl) {
    await promiseRetry(() => getOperationStatus(operationStatusUrl));
    // TODO: ARM is supposed to return a resourceLocation property, but it does not https://github.com/microsoft/api-guidelines/blob/vNext/Guidelines.md#target-resource-location
    // When Cosmos RP adds resourceLocation, we should use it instead
    // For now manually execute a GET if the operation was a mutation and not a deletion
    if (method === "POST" || method === "PATCH" || method === "PUT") {
      return armRequest({
        host,
        path,
        apiVersion,
        method: "GET"
      });
    }
  }

  const responseBody = (await response.json()) as T;
  return responseBody;
}

const SUCCEEDED = "Succeeded" as const;
const FAILED = "Failed" as const;
const CANCELED = "Canceled" as const;

type Status = typeof SUCCEEDED | typeof FAILED | typeof CANCELED;

interface OperationResponse {
  status: Status;
  error: unknown;
}

async function getOperationStatus(operationStatusUrl: string) {
  const response = await window.fetch(operationStatusUrl, {
    headers: {
      Authorization: userContext.authorizationToken
    }
  });
  if (!response.ok) {
    const errorResponse = (await response.json()) as ErrorResponse;
    const error = new Error(errorResponse.message) as ARMError;
    error.code = errorResponse.code;
    throw new AbortError(error);
  }
  const body = (await response.json()) as OperationResponse;
  const status = body.status;
  if (status === SUCCEEDED) {
    return;
  }
  if (status === CANCELED || status === FAILED) {
    const errorMessage = body.error ? JSON.stringify(body.error) : "Operation could not be completed";
    const error = new Error(errorMessage);
    throw new AbortError(error);
  }
  throw new Error(`Operation Response: ${JSON.stringify(body)}. Retrying.`);
}
