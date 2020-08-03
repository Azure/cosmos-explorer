/* 

A general purpose fetch function for ARM resources. Not designed to be used directly
Instead, generate ARM clients that consume this function with stricter typing.

*/

import { CosmosClient } from "../../Common/CosmosClient";
import promiseRetry, { AbortError } from "p-retry";

interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

interface ARMError extends Error {
  code: string;
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
      Authorization: CosmosClient.authorizationToken()
    },
    body: requestBody ? JSON.stringify(requestBody) : undefined
  });
  if (!response.ok) {
    const errorResponse = (await response.json()) as ErrorResponse;
    const error = new Error(errorResponse.error?.message) as ARMError;
    error.code = errorResponse.error.code;
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
      Authorization: CosmosClient.authorizationToken()
    }
  });
  if (!response.ok) {
    const errorResponse = (await response.json()) as ErrorResponse;
    const error = new Error(errorResponse.error?.message) as ARMError;
    error.code = errorResponse.error.code;
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
