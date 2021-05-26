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
import Explorer, { ExplorerParams } from "../Explorer/Explorer";
import { handleOpenAction } from "../Explorer/OpenActions";
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
import { isInvalidParentFrameOrigin } from "../Utils/MessageValidation";

// This hook will create a new instance of Explorer.ts and bind it to the DOM
// This hook has a LOT of magic, but ideally we can delete it once we have removed KO and switched entirely to React
// Pleas tread carefully :)

export function useKnockoutExplorer(platform: Platform, explorerParams: ExplorerParams): Explorer {
  const [explorer, setExplorer] = useState<Explorer>();

  useEffect(() => {
    const effect = async () => {
      if (platform) {
        if (platform === Platform.Hosted) {
          const explorer = await configureHosted(explorerParams);
          setExplorer(explorer);
        } else if (platform === Platform.Emulator) {
          const explorer = configureEmulator(explorerParams);
          setExplorer(explorer);
        } else if (platform === Platform.Portal) {
          const explorer = await configurePortal(explorerParams);
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

async function configureHosted(explorerParams: ExplorerParams): Promise<Explorer> {
  const win = (window as unknown) as HostedExplorerChildFrame;
  if (win.hostedConfig.authType === AuthType.EncryptedToken) {
    return configureHostedWithEncryptedToken(win.hostedConfig, explorerParams);
  } else if (win.hostedConfig.authType === AuthType.ResourceToken) {
    return configureHostedWithResourceToken(win.hostedConfig, explorerParams);
  } else if (win.hostedConfig.authType === AuthType.ConnectionString) {
    return configureHostedWithConnectionString(win.hostedConfig, explorerParams);
  } else if (win.hostedConfig.authType === AuthType.AAD) {
    return configureHostedWithAAD(win.hostedConfig, explorerParams);
  }
  throw new Error(`Unknown hosted config: ${win.hostedConfig}`);
}

async function configureHostedWithAAD(config: AAD, explorerParams: ExplorerParams): Promise<Explorer> {
  // TODO: Refactor. updateUserContext needs to be called twice because listKeys below depends on userContext.authorizationToken
  updateUserContext({
    authType: AuthType.AAD,
    authorizationToken: `Bearer ${config.authorizationToken}`,
    aadToken: config.aadToken,
  });
  const account = config.databaseAccount;
  const accountResourceId = account.id;
  const subscriptionId = accountResourceId && accountResourceId.split("subscriptions/")[1].split("/")[0];
  const resourceGroup = accountResourceId && accountResourceId.split("resourceGroups/")[1].split("/")[0];
  const keys = await listKeys(subscriptionId, resourceGroup, account.name);
  updateUserContext({
    subscriptionId,
    resourceGroup,
    databaseAccount: config.databaseAccount,
    masterKey: keys.primaryMasterKey,
  });
  const explorer = new Explorer(explorerParams);
  explorer.configure({
    databaseAccount: account,
  });
  return explorer;
}

function configureHostedWithConnectionString(config: ConnectionString, explorerParams: ExplorerParams): Explorer {
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
  const explorer = new Explorer(explorerParams);
  explorer.configure({
    databaseAccount,
  });
  return explorer;
}

function configureHostedWithResourceToken(config: ResourceToken, explorerParams: ExplorerParams): Explorer {
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
  });
  const explorer = new Explorer(explorerParams);
  explorer.resourceTokenDatabaseId(parsedResourceToken.databaseId);
  explorer.resourceTokenCollectionId(parsedResourceToken.collectionId);
  if (parsedResourceToken.partitionKey) {
    explorer.resourceTokenPartitionKey(parsedResourceToken.partitionKey);
  }
  explorer.configure({ databaseAccount });
  return explorer;
}

function configureHostedWithEncryptedToken(config: EncryptedToken, explorerParams: ExplorerParams): Explorer {
  updateUserContext({
    authType: AuthType.EncryptedToken,
    accessToken: encodeURIComponent(config.encryptedToken),
  });
  const apiExperience = DefaultExperienceUtility.getDefaultExperienceFromApiKind(config.encryptedTokenMetadata.apiKind);
  const explorer = new Explorer(explorerParams);
  explorer.configure({
    databaseAccount: {
      id: "",
      name: config.encryptedTokenMetadata.accountName,
      kind: getDatabaseAccountKindFromExperience(apiExperience),
      properties: getDatabaseAccountPropertiesFromMetadata(config.encryptedTokenMetadata),
      tags: {},
    },
  });
  return explorer;
}

function configureEmulator(explorerParams: ExplorerParams): Explorer {
  updateUserContext({
    databaseAccount: emulatorAccount,
    authType: AuthType.MasterKey,
  });
  const explorer = new Explorer(explorerParams);
  explorer.isAccountReady(true);
  return explorer;
}

async function configurePortal(explorerParams: ExplorerParams): Promise<Explorer> {
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
        const explorer = new Explorer(explorerParams);
        explorer.configure(message);
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
          const explorer = new Explorer(explorerParams);
          explorer.configure(inputs);
          resolve(explorer);
          if (openAction) {
            handleOpenAction(openAction, explorer.databases(), explorer);
          }
        } else if (shouldForwardMessage(message, event.origin)) {
          sendMessage(message);
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
    if (inputs.flights.indexOf(Flights.SchemaAnalyzer) !== -1) {
      userContext.features.enableSchemaAnalyzer = true;
    }
  }
}

interface PortalMessage {
  openAction?: DataExplorerAction;
  actionType?: ActionType;
  type?: MessageTypes;
  inputs?: DataExplorerInputsFrame;
}
