import { useEffect } from "react";
import { applyExplorerBindings } from "../applyExplorerBindings";
import { AuthType } from "../AuthType";
import { AccountKind, DefaultAccountExperience } from "../Common/Constants";
import { sendMessage } from "../Common/MessageHandler";
import { configContext, Platform } from "../ConfigContext";
import { ActionType, DataExplorerAction } from "../Contracts/ActionContracts";
import { MessageTypes } from "../Contracts/ExplorerContracts";
import { DataExplorerInputsFrame } from "../Contracts/ViewModels";
import Explorer, { ExplorerParams } from "../Explorer/Explorer";
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
import { DefaultExperienceUtility } from "../Shared/DefaultExperienceUtility";
import { updateUserContext } from "../UserContext";
import { listKeys } from "../Utils/arm/generatedClients/2020-04-01/databaseAccounts";
import { isInvalidParentFrameOrigin } from "../Utils/MessageValidation";

// This hook will create a new instance of Explorer.ts and bind it to the DOM
// This hook has a LOT of magic, but ideally we can delete it once we have removed KO and switched entirely to React
// Pleas tread carefully :)
let explorer: Explorer;

export function useKnockoutExplorer(platform: Platform, explorerParams: ExplorerParams): Explorer {
  explorer = explorer || new Explorer(explorerParams);
  useEffect(() => {
    const effect = async () => {
      if (platform) {
        if (platform === Platform.Hosted) {
          await configureHosted();
          applyExplorerBindings(explorer);
        } else if (platform === Platform.Emulator) {
          configureEmulator();
          applyExplorerBindings(explorer);
        } else if (platform === Platform.Portal) {
          configurePortal();
        }
      }
    };
    effect();
  }, [platform]);
  return explorer;
}

async function configureHosted() {
  const win = (window as unknown) as HostedExplorerChildFrame;
  explorer.selfServeType(SelfServeType.none);
  if (win.hostedConfig.authType === AuthType.EncryptedToken) {
    configureHostedWithEncryptedToken(win.hostedConfig);
  } else if (win.hostedConfig.authType === AuthType.ResourceToken) {
    configureHostedWithResourceToken(win.hostedConfig);
  } else if (win.hostedConfig.authType === AuthType.ConnectionString) {
    configureHostedWithConnectionString(win.hostedConfig);
  } else if (win.hostedConfig.authType === AuthType.AAD) {
    await configureHostedWithAAD(win.hostedConfig);
  }
}

async function configureHostedWithAAD(config: AAD) {
  const account = config.databaseAccount;
  const accountResourceId = account.id;
  const subscriptionId = accountResourceId && accountResourceId.split("subscriptions/")[1].split("/")[0];
  const resourceGroup = accountResourceId && accountResourceId.split("resourceGroups/")[1].split("/")[0];
  updateUserContext({
    authType: AuthType.AAD,
    authorizationToken: `Bearer ${config.authorizationToken}`,
    databaseAccount: config.databaseAccount,
  });
  const keys = await listKeys(subscriptionId, resourceGroup, account.name);
  explorer.configure({
    databaseAccount: account,
    subscriptionId,
    resourceGroup,
    masterKey: keys.primaryMasterKey,
    authorizationToken: `Bearer ${config.authorizationToken}`,
    features: extractFeatures(),
  });
}

function configureHostedWithConnectionString(config: ConnectionString) {
  updateUserContext({
    // For legacy reasons lots of code expects a connection string login to look and act like an encrypted token login
    authType: AuthType.EncryptedToken,
    accessToken: encodeURIComponent(config.encryptedToken),
  });
  const apiExperience = DefaultExperienceUtility.getDefaultExperienceFromApiKind(config.encryptedTokenMetadata.apiKind);
  explorer.configure({
    databaseAccount: {
      id: "",
      name: config.encryptedTokenMetadata.accountName,
      kind: getDatabaseAccountKindFromExperience(apiExperience),
      properties: getDatabaseAccountPropertiesFromMetadata(config.encryptedTokenMetadata),
      tags: {},
    },
    masterKey: config.masterKey,
    features: extractFeatures(),
  });
}

function configureHostedWithResourceToken(config: ResourceToken) {
  const parsedResourceToken = parseResourceTokenConnectionString(config.resourceToken);
  updateUserContext({
    authType: AuthType.ResourceToken,
    resourceToken: parsedResourceToken.resourceToken,
    endpoint: parsedResourceToken.accountEndpoint,
  });
  explorer.resourceTokenDatabaseId(parsedResourceToken.databaseId);
  explorer.resourceTokenCollectionId(parsedResourceToken.collectionId);
  if (parsedResourceToken.partitionKey) {
    explorer.resourceTokenPartitionKey(parsedResourceToken.partitionKey);
  }
  explorer.configure({
    databaseAccount: {
      id: "",
      name: parsedResourceToken.accountEndpoint,
      kind: AccountKind.GlobalDocumentDB,
      properties: { documentEndpoint: parsedResourceToken.accountEndpoint },
      // Resource tokens can only be used with SQL API
      tags: { defaultExperience: DefaultAccountExperience.DocumentDB },
    },
    features: extractFeatures(),
    isAuthWithresourceToken: true,
  });
  explorer.isRefreshingExplorer(false);
}

function configureHostedWithEncryptedToken(config: EncryptedToken) {
  updateUserContext({
    authType: AuthType.EncryptedToken,
    accessToken: encodeURIComponent(config.encryptedToken),
  });
  const apiExperience: string = DefaultExperienceUtility.getDefaultExperienceFromApiKind(
    config.encryptedTokenMetadata.apiKind
  );
  explorer.configure({
    databaseAccount: {
      id: "",
      name: config.encryptedTokenMetadata.accountName,
      kind: getDatabaseAccountKindFromExperience(apiExperience),
      properties: getDatabaseAccountPropertiesFromMetadata(config.encryptedTokenMetadata),
      tags: {},
    },
    features: extractFeatures(),
  });
}

function configureEmulator() {
  updateUserContext({
    authType: AuthType.MasterKey,
  });
  explorer.selfServeType(SelfServeType.none);
  explorer.databaseAccount(emulatorAccount);
  explorer.isAccountReady(true);
}

function configurePortal() {
  updateUserContext({
    authType: AuthType.AAD,
  });
  // In development mode, try to load the iframe message from session storage.
  // This allows webpack hot reload to function properly in the portal
  if (process.env.NODE_ENV === "development" && !window.location.search.includes("disablePortalInitCache")) {
    const initMessage = sessionStorage.getItem("portalDataExplorerInitMessage");
    if (initMessage) {
      const message = JSON.parse(initMessage);
      console.warn(
        "Loaded cached portal iframe message from session storage. Do a full page refresh to get a new message"
      );
      console.dir(message);
      explorer.configure(message);
      applyExplorerBindings(explorer);
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
      if (inputs) {
        if (
          configContext.BACKEND_ENDPOINT &&
          configContext.platform === Platform.Portal &&
          process.env.NODE_ENV === "development"
        ) {
          inputs.extensionEndpoint = configContext.PROXY_PATH;
        }

        explorer.configure(inputs);
        applyExplorerBindings(explorer);
      }
    },
    false
  );

  sendMessage("ready");
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

interface PortalMessage {
  openAction?: DataExplorerAction;
  actionType?: ActionType;
  type?: MessageTypes;
  inputs?: DataExplorerInputsFrame;
}
