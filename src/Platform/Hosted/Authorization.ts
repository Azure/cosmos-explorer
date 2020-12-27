import Q from "q";
import * as Constants from "../../Common/Constants";
import * as DataModels from "../../Contracts/DataModels";
import { AuthType } from "../../AuthType";
import * as NotificationConsoleUtils from "../../Utils/NotificationConsoleUtils";
import { ConsoleDataType } from "../../Explorer/Menus/NotificationConsole/NotificationConsoleComponent";
import { DefaultExperienceUtility } from "../../Shared/DefaultExperienceUtility";
import * as Logger from "../../Common/Logger";
import { configContext } from "../../ConfigContext";
import { userContext } from "../../UserContext";

export default class AuthHeadersUtil {
  public static serverId: string = Constants.ServerIds.productionPortal;

  private static readonly _firstPartyAppId: string = "203f1145-856a-4232-83d4-a43568fba23d";
  private static readonly _aadEndpoint: string = configContext.AAD_ENDPOINT;
  private static readonly _armEndpoint: string = configContext.ARM_ENDPOINT;
  private static readonly _arcadiaEndpoint: string = configContext.ARCADIA_ENDPOINT;
  private static readonly _armAuthArea: string = configContext.ARM_AUTH_AREA;
  private static readonly _graphEndpoint: string = configContext.GRAPH_ENDPOINT;
  private static readonly _graphApiVersion: string = configContext.GRAPH_API_VERSION;

  private static _authContext: AuthenticationContext = new AuthenticationContext({
    instance: AuthHeadersUtil._aadEndpoint,
    clientId: AuthHeadersUtil._firstPartyAppId,
    postLogoutRedirectUri: window.location.origin,
    endpoints: {
      aad: AuthHeadersUtil._aadEndpoint,
      graph: AuthHeadersUtil._graphEndpoint,
      armAuthArea: AuthHeadersUtil._armAuthArea,
      armEndpoint: AuthHeadersUtil._armEndpoint,
      arcadiaEndpoint: AuthHeadersUtil._arcadiaEndpoint
    },
    tenant: undefined,
    cacheLocation: window.navigator.userAgent.indexOf("Edge") > -1 ? "localStorage" : undefined
  });

  public static getAccessInputMetadata(accessInput: string): Q.Promise<DataModels.AccessInputMetadata> {
    const deferred: Q.Deferred<DataModels.AccessInputMetadata> = Q.defer<DataModels.AccessInputMetadata>();
    const url = `${configContext.BACKEND_ENDPOINT}${Constants.ApiEndpoints.guestRuntimeProxy}/accessinputmetadata`;
    const authType: string = (<any>window).authType;
    const headers: { [headerName: string]: string } = {};

    if (authType === AuthType.EncryptedToken) {
      headers[Constants.HttpHeaders.guestAccessToken] = accessInput;
    } else {
      headers[Constants.HttpHeaders.connectionString] = accessInput;
    }

    $.ajax({
      url: url,
      type: "GET",
      headers: headers,
      cache: false,
      dataType: "text"
    }).then(
      (data: string, textStatus: string, xhr: JQueryXHR<any>) => {
        if (!data) {
          NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, `Failed to get access input metadata`);
          deferred.reject(`Failed to get access input metadata`);
        }

        try {
          const metadata: DataModels.AccessInputMetadata = JSON.parse(JSON.parse(data));
          deferred.resolve(metadata); // TODO: update to a single JSON parse once backend response is stringified exactly once
        } catch (error) {
          NotificationConsoleUtils.logConsoleMessage(ConsoleDataType.Error, "Failed to parse access input metadata");
          deferred.reject("Failed to parse access input metadata");
          throw error;
        }
      },
      (xhr: JQueryXHR<any>, textStatus: string, error: any) => {
        NotificationConsoleUtils.logConsoleMessage(
          ConsoleDataType.Error,
          `Error while fetching access input metadata: ${JSON.stringify(xhr.responseText)}`
        );
        deferred.reject(xhr.responseText);
      }
    );

