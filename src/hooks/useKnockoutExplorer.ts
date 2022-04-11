import { useTabs } from "hooks/useTabs";
import { useEffect, useState } from "react";
import { applyExplorerBindings } from "../applyExplorerBindings";
import { AuthType } from "../AuthType";
import { AccountKind, Flights } from "../Common/Constants";
import { normalizeArmEndpoint } from "../Common/EnvironmentUtility";
import { sendMessage, sendReadyMessage } from "../Common/MessageHandler";
import { configContext, Platform, updateConfigContext } from "../ConfigContext";
import { ActionType, DataExplorerAction } from "../Contracts/ActionContracts";
import { MessageTypes } from "../Contracts/ExplorerContracts";
import { DataExplorerInputsFrame } from "../Contracts/ViewModels";
import Explorer from "../Explorer/Explorer";
import { handleOpenAction } from "../Explorer/OpenActions/OpenActions";
import { useDatabases } from "../Explorer/useDatabases";
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
import { CollectionCreation } from "../Shared/Constants";
import { DefaultExperienceUtility } from "../Shared/DefaultExperienceUtility";
import { PortalEnv, updateUserContext, userContext } from "../UserContext";
import { listKeys } from "../Utils/arm/generatedClients/cosmos/databaseAccounts";
import { DatabaseAccountListKeysResult } from "../Utils/arm/generatedClients/cosmos/types";
import { getMsalInstance } from "../Utils/AuthorizationUtils";
import { isInvalidParentFrameOrigin } from "../Utils/MessageValidation";

// This hook will create a new instance of Explorer.ts and bind it to the DOM
// This hook has a LOT of magic, but ideally we can delete it once we have removed KO and switched entirely to React
// Please tread carefully :)

export function useKnockoutExplorer(platform: Platform): Explorer {
  const [explorer, setExplorer] = useState<Explorer>();

  useEffect(() => {
    const effect = async () => {
      if (platform) {
        //Updating phoenix feature flags for MPAC based of config context
        if (configContext.isPhoenixEnabled === true) {
          userContext.features.phoenixNotebooks = true;
          userContext.features.phoenixFeatures = true;
        }
        if (platform === Platform.Hosted) {
          const explorer = await configureHosted();
          setExplorer(explorer);
        } else if (platform === Platform.Emulator) {
          const explorer = configureEmulator();
          setExplorer(explorer);
        } else if (platform === Platform.Portal) {
          const explorer = await configurePortal();
          setExplorer(explorer);
        }
      }
    };
    effect();
  }, [platform]);

  useEffect(() => {
    if (explorer) {
      applyExplorerBindings(explorer);
    }
  }, [explorer]);

  return explorer;
}

async function configureHosted(): Promise<Explorer> {
  const win = (window as unknown) as HostedExplorerChildFrame;
  let explorer: Explorer;
  if (win.hostedConfig.authType === AuthType.EncryptedToken) {
    explorer = configureHostedWithEncryptedToken(win.hostedConfig);
  } else if (win.hostedConfig.authType === AuthType.ResourceToken) {
    explorer = configureHostedWithResourceToken(win.hostedConfig);
  } else if (win.hostedConfig.authType === AuthType.ConnectionString) {
    explorer = configureHostedWithConnectionString(win.hostedConfig);
  } else if (win.hostedConfig.authType === AuthType.AAD) {
    explorer = await configureHostedWithAAD(win.hostedConfig);
  } else {
    throw new Error(`Unknown hosted config: ${win.hostedConfig}`);
  }

  window.addEventListener(
    "message",
    (event) => {
      if (isInvalidParentFrameOrigin(event)) {
        return;
      }

      if (!shouldProcessMessage(event)) {
        return;
      }

      if (event.data?.type === MessageTypes.CloseTab) {
        useTabs.getState().closeTabsByComparator((tab) => tab.tabId === event.data?.data?.tabId);
      }
    },
    false
  );

  return explorer;
}

