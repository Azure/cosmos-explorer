import { sendCachedDataMessage } from "Common/MessageHandler";
import { FabricDatabaseConnectionInfo } from "Contracts/FabricContract";
import { MessageTypes } from "Contracts/MessageTypes";
import { updateUserContext } from "UserContext";
import { logConsoleError } from "Utils/NotificationConsoleUtils";

const TOKEN_VALIDITY_MS = (3600 - 600) * 1000; // 1 hour minus 10 minutes to be safe
const DEBOUNCE_DELAY_MS = 1000 * 20; // 20 second
let timeoutId: NodeJS.Timeout;

// Prevents multiple parallel requests during DEBOUNCE_DELAY_MS
let lastRequestTimestamp: number = undefined;

const requestDatabaseResourceTokens = async (onComplete: () => void): Promise<void> => {
  if (lastRequestTimestamp !== undefined && lastRequestTimestamp + DEBOUNCE_DELAY_MS > Date.now()) {
    return;
  }

  lastRequestTimestamp = Date.now();
  try {
    const fabricDatabaseConnectionInfo = await sendCachedDataMessage<FabricDatabaseConnectionInfo>(
      MessageTypes.GetAllResourceTokens,
      [],
    );
    updateUserContext({ fabricDatabaseConnectionInfo });
    scheduleRefreshDatabaseResourceToken();
    if (onComplete) {
      onComplete();
    }
  } catch (error) {
    logConsoleError(error);
  } finally {
    lastRequestTimestamp = undefined;
  }
};

/**
 * Check token validity and schedule a refresh if necessary
 * @param tokenTimestamp
 * @returns
 */
export const scheduleRefreshDatabaseResourceToken = (refreshNow?: boolean, onComplete?: () => void): void => {
  if (timeoutId !== undefined) {
    clearTimeout(timeoutId);
    timeoutId = undefined;
  }

  timeoutId = setTimeout(
    () => {
      requestDatabaseResourceTokens(onComplete);
    },
    refreshNow ? 0 : TOKEN_VALIDITY_MS,
  );
};

export const checkDatabaseResourceTokensValidity = (tokenTimestamp: number): void => {
  if (tokenTimestamp + TOKEN_VALIDITY_MS < Date.now()) {
    scheduleRefreshDatabaseResourceToken(true);
  }
};
