import { IResourceProviderClient } from "../ResourceProvider/IResourceProviderClient";
import { NotebookWorkspace } from "../Contracts/DataModels";

export class NotebookWorkspaceSettingsProviderClient implements IResourceProviderClient<string> {
  public async deleteAsync(_url: string, _apiVersion: string): Promise<void> {
    throw new Error("Not yet implemented");
  }

  public async postAsync(_url: string, _body: any, _apiVersion: string): Promise<any> {
    return Promise.resolve({
      notebookServerEndpoint: "http://localhost:8888",
      username: "",
      password: "",
    });
  }

  public async getAsync(): Promise<string> {
    throw new Error("Not yet implemented");
  }

  public async putAsync(): Promise<string> {
    throw new Error("Not yet implemented");
  }

  public async patchAsync(): Promise<string> {
    throw new Error("Not yet implemented");
  }
}

export class NotebookWorkspaceResourceProviderClient implements IResourceProviderClient<NotebookWorkspace> {
  public async deleteAsync(): Promise<void> {
    throw new Error("Not yet implemented");
  }

  public async postAsync(): Promise<NotebookWorkspace> {
    throw new Error("Not yet implemented");
  }

  public async getAsync(): Promise<NotebookWorkspace | NotebookWorkspace[]> {
    throw new Error("Not yet implemented");
  }

  public async putAsync(): Promise<NotebookWorkspace> {
    throw new Error("Not yet implemented");
  }

  public async patchAsync(): Promise<NotebookWorkspace> {
    throw new Error("Not yet implemented");
  }
}
