import * as _ from "underscore";
import { ConsoleDataType } from "../Explorer/Menus/NotificationConsole/NotificationConsoleComponent";

const _global = typeof self === "undefined" ? window : self;

function log(type: ConsoleDataType, message: string): () => void {
  const dataExplorer = _global.dataExplorer;
  if (dataExplorer) {
    const id = _.uniqueId();
    const date = new Intl.DateTimeFormat("en-EN", {
      hour12: true,
      hour: "numeric",
      minute: "numeric",
    }).format(new Date());

    dataExplorer.logConsoleData({ type, date, message, id });
    return () => dataExplorer.deleteInProgressConsoleDataWithId(id);
  }

  return () => undefined;
}

export const logConsoleProgress = (msg: string): (() => void) => log(ConsoleDataType.InProgress, msg);

export const logConsoleError = (msg: string): void => {
  log(ConsoleDataType.Error, msg);
};

export const logConsoleInfo = (msg: string): void => {
  log(ConsoleDataType.Info, msg);
};
