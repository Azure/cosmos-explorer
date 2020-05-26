import { IResourceProviderClientFactory, IResourceProviderClient } from "./IResourceProviderClient";
import { ResourceProviderClient } from "./ResourceProviderClient";

export class ResourceProviderClientFactory implements IResourceProviderClientFactory<any> {
  private cachedClients: { [url: string]: IResourceProviderClient<any> } = {};

  constructor(private armEndpoint: string) {}

  public getOrCreate(url: string): IResourceProviderClient<any> {
    if (!url) {
      throw new Error("No resource provider client factory params specified");
    }
    if (!this.cachedClients[url]) {
      this.cachedClients[url] = new ResourceProviderClient(this.armEndpoint);
    }
    return this.cachedClients[url];
  }
}
