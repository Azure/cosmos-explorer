import Explorer from "../../Explorer/Explorer";
import { NotificationsClient } from "./NotificationsClient";

export default class HostedExplorerFactory {
  public createExplorer(): Explorer {
    const explorer = new Explorer({
      notificationsClient: new NotificationsClient(),
      isEmulator: false
    });

    return explorer;
  }

  public static reInitializeDocumentClientUtilityForExplorer(explorer: Explorer): void {
    if (!!explorer) {
      explorer.notificationConsoleData([]);
    }
  }
}
