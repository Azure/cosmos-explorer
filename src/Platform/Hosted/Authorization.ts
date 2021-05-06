import * as Constants from "../../Common/Constants";
import { configContext } from "../../ConfigContext";
import * as DataModels from "../../Contracts/DataModels";
import { DefaultExperienceUtility } from "../../Shared/DefaultExperienceUtility";
import { userContext } from "../../UserContext";

export default class AuthHeadersUtil {
  public static async generateEncryptedToken(readOnly: boolean = false): Promise<DataModels.GenerateTokenResponse> {
    const url = configContext.BACKEND_ENDPOINT + "/api/tokens/generateToken" + AuthHeadersUtil._generateResourceUrl();
    const headers: any = { authorization: userContext.authorizationToken };
    headers[Constants.HttpHeaders.getReadOnlyKey] = readOnly;

    const response = await fetch(url, { method: "POST", headers });
    const result = await response.json();
    // This API has a quirk where the response must be parsed to JSON twice
    return JSON.parse(result);
  }

  private static _generateResourceUrl(): string {
<<<<<<< HEAD
    const databaseAccount = userContext.databaseAccount;
    const subscriptionId: string = userContext.subscriptionId;
    const resourceGroup = userContext.resourceGroup;
    const apiKind: DataModels.ApiKind = DefaultExperienceUtility.getApiKindFromDefaultExperience(userContext.apiType);
    const accountEndpoint = (databaseAccount && databaseAccount.properties.documentEndpoint) || "";
=======
    const { databaseAccount, resourceGroup, subscriptionId } = userContext;
    const apiKind: DataModels.ApiKind = DefaultExperienceUtility.getApiKindFromDefaultExperience(userContext.apiType);
    const accountEndpoint = databaseAccount?.properties?.documentEndpoint || "";
>>>>>>> 23223cfb231e7c65b01dd47faa51a1d84007352d
    const sid = subscriptionId || "";
    const rg = resourceGroup || "";
    const dba = databaseAccount?.name || "";
    const resourceUrl = encodeURIComponent(accountEndpoint);
    const rid = "";
    const rtype = "";
    return `?resourceUrl=${resourceUrl}&rid=${rid}&rtype=${rtype}&sid=${sid}&rg=${rg}&dba=${dba}&api=${apiKind}`;
  }
}
