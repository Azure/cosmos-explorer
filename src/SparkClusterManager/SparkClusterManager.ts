import * as ViewModels from "../Contracts/ViewModels";
import { ArmApiVersions } from "../Common/Constants";
import { IResourceProviderClient, IResourceProviderClientFactory } from "../ResourceProvider/IResourceProviderClient";
import * as Logger from "../Common/Logger";
import { ResourceProviderClientFactory } from "../ResourceProvider/ResourceProviderClientFactory";
import {
  SparkCluster,
  SparkClusterConnectionInfo,
  SparkClusterFeedResponse,
  Library,
  LibraryFeedResponse
} from "../Contracts/DataModels";

export class SparkClusterManager implements ViewModels.SparkClusterManager {
  private resourceProviderClientFactory: IResourceProviderClientFactory<any>;

  constructor(private armEndpoint: string) {
    this.resourceProviderClientFactory = new ResourceProviderClientFactory(this.armEndpoint);
  }

  public async getClustersAsync(cosmosdbResourceId: string): Promise<SparkCluster[]> {
    const uri = `${cosmosdbResourceId}/clusters`;
    try {
      const response = (await this.rpClient(uri).getAsync(uri, ArmApiVersions.documentDB)) as SparkClusterFeedResponse;
      return response && response.value;
    } catch (error) {
      Logger.logError(error, "SparkClusterManager/getClustersAsync");
      throw error;
    }
  }

  public async getClusterAsync(cosmosdbResourceId: string, clusterId: string): Promise<SparkCluster> {
    const uri = `${cosmosdbResourceId}/clusters/${clusterId}`;
    try {
      return (await this.rpClient(uri).getAsync(uri, ArmApiVersions.documentDB)) as SparkCluster;
    } catch (error) {
      Logger.logError(error, "SparkClusterManager/getClusterAsync");
      throw error;
    }
  }

  public async createClusterAsync(cosmosdbResourceId: string, cluster: Partial<SparkCluster>): Promise<void> {
    if (!cluster || !cluster.name) {
      throw new Error("Invalid or incomplete spark cluster properties specified");
    }

    const uri = `${cosmosdbResourceId}/clusters/${cluster.name}`;
    try {
      await this.rpClient(uri).putAsync(uri, ArmApiVersions.documentDB, cluster);
    } catch (error) {
      Logger.logError(error, "SparkClusterManager/createClusterAsync");
      throw error;
    }
  }

  public async updateClusterAsync(
    cosmosdbResourceId: string,
    clusterId: string,
    cluster: SparkCluster
  ): Promise<SparkCluster> {
    const uri = `${cosmosdbResourceId}/clusters/${clusterId}`;
    try {
      return await this.rpClient<SparkCluster>(uri).putAsync(uri, ArmApiVersions.documentDB, cluster);
    } catch (error) {
      Logger.logError(error, "SparkClusterManager/updateClusterAsync");
      throw error;
    }
  }

  public async deleteClusterAsync(cosmosdbResourceId: string, clusterId: string): Promise<void> {
    const uri = `${cosmosdbResourceId}/clusters/${clusterId}`;
    try {
      await this.rpClient(uri).deleteAsync(uri, ArmApiVersions.documentDB);
    } catch (error) {
      Logger.logError(error, "SparkClusterManager/deleteClusterAsync");
      throw error;
    }
  }

  public async getClusterConnectionInfoAsync(
    cosmosdbResourceId: string,
    clusterId: string
  ): Promise<SparkClusterConnectionInfo> {
    const uri = `${cosmosdbResourceId}/clusters/${clusterId}/getConnectionInfo`;
    try {
      return await this.rpClient<SparkClusterConnectionInfo>(uri).postAsync(uri, ArmApiVersions.documentDB, undefined);
    } catch (error) {
      Logger.logError(error, "SparkClusterManager/getClusterConnectionInfoAsync");
      throw error;
    }
  }

  public async getLibrariesAsync(cosmosdbResourceId: string): Promise<Library[]> {
    const uri = `${cosmosdbResourceId}/libraries`;
    try {
      const response = (await this.rpClient(uri).getAsync(uri, ArmApiVersions.documentDB)) as LibraryFeedResponse;
      return response && response.value;
    } catch (error) {
      Logger.logError(error, "SparkClusterManager/getLibrariesAsync");
      throw error;
    }
  }

  public async getLibraryAsync(cosmosdbResourceId: string, libraryName: string): Promise<Library> {
    const uri = `${cosmosdbResourceId}/libraries/${libraryName}`;
    try {
      return (await this.rpClient(uri).getAsync(uri, ArmApiVersions.documentDB)) as Library;
    } catch (error) {
      Logger.logError(error, "SparkClusterManager/getLibraryAsync");
      throw error;
    }
  }

  public async addLibraryAsync(cosmosdbResourceId: string, libraryName: string, library: Library): Promise<void> {
    const uri = `${cosmosdbResourceId}/libraries/${encodeURIComponent(libraryName)}`;
    try {
      await this.rpClient(uri).putAsync(uri, ArmApiVersions.documentDB, library);
    } catch (error) {
      Logger.logError(error, "SparkClusterManager/putLibraryAsync");
      throw error;
    }
  }

  public async deleteLibraryAsync(cosmosdbResourceId: string, libraryName: string): Promise<void> {
    const uri = `${cosmosdbResourceId}/libraries/${libraryName}`;
    try {
      await this.rpClient(uri).deleteAsync(uri, ArmApiVersions.documentDB);
    } catch (error) {
      Logger.logError(error, "SparkClusterManager/deleteLibraryAsync");
      throw error;
    }
  }

  private rpClient<TResource>(uri: string): IResourceProviderClient<TResource> {
    return this.resourceProviderClientFactory.getOrCreate(uri);
  }
}
