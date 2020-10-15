import ko from "knockout";
import { HttpHeaders, HttpStatusCodes } from "../Common/Constants";
import { configContext } from "../ConfigContext";
import * as DataModels from "../Contracts/DataModels";
import { AuthorizeAccessComponent } from "../Explorer/Controls/GitHub/AuthorizeAccessComponent";
import { IGitHubResponse } from "../GitHub/GitHubClient";
import { IGitHubOAuthToken } from "../GitHub/GitHubOAuthService";
import { getAuthorizationHeader } from "../Utils/AuthorizationUtils";

export interface IJunoResponse<T> {
  status: number;
  data: T;
}

export interface IPinnedRepo {
  owner: string;
  name: string;
  private: boolean;
  branches: IPinnedBranch[];
}

export interface IPinnedBranch {
  name: string;
}

export interface IGalleryItem {
  id: string;
  name: string;
  description: string;
  gitSha: string;
  tags: string[];
  author: string;
  thumbnailUrl: string;
  created: string;
  isSample: boolean;
  downloads: number;
  favorites: number;
  views: number;
  newCellId: string;
  policyViolations: string[];
  pendingScanJobIds: string[];
}

export interface IPublicGalleryData {
  metadata: IPublicGalleryMetaData;
  notebooksData: IGalleryItem[];
}

export interface IPublicGalleryMetaData {
  acceptedCodeOfConduct: boolean;
}

export interface IUserGallery {
  favorites: string[];
  published: string[];
}

interface IPublishNotebookRequest {
  name: string;
  description: string;
  tags: string[];
  author: string;
  thumbnailUrl: string;
  content: any;
}

export class JunoClient {
  private cachedPinnedRepos: ko.Observable<IPinnedRepo[]>;

  constructor(private databaseAccount?: ko.Observable<DataModels.DatabaseAccount>) {
    this.cachedPinnedRepos = ko.observable<IPinnedRepo[]>([]);
  }

  public subscribeToPinnedRepos(callback: ko.SubscriptionCallback<IPinnedRepo[], void>): ko.Subscription {
    return this.cachedPinnedRepos.subscribe(callback);
  }

  public async getPinnedRepos(scope: string): Promise<IJunoResponse<IPinnedRepo[]>> {
    const response = await window.fetch(`${this.getNotebooksAccountUrl()}/github/pinnedrepos`, {
      headers: JunoClient.getHeaders()
    });

    let pinnedRepos: IPinnedRepo[];
    if (response.status === HttpStatusCodes.OK) {
      pinnedRepos = JSON.parse(await response.text());

      // In case we're restricted to public only scope, we return only public repos
      if (scope === AuthorizeAccessComponent.Scopes.Public.key) {
        pinnedRepos = pinnedRepos.filter(repo => !repo.private);
      }

      this.cachedPinnedRepos(pinnedRepos);
    }

    return {
      status: response.status,
      data: pinnedRepos
    };
  }

  public async updatePinnedRepos(repos: IPinnedRepo[]): Promise<IJunoResponse<undefined>> {
    const response = await window.fetch(`${this.getNotebooksAccountUrl()}/github/pinnedrepos`, {
      method: "PUT",
      body: JSON.stringify(repos),
      headers: JunoClient.getHeaders()
    });

    if (response.status === HttpStatusCodes.OK) {
      this.cachedPinnedRepos(repos);
    }

    return {
      status: response.status,
      data: undefined
    };
  }

  public async deleteGitHubInfo(): Promise<IJunoResponse<undefined>> {
    const response = await window.fetch(`${this.getNotebooksAccountUrl()}/github`, {
      method: "DELETE",
      headers: JunoClient.getHeaders()
    });

    return {
      status: response.status,
      data: undefined
    };
  }

  public async getGitHubToken(code: string): Promise<IGitHubResponse<IGitHubOAuthToken>> {
    const githubParams = JunoClient.getGitHubClientParams();
    githubParams.append("code", code);

    const response = await window.fetch(`${this.getNotebooksAccountUrl()}/github/token?${githubParams.toString()}`, {
      headers: JunoClient.getHeaders()
    });

    let data: IGitHubOAuthToken;
    const body = await response.text();
    if (body) {
      data = JSON.parse(body);
    } else {
      data = {
        error: response.statusText
      };
    }

    return {
      status: response.status,
      data
    };
  }

