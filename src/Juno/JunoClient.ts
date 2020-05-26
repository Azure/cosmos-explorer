import ko from "knockout";
import { HttpStatusCodes } from "../Common/Constants";
import { config } from "../Config";
import * as ViewModels from "../Contracts/ViewModels";
import { IGitHubResponse } from "../GitHub/GitHubClient";
import { IGitHubOAuthToken } from "../GitHub/GitHubOAuthService";
import { getAuthorizationHeader } from "../Utils/AuthorizationUtils";
import { AuthorizeAccessComponent } from "../Explorer/Controls/GitHub/AuthorizeAccessComponent";

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

export class JunoClient {
  private cachedPinnedRepos: ko.Observable<IPinnedRepo[]>;

  constructor(public databaseAccount: ko.Observable<ViewModels.DatabaseAccount>) {
    this.cachedPinnedRepos = ko.observable<IPinnedRepo[]>([]);
  }

  public subscribeToPinnedRepos(callback: ko.SubscriptionCallback<IPinnedRepo[], void>): ko.Subscription {
    return this.cachedPinnedRepos.subscribe(callback);
  }

  public async getPinnedRepos(scope: string): Promise<IJunoResponse<IPinnedRepo[]>> {
    const response = await window.fetch(`${this.getJunoGitHubUrl()}/pinnedrepos`, {
      headers: this.getHeaders()
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
    const response = await window.fetch(`${this.getJunoGitHubUrl()}/pinnedrepos`, {
      method: "PUT",
      body: JSON.stringify(repos),
      headers: this.getHeaders()
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
    const response = await window.fetch(this.getJunoGitHubUrl(), {
      method: "DELETE",
      headers: this.getHeaders()
    });

    return {
      status: response.status,
      data: undefined
    };
  }

  public async getGitHubToken(code: string): Promise<IGitHubResponse<IGitHubOAuthToken>> {
    const githubParams = JunoClient.getGitHubClientParams();
    githubParams.append("code", code);

    const response = await window.fetch(`${this.getJunoGitHubUrl()}/token?${githubParams.toString()}`, {
      headers: this.getHeaders()
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

    const response = await window.fetch(`${this.getJunoGitHubUrl()}/token?${githubParams.toString()}`, {
      method: "DELETE",
      headers: this.getHeaders()
    });

    return {
      status: response.status,
      data: await response.text()
    };
  }

  private getJunoGitHubUrl(): string {
    return `${config.JUNO_ENDPOINT}/api/notebooks/${this.databaseAccount().name}/github`;
  }

  private getHeaders(): HeadersInit {
    const authorizationHeader = getAuthorizationHeader();
    return {
      [authorizationHeader.header]: authorizationHeader.token,
      "content-type": "application/json"
    };
  }

  public static getGitHubClientParams(): URLSearchParams {
    const githubParams = new URLSearchParams({
      client_id: config.GITHUB_CLIENT_ID
    });

    if (config.GITHUB_CLIENT_SECRET) {
      githubParams.append("client_secret", config.GITHUB_CLIENT_SECRET);
    }

    return githubParams;
  }
}
