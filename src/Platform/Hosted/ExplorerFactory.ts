import Explorer from "../../Explorer/Explorer";
import { NotificationsClient } from "./NotificationsClient";
import DocumentClientUtilityBase from "../../Common/DocumentClientUtilityBase";
import { DataAccessUtilityBase } from "../../Common/DataAccessUtilityBase";

export default class HostedExplorerFactory {
  public createExplorer(): Explorer {
    var documentClientUtility = new DocumentClientUtilityBase(new DataAccessUtilityBase());

    const explorer = new Explorer({
      documentClientUtility: documentClientUtility,
      notificationsClient: new NotificationsClient(),
      isEmulator: false
    });

    return explorer;
  }

  public static reInitializeDocumentClientUtilityForExplorer(explorer: Explorer): void {
    if (!!explorer) {
      const documentClientUtility = new DocumentClientUtilityBase(new DataAccessUtilityBase());
      explorer.rebindDocumentClientUtility(documentClientUtility);
      explorer.notificationConsoleData([]);
    }
  }
}
