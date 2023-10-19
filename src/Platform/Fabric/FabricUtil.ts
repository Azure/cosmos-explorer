import { sendCachedDataMessage } from "Common/MessageHandler";
import { FabricDatabaseConnectionInfo } from "Contracts/FabricContract";
import { MessageTypes } from "Contracts/MessageTypes";
import { updateUserContext } from "UserContext";

const TOKEN_VALIDITY_MS = 3600 * 1000; // 1 hour
let timeoutId: NodeJS.Timeout;

// Prevents multiple parallel requests
let isRequestPending = false;

export const requestDatabaseResourceTokens = (): void => {
  if (isRequestPending) {
    return;
  }

  // TODO Make Fabric return the message id so we can handle this promise
  isRequestPending = true;
  sendCachedDataMessage<FabricDatabaseConnectionInfo>(MessageTypes.GetAllResourceTokens, []);
};

export const handleRequestDatabaseResourceTokensResponse = (
  fabricDatabaseConnectionInfo: FabricDatabaseConnectionInfo,
): void => {
  isRequestPending = false;
  updateUserContext({ fabricDatabaseConnectionInfo });
  scheduleRefreshDatabaseResourceToken();
};

/**
 * Check token validity and schedule a refresh if necessary
 * @param tokenTimestamp
 * @returns
 */
export const scheduleRefreshDatabaseResourceToken = (): void => {
  if (timeoutId !== undefined) {
    clearTimeout(timeoutId);
    timeoutId = undefined;
  }

  timeoutId = setTimeout(() => {
    requestDatabaseResourceTokens();
  }, TOKEN_VALIDITY_MS);
};

export const checkDatabaseResourceTokensValidity = (tokenTimestamp: number): void => {
  if (tokenTimestamp + TOKEN_VALIDITY_MS < Date.now()) {
    requestDatabaseResourceTokens();
  }
};
