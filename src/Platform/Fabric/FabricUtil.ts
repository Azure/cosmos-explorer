import { sendCachedDataMessage } from "Common/MessageHandler";
import { FabricDatabaseConnectionInfo } from "Contracts/FabricMessagesContract";
import { MessageTypes } from "Contracts/MessageTypes";
import { updateUserContext, userContext } from "UserContext";
import { logConsoleError } from "Utils/NotificationConsoleUtils";

const TOKEN_VALIDITY_MS = (3600 - 600) * 1000; // 1 hour minus 10 minutes to be safe
const DEBOUNCE_DELAY_MS = 1000 * 20; // 20 second
let timeoutId: NodeJS.Timeout;

// Prevents multiple parallel requests during DEBOUNCE_DELAY_MS
let lastRequestTimestamp: number = undefined;

const requestDatabaseResourceTokens = async (): Promise<void> => {
  if (lastRequestTimestamp !== undefined && lastRequestTimestamp + DEBOUNCE_DELAY_MS > Date.now()) {
    return;
  }

  lastRequestTimestamp = Date.now();
  try {
    const fabricDatabaseConnectionInfo = await sendCachedDataMessage<FabricDatabaseConnectionInfo>(
      MessageTypes.GetAllResourceTokens,
      [],
      userContext.fabricContext.connectionId,
    );

    if (!userContext.databaseAccount.properties.documentEndpoint) {
      userContext.databaseAccount.properties.documentEndpoint = fabricDatabaseConnectionInfo.endpoint;
    }

    updateUserContext({
      fabricContext: { ...userContext.fabricContext, databaseConnectionInfo: fabricDatabaseConnectionInfo },
      databaseAccount: { ...userContext.databaseAccount },
    });
    scheduleRefreshDatabaseResourceToken();
  } catch (error) {
    logConsoleError(error);
    throw error;
  } finally {
    lastRequestTimestamp = undefined;
  }
};

/**
 * Check token validity and schedule a refresh if necessary
 * @param tokenTimestamp
 * @returns
 */
export const scheduleRefreshDatabaseResourceToken = (refreshNow?: boolean): Promise<void> => {
  return new Promise((resolve) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }

    timeoutId = setTimeout(
      () => {
        requestDatabaseResourceTokens().then(resolve);
      },
      refreshNow ? 0 : TOKEN_VALIDITY_MS,
    );
  });
};

export const checkDatabaseResourceTokensValidity = (tokenTimestamp: number): void => {
  if (tokenTimestamp + TOKEN_VALIDITY_MS < Date.now()) {
    scheduleRefreshDatabaseResourceToken(true);
  }
};
