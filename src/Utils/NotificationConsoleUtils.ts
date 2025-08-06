import * as _ from "underscore";
import { ConsoleDataType } from "../Explorer/Menus/NotificationConsole/ConsoleData";
import { useNotificationConsole } from "../hooks/useNotificationConsole";

function log(type: ConsoleDataType, message: string): () => void {
  const id = _.uniqueId();
  const date = new Intl.DateTimeFormat("en-EN", {
    hour12: true,
    hour: "numeric",
    minute: "numeric",
  }).format(new Date());

  useNotificationConsole.getState().setNotificationConsoleData({ type, date, message, id });
  return () => useNotificationConsole.getState().setInProgressConsoleDataIdToBeDeleted(id);
}

export const logConsoleProgress = (msg: string): (() => void) => log(ConsoleDataType.InProgress, msg);

export const logConsoleError = (msg: string): void => {
  log(ConsoleDataType.Error, msg);
};

export const logConsoleInfo = (msg: string): void => {
  log(ConsoleDataType.Info, msg);
};

export const logConsoleWarning = (msg: string): void => {
  log(ConsoleDataType.Warning, msg);
};
