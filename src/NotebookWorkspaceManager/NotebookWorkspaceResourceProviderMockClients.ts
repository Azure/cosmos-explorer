import { IResourceProviderClient } from "../ResourceProvider/IResourceProviderClient";
import { NotebookWorkspace } from "../Contracts/DataModels";

export class NotebookWorkspaceSettingsProviderClient implements IResourceProviderClient<string> {
  public async deleteAsync(url: string, apiVersion: string): Promise<void> {
    throw new Error("Not yet implemented");
  }

  public async postAsync(url: string, body: any, apiVersion: string): Promise<any> {
    return Promise.resolve({
      notebookServerEndpoint: "http://localhost:8888",
      username: "",
      password: "",
    });
  }

  public async getAsync(url: string, apiVersion: string): Promise<string> {
    throw new Error("Not yet implemented");
  }

  public async putAsync(url: string, body: any, apiVersion: string): Promise<string> {
    throw new Error("Not yet implemented");
  }

  public async patchAsync(url: string, apiVersion: string): Promise<string> {
    throw new Error("Not yet implemented");
  }
}

export class NotebookWorkspaceResourceProviderClient implements IResourceProviderClient<NotebookWorkspace> {
  public async deleteAsync(url: string, apiVersion: string): Promise<void> {
    throw new Error("Not yet implemented");
  }

  public async postAsync(url: string, body: any, apiVersion: string): Promise<NotebookWorkspace> {
    throw new Error("Not yet implemented");
  }

  public async getAsync(url: string, apiVersion: string): Promise<NotebookWorkspace | NotebookWorkspace[]> {
    throw new Error("Not yet implemented");
  }

  public async putAsync(url: string, body: any, apiVersion: string): Promise<NotebookWorkspace> {
    throw new Error("Not yet implemented");
  }

  public async patchAsync(url: string, body: any, apiVersion: string): Promise<NotebookWorkspace> {
    throw new Error("Not yet implemented");
  }
}
