export interface IResourceProviderClient<TResource> {
  deleteAsync(url: string, apiVersion: string, skipResourceValidation?: boolean): Promise<void>;
  getAsync(
    url: string,
    apiVersion: string,
    queryString?: string,
    skipResourceValidation?: boolean
  ): Promise<TResource | TResource[]>;
  postAsync(url: string, apiVersion: string, body: any, skipResourceValidation?: boolean): Promise<any>;
  putAsync(url: string, apiVersion: string, body: any, skipResourceValidation?: boolean): Promise<TResource>;
  patchAsync(url: string, apiVersion: string, body: any, skipResourceValidation?: boolean): Promise<TResource>;
}

export interface IResourceProviderClientFactory<TResult> {
  getOrCreate(url: string): IResourceProviderClient<TResult>;
}
