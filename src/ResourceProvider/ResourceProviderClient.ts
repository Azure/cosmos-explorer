import * as ViewModels from "../Contracts/ViewModels";
import { HttpStatusCodes } from "../Common/Constants";
import { IResourceProviderClient, IResourceProviderRequestOptions } from "./IResourceProviderClient";
import { OperationStatus } from "../Contracts/DataModels";
import { TokenProviderFactory } from "../TokenProviders/TokenProviderFactory";
import UrlUtility from "../Common/UrlUtility";

export class ResourceProviderClient<T> implements IResourceProviderClient<T> {
  private httpClient: HttpClient;

  constructor(private armEndpoint: string) {
    this.httpClient = new HttpClient();
  }

  public async getAsync(
    url: string,
    apiVersion: string,
    queryString?: string,
    requestOptions?: IResourceProviderRequestOptions
  ): Promise<T | T[]> {
    let uri = `${this.armEndpoint}${url}?api-version=${apiVersion}`;
    if (queryString) {
      uri += `&${queryString}`;
    }
    return await this.httpClient.getAsync<T | T[]>(
      uri,
      Object.assign({}, { skipResourceValidation: false }, requestOptions)
    );
  }

  public async postAsync(
    url: string,
    apiVersion: string,
    body: any,
    requestOptions?: IResourceProviderRequestOptions
  ): Promise<any> {
    const fullUrl = UrlUtility.createUri(this.armEndpoint, url);
    return await this.httpClient.postAsync(
      `${fullUrl}?api-version=${apiVersion}`,
      body,
      Object.assign({}, { skipResourceValidation: false }, requestOptions)
    );
  }

  public async putAsync(
    url: string,
    apiVersion: string,
    body: any,
    requestOptions?: IResourceProviderRequestOptions
  ): Promise<T> {
    const fullUrl = UrlUtility.createUri(this.armEndpoint, url);
    return await this.httpClient.putAsync<T>(
      `${fullUrl}?api-version=${apiVersion}`,
      body,
      Object.assign({}, { skipResourceValidation: false }, requestOptions)
    );
  }

  public async patchAsync(
    url: string,
    apiVersion: string,
    body: any,
    requestOptions?: IResourceProviderRequestOptions
  ): Promise<T> {
    const fullUrl = UrlUtility.createUri(this.armEndpoint, url);
    return await this.httpClient.patchAsync<T>(
      `${fullUrl}?api-version=${apiVersion}`,
      body,
      Object.assign({}, { skipResourceValidation: false }, requestOptions)
    );
  }

  public async deleteAsync(
    url: string,
    apiVersion: string,
    requestOptions?: IResourceProviderRequestOptions
  ): Promise<void> {
    const fullUrl = UrlUtility.createUri(this.armEndpoint, url);
    return await this.httpClient.deleteAsync(
      `${fullUrl}?api-version=${apiVersion}`,
      Object.assign({}, { skipResourceValidation: true }, requestOptions)
    );
  }
}

class HttpClient {
  private static readonly SUCCEEDED_STATUS = "Succeeded";
  private static readonly FAILED_STATUS = "Failed";
  private static readonly CANCELED_STATUS = "Canceled";
  private static readonly AZURE_ASYNC_OPERATION_HEADER = "azure-asyncoperation";
  private static readonly RETRY_AFTER_HEADER = "Retry-After";
  private static readonly DEFAULT_THROTTLE_WAIT_TIME_SECONDS = 5;

  private tokenProvider: ViewModels.TokenProvider;

  constructor() {
    this.tokenProvider = TokenProviderFactory.create();
  }

  public async getAsync<T>(url: string, requestOptions: IResourceProviderRequestOptions): Promise<T> {
    const args: RequestInit = { method: "GET" };
    const response = await this.httpRequest(new Request(url, args), requestOptions);
    return (await response.json()) as T;
  }

  public async postAsync(url: string, body: any, requestOptions: IResourceProviderRequestOptions): Promise<any> {
    body = typeof body !== "string" && body !== undefined ? JSON.stringify(body) : body;
    const args: RequestInit = { method: "POST", headers: { "Content-Type": "application/json" }, body };
    const response = await this.httpRequest(new Request(url, args), requestOptions);
    return await response.json();
  }

