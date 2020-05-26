export interface IResourceProviderClient<TResource> {
  deleteAsync(url: string, apiVersion: string): Promise<void>;
  getAsync(url: string, apiVersion: string, queryString?: string): Promise<TResource | TResource[]>;
  postAsync(url: string, apiVersion: string, body: any): Promise<any>;
  putAsync(url: string, apiVersion: string, body: any): Promise<TResource>;
  patchAsync(url: string, apiVersion: string, body: any): Promise<TResource>;
}

export interface IResourceProviderClientFactory<TResult> {
  getOrCreate(url: string): IResourceProviderClient<TResult>;
}
