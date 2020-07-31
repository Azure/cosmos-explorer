/* 

A general purpose fetch function for ARM resources. Not designed to be used directly
Instead, generate ARM clients that consume this function.

*/

interface Options {
  host: string;
  path: string;
  apiVersion: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

export async function armRequest<T>({ host, path, apiVersion, method, body: requestBody }: Options): Promise<T> {
  console.log(apiVersion);
  const response = await window.fetch(new URL(path, host).toString(), {
    method,
    body: requestBody ? JSON.stringify(requestBody) : undefined
  });
  const responseBody = (await response.json()) as T;
  return responseBody;
}
