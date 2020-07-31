import Explorer from "../../Explorer/Explorer";
import { NotificationsClient } from "./NotificationsClient";

export default class PortalExplorerFactory {
  public createExplorer(): Explorer {
    var explorer = new Explorer({
      notificationsClient: new NotificationsClient(),
      isEmulator: false
    });

    return explorer;
  }
}
