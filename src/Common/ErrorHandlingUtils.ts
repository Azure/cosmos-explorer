import { CosmosError, sendNotificationForError } from "./dataAccess/sendNotificationForError";
import { logConsoleError } from "../Utils/NotificationConsoleUtils";
import { logError } from "./Logger";
import { replaceKnownError } from "./ErrorParserUtility";

export const handleError = (error: CosmosError, consoleErrorPrefix: string, area: string): void => {
  const sanitizedErrorMsg = replaceKnownError(error.message);
  logConsoleError(`${consoleErrorPrefix}:\n ${sanitizedErrorMsg}`);
  logError(sanitizedErrorMsg, area, error.code);
  sendNotificationForError(error);
};
