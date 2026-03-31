import { MessageTypes } from "../Contracts/ExplorerContracts";
import { SubscriptionType } from "../Contracts/SubscriptionType";
import { isExpectedError } from "../Metrics/ErrorClassification";
import { scenarioMonitor } from "../Metrics/ScenarioMonitor";
import { userContext } from "../UserContext";
import { ARMError } from "../Utils/arm/request";
import { logConsoleError } from "../Utils/NotificationConsoleUtils";
import { HttpStatusCodes } from "./Constants";
import { logError } from "./Logger";
import { sendMessage } from "./MessageHandler";

export interface HandleErrorOptions {
  /** Optional redacted error to use for telemetry logging instead of the original error */
  redactedError?: string | ARMError | Error;
}

export const handleError = (
  error: string | ARMError | Error,
  area: string,
  consoleErrorPrefix?: string,
  options?: HandleErrorOptions,
): void => {
  const errorMessage = getErrorMessage(error);
  const errorCode = error instanceof ARMError ? error.code : undefined;

  // logs error to data explorer console (always shows original, non-redacted message)
  const consoleErrorMessage = consoleErrorPrefix ? `${consoleErrorPrefix}:\n ${errorMessage}` : errorMessage;
  logConsoleError(consoleErrorMessage);

  // logs error to both app insight and kusto (use redacted message if provided)
  const telemetryErrorMessage = options?.redactedError ? getErrorMessage(options.redactedError) : errorMessage;
  logError(telemetryErrorMessage, area, errorCode);

  // checks for errors caused by firewall and sends them to portal to handle
  sendNotificationForError(errorMessage, errorCode);

  // Mark expected failures for health metrics (auth, firewall, permissions, etc.)
  // This ensures timeouts with expected failures emit healthy instead of unhealthy
  if (isExpectedError(error)) {
    scenarioMonitor.markExpectedFailure();
  }
};

export const getErrorMessage = (error: string | Error = ""): string => {
  let errorMessage = typeof error === "string" ? error : error.message;
  if (!errorMessage) {
    errorMessage = JSON.stringify(error);
  }
  return replaceKnownError(errorMessage);
};

export const getErrorStack = (error: string | Error): string => {
  return typeof error === "string" ? undefined : error.stack;
};

const sendNotificationForError = (errorMessage: string, errorCode: number | string): void => {
  if (errorCode === HttpStatusCodes.Forbidden) {
    if (errorMessage?.toLowerCase().indexOf("sharedoffer is disabled for your account") > 0) {
      return;
    }
    sendMessage({
      type: MessageTypes.ForbiddenError,
      reason: errorMessage,
    });
  }
};

const replaceKnownError = (errorMessage: string): string => {
  if (
    userContext.subscriptionType === SubscriptionType.Internal &&
    errorMessage?.indexOf("SharedOffer is Disabled for your account") >= 0
  ) {
    return "Database throughput is not supported for internal subscriptions.";
  } else if (errorMessage?.indexOf("Partition key paths must contain only valid") >= 0) {
    return "Partition key paths must contain only valid characters and not contain a trailing slash or wildcard character.";
  } else if (
    errorMessage?.indexOf("The user aborted a request") >= 0 ||
    errorMessage?.indexOf("The operation was aborted") >= 0 ||
    errorMessage === "signal is aborted without reason"
  ) {
    return "User aborted query.";
  }

  return errorMessage;
};
