import { AuthType } from "../../AuthType";
import * as Constants from "../../Common/Constants";
import { configContext } from "../../ConfigContext";
import { ApiKind, DatabaseAccount } from "../../Contracts/DataModels";
import { DataExplorerInputsFrame } from "../../Contracts/ViewModels";
import Explorer from "../../Explorer/Explorer";
import "../../Explorer/Tables/DataTable/DataTableBindingManager";
import { CollectionCreation, SubscriptionUtilMappings } from "../../Shared/Constants";
import { DefaultExperienceUtility } from "../../Shared/DefaultExperienceUtility";
import AuthHeadersUtil from "./Authorization";
import { extractFeatures } from "./extractFeatures";
import { getDatabaseAccountPropertiesFromMetadata } from "./HostedUtils";

export default class Main {
  public static initDataExplorerFrameInputs(
    explorer: Explorer,
    masterKey?: string /* master key extracted from connection string if available */,
    account?: DatabaseAccount,
    authorizationToken?: string /* access key */
  ): void {
    const serverId: string = AuthHeadersUtil.serverId;
    const authType: string = (<any>window).authType;
    const accountResourceId =
      authType === AuthType.EncryptedToken
        ? Main._databaseAccountId
        : authType === AuthType.AAD && account
        ? account.id
        : "";
    const subscriptionId: string = accountResourceId && accountResourceId.split("subscriptions/")[1].split("/")[0];
    const resourceGroup: string = accountResourceId && accountResourceId.split("resourceGroups/")[1].split("/")[0];

    explorer.isTryCosmosDBSubscription(SubscriptionUtilMappings.FreeTierSubscriptionIds.indexOf(subscriptionId) >= 0);
    if (authorizationToken && authorizationToken.indexOf("Bearer") !== 0) {
      // Portal sends the auth token with bearer suffix, so we prepend the same to be consistent
      authorizationToken = `Bearer ${authorizationToken}`;
    }

    if (authType === AuthType.EncryptedToken) {
      // TODO: Remove window.authType
      window.authType = AuthType.EncryptedToken;
      const apiExperience: string = DefaultExperienceUtility.getDefaultExperienceFromApiKind(
        Main._accessInputMetadata.apiKind
      );
      return explorer.initDataExplorerWithFrameInputs({
        databaseAccount: {
          id: Main._databaseAccountId,
          name: Main._accessInputMetadata.accountName,
          kind: this._getDatabaseAccountKindFromExperience(apiExperience),
          properties: getDatabaseAccountPropertiesFromMetadata(Main._accessInputMetadata),
          tags: { defaultExperience: apiExperience }
        },
        subscriptionId,
        resourceGroup,
        masterKey,
        hasWriteAccess: true, // TODO: we should embed this information in the token ideally
        authorizationToken: undefined,
        features: extractFeatures(),
        csmEndpoint: undefined,
        dnsSuffix: null,
        serverId: serverId,
        extensionEndpoint: configContext.BACKEND_ENDPOINT,
        subscriptionType: CollectionCreation.DefaultSubscriptionType,
        quotaId: undefined,
        addCollectionDefaultFlight: explorer.flight(),
        isTryCosmosDBSubscription: explorer.isTryCosmosDBSubscription()
      });
    }

    if (authType === AuthType.AAD) {
      const inputs: DataExplorerInputsFrame = {
        databaseAccount: account,
        subscriptionId,
        resourceGroup,
        masterKey,
        hasWriteAccess: true, //TODO: 425017 - support read access
        authorizationToken,
        features: extractFeatures(),
        csmEndpoint: undefined,
        dnsSuffix: null,
        serverId: serverId,
        extensionEndpoint: configContext.BACKEND_ENDPOINT,
        subscriptionType: CollectionCreation.DefaultSubscriptionType,
        quotaId: undefined,
        addCollectionDefaultFlight: explorer.flight(),
        isTryCosmosDBSubscription: explorer.isTryCosmosDBSubscription()
      };
      return explorer.initDataExplorerWithFrameInputs(inputs);
    }

    if (authType === AuthType.ResourceToken) {
      const apiExperience: string = DefaultExperienceUtility.getDefaultExperienceFromApiKind(
        Main._accessInputMetadata.apiKind
      );
      return explorer.initDataExplorerWithFrameInputs({
        databaseAccount: {
          id: Main._databaseAccountId,
          name: Main._accessInputMetadata.accountName,
          kind: this._getDatabaseAccountKindFromExperience(apiExperience),
          properties: getDatabaseAccountPropertiesFromMetadata(Main._accessInputMetadata),
          tags: { defaultExperience: apiExperience }
        },
        subscriptionId,
        resourceGroup,
        masterKey,
        hasWriteAccess: true, // TODO: we should embed this information in the token ideally
        authorizationToken: undefined,
        features: extractFeatures(),
        csmEndpoint: undefined,
        dnsSuffix: null,
        serverId: serverId,
        extensionEndpoint: configContext.BACKEND_ENDPOINT,
        subscriptionType: CollectionCreation.DefaultSubscriptionType,
        quotaId: undefined,
        addCollectionDefaultFlight: explorer.flight(),
        isTryCosmosDBSubscription: explorer.isTryCosmosDBSubscription(),
        isAuthWithresourceToken: true
      });
    }

    throw new Error(`Unsupported AuthType ${authType}`);
  }
}
