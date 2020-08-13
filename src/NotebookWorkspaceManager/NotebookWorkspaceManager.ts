import { ArmApiVersions } from "../Common/Constants";
import { IResourceProviderClient, IResourceProviderClientFactory } from "../ResourceProvider/IResourceProviderClient";
import * as Logger from "../Common/Logger";
import {
  NotebookWorkspace,
  NotebookWorkspaceConnectionInfo,
  NotebookWorkspaceFeedResponse
} from "../Contracts/DataModels";
import { ResourceProviderClientFactory } from "../ResourceProvider/ResourceProviderClientFactory";

export class NotebookWorkspaceManager {
  private resourceProviderClientFactory: IResourceProviderClientFactory<any>;

  constructor(private _armEndpoint: string) {
    this.resourceProviderClientFactory = new ResourceProviderClientFactory(this._armEndpoint);
  }

  public async getNotebookWorkspacesAsync(cosmosdbResourceId: string): Promise<NotebookWorkspace[]> {
    const uri = `${cosmosdbResourceId}/notebookWorkspaces`;
    try {
      const response = (await this.rpClient(uri).getAsync(
        uri,
        ArmApiVersions.documentDB
      )) as NotebookWorkspaceFeedResponse;
      return response && response.value;
    } catch (error) {
      Logger.logError(error, "NotebookWorkspaceManager/getNotebookWorkspacesAsync");
      throw error;
    }
  }

  public async getNotebookWorkspaceAsync(
    cosmosdbResourceId: string,
    notebookWorkspaceId: string
  ): Promise<NotebookWorkspace> {
    const uri = `${cosmosdbResourceId}/notebookWorkspaces/${notebookWorkspaceId}`;
    try {
      return (await this.rpClient(uri).getAsync(uri, ArmApiVersions.documentDB)) as NotebookWorkspace;
    } catch (error) {
      Logger.logError(error, "NotebookWorkspaceManager/getNotebookWorkspaceAsync");
      throw error;
    }
  }

  public async createNotebookWorkspaceAsync(cosmosdbResourceId: string, notebookWorkspaceId: string): Promise<void> {
    const uri = `${cosmosdbResourceId}/notebookWorkspaces/${notebookWorkspaceId}`;
    try {
      await this.rpClient(uri).putAsync(uri, ArmApiVersions.documentDB, { name: notebookWorkspaceId });
    } catch (error) {
      Logger.logError(error, "NotebookWorkspaceManager/createNotebookWorkspaceAsync");
      throw error;
    }
  }

  public async deleteNotebookWorkspaceAsync(cosmosdbResourceId: string, notebookWorkspaceId: string): Promise<void> {
    const uri = `${cosmosdbResourceId}/notebookWorkspaces/${notebookWorkspaceId}`;
    try {
      await this.rpClient(uri).deleteAsync(uri, ArmApiVersions.documentDB);
    } catch (error) {
      Logger.logError(error, "NotebookWorkspaceManager/deleteNotebookWorkspaceAsync");
      throw error;
    }
  }

  public async getNotebookConnectionInfoAsync(
    cosmosdbResourceId: string,
    notebookWorkspaceId: string
  ): Promise<NotebookWorkspaceConnectionInfo> {
    const uri = `${cosmosdbResourceId}/notebookWorkspaces/${notebookWorkspaceId}/listConnectionInfo`;
    try {
      return await this.rpClient<NotebookWorkspaceConnectionInfo>(uri).postAsync(
        uri,
        ArmApiVersions.documentDB,
        undefined
      );
    } catch (error) {
      Logger.logError(error, "NotebookWorkspaceManager/getNotebookConnectionInfoAsync");
      throw error;
    }
  }

  public async startNotebookWorkspaceAsync(cosmosdbResourceId: string, notebookWorkspaceId: string): Promise<void> {
    const uri = `${cosmosdbResourceId}/notebookWorkspaces/${notebookWorkspaceId}/start`;
    try {
      return await this.rpClient(uri).postAsync(uri, ArmApiVersions.documentDB, undefined, {
        skipResourceValidation: true
      });
    } catch (error) {
      Logger.logError(error, "NotebookWorkspaceManager/startNotebookWorkspaceAsync");
      throw error;
    }
  }

  private rpClient<TResource>(uri: string): IResourceProviderClient<TResource> {
    return this.resourceProviderClientFactory.getOrCreate(uri);
  }
}
