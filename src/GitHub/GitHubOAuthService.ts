import ko from "knockout";
import postRobot from "post-robot";
import { GetGithubClientId } from "Utils/GitHubUtils";
import { HttpStatusCodes } from "../Common/Constants";
import { handleError } from "../Common/ErrorHandlingUtils";
import { AuthorizeAccessComponent } from "../Explorer/Controls/GitHub/AuthorizeAccessComponent";
import { JunoClient } from "../Juno/JunoClient";
import { logConsoleInfo } from "../Utils/NotificationConsoleUtils";
import { GitHubConnectorMsgType, IGitHubConnectorParams } from "./GitHubConnector";

postRobot.on(
  GitHubConnectorMsgType,
  {
    domain: window.location.origin,
  },
  (event) => {
    // Typescript definition for event is wrong. So read params by casting to <any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params = (event as any).data as IGitHubConnectorParams;
    window.dataExplorer.notebookManager?.gitHubOAuthService.finishOAuth(params);
  },
);

export interface IGitHubOAuthToken {
  // API properties
  access_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

export class GitHubOAuthService {
  private static readonly OAuthEndpoint = "https://github.com/login/oauth/authorize";

  private state: string;
  private token: ko.Observable<IGitHubOAuthToken>;

  constructor(private junoClient: JunoClient) {
    this.token = ko.observable<IGitHubOAuthToken>();
  }

  public async startOAuth(scope: string): Promise<string> {
    // If attempting to change scope from "Public & private repos" to "Public only" we need to delete app authorization.
    // Otherwise OAuth app still retains the "public & private repos" permissions.
    if (
      this.token()?.scope === AuthorizeAccessComponent.Scopes.PublicAndPrivate.key &&
      scope === AuthorizeAccessComponent.Scopes.Public.key
    ) {
      const logoutSuccessful = await this.logout();
      if (!logoutSuccessful) {
        return undefined;
      }
    }

    const params = {
      scope,
      client_id: GetGithubClientId(),
      redirect_uri: new URL("./connectToGitHub.html", window.location.href).href,
      state: this.resetState(),
    };

    window.open(`${GitHubOAuthService.OAuthEndpoint}?${new URLSearchParams(params).toString()}`);
    return params.state;
  }

  public async finishOAuth(params: IGitHubConnectorParams): Promise<void> {
    try {
      this.validateState(params.state);
      const response = await this.junoClient.getGitHubToken(params.code);

      if (response.status === HttpStatusCodes.OK && !response.data.error) {
        logConsoleInfo("Successfully connected to GitHub");
        this.token(response.data);
      } else {
        let errorMsg = response.data.error;
        if (response.data.error_description) {
          errorMsg = `${errorMsg}: ${response.data.error_description}`;
        }
        throw new Error(errorMsg);
      }
    } catch (error) {
      logConsoleInfo(`Failed to connect to GitHub: ${error}`);
      this.token({ error });
    }
  }

  public getTokenObservable(): ko.Observable<IGitHubOAuthToken> {
    return this.token;
  }

  public async logout(): Promise<boolean> {
    try {
      const response = await this.junoClient.deleteAppAuthorization(this.token()?.access_token);
      if (response.status !== HttpStatusCodes.NoContent) {
        throw new Error(`Received HTTP ${response.status}: ${response.data} when deleting app authorization`);
      }

      this.resetToken();
      return true;
    } catch (error) {
      handleError(error, "GitHubOAuthService/logout", "Failed to delete app authorization");
      return false;
    }
  }

  public isLoggedIn(): boolean {
    return !!this.token()?.access_token;
  }

  private resetState(): string {
    this.state = Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER)).toString();
    return this.state;
  }

  public resetToken(): void {
    this.token(undefined);
  }

  private validateState(state: string) {
    if (state !== this.state) {
      throw new Error("State didn't match. Possibility of cross-site request forgery attack.");
    }
  }
}
