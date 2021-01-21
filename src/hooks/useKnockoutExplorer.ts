import { useEffect } from "react";
import { applyExplorerBindings } from "../applyExplorerBindings";
import { AuthType } from "../AuthType";
import { AccountKind, DefaultAccountExperience, ServerIds } from "../Common/Constants";
import { configContext, ConfigContext, Platform } from "../ConfigContext";
import Explorer from "../Explorer/Explorer";
import {
  AAD,
  ConnectionString,
  EncryptedToken,
  HostedExplorerChildFrame,
  ResourceToken,
} from "../HostedExplorerChildFrame";
import { emulatorAccount } from "../Platform/Emulator/emulatorAccount";
import { extractFeatures } from "../Platform/Hosted/extractFeatures";
import { parseResourceTokenConnectionString } from "../Platform/Hosted/Helpers/ResourceTokenUtils";
import {
  getDatabaseAccountKindFromExperience,
  getDatabaseAccountPropertiesFromMetadata,
} from "../Platform/Hosted/HostedUtils";
import { SelfServeType } from "../SelfServe/SelfServeUtils";
import { CollectionCreation } from "../Shared/Constants";
import { DefaultExperienceUtility } from "../Shared/DefaultExperienceUtility";
import { updateUserContext } from "../UserContext";
import { listKeys } from "../Utils/arm/generatedClients/2020-04-01/databaseAccounts";

// This hook will create a new instance of Explorer.ts and bind it to the DOM
// It should *only* ever run once
// If it runs more than once it can cause memory leaks or handlers bound to DOM nodes that do not exist anymore.
let bindingsApplied = false;
export function useKnockoutExplorer(config: ConfigContext): void {
  useEffect(() => {
    const effect = async () => {
      if (config) {
        const explorer = new Explorer();
        if (config.platform === Platform.Hosted) {
          await configureHosted(explorer, config);
        } else if (config.platform === Platform.Emulator) {
          configureEmulator(explorer);
        } else if (config.platform === Platform.Portal) {
          configurePortal(explorer);
        }
        if (bindingsApplied) {
          console.error("Knockout bindings were applied more than once. useKnockoutExplorer has a problem.");
        }
        applyExplorerBindings(explorer);
        bindingsApplied = true;
      }
    };
    effect();
  }, [config]);
}

async function configureHosted(explorer: Explorer, config: ConfigContext) {
  const win = (window as unknown) as HostedExplorerChildFrame;
  explorer.selfServeType(SelfServeType.none);
  if (win.hostedConfig.authType === AuthType.EncryptedToken) {
    configureHostedWithEncryptedToken(explorer, win.hostedConfig, config);
  } else if (win.hostedConfig.authType === AuthType.ResourceToken) {
    configureHostedWithResourceToken(win.hostedConfig, explorer);
  } else if (win.hostedConfig.authType === AuthType.ConnectionString) {
    configureHostedWithConnectionString(explorer, win.hostedConfig);
  } else if (win.hostedConfig.authType === AuthType.AAD) {
    await configureHostedWithAAD(win.hostedConfig, explorer);
  }
}

async function configureHostedWithAAD(config: AAD, explorer: Explorer) {
  window.authType = AuthType.AAD;
  const account = config.databaseAccount;
  const accountResourceId = account.id;
  const subscriptionId = accountResourceId && accountResourceId.split("subscriptions/")[1].split("/")[0];
  const resourceGroup = accountResourceId && accountResourceId.split("resourceGroups/")[1].split("/")[0];
  updateUserContext({
    authorizationToken: `Bearer ${config.authorizationToken}`,
    databaseAccount: config.databaseAccount,
  });
  const keys = await listKeys(subscriptionId, resourceGroup, account.name);
  explorer.initDataExplorerWithFrameInputs({
    databaseAccount: account,
    subscriptionId,
    resourceGroup,
    masterKey: keys.primaryMasterKey,
    hasWriteAccess: true,
    authorizationToken: `Bearer ${config.authorizationToken}`,
    features: extractFeatures(),
    csmEndpoint: undefined,
    dnsSuffix: undefined,
    serverId: ServerIds.productionPortal,
    extensionEndpoint: configContext.BACKEND_ENDPOINT,
    subscriptionType: CollectionCreation.DefaultSubscriptionType,
    quotaId: undefined,
    addCollectionDefaultFlight: explorer.flight(),
    isTryCosmosDBSubscription: explorer.isTryCosmosDBSubscription(),
  });
  explorer.isAccountReady(true);
}

