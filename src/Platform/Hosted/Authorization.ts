import Q from "q";
import * as Constants from "../../Common/Constants";
import { configContext } from "../../ConfigContext";
import * as DataModels from "../../Contracts/DataModels";
import { DefaultExperienceUtility } from "../../Shared/DefaultExperienceUtility";
import { userContext } from "../../UserContext";

export default class AuthHeadersUtil {
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
      cache: false,
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
      cache: false,
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
