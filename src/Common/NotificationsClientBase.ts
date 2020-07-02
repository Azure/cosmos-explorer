import "jquery";
import * as Q from "q";
import * as DataModels from "../Contracts/DataModels";
import * as ViewModels from "../Contracts/ViewModels";

import { getAuthorizationHeader } from "../Utils/AuthorizationUtils";
import { CosmosClient } from "./CosmosClient";

export class NotificationsClientBase implements ViewModels.NotificationsClient {
  private _extensionEndpoint: string;
  private _notificationsApiSuffix: string;

  protected constructor(notificationsApiSuffix: string) {
    this._notificationsApiSuffix = notificationsApiSuffix;
  }

  public fetchNotifications(): Q.Promise<DataModels.Notification[]> {
    const deferred: Q.Deferred<DataModels.Notification[]> = Q.defer<DataModels.Notification[]>();
    const databaseAccount: ViewModels.DatabaseAccount = CosmosClient.databaseAccount();
    const subscriptionId: string = CosmosClient.subscriptionId();
    const resourceGroup: string = CosmosClient.resourceGroup();
    const url: string = `${this._extensionEndpoint}${this._notificationsApiSuffix}?accountName=${databaseAccount.name}&subscriptionId=${subscriptionId}&resourceGroup=${resourceGroup}`;
    const authorizationHeader: ViewModels.AuthorizationTokenHeaderMetadata = getAuthorizationHeader();
    const headers: any = {};
    headers[authorizationHeader.header] = authorizationHeader.token;

    $.ajax({
      url: url,
      type: "GET",
      headers: headers,
      cache: false,
    }).then(
      (notifications: DataModels.Notification[], textStatus: string, xhr: JQueryXHR<any>) => {
        deferred.resolve(notifications);
      },
      (xhr: JQueryXHR<any>, textStatus: string, error: any) => {
        deferred.reject(xhr.responseText);
      }
    );

    return deferred.promise;
  }

  public setExtensionEndpoint(extensionEndpoint: string): void {
    this._extensionEndpoint = extensionEndpoint;
  }
}
