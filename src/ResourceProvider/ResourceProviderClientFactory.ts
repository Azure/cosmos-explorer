import { configContext } from "../ConfigContext";
import { IResourceProviderClientFactory, IResourceProviderClient } from "./IResourceProviderClient";
import { ResourceProviderClient } from "./ResourceProviderClient";

export class ResourceProviderClientFactory implements IResourceProviderClientFactory<any> {
  private armEndpoint: string;
  private cachedClients: { [url: string]: IResourceProviderClient<any> } = {};

  constructor() {
    this.armEndpoint = configContext.ARM_ENDPOINT;
  }

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
