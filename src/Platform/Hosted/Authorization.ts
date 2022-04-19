import * as Constants from "../../Common/Constants";
import { configContext } from "../../ConfigContext";
import * as DataModels from "../../Contracts/DataModels";
import { DefaultExperienceUtility } from "../../Shared/DefaultExperienceUtility";
import { userContext } from "../../UserContext";

export const generateEncryptedToken = async (readOnly = false): Promise<DataModels.GenerateTokenResponse> => {
  const url = configContext.BACKEND_ENDPOINT + "/api/tokens/generateToken" + _generateResourceUrl();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const headers: any = { authorization: userContext.authorizationToken };
  headers[Constants.HttpHeaders.getReadOnlyKey] = readOnly;

  const response = await fetch(url, { method: "POST", headers });
  const result = await response.json();
  // This API has a quirk where the response must be parsed to JSON twice
  return JSON.parse(result);
};

export const _generateResourceUrl = (): string => {
  const { databaseAccount, resourceGroup, subscriptionId } = userContext;
  const apiKind: DataModels.ApiKind = DefaultExperienceUtility.getApiKindFromDefaultExperience(userContext.apiType);
  const accountEndpoint = databaseAccount?.properties?.documentEndpoint || "";
  const sid = subscriptionId || "";
  const rg = resourceGroup || "";
  const dba = databaseAccount?.name || "";
  const resourceUrl = encodeURIComponent(accountEndpoint);
  const rid = "";
  const rtype = "";
  return `?resourceUrl=${resourceUrl}&rid=${rid}&rtype=${rtype}&sid=${sid}&rg=${rg}&dba=${dba}&api=${apiKind}`;
};
