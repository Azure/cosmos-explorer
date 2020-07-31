/* 

A general purpose fetch function for ARM resources. Not designed to be used directly
Instead, generate ARM clients that consume this function with stricter typing.

*/

import { CosmosClient } from "../../Common/CosmosClient";

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
  const responseBody = (await response.json()) as T;
  return responseBody;
}