async function configureHostedWithAAD(config: AAD): Promise<Explorer> {
  // TODO: Refactor. updateUserContext needs to be called twice because listKeys below depends on userContext.authorizationToken
  updateUserContext({
    authType: AuthType.AAD,
    authorizationToken: `Bearer ${config.authorizationToken}`,
  });
  const account = config.databaseAccount;
  const accountResourceId = account.id;
  const subscriptionId = accountResourceId && accountResourceId.split("subscriptions/")[1].split("/")[0];
  const resourceGroup = accountResourceId && accountResourceId.split("resourceGroups/")[1].split("/")[0];
  let aadToken;
  let keys: DatabaseAccountListKeysResult = {};
  if (account.properties?.documentEndpoint) {
    const hrefEndpoint = new URL(account.properties.documentEndpoint).href.replace(/\/$/, "/.default");
    const msalInstance = getMsalInstance();
    const cachedAccount = msalInstance.getAllAccounts()?.[0];
    msalInstance.setActiveAccount(cachedAccount);
    const cachedTenantId = localStorage.getItem("cachedTenantId");
    const aadTokenResponse = await msalInstance.acquireTokenSilent({
      forceRefresh: true,
      scopes: [hrefEndpoint],
      authority: `${configContext.AAD_ENDPOINT}${cachedTenantId}`,
    });
    aadToken = aadTokenResponse.accessToken;
  }
  try {
    if (!account.properties.disableLocalAuth) {
      keys = await listKeys(subscriptionId, resourceGroup, account.name);
    }
  } catch (e) {
    if (userContext.features.enableAadDataPlane) {
      console.warn(e);
    } else {
      throw new Error(`List keys failed: ${e.message}`);
    }
  }
  updateUserContext({
    subscriptionId,
    resourceGroup,
    aadToken,
    databaseAccount: config.databaseAccount,
    masterKey: keys.primaryMasterKey,
  });
  const explorer = new Explorer();
  return explorer;
}

function configureHostedWithConnectionString(config: ConnectionString): Explorer {
  const apiExperience = DefaultExperienceUtility.getDefaultExperienceFromApiKind(config.encryptedTokenMetadata.apiKind);
  const databaseAccount = {
    id: "",
    location: "",
    type: "",
    name: config.encryptedTokenMetadata.accountName,
    kind: getDatabaseAccountKindFromExperience(apiExperience),
    properties: getDatabaseAccountPropertiesFromMetadata(config.encryptedTokenMetadata),
    tags: {},
  };
  updateUserContext({
    // For legacy reasons lots of code expects a connection string login to look and act like an encrypted token login
    authType: AuthType.EncryptedToken,
    accessToken: encodeURIComponent(config.encryptedToken),
    databaseAccount,
    masterKey: config.masterKey,
  });
  const explorer = new Explorer();
  return explorer;
}

function configureHostedWithResourceToken(config: ResourceToken): Explorer {
  const parsedResourceToken = parseResourceTokenConnectionString(config.resourceToken);
  const databaseAccount = {
    id: "",
    location: "",
    type: "",
    name: parsedResourceToken.accountEndpoint,
    kind: AccountKind.GlobalDocumentDB,
    properties: { documentEndpoint: parsedResourceToken.accountEndpoint },
  };
  updateUserContext({
    databaseAccount,
    authType: AuthType.ResourceToken,
    resourceToken: parsedResourceToken.resourceToken,
    endpoint: parsedResourceToken.accountEndpoint,
    parsedResourceToken: {
      databaseId: parsedResourceToken.databaseId,
      collectionId: parsedResourceToken.collectionId,
      partitionKey: parsedResourceToken.partitionKey,
    },
  });
  const explorer = new Explorer();
  return explorer;
}

function configureHostedWithEncryptedToken(config: EncryptedToken): Explorer {
  const apiExperience = DefaultExperienceUtility.getDefaultExperienceFromApiKind(config.encryptedTokenMetadata.apiKind);
  updateUserContext({
    authType: AuthType.EncryptedToken,
    accessToken: encodeURIComponent(config.encryptedToken),
    databaseAccount: {
      id: "",
      location: "",
      type: "",
      name: config.encryptedTokenMetadata.accountName,
      kind: getDatabaseAccountKindFromExperience(apiExperience),
      properties: getDatabaseAccountPropertiesFromMetadata(config.encryptedTokenMetadata),
    },
  });
  const explorer = new Explorer();
  return explorer;
}

function configureEmulator(): Explorer {
  updateUserContext({
    databaseAccount: emulatorAccount,
    authType: AuthType.MasterKey,
  });
  const explorer = new Explorer();
  return explorer;
}

