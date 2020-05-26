import * as Constants from "./Constants";

import { LocalStorageUtility, StorageKey } from "../Shared/StorageUtility";

// x-ms-resource-quota: databases = 100; collections = 5000; users = 500000; permissions = 2000000;
export function getQuota(responseHeaders: any): any {
  return responseHeaders && responseHeaders[Constants.HttpHeaders.resourceQuota]
    ? parseStringIntoObject(responseHeaders[Constants.HttpHeaders.resourceQuota])
    : null;
}

export function shouldEnableCrossPartitionKey(): boolean {
  return LocalStorageUtility.getEntryString(StorageKey.IsCrossPartitionQueryEnabled) === "true";
}

function parseStringIntoObject(resourceString: string) {
  var entityObject: any = {};

  if (resourceString) {
    var entitiesArray: string[] = resourceString.split(";");
    for (var i: any = 0; i < entitiesArray.length; i++) {
      var entity: string[] = entitiesArray[i].split("=");
      entityObject[entity[0]] = entity[1];
    }
  }

  return entityObject;
}
