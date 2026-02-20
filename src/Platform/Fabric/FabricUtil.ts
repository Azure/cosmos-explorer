import { sendCachedDataMessage } from "Common/MessageHandler";
import { configContext, Platform } from "ConfigContext";
import { FabricMessageTypes } from "Contracts/FabricMessageTypes";
import { CosmosDbArtifactType, ResourceTokenInfo } from "Contracts/FabricMessagesContract";
import { FabricArtifactInfo, updateUserContext, userContext } from "UserContext";
import { logConsoleError } from "Utils/NotificationConsoleUtils";
import * as AutoPilotUtils from "../../Utils/AutoPilotUtils";

// Fabric Native accounts are always autoscale and have a fixed throughput of 5K
export const DEFAULT_FABRIC_NATIVE_CONTAINER_THROUGHPUT = AutoPilotUtils.autoPilotThroughput5K;

const TOKEN_VALIDITY_MS = (3600 - 600) * 1000; // 1 hour minus 10 minutes to be safe
const DEBOUNCE_DELAY_MS = 1000 * 20; // 20 second
let timeoutId: NodeJS.Timeout | undefined;

// Prevents multiple parallel requests during DEBOUNCE_DELAY_MS
let lastRequestTimestamp: number | undefined = undefined;

/**
 * Request fabric token:
 * - Mirrored key and AAD: Database Resource Tokens
 * - Native: AAD token
 * @returns
 */
const requestFabricToken = async (): Promise<void> => {
  if (lastRequestTimestamp !== undefined && lastRequestTimestamp + DEBOUNCE_DELAY_MS > Date.now()) {
    return;
  }

  lastRequestTimestamp = Date.now();
  try {
    if (isFabricMirrored()) {
      await requestAndStoreDatabaseResourceTokens();
    } else if (isFabricNative()) {
      await requestAndStoreAccessToken();
    }

    scheduleRefreshFabricToken();
  } catch (error) {
    logConsoleError(error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    lastRequestTimestamp = undefined;
  }
};

const requestAndStoreDatabaseResourceTokens = async (): Promise<void> => {
  if (!userContext.fabricContext || !userContext.databaseAccount) {
    // This should not happen
    logConsoleError("Fabric context or database account is missing: cannot request tokens");
    return;
  }

  const resourceTokenInfo = await sendCachedDataMessage<ResourceTokenInfo>(
    FabricMessageTypes.GetAllResourceTokens,
    [],
    userContext.fabricContext.artifactInfo?.connectionId,
  );

  if (!userContext.databaseAccount.properties.documentEndpoint) {
    userContext.databaseAccount.properties.documentEndpoint = resourceTokenInfo.endpoint;
  }

  if (resourceTokenInfo.credentialType === "OAuth2") {
    // Mirrored AAD
    updateUserContext({
      fabricContext: {
        ...userContext.fabricContext,
        databaseName: resourceTokenInfo.databaseId,
        artifactInfo: undefined,
        isReadOnly: resourceTokenInfo.isReadOnly ?? userContext.fabricContext.isReadOnly,
      },
      databaseAccount: { ...userContext.databaseAccount },
      aadToken: resourceTokenInfo.accessToken,
    });
  } else {
    // TODO: In Fabric contract V2, credentialType is undefined. For V3, it is "Key". Check for "Key" when V3 is supported for Fabric Mirroring Key
    // Mirrored key
    updateUserContext({
      fabricContext: {
        ...userContext.fabricContext,
        databaseName: resourceTokenInfo.databaseId,
        artifactInfo: {
          ...(userContext.fabricContext.artifactInfo as FabricArtifactInfo[CosmosDbArtifactType.MIRRORED_KEY]),
          resourceTokenInfo,
        },
        isReadOnly: resourceTokenInfo.isReadOnly ?? userContext.fabricContext.isReadOnly,
      },
      databaseAccount: { ...userContext.databaseAccount },
    });
  }
};

const requestAndStoreAccessToken = async (): Promise<void> => {
  if (!userContext.fabricContext || !userContext.databaseAccount) {
    // This should not happen
    logConsoleError("Fabric context or database account is missing: cannot request tokens");
    return;
  }

  const accessTokenInfo = await sendCachedDataMessage<{ accessToken: string }>(FabricMessageTypes.GetAccessToken, []);

  updateUserContext({
    aadToken: accessTokenInfo.accessToken,
  });
};

export const openRestoreContainerDialog = (): void => {
  if (isFabricNative()) {
    sendCachedDataMessage(FabricMessageTypes.RestoreContainer, []);
  }
};

/**
 * Check token validity and schedule a refresh if necessary
 * @param tokenTimestamp
 * @returns
 */
export const scheduleRefreshFabricToken = (refreshNow?: boolean): Promise<void> => {
  return new Promise((resolve) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }

    timeoutId = setTimeout(
      () => {
        requestFabricToken().then(resolve);
      },
      refreshNow ? 0 : TOKEN_VALIDITY_MS,
    );
  });
};

export const checkDatabaseResourceTokensValidity = (tokenTimestamp: number): void => {
  if (tokenTimestamp + TOKEN_VALIDITY_MS < Date.now()) {
    scheduleRefreshFabricToken(true);
  }
};

export const isFabric = (): boolean => configContext.platform === Platform.Fabric;
export const isFabricMirroredKey = (): boolean =>
  isFabric() && userContext.fabricContext?.artifactType === CosmosDbArtifactType.MIRRORED_KEY;
export const isFabricMirroredAAD = (): boolean =>
  isFabric() && userContext.fabricContext?.artifactType === CosmosDbArtifactType.MIRRORED_AAD;
export const isFabricMirrored = (): boolean => isFabricMirroredKey() || isFabricMirroredAAD();
export const isFabricNative = (): boolean =>
  isFabric() && userContext.fabricContext?.artifactType === CosmosDbArtifactType.NATIVE;
export const isFabricNativeReadOnly = (): boolean => isFabricNative() && !!userContext.fabricContext?.isReadOnly;
