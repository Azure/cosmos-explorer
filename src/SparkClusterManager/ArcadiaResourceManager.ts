import {
  ArcadiaWorkspace,
  ArcadiaWorkspaceFeedResponse,
  SparkPool,
  SparkPoolFeedResponse,
} from "../Contracts/DataModels";
import { ArmApiVersions, ArmResourceTypes } from "../Common/Constants";
import { IResourceProviderClient, IResourceProviderClientFactory } from "../ResourceProvider/IResourceProviderClient";
import * as Logger from "../Common/Logger";
import { ResourceProviderClientFactory } from "../ResourceProvider/ResourceProviderClientFactory";
import { configContext } from "../ConfigContext";
import { getErrorMessage } from "../Common/ErrorHandlingUtils";

export class ArcadiaResourceManager {
  private resourceProviderClientFactory: IResourceProviderClientFactory<any>;

  constructor(private armEndpoint = configContext.ARM_ENDPOINT) {
    this.resourceProviderClientFactory = new ResourceProviderClientFactory(this.armEndpoint);
  }

  public async getWorkspacesAsync(arcadiaResourceId: string): Promise<ArcadiaWorkspace[]> {
    const uri = `${arcadiaResourceId}/workspaces`;
    try {
      const response = (await this._rpClient(uri).getAsync(
        uri,
        ArmApiVersions.arcadia
      )) as ArcadiaWorkspaceFeedResponse;
      return response && response.value;
    } catch (error) {
      Logger.logError(getErrorMessage(error), "ArcadiaResourceManager/getWorkspaceAsync");
      throw error;
    }
  }

  public async getWorkspaceAsync(arcadiaResourceId: string, workspaceId: string): Promise<ArcadiaWorkspace> {
    const uri = `${arcadiaResourceId}/workspaces/${workspaceId}`;
    try {
      return (await this._rpClient(uri).getAsync(uri, ArmApiVersions.arcadia)) as ArcadiaWorkspace;
    } catch (error) {
      Logger.logError(getErrorMessage(error), "ArcadiaResourceManager/getWorkspaceAsync");
      throw error;
    }
  }

  public async listWorkspacesAsync(subscriptionIds: string[]): Promise<ArcadiaWorkspace[]> {
    let uriFilter = `$filter=(resourceType eq '${ArmResourceTypes.synapseWorkspaces.toLowerCase()}')`;
    if (subscriptionIds && subscriptionIds.length) {
      uriFilter += ` and (${"subscriptionId eq '" + subscriptionIds.join("' or subscriptionId eq '") + "'"})`;
    }
    const uri = "/resources";
    try {
      const response = (await this._rpClient(uri + uriFilter).getAsync(
        uri,
        ArmApiVersions.arm,
        uriFilter
      )) as ArcadiaWorkspaceFeedResponse;
      return response && response.value;
    } catch (error) {
      Logger.logError(getErrorMessage(error), "ArcadiaManager/listWorkspacesAsync");
      throw error;
    }
  }

  public async listSparkPoolsAsync(resourceId: string): Promise<SparkPool[]> {
    let uri = `${resourceId}/bigDataPools`;

    try {
      const response = (await this._rpClient(uri).getAsync(uri, ArmApiVersions.arcadia)) as SparkPoolFeedResponse;
      return response && response.value;
    } catch (error) {
      Logger.logError(getErrorMessage(error), "ArcadiaManager/listSparkPoolsAsync");
      throw error;
    }
  }

  private _rpClient<TResource>(uri: string): IResourceProviderClient<TResource> {
    return this.resourceProviderClientFactory.getOrCreate(uri);
  }
}