function configureHostedWithConnectionString(explorer: Explorer, config: ConnectionString) {
  // For legacy reasons lots of code expects a connection string login to look and act like an encrypted token login
  window.authType = AuthType.EncryptedToken;
  // Impossible to tell if this is a try cosmos sub using an encrypted token
  explorer.isTryCosmosDBSubscription(false);
  updateUserContext({
    accessToken: encodeURIComponent(config.encryptedToken),
  });

  const apiExperience: string = DefaultExperienceUtility.getDefaultExperienceFromApiKind(
    config.encryptedTokenMetadata.apiKind
  );
  explorer.initDataExplorerWithFrameInputs({
    databaseAccount: {
      id: "",
      // id: Main._databaseAccountId,
      name: config.encryptedTokenMetadata.accountName,
      kind: getDatabaseAccountKindFromExperience(apiExperience),
      properties: getDatabaseAccountPropertiesFromMetadata(config.encryptedTokenMetadata),
      tags: [],
    },
    subscriptionId: undefined,
    resourceGroup: undefined,
    masterKey: config.masterKey,
    hasWriteAccess: true,
    authorizationToken: undefined,
    features: extractFeatures(),
    csmEndpoint: undefined,
    dnsSuffix: undefined,
    serverId: ServerIds.productionPortal,
    extensionEndpoint: configContext.BACKEND_ENDPOINT,
    subscriptionType: CollectionCreation.DefaultSubscriptionType,
    quotaId: undefined,
    addCollectionDefaultFlight: explorer.flight(),
    isTryCosmosDBSubscription: explorer.isTryCosmosDBSubscription(),
  });
  explorer.isAccountReady(true);
}

function configureHostedWithResourceToken(config: ResourceToken, explorer: Explorer) {
  window.authType = AuthType.ResourceToken;
  // Resource tokens can only be used with SQL API
  const apiExperience: string = DefaultAccountExperience.DocumentDB;
  const parsedResourceToken = parseResourceTokenConnectionString(config.resourceToken);
  updateUserContext({
    resourceToken: parsedResourceToken.resourceToken,
    endpoint: parsedResourceToken.accountEndpoint,
  });
  explorer.resourceTokenDatabaseId(parsedResourceToken.databaseId);
  explorer.resourceTokenCollectionId(parsedResourceToken.collectionId);
  if (parsedResourceToken.partitionKey) {
    explorer.resourceTokenPartitionKey(parsedResourceToken.partitionKey);
  }
  explorer.initDataExplorerWithFrameInputs({
    databaseAccount: {
      id: "",
      name: parsedResourceToken.accountEndpoint,
      kind: AccountKind.GlobalDocumentDB,
      properties: { documentEndpoint: parsedResourceToken.accountEndpoint },
      tags: { defaultExperience: apiExperience },
    },
    subscriptionId: undefined,
    resourceGroup: undefined,
    masterKey: undefined,
    hasWriteAccess: true,
    authorizationToken: undefined,
    features: extractFeatures(),
    csmEndpoint: undefined,
    dnsSuffix: undefined,
    serverId: ServerIds.productionPortal,
    extensionEndpoint: configContext.BACKEND_ENDPOINT,
    subscriptionType: CollectionCreation.DefaultSubscriptionType,
    quotaId: undefined,
    addCollectionDefaultFlight: explorer.flight(),
    isTryCosmosDBSubscription: explorer.isTryCosmosDBSubscription(),
    isAuthWithresourceToken: true,
  });
  explorer.isAccountReady(true);
  explorer.isRefreshingExplorer(false);
}

function configureHostedWithEncryptedToken(explorer: Explorer, config: EncryptedToken, configContext: ConfigContext) {
  window.authType = AuthType.EncryptedToken;
  // Impossible to tell if this is a try cosmos sub using an encrypted token
  explorer.isTryCosmosDBSubscription(false);
  updateUserContext({
    accessToken: encodeURIComponent(config.encryptedToken),
  });

  const apiExperience: string = DefaultExperienceUtility.getDefaultExperienceFromApiKind(
    config.encryptedTokenMetadata.apiKind
  );
  explorer.initDataExplorerWithFrameInputs({
    databaseAccount: {
      id: "",
      name: config.encryptedTokenMetadata.accountName,
      kind: getDatabaseAccountKindFromExperience(apiExperience),
      properties: getDatabaseAccountPropertiesFromMetadata(config.encryptedTokenMetadata),
      tags: [],
    },
    subscriptionId: undefined,
    resourceGroup: undefined,
    masterKey: undefined,
    hasWriteAccess: true,
    authorizationToken: undefined,
    features: extractFeatures(),
    csmEndpoint: undefined,
    dnsSuffix: undefined,
    serverId: ServerIds.productionPortal,
    extensionEndpoint: configContext.BACKEND_ENDPOINT,
    subscriptionType: CollectionCreation.DefaultSubscriptionType,
    quotaId: undefined,
    addCollectionDefaultFlight: explorer.flight(),
    isTryCosmosDBSubscription: explorer.isTryCosmosDBSubscription(),
  });
  explorer.isAccountReady(true);
}

function configureEmulator(explorer: Explorer) {
  window.authType = AuthType.MasterKey;
  explorer.selfServeType(SelfServeType.none);
  explorer.databaseAccount(emulatorAccount);
  explorer.isAccountReady(true);
}

function configurePortal(explorer: Explorer) {
  window.authType = AuthType.AAD;

  // In development mode, try to load the iframe message from session storage.
  // This allows webpack hot reload to funciton properly
  if (process.env.NODE_ENV === "development") {
    const initMessage = sessionStorage.getItem("portalDataExplorerInitMessage");
    if (initMessage) {
      const message = JSON.parse(initMessage);
      console.warn("Loaded cached portal iframe message from session storage");
      console.dir(message);
      explorer.initDataExplorerWithFrameInputs(message);
    }
  }

  window.addEventListener("message", explorer.handleMessage.bind(explorer), false);
}
