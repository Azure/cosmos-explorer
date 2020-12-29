import AuthHeadersUtil from "./Authorization";
import * as Constants from "../../Common/Constants";
import * as Logger from "../../Common/Logger";
import { Tenant, Subscription, DatabaseAccount, AccountKeys } from "../../Contracts/DataModels";
import { configContext } from "../../ConfigContext";
import { getErrorMessage } from "../../Common/ErrorHandlingUtils";

// TODO: 421864 - add a fetch wrapper
export class ArmResourceUtils {
  private static readonly _armEndpoint: string = configContext.ARM_ENDPOINT;
  private static readonly _armApiVersion: string = configContext.ARM_API_VERSION;
  private static readonly _armAuthArea: string = configContext.ARM_AUTH_AREA;

  // TODO: 422867 - return continuation token instead of read through
  public static async listTenants(): Promise<Array<Tenant>> {
    let tenants: Array<Tenant> = [];

    try {
      const fetchHeaders = await ArmResourceUtils._getAuthHeader(ArmResourceUtils._armAuthArea);
      let nextLink = `${ArmResourceUtils._armEndpoint}/tenants?api-version=2017-08-01`;

      while (nextLink) {
        const response: Response = await fetch(nextLink, { headers: fetchHeaders });
        const result: TenantListResult =
          response.status === 204 || response.status === 304 ? null : await response.json();
        if (!response.ok) {
          throw result;
        }
        nextLink = result.nextLink;
        tenants = [...tenants, ...result.value];
      }
      return tenants;
    } catch (error) {
      Logger.logError(getErrorMessage(error), "ArmResourceUtils/listTenants");
      throw error;
    }
  }

  // TODO: 422867 - return continuation token instead of read through
  public static async listSubscriptions(tenantId?: string): Promise<Array<Subscription>> {
    let subscriptions: Array<Subscription> = [];

    try {
      const fetchHeaders = await ArmResourceUtils._getAuthHeader(ArmResourceUtils._armAuthArea, tenantId);
      let nextLink = `${ArmResourceUtils._armEndpoint}/subscriptions?api-version=${ArmResourceUtils._armApiVersion}`;

      while (nextLink) {
        const response: Response = await fetch(nextLink, { headers: fetchHeaders });
        const result: SubscriptionListResult =
          response.status === 204 || response.status === 304 ? null : await response.json();
        if (!response.ok) {
          throw result;
        }
        nextLink = result.nextLink;
        const validSubscriptions = result.value.filter(
          sub => sub.state === "Enabled" || sub.state === "Warned" || sub.state === "PastDue"
        );
        subscriptions = [...subscriptions, ...validSubscriptions];
      }
      return subscriptions;
    } catch (error) {
      Logger.logError(getErrorMessage(error), "ArmResourceUtils/listSubscriptions");
      throw error;
    }
  }

  // TODO: 422867 - return continuation token instead of read through
  public static async listCosmosdbAccounts(
    subscriptionIds: string[],
    tenantId?: string
  ): Promise<Array<DatabaseAccount>> {
    if (!subscriptionIds || !subscriptionIds.length) {
      return Promise.reject("No subscription passed in");
    }

    let accounts: Array<DatabaseAccount> = [];

    try {
      const subscriptionFilter = "subscriptionId eq '" + subscriptionIds.join("' or subscriptionId eq '") + "'";
      const urlFilter = `$filter=(${subscriptionFilter}) and (resourceType eq 'microsoft.documentdb/databaseaccounts')`;
      const fetchHeaders = await ArmResourceUtils._getAuthHeader(ArmResourceUtils._armAuthArea, tenantId);
      let nextLink = `${ArmResourceUtils._armEndpoint}/resources?api-version=${ArmResourceUtils._armApiVersion}&${urlFilter}`;

      while (nextLink) {
        const response: Response = await fetch(nextLink, { headers: fetchHeaders });
        const result: AccountListResult =
          response.status === 204 || response.status === 304 ? null : await response.json();
        if (!response.ok) {
          throw result;
        }
        nextLink = result.nextLink;
        accounts = [...accounts, ...result.value];
      }
      return accounts;
    } catch (error) {
      Logger.logError(getErrorMessage(error), "ArmResourceUtils/listAccounts");
      throw error;
    }
  }

  public static async getCosmosdbAccount(cosmosdbResourceId: string, tenantId?: string): Promise<DatabaseAccount> {
    if (!cosmosdbResourceId) {
      return Promise.reject("No Cosmos DB resource id passed in");
    }
    try {
      const fetchHeaders = await ArmResourceUtils._getAuthHeader(ArmResourceUtils._armAuthArea, tenantId);
      const url = `${ArmResourceUtils._armEndpoint}/${cosmosdbResourceId}?api-version=${Constants.ArmApiVersions.documentDB}`;

      const response: Response = await fetch(url, { headers: fetchHeaders });
      const result: DatabaseAccount = response.status === 204 || response.status === 304 ? null : await response.json();
      if (!response.ok) {
        throw result;
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  public static async getCosmosdbKeys(cosmosdbResourceId: string, tenantId?: string): Promise<AccountKeys> {
    if (!cosmosdbResourceId) {
      return Promise.reject("No Cosmos DB resource id passed in");
    }

    try {
      const fetchHeaders = await ArmResourceUtils._getAuthHeader(ArmResourceUtils._armAuthArea, tenantId);
      const readWriteKeysUrl = `${ArmResourceUtils._armEndpoint}/${cosmosdbResourceId}/listKeys?api-version=${Constants.ArmApiVersions.documentDB}`;
      const readOnlyKeysUrl = `${ArmResourceUtils._armEndpoint}/${cosmosdbResourceId}/readOnlyKeys?api-version=${Constants.ArmApiVersions.documentDB}`;
      let response: Response = await fetch(readWriteKeysUrl, { headers: fetchHeaders, method: "POST" });
      if (response.status === Constants.HttpStatusCodes.Forbidden) {
        // fetch read only keys for readers
        response = await fetch(readOnlyKeysUrl, { headers: fetchHeaders, method: "POST" });
      }
      const result: AccountKeys =
        response.status === Constants.HttpStatusCodes.NoContent ||
        response.status === Constants.HttpStatusCodes.NotModified
          ? null
          : await response.json();
      if (!response.ok) {
        throw result;
      }
      return result;
    } catch (error) {
      Logger.logError(getErrorMessage(error), "ArmResourceUtils/getAccountKeys");
      throw error;
    }
  }

  public static async getAuthToken(tenantId?: string): Promise<string> {
    try {
      const token = await AuthHeadersUtil.getAccessToken(ArmResourceUtils._armAuthArea, tenantId);
      return token;
    } catch (error) {
      Logger.logError(getErrorMessage(error), "ArmResourceUtils/getAuthToken");
      throw error;
    }
  }

  private static async _getAuthHeader(authArea: string, tenantId?: string): Promise<Headers> {
    const token = await AuthHeadersUtil.getAccessToken(authArea, tenantId);
    let fetchHeaders = new Headers();
    fetchHeaders.append("authorization", `Bearer ${token}`);
    return fetchHeaders;
  }
}

interface TenantListResult {
  nextLink: string;
  value: Tenant[];
}

interface SubscriptionListResult {
  nextLink: string;
  value: Subscription[];
}

interface AccountListResult {
  nextLink: string;
  value: DatabaseAccount[];
}
