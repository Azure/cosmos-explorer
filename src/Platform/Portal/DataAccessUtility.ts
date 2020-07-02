import "jquery";
import * as _ from "underscore";
import Q from "q";

import { getAuthorizationHeader } from "../../Utils/AuthorizationUtils";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import * as Constants from "../../Common/Constants";
import { DataAccessUtilityBase } from "../../Common/DataAccessUtilityBase";
import { MessageHandler } from "../../Common/MessageHandler";
import { MessageTypes } from "../../Contracts/ExplorerContracts";

export class DataAccessUtility extends DataAccessUtilityBase {
  public readDatabases(options: any): Q.Promise<DataModels.Database[]> {
    return MessageHandler.sendCachedDataMessage<DataModels.Database[]>(MessageTypes.AllDatabases, [
      (<any>window).dataExplorer.databaseAccount().id,
      Constants.ClientDefaults.portalCacheTimeoutMs,
    ]).catch((error) => {
      return super.readDatabases(options);
    });
  }

  // public readCollections(database: ViewModels.Database, options: any): Q.Promise<DataModels.Collection[]> {
  //   return MessageHandler.sendCachedDataMessage<DataModels.Collection[]>(MessageTypes.CollectionsForDatabase, [
  //     (<any>window).dataExplorer.databaseAccount().id,
  //     database.id()
  //   ]);
  // }

  public readOffers(options: any): Q.Promise<DataModels.Offer[]> {
    return MessageHandler.sendCachedDataMessage<DataModels.Offer[]>(MessageTypes.AllOffers, [
      (<any>window).dataExplorer.databaseAccount().id,
      Constants.ClientDefaults.portalCacheTimeoutMs,
    ]).catch((error) => {
      return super.readOffers(options);
    });
  }

  public readOffer(requestedResource: DataModels.Offer, options: any): Q.Promise<DataModels.OfferWithHeaders> {
    const deferred: Q.Deferred<DataModels.OfferWithHeaders> = Q.defer<DataModels.OfferWithHeaders>();
    super.readOffer(requestedResource, options).then(
      (offer: DataModels.OfferWithHeaders) => deferred.resolve(offer),
      (reason: any) => {
        const isThrottled: boolean =
          !!reason &&
          !!reason.error &&
          !!reason.error.code &&
          reason.error.code == Constants.HttpStatusCodes.TooManyRequests;
        if (isThrottled && MessageHandler.canSendMessage()) {
          MessageHandler.sendCachedDataMessage<DataModels.OfferWithHeaders>(MessageTypes.SingleOffer, [
            (<any>window).dataExplorer.databaseAccount().id,
            requestedResource._self,
            requestedResource.offerVersion,
          ]).then(
            (offer: DataModels.OfferWithHeaders) => deferred.resolve(offer),
            (reason: any) => deferred.reject(reason)
          );
          return;
        }

        deferred.reject(reason);
      }
    );

    return deferred.promise;
  }

  public updateOfferThroughputBeyondLimit(
    updateThroughputRequestPayload: DataModels.UpdateOfferThroughputRequest,
    options: any
  ): Q.Promise<void> {
    const deferred: Q.Deferred<void> = Q.defer<void>();
    const explorer: ViewModels.Explorer = (<any>window).dataExplorer;
    const url: string = `${explorer.extensionEndpoint()}/api/offerthroughputrequest/updatebeyondspecifiedlimit`;
    const authorizationHeader: ViewModels.AuthorizationTokenHeaderMetadata = getAuthorizationHeader();
    const requestOptions: any = _.extend({}, options, {});
    requestOptions[authorizationHeader.header] = authorizationHeader.token;
    const requestSettings: JQueryAjaxSettings<any> = {
      type: "POST",
      contentType: "application/json",
      headers: requestOptions,
      data: JSON.stringify(updateThroughputRequestPayload),
    };

    $.ajax(url, requestSettings).then(
      (data: any, textStatus: string, xhr: JQueryXHR<any>) => {
        deferred.resolve();
      },
      (xhr: JQueryXHR<any>, textStatus: string, error: any) => {
        deferred.reject(xhr.responseText);
      }
    );

    return deferred.promise;
  }
}