  public async deleteAppAuthorization(token: string): Promise<IJunoResponse<string>> {
    const githubParams = JunoClient.getGitHubClientParams();
    githubParams.append("access_token", token);

    const response = await window.fetch(`${this.getNotebooksAccountUrl()}/github/token?${githubParams.toString()}`, {
      method: "DELETE",
      headers: JunoClient.getHeaders()
    });

    return {
      status: response.status,
      data: await response.text()
    };
  }

  public async getSampleNotebooks(): Promise<IJunoResponse<IGalleryItem[]>> {
    return this.getNotebooks(`${this.getNotebooksUrl()}/gallery/samples`);
  }

  public async getPublicNotebooks(): Promise<IJunoResponse<IGalleryItem[]>> {
    return this.getNotebooks(`${this.getNotebooksUrl()}/gallery/public`);
  }

  // will be renamed once feature.enableCodeOfConduct flag is removed
  public async fetchPublicNotebooks(): Promise<IJunoResponse<IPublicGalleryData>> {
    const url = `${this.getNotebooksAccountUrl()}/gallery/public`;
    const response = await window.fetch(url, {
      method: "PATCH",
      headers: JunoClient.getHeaders()
    });

    let data: IPublicGalleryData;
    if (response.status === HttpStatusCodes.OK) {
      data = await response.json();
    }

    return {
      status: response.status,
      data
    };
  }

  public async acceptCodeOfConduct(): Promise<IJunoResponse<boolean>> {
    const url = `${this.getNotebooksAccountUrl()}/gallery/acceptCodeOfConduct`;
    const response = await window.fetch(url, {
      method: "PATCH",
      headers: JunoClient.getHeaders()
    });

    let data: boolean;
    if (response.status === HttpStatusCodes.OK) {
      data = await response.json();
    }

    return {
      status: response.status,
      data
    };
  }

  public async isCodeOfConductAccepted(): Promise<IJunoResponse<boolean>> {
    const url = `${this.getNotebooksAccountUrl()}/gallery/isCodeOfConductAccepted`;
    const response = await window.fetch(url, {
      method: "PATCH",
      headers: JunoClient.getHeaders()
    });

    let data: boolean;
    if (response.status === HttpStatusCodes.OK) {
      data = await response.json();
    }

    return {
      status: response.status,
      data
    };
  }

  public async getNotebookInfo(id: string): Promise<IJunoResponse<IGalleryItem>> {
    const response = await window.fetch(this.getNotebookInfoUrl(id));

    let data: IGalleryItem;
    if (response.status === HttpStatusCodes.OK) {
      data = await response.json();
    }

    return {
      status: response.status,
      data
    };
  }

  public async getNotebookContent(id: string): Promise<IJunoResponse<string>> {
    const response = await window.fetch(this.getNotebookContentUrl(id));

    let data: string;
    if (response.status === HttpStatusCodes.OK) {
      data = await response.text();
    }

    return {
      status: response.status,
      data
    };
  }

  public async increaseNotebookViews(id: string): Promise<IJunoResponse<IGalleryItem>> {
    const response = await window.fetch(`${this.getNotebooksUrl()}/gallery/${id}/views`, {
      method: "PATCH"
    });

    let data: IGalleryItem;
    if (response.status === HttpStatusCodes.OK) {
      data = await response.json();
    }

    return {
      status: response.status,
      data
    };
  }

  public async increaseNotebookDownloadCount(id: string): Promise<IJunoResponse<IGalleryItem>> {
    const response = await window.fetch(`${this.getNotebooksAccountUrl()}/gallery/${id}/downloads`, {
      method: "PATCH",
      headers: JunoClient.getHeaders()
    });

    let data: IGalleryItem;
    if (response.status === HttpStatusCodes.OK) {
      data = await response.json();
    }

    return {
      status: response.status,
      data
    };
  }

  public async favoriteNotebook(id: string): Promise<IJunoResponse<IGalleryItem>> {
    const response = await window.fetch(`${this.getNotebooksAccountUrl()}/gallery/${id}/favorite`, {
      method: "PATCH",
      headers: JunoClient.getHeaders()
    });

    let data: IGalleryItem;
    if (response.status === HttpStatusCodes.OK) {
      data = await response.json();
    }

    return {
      status: response.status,
      data
    };
  }

