import * as ViewModels from "../../Contracts/ViewModels";
import Explorer from "../../Explorer/Explorer";
import { NotificationsClient } from "./NotificationsClient";
import DocumentClientUtilityBase from "../../Common/DocumentClientUtilityBase";
import { DataAccessUtility } from "./DataAccessUtility";

export default class HostedExplorerFactory {
  public createExplorer(): ViewModels.Explorer {
    var documentClientUtility = new DocumentClientUtilityBase(new DataAccessUtility());

    const explorer = new Explorer({
      documentClientUtility: documentClientUtility,
      notificationsClient: new NotificationsClient(),
      isEmulator: false
    });

    return explorer;
  }

  public static reInitializeDocumentClientUtilityForExplorer(explorer: ViewModels.Explorer): void {
    if (!!explorer) {
      const documentClientUtility = new DocumentClientUtilityBase(new DataAccessUtility());
      explorer.rebindDocumentClientUtility(documentClientUtility);
      explorer.notificationConsoleData([]);
    }
  }
}
