import * as _ from "underscore";
import { ConsoleDataType } from "../Explorer/Menus/NotificationConsole/NotificationConsoleComponent";

const _global = typeof self === "undefined" ? window : self;

/**
 * @deprecated
 * Use logConsoleInfo, logConsoleError, logConsoleProgress instead
 * */
export function logConsoleMessage(type: ConsoleDataType, message: string, id?: string): string {
  const dataExplorer = _global.dataExplorer;
  if (dataExplorer) {
    const date = new Date();
    const formattedDate: string = new Intl.DateTimeFormat("en-EN", {
      hour12: true,
      hour: "numeric",
      minute: "numeric"
    }).format(date);
    if (!id) {
      id = _.uniqueId();
    }
    dataExplorer.logConsoleData({ type: type, date: formattedDate, message: message, id: id });
  }
  return id || "";
}

export function clearInProgressMessageWithId(id: string): void {
  const dataExplorer = _global.dataExplorer;
  dataExplorer && dataExplorer.deleteInProgressConsoleDataWithId(id);
}

export function logConsoleProgress(message: string): () => void {
  const type = ConsoleDataType.InProgress;
  const dataExplorer = _global.dataExplorer;
  if (dataExplorer) {
    const id = _.uniqueId();
    const date = new Date();
    const formattedDate: string = new Intl.DateTimeFormat("en-EN", {
      hour12: true,
      hour: "numeric",
      minute: "numeric"
    }).format(date);
    dataExplorer.logConsoleData({ type, date: formattedDate, message, id });
    return () => {
      dataExplorer.deleteInProgressConsoleDataWithId(id);
    };
  } else {
    return () => {
      return;
    };
  }
}

export function logConsoleError(message: string): void {
  const type = ConsoleDataType.Error;
  const dataExplorer = _global.dataExplorer;
  if (dataExplorer) {
    const id = _.uniqueId();
    const date = new Date();
    const formattedDate: string = new Intl.DateTimeFormat("en-EN", {
      hour12: true,
      hour: "numeric",
      minute: "numeric"
    }).format(date);
    dataExplorer.logConsoleData({ type, date: formattedDate, message, id });
  }
}

export function logConsoleInfo(message: string): void {
  const type = ConsoleDataType.Info;
  const dataExplorer = _global.dataExplorer;
  if (dataExplorer) {
    const id = _.uniqueId();
    const date = new Date();
    const formattedDate: string = new Intl.DateTimeFormat("en-EN", {
      hour12: true,
      hour: "numeric",
      minute: "numeric"
    }).format(date);
    dataExplorer.logConsoleData({ type, date: formattedDate, message, id });
  }
}
