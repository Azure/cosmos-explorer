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
