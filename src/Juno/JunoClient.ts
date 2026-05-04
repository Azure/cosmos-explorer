import { allowedJunoOrigins, validateEndpoint } from "Utils/EndpointUtils";
import { GetGithubClientId } from "Utils/GitHubUtils";
import ko from "knockout";
import { HttpHeaders, HttpStatusCodes } from "../Common/Constants";
import { configContext } from "../ConfigContext";
import * as DataModels from "../Contracts/DataModels";
import { AuthorizeAccessComponent } from "../Explorer/Controls/GitHub/AuthorizeAccessComponent";
import { IGitHubResponse } from "../GitHub/GitHubClient";
import { IGitHubOAuthToken } from "../GitHub/GitHubOAuthService";
import { userContext } from "../UserContext";
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

export class JunoClient {
  private cachedPinnedRepos: ko.Observable<IPinnedRepo[]>;

  constructor() {
    this.cachedPinnedRepos = ko.observable<IPinnedRepo[]>([]);
  }

  public subscribeToPinnedRepos(callback: ko.SubscriptionCallback<IPinnedRepo[], void>): ko.Subscription {
    return this.cachedPinnedRepos.subscribe(callback);
  }

  public async getPinnedRepos(scope: string): Promise<IJunoResponse<IPinnedRepo[]>> {
    const response = await window.fetch(`${this.getNotebooksSubscriptionIdAccountUrl()}/github/pinnedrepos`, {
      headers: JunoClient.getHeaders(),
    });

    let pinnedRepos: IPinnedRepo[];
    if (response.status === HttpStatusCodes.OK) {
      pinnedRepos = JSON.parse(await response.text());

      // In case we're restricted to public only scope, we return only public repos
      if (scope === AuthorizeAccessComponent.Scopes.Public.key) {
        pinnedRepos = pinnedRepos.filter((repo) => !repo.private);
      }

      this.cachedPinnedRepos(pinnedRepos);
    }

    return {
      status: response.status,
      data: pinnedRepos,
    };
  }

  public async updatePinnedRepos(repos: IPinnedRepo[]): Promise<IJunoResponse<undefined>> {
    const response = await window.fetch(`${this.getNotebooksSubscriptionIdAccountUrl()}/github/pinnedrepos`, {
      method: "PUT",
      body: JSON.stringify(repos),
      headers: JunoClient.getHeaders(),
    });

    if (response.status === HttpStatusCodes.OK) {
      this.cachedPinnedRepos(repos);
    }

    return {
      status: response.status,
      data: undefined,
    };
  }

  public async deleteGitHubInfo(): Promise<IJunoResponse<undefined>> {
    const response = await window.fetch(`${this.getNotebooksSubscriptionIdAccountUrl()}/github`, {
      method: "DELETE",
      headers: JunoClient.getHeaders(),
    });

    return {
      status: response.status,
      data: undefined,
    };
  }

  public async getGitHubToken(code: string): Promise<IGitHubResponse<IGitHubOAuthToken>> {
    const githubParams = JunoClient.getGitHubClientParams();
    githubParams.append("code", code);

    const response = await window.fetch(
      `${this.getNotebooksSubscriptionIdAccountUrl()}/github/token?${githubParams.toString()}`,
      {
        headers: JunoClient.getHeaders(),
      },
    );

    let data: IGitHubOAuthToken;
    const body = await response.text();
    if (body) {
      data = JSON.parse(body);
    } else {
      data = {
        error: response.statusText,
      };
    }

    return {
      status: response.status,
      data,
    };
  }

  public async deleteAppAuthorization(token: string): Promise<IJunoResponse<string>> {
    const githubParams = JunoClient.getGitHubClientParams();
    githubParams.append("access_token", token);

    const response = await window.fetch(
      `${this.getNotebooksSubscriptionIdAccountUrl()}/github/token?${githubParams.toString()}`,
      {
        method: "DELETE",
        headers: JunoClient.getHeaders(),
      },
    );

    return {
      status: response.status,
      data: await response.text(),
    };
  }

  public async increaseNotebookViews(id: string): Promise<IJunoResponse<IGalleryItem>> {
    const response = await window.fetch(`${this.getNotebooksUrl()}/gallery/${id}/views`, {
      method: "PATCH",
    });

    let data: IGalleryItem;
    if (response.status === HttpStatusCodes.OK) {
      data = await response.json();
    }

    return {
      status: response.status,
      data,
    };
  }

  public async requestSchema(
    schemaRequest: DataModels.ISchemaRequest,
  ): Promise<IJunoResponse<DataModels.ISchemaRequest>> {
    const response = await window.fetch(`${this.getAnalyticsUrl()}/schema/request`, {
      method: "POST",
      body: JSON.stringify(schemaRequest),
      headers: JunoClient.getHeaders(),
    });

    let data: DataModels.ISchemaRequest;
    if (response.status === HttpStatusCodes.OK) {
      data = await response.json();
    }

    return {
      status: response.status,
      data,
    };
  }

  public async getSchema(
    subscriptionId: string,
    resourceGroup: string,
    accountName: string,
    databaseName: string,
    containerName: string,
  ): Promise<IJunoResponse<DataModels.ISchema>> {
    const response = await window.fetch(
      `${this.getAnalyticsUrl()}/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/databaseAccounts/${accountName}/schema/${databaseName}/${containerName}`,
      {
        method: "GET",
        headers: JunoClient.getHeaders(),
      },
    );

    let data: DataModels.ISchema;

    if (response.status === HttpStatusCodes.OK) {
      data = await response.json();
    }

    return {
      status: response.status,
      data,
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
      data,
    };
  }

  // public for tests
  public static getJunoEndpoint(): string {
    const junoEndpoint = userContext.features.junoEndpoint ?? configContext.JUNO_ENDPOINT;
    if (!validateEndpoint(junoEndpoint, allowedJunoOrigins)) {
      const error = `${junoEndpoint} not allowed as juno endpoint`;
      console.error(error);
      throw new Error(error);
    }

    return junoEndpoint;
  }

  private getNotebooksUrl(): string {
    return `${JunoClient.getJunoEndpoint()}/api/notebooks`;
  }

  private getAccount(): string {
    return userContext?.databaseAccount?.name;
  }

  private getSubscriptionId(): string {
    return userContext.subscriptionId;
  }

  private getNotebooksSubscriptionIdAccountUrl(): string {
    return `${this.getNotebooksUrl()}/subscriptions/${this.getSubscriptionId()}/databaseAccounts/${this.getAccount()}`;
  }

  private getAnalyticsUrl(): string {
    return `${JunoClient.getJunoEndpoint()}/api/analytics`;
  }

  private static getHeaders(): HeadersInit {
    const authorizationHeader = getAuthorizationHeader();
    return {
      [authorizationHeader.header]: authorizationHeader.token,
      [HttpHeaders.contentType]: "application/json",
    };
  }

  private static getGitHubClientParams(): URLSearchParams {
    const githubParams = new URLSearchParams({
      client_id: GetGithubClientId(),
    });

    if (configContext.GITHUB_CLIENT_SECRET) {
      githubParams.append("client_secret", configContext.GITHUB_CLIENT_SECRET);
    }

    return githubParams;
  }
}