  public async unfavoriteNotebook(id: string): Promise<IJunoResponse<IGalleryItem>> {
    const response = await window.fetch(`${this.getNotebooksUrl()}/gallery/${id}/unfavorite`, {
      method: "PATCH",
      headers: JunoClient.getHeaders()
    });

    let data: IGalleryItem;
    if (response.status === HttpStatusCodes.OK) {
      data = await response.json();
    }

    return {
      status: response.status,
      data
    };
  }

  public async getFavoriteNotebooks(): Promise<IJunoResponse<IGalleryItem[]>> {
    return await this.getNotebooks(`${this.getNotebooksUrl()}/gallery/favorites`, {
      headers: JunoClient.getHeaders()
    });
  }

  public async getPublishedNotebooks(): Promise<IJunoResponse<IGalleryItem[]>> {
    return await this.getNotebooks(`${this.getNotebooksUrl()}/gallery/published`, {
      headers: JunoClient.getHeaders()
    });
  }

  public async deleteNotebook(id: string): Promise<IJunoResponse<IGalleryItem>> {
    const response = await window.fetch(`${this.getNotebooksUrl()}/gallery/${id}`, {
      method: "DELETE",
      headers: JunoClient.getHeaders()
    });

    let data: IGalleryItem;
    if (response.status === HttpStatusCodes.OK) {
      data = await response.json();
    }

    return {
      status: response.status,
      data
    };
  }

  public async publishNotebook(
    name: string,
    description: string,
    tags: string[],
    author: string,
    thumbnailUrl: string,
    content: string,
    isLinkInjectionEnabled: boolean
  ): Promise<IJunoResponse<IGalleryItem>> {
    const response = await window.fetch(`${this.getNotebooksAccountUrl()}/gallery`, {
      method: "PUT",
      headers: JunoClient.getHeaders(),
      body: isLinkInjectionEnabled
        ? JSON.stringify({
            name,
            description,
            tags,
            author,
            thumbnailUrl,
            content: JSON.parse(content),
            addLinkToNotebookViewer: isLinkInjectionEnabled
          } as IPublishNotebookRequest)
        : JSON.stringify({
            name,
            description,
            tags,
            author,
            thumbnailUrl,
            content: JSON.parse(content)
          } as IPublishNotebookRequest)
    });

    let data: IGalleryItem;
    if (response.status === HttpStatusCodes.OK) {
      data = await response.json();
    } else {
      throw new Error(`HTTP status ${response.status} thrown. ${(await response.json()).Message}`);
    }

    return {
      status: response.status,
      data
    };
  }

  public getNotebookContentUrl(id: string): string {
    return `${this.getNotebooksUrl()}/gallery/${id}/content`;
  }

  public getNotebookInfoUrl(id: string): string {
    return `${this.getNotebooksUrl()}/gallery/${id}`;
  }

  public async reportAbuse(notebookId: string, abuseCategory: string, notes: string): Promise<IJunoResponse<boolean>> {
    const response = await window.fetch(`${this.getNotebooksUrl()}/avert/reportAbuse`, {
      method: "POST",
      body: JSON.stringify({
        notebookId,
        abuseCategory,
        notes
      }),
      headers: {
        [HttpHeaders.contentType]: "application/json"
      }
    });

    let data: boolean;
    if (response.status === HttpStatusCodes.OK) {
      data = await response.json();
    }

    return {
      status: response.status,
      data
    };
  }

  private async getNotebooks(input: RequestInfo, init?: RequestInit): Promise<IJunoResponse<IGalleryItem[]>> {
    const response = await window.fetch(input, init);

    let data: IGalleryItem[];
    if (response.status === HttpStatusCodes.OK) {
      data = await response.json();
    }

    return {
      status: response.status,
      data
    };
  }

  private getNotebooksUrl(): string {
    return `${configContext.JUNO_ENDPOINT}/api/notebooks`;
  }

  private getNotebooksAccountUrl(): string {
    return `${configContext.JUNO_ENDPOINT}/api/notebooks/${this.databaseAccount().name}`;
  }

  private static getHeaders(): HeadersInit {
    const authorizationHeader = getAuthorizationHeader();
    return {
      [authorizationHeader.header]: authorizationHeader.token,
      [HttpHeaders.contentType]: "application/json"
    };
  }

  private static getGitHubClientParams(): URLSearchParams {
    const githubParams = new URLSearchParams({
      client_id: configContext.GITHUB_CLIENT_ID
    });

    if (configContext.GITHUB_CLIENT_SECRET) {
      githubParams.append("client_secret", configContext.GITHUB_CLIENT_SECRET);
    }

    return githubParams;
  }
}
