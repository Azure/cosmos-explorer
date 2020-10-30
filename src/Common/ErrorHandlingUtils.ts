import { HttpStatusCodes } from "./Constants";
import { MessageTypes } from "../Contracts/ExplorerContracts";
import { SubscriptionType } from "../Contracts/ViewModels";
import { logConsoleError } from "../Utils/NotificationConsoleUtils";
import { logError } from "./Logger";
import { sendMessage } from "./MessageHandler";

export interface CosmosError {
  code: number;
  message?: string;
}

export const handleError = (error: string | CosmosError, consoleErrorPrefix: string, area: string): void => {
  const errorMessage = getErrorMessage(error);
  const errorCode = typeof error === "string" ? undefined : error.code;
  // logs error to data explorer console
  logConsoleError(`${consoleErrorPrefix}:\n ${errorMessage}`);
  // logs error to both app insight and kusto
  logError(errorMessage, area, errorCode);
  // checks for errors caused by firewall and sends them to portal to handle
  sendNotificationForError(errorMessage, errorCode);
};

export const getErrorMessage = (error: string | CosmosError | Error): string => {
  const errorMessage = typeof error === "string" ? error : error.message;
  return replaceKnownError(errorMessage);
};

const sendNotificationForError = (errorMessage: string, errorCode: number): void => {
  if (errorCode === HttpStatusCodes.Forbidden) {
    if (errorMessage?.toLowerCase().indexOf("sharedoffer is disabled for your account") > 0) {
      return;
    }
    sendMessage({
      type: MessageTypes.ForbiddenError,
      reason: errorMessage
    });
  }
};

const replaceKnownError = (errorMessage: string): string => {
  if (
    window.dataExplorer.subscriptionType() === SubscriptionType.Internal &&
    errorMessage.indexOf("SharedOffer is Disabled for your account") >= 0
  ) {
    return "Database throughput is not supported for internal subscriptions.";
  } else if (errorMessage.indexOf("Partition key paths must contain only valid") >= 0) {
    return "Partition key paths must contain only valid characters and not contain a trailing slash or wildcard character.";
  }

  return errorMessage;
};
