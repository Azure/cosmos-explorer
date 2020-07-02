import * as _ from "underscore";
import { ConsoleDataType } from "../Explorer/Menus/NotificationConsole/NotificationConsoleComponent";

const _global = typeof self === "undefined" ? window : self;

export class NotificationConsoleUtils {
  public static logConsoleMessage(type: ConsoleDataType, message: string, id?: string): string {
    const dataExplorer = _global.dataExplorer;
    if (dataExplorer != null) {
      const date = new Date();
      const formattedDate: string = new Intl.DateTimeFormat("en-EN", {
        hour12: true,
        hour: "numeric",
        minute: "numeric",
      }).format(date);
      if (!id) {
        id = _.uniqueId();
      }
      dataExplorer.logConsoleData({ type: type, date: formattedDate, message: message, id: id });
    }
    return id;
  }

  public static clearInProgressMessageWithId(id: string) {
    const dataExplorer = _global.dataExplorer;
    dataExplorer && (dataExplorer as any).deleteInProgressConsoleDataWithId(id);
  }
}