  public async putAsync<T>(url: string, body: any, requestOptions: IResourceProviderRequestOptions): Promise<T> {
    body = typeof body !== "string" && body !== undefined ? JSON.stringify(body) : body;
    const args: RequestInit = { method: "PUT", headers: { "Content-Type": "application/json" }, body };
    const response = await this.httpRequest(new Request(url, args), requestOptions);
    return (await response.json()) as T;
  }

  public async patchAsync<T>(url: string, body: any, requestOptions: IResourceProviderRequestOptions): Promise<T> {
    body = typeof body !== "string" && body !== undefined ? JSON.stringify(body) : body;
    const args: RequestInit = { method: "PATCH", headers: { "Content-Type": "application/json" }, body };
    const response = await this.httpRequest(new Request(url, args), requestOptions);
    return (await response.json()) as T;
  }

  public async deleteAsync(url: string, requestOptions: IResourceProviderRequestOptions): Promise<void> {
    const args: RequestInit = { method: "DELETE" };
    await this.httpRequest(new Request(url, args), requestOptions);
    return null;
  }

  public async httpRequest<T>(
    request: RequestInfo,
    requestOptions: IResourceProviderRequestOptions,
    numRetries: number = 12
  ): Promise<Response> {
    const authHeader = await this.tokenProvider.getAuthHeader();
    authHeader &&
      authHeader.forEach((value: string, header: string) => {
        (request as Request).headers.append(header, value);
      });
    const response = await fetch(request);

    if (response.status === HttpStatusCodes.Accepted) {
      const operationStatusUrl: string =
        response.headers && response.headers.get(HttpClient.AZURE_ASYNC_OPERATION_HEADER);
      const resource = await this.pollOperationAndGetResultAsync<T>(request, operationStatusUrl, requestOptions);
      return new Response(resource && JSON.stringify(resource));
    }

    if (response.status === HttpStatusCodes.TooManyRequests && numRetries > 0) {
      // retry on throttles
      let waitTimeInSeconds = response.headers.has(HttpClient.RETRY_AFTER_HEADER)
        ? parseInt(response.headers.get(HttpClient.RETRY_AFTER_HEADER))
        : HttpClient.DEFAULT_THROTTLE_WAIT_TIME_SECONDS;

      return new Promise<Response>((resolve: (value: Response) => void, reject: (error: any) => void) => {
        setTimeout(async () => {
          try {
            const response = await this.httpRequest<T>(request, requestOptions, numRetries - 1);
            resolve(response);
          } catch (error) {
            reject(error);
            throw error;
          }
        }, waitTimeInSeconds * 1000);
      });
    }

    if (response.ok) {
      // RP sometimes returns HTTP 200 for async operations instead of HTTP 202 (e.g., on PATCH operations), so we need to check
      const operationStatusUrl: string =
        response.headers && response.headers.get(HttpClient.AZURE_ASYNC_OPERATION_HEADER);

      if (operationStatusUrl) {
        const resource = await this.pollOperationAndGetResultAsync<T>(request, operationStatusUrl, requestOptions);
        return new Response(resource && JSON.stringify(resource));
      }

      return response;
    }

    return Promise.reject({ code: response.status, message: await response.text() });
  }

  private async pollOperationAndGetResultAsync<T>(
    originalRequest: RequestInfo,
    operationStatusUrl: string,
    requestOptions: IResourceProviderRequestOptions
  ): Promise<T> {
    const getOperationResult = async (resolve: (value: T) => void, reject: (error: any) => void) => {
      const operationStatus: OperationStatus = await this.getAsync<OperationStatus>(operationStatusUrl, requestOptions);
      if (!operationStatus) {
        return reject("Could not retrieve operation status");
      } else if (operationStatus.status === HttpClient.SUCCEEDED_STATUS) {
        let result;
        if (requestOptions?.skipResourceValidation === false) {
          result = await this.getAsync<T>((originalRequest as Request).url, requestOptions);
        }
        return resolve(result);
      } else if (
        operationStatus.status === HttpClient.CANCELED_STATUS ||
        operationStatus.status === HttpClient.FAILED_STATUS
      ) {
        const errorMessage = operationStatus.error
          ? JSON.stringify(operationStatus.error)
          : "Operation could not be completed";
        return reject(errorMessage);
      }
      // TODO: add exponential backup and timeout threshold
      setTimeout(getOperationResult, 1000, resolve, reject);
    };

    return new Promise<T>(getOperationResult);
  }
}
