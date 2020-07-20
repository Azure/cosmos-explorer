import * as ViewModels from "../../Contracts/ViewModels";
import Explorer from "../../Explorer/Explorer";

import { NotificationsClient } from "./NotificationsClient";
import DocumentClientUtilityBase from "../../Common/DocumentClientUtilityBase";
import { DataAccessUtility } from "./DataAccessUtility";

export default class PortalExplorerFactory {
  public createExplorer(): Explorer {
    var documentClientUtility = new DocumentClientUtilityBase(new DataAccessUtility());

    var explorer = new Explorer({
      documentClientUtility: documentClientUtility,
      notificationsClient: new NotificationsClient(),
      isEmulator: false
    });

    return explorer;
  }
}
