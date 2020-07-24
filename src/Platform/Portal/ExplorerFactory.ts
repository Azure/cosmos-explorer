import Explorer from "../../Explorer/Explorer";

import { NotificationsClient } from "./NotificationsClient";
import DocumentClientUtilityBase from "../../Common/DocumentClientUtilityBase";
import { DataAccessUtilityBase } from "../../Common/DataAccessUtilityBase";

export default class PortalExplorerFactory {
  public createExplorer(): Explorer {
    var documentClientUtility = new DocumentClientUtilityBase(new DataAccessUtilityBase());

    var explorer = new Explorer({
      documentClientUtility: documentClientUtility,
      notificationsClient: new NotificationsClient(),
      isEmulator: false
    });

    return explorer;
  }
}
