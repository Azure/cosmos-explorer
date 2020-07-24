import Explorer from "../../Explorer/Explorer";
import { NotificationsClient } from "./NotificationsClient";
import DocumentClientUtilityBase from "../../Common/DocumentClientUtilityBase";

export default class HostedExplorerFactory {
  public createExplorer(): Explorer {
    var documentClientUtility = new DocumentClientUtilityBase();

    const explorer = new Explorer({
      documentClientUtility: documentClientUtility,
      notificationsClient: new NotificationsClient(),
      isEmulator: false
    });

    return explorer;
  }

  public static reInitializeDocumentClientUtilityForExplorer(explorer: Explorer): void {
    if (!!explorer) {
      const documentClientUtility = new DocumentClientUtilityBase();
      explorer.rebindDocumentClientUtility(documentClientUtility);
      explorer.notificationConsoleData([]);
    }
  }
}
