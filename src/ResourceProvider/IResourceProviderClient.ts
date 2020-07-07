export interface IResourceProviderClient<TResource> {
  deleteAsync(url: string, apiVersion: string, requestOptions?: IResourceProviderRequestOptions): Promise<void>;
  getAsync(
    url: string,
    apiVersion: string,
    queryString?: string,
    requestOptions?: IResourceProviderRequestOptions
  ): Promise<TResource | TResource[]>;
  postAsync(url: string, apiVersion: string, body: any, requestOptions?: IResourceProviderRequestOptions): Promise<any>;
  putAsync(
    url: string,
    apiVersion: string,
    body: any,
    requestOptions?: IResourceProviderRequestOptions
  ): Promise<TResource>;
  patchAsync(
    url: string,
    apiVersion: string,
    body: any,
    requestOptions?: IResourceProviderRequestOptions
  ): Promise<TResource>;
}

export interface IResourceProviderRequestOptions {
  skipResourceValidation: boolean;
}

export interface IResourceProviderClientFactory<TResult> {
  getOrCreate(url: string): IResourceProviderClient<TResult>;
}
