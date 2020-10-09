import Q from "q";
import * as DataModels from "../../Contracts/DataModels";
import { NotificationsClientBase } from "../../Common/NotificationsClientBase";

export class NotificationsClient extends NotificationsClientBase {
  private static readonly _notificationsApiSuffix: string = "/api/notifications";

  public constructor() {
    super(NotificationsClient._notificationsApiSuffix);
  }

  public fetchNotifications(): Q.Promise<DataModels.Notification[]> {
    // no notifications for the emulator
    return Q([]);
  }
}