    return deferred.promise.timeout(Constants.ClientDefaults.requestTimeoutMs);
  }

  public static generateEncryptedToken(): Q.Promise<DataModels.GenerateTokenResponse> {
    const url = configContext.BACKEND_ENDPOINT + "/api/tokens/generateToken" + AuthHeadersUtil._generateResourceUrl();
    const explorer = window.dataExplorer;
    const headers: any = { authorization: userContext.authorizationToken };
    headers[Constants.HttpHeaders.getReadOnlyKey] = !explorer.hasWriteAccess();

    return AuthHeadersUtil._initiateGenerateTokenRequest({
      url: url,
      type: "POST",
      headers: headers,
      contentType: "application/json",
      cache: false
    });
  }

  public static generateUnauthenticatedEncryptedTokenForConnectionString(
    connectionString: string
  ): Q.Promise<DataModels.GenerateTokenResponse> {
    if (!connectionString) {
      return Q.reject("None or empty connection string specified");
    }

    const url = configContext.BACKEND_ENDPOINT + "/api/guest/tokens/generateToken";
    const headers: any = {};
    headers[Constants.HttpHeaders.connectionString] = connectionString;

    return AuthHeadersUtil._initiateGenerateTokenRequest({
      url: url,
      type: "POST",
      headers: headers,
      contentType: "application/json",
      cache: false
    });
  }

  public static isUserSignedIn(): boolean {
    const user = AuthHeadersUtil._authContext.getCachedUser();
    return !!user;
  }

  public static getCachedUser(): AuthenticationContext.UserInfo {
    if (this.isUserSignedIn()) {
      return AuthHeadersUtil._authContext.getCachedUser();
    }
    return undefined;
  }

  public static signIn() {
    if (!AuthHeadersUtil.isUserSignedIn()) {
      AuthHeadersUtil._authContext.login();
    }
  }

  public static signOut() {
    AuthHeadersUtil._authContext.logOut();
  }

  /**
   * Process token from oauth after login or get cached
   */
  public static processTokenResponse() {
    const isCallback = AuthHeadersUtil._authContext.isCallback(window.location.hash);
    if (isCallback && !AuthHeadersUtil._authContext.getLoginError()) {
      AuthHeadersUtil._authContext.handleWindowCallback();
    }
  }

  /**
   * Get auth token to access apis (Graph, ARM)
   *
   * @param authEndpoint Default to ARM endpoint
   * @param tenantId if tenant id provided, tenant id will set at global. Can be reset with 'common'
   */
  public static async getAccessToken(
    authEndpoint: string = AuthHeadersUtil._armAuthArea,
    tenantId?: string
  ): Promise<string> {
    const AuthorizationType: string = (<any>window).authType;
    if (AuthorizationType === AuthType.EncryptedToken) {
      // setting authorization header to an undefined value causes the browser to exclude
      // the header, which is expected here
      throw new Error("auth type is encrypted token, should not get access token");
    }

    return new Promise<string>(async (resolve, reject) => {
      if (tenantId) {
        // if tenant id passed in, we will use this tenant id for all the rest calls until next tenant id passed in
        AuthHeadersUtil._authContext.config.tenant = tenantId;
      }

      AuthHeadersUtil._authContext.acquireToken(
        authEndpoint,
        AuthHeadersUtil._authContext.config.tenant,
        (errorResponse: any, token: any) => {
          if (errorResponse && typeof errorResponse === "string") {
            if (errorResponse.indexOf("login is required") >= 0 || errorResponse.indexOf("AADSTS50058") === 0) {
              // Handle error AADSTS50058: A silent sign-in request was sent but no user is signed in.
              // The user's cached token is invalid, hence we let the user login again.
              AuthHeadersUtil._authContext.login();
              return;
            }
            if (
              this._isMultifactorAuthRequired(errorResponse) ||
              errorResponse.indexOf("AADSTS53000") > -1 ||
              errorResponse.indexOf("AADSTS65001") > -1
            ) {
              // Handle error AADSTS50079 and AADSTS50076: User needs to use multifactor authentication and acquireToken fails silent. Redirect
              // Handle error AADSTS53000: User needs to use compliant device to access resource when Conditional Access Policy is set up for user.
              AuthHeadersUtil._authContext.acquireTokenRedirect(
                authEndpoint,
                AuthHeadersUtil._authContext.config.tenant
              );
              return;
            }
          }
          if (errorResponse || !token) {
            Logger.logError(errorResponse, "Hosted/Authorization/_getAuthHeader");
            reject(errorResponse);
            return;
          }
          resolve(token);
        }
      );
    });
  }

  public static async getPhotoFromGraphAPI(): Promise<Blob> {
    const token = await this.getAccessToken(AuthHeadersUtil._graphEndpoint);
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${token}`);

    try {
      const response: Response = await fetch(
        `${AuthHeadersUtil._graphEndpoint}/me/thumbnailPhoto?api-version=${AuthHeadersUtil._graphApiVersion}`,
        {
          method: "GET",
          headers: headers
        }
      );
      if (!response.ok) {
        throw response;
      }
      return response.blob();
    } catch (err) {
      return new Blob();
    }
  }

  private static async _getTenant(subId: string): Promise<string | undefined> {
    if (subId) {
      try {
        // Follow https://github.com/MicrosoftDocs/azure-docs/blob/master/articles/azure-resource-manager/resource-manager-api-authentication.md
        // TenantId will be returned in the header of the response.
        const response: Response = await fetch(
          `https://management.core.windows.net/subscriptions/${subId}?api-version=2015-01-01`
        );
        if (!response.ok) {
          throw response;
        }
      } catch (reason) {
        if (reason.status === 401) {
          const authUrl: string = reason.headers
            .get("www-authenticate")
            .split(",")[0]
            .split("=")[1];
          // Fetch the tenant GUID ID and the length should be 36.
          const tenantId: string = authUrl.substring(authUrl.lastIndexOf("/") + 1, authUrl.lastIndexOf("/") + 37);
          return Promise.resolve(tenantId);
        }
      }
    }
    return Promise.resolve(undefined);
  }

  private static _isMultifactorAuthRequired(errorResponse: string): boolean {
    for (const code of ["AADSTS50079", "AADSTS50076"]) {
      if (errorResponse.indexOf(code) === 0) {
        return true;
      }
    }
    return false;
  }

  private static _generateResourceUrl(): string {
    const databaseAccount = userContext.databaseAccount;
    const subscriptionId: string = userContext.subscriptionId;
    const resourceGroup = userContext.resourceGroup;
    const defaultExperience: string = DefaultExperienceUtility.getDefaultExperienceFromDatabaseAccount(databaseAccount);
    const apiKind: DataModels.ApiKind = DefaultExperienceUtility.getApiKindFromDefaultExperience(defaultExperience);
    const accountEndpoint = (databaseAccount && databaseAccount.properties.documentEndpoint) || "";
    const sid = subscriptionId || "";
    const rg = resourceGroup || "";
    const dba = (databaseAccount && databaseAccount.name) || "";
    const resourceUrl = encodeURIComponent(accountEndpoint);
    const rid = "";
    const rtype = "";
    return `?resourceUrl=${resourceUrl}&rid=${rid}&rtype=${rtype}&sid=${sid}&rg=${rg}&dba=${dba}&api=${apiKind}`;
  }

  private static _initiateGenerateTokenRequest(
    requestSettings: JQueryAjaxSettings<any>
  ): Q.Promise<DataModels.GenerateTokenResponse> {
    const deferred: Q.Deferred<DataModels.GenerateTokenResponse> = Q.defer<DataModels.GenerateTokenResponse>();

    $.ajax(requestSettings).then(
      (data: string, textStatus: string, xhr: JQueryXHR<any>) => {
        if (!data) {
          deferred.reject("No token generated");
        }

        deferred.resolve(JSON.parse(data));
      },
      (xhr: JQueryXHR<any>, textStatus: string, error: any) => {
        deferred.reject(xhr.responseText);
      }
    );

    return deferred.promise.timeout(Constants.ClientDefaults.requestTimeoutMs);
  }
}