async function configurePortal(): Promise<Explorer> {
  updateUserContext({
    authType: AuthType.AAD,
  });
  return new Promise((resolve) => {
    // In development mode, try to load the iframe message from session storage.
    // This allows webpack hot reload to function properly in the portal
    if (process.env.NODE_ENV === "development" && !window.location.search.includes("disablePortalInitCache")) {
      const initMessage = sessionStorage.getItem("portalDataExplorerInitMessage");
      if (initMessage) {
        const message = JSON.parse(initMessage) as DataExplorerInputsFrame;
        console.warn(
          "Loaded cached portal iframe message from session storage. Do a full page refresh to get a new message"
        );
        console.dir(message);
        updateContextsFromPortalMessage(message);
        const explorer = new Explorer();
        // In development mode, save the iframe message from the portal in session storage.
        // This allows webpack hot reload to funciton properly
        if (process.env.NODE_ENV === "development") {
          sessionStorage.setItem("portalDataExplorerInitMessage", JSON.stringify(message));
        }
        resolve(explorer);
      }
    }

    // In the Portal, configuration of Explorer happens via iframe message
    window.addEventListener(
      "message",
      (event) => {
        if (isInvalidParentFrameOrigin(event)) {
          return;
        }

        if (!shouldProcessMessage(event)) {
          return;
        }

        // Check for init message
        const message: PortalMessage = event.data?.data;
        const inputs = message?.inputs;
        const openAction = message?.openAction;
        if (inputs) {
          if (
            configContext.BACKEND_ENDPOINT &&
            configContext.platform === Platform.Portal &&
            process.env.NODE_ENV === "development"
          ) {
            inputs.extensionEndpoint = configContext.PROXY_PATH;
          }

          updateContextsFromPortalMessage(inputs);
          const explorer = new Explorer();
          resolve(explorer);
          if (openAction) {
            handleOpenAction(openAction, useDatabases.getState().databases, explorer);
          }
        } else if (shouldForwardMessage(message, event.origin)) {
          sendMessage(message);
        } else if (event.data?.type === MessageTypes.CloseTab) {
          useTabs.getState().closeTabsByComparator((tab) => tab.tabId === event.data?.data?.tabId);
        }
      },
      false
    );

    sendReadyMessage();
  });
}

function shouldForwardMessage(message: PortalMessage, messageOrigin: string) {
  // Only allow forwarding messages from the same origin
  return messageOrigin === window.document.location.origin && message.type === MessageTypes.TelemetryInfo;
}

function shouldProcessMessage(event: MessageEvent): boolean {
  if (typeof event.data !== "object") {
    return false;
  }
  if (event.data["signature"] !== "pcIframe") {
    return false;
  }
  if (!("data" in event.data)) {
    return false;
  }
  if (typeof event.data["data"] !== "object") {
    return false;
  }

  return true;
}

function updateContextsFromPortalMessage(inputs: DataExplorerInputsFrame) {
  if (
    configContext.BACKEND_ENDPOINT &&
    configContext.platform === Platform.Portal &&
    process.env.NODE_ENV === "development"
  ) {
    inputs.extensionEndpoint = configContext.PROXY_PATH;
  }

  const authorizationToken = inputs.authorizationToken || "";
  const masterKey = inputs.masterKey || "";
  const databaseAccount = inputs.databaseAccount;

  updateConfigContext({
    BACKEND_ENDPOINT: inputs.extensionEndpoint || configContext.BACKEND_ENDPOINT,
    ARM_ENDPOINT: normalizeArmEndpoint(inputs.csmEndpoint || configContext.ARM_ENDPOINT),
  });

  updateUserContext({
    authorizationToken,
    masterKey,
    databaseAccount,
    resourceGroup: inputs.resourceGroup,
    subscriptionId: inputs.subscriptionId,
    subscriptionType: inputs.subscriptionType,
    quotaId: inputs.quotaId,
    portalEnv: inputs.serverId as PortalEnv,
    hasWriteAccess: inputs.hasWriteAccess ?? true,
    addCollectionFlight: inputs.addCollectionDefaultFlight || CollectionCreation.DefaultAddCollectionDefaultFlight,
    collectionCreationDefaults: inputs.defaultCollectionThroughput,
  });
  if (inputs.features) {
    Object.assign(userContext.features, extractFeatures(new URLSearchParams(inputs.features)));
  }
  if (inputs.flights) {
    if (inputs.flights.indexOf(Flights.AutoscaleTest) !== -1) {
      userContext.features.autoscaleDefault;
    }
    if (inputs.flights.indexOf(Flights.PartitionKeyTest) !== -1) {
      userContext.features.partitionKeyDefault = true;
    }
    if (inputs.flights.indexOf(Flights.PartitionKeyTest) !== -1) {
      userContext.features.partitionKeyDefault = true;
    }
    if (inputs.flights.indexOf(Flights.PKPartitionKeyTest) !== -1) {
      userContext.features.partitionKeyDefault2 = true;
    }
    if (inputs.flights.indexOf(Flights.PhoenixNotebooks) !== -1) {
      userContext.features.phoenixNotebooks = true;
    }
    if (inputs.flights.indexOf(Flights.PhoenixFeatures) !== -1) {
      userContext.features.phoenixFeatures = true;
    }
    if (inputs.flights.indexOf(Flights.NotebooksDownBanner) !== -1) {
      userContext.features.notebooksDownBanner = true;
    }
  }
}

interface PortalMessage {
  openAction?: DataExplorerAction;
  actionType?: ActionType;
  type?: MessageTypes;
  inputs?: DataExplorerInputsFrame;
}
