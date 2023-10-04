import * as ViewModels from "../../Contracts/ViewModels";
import * as Constants from "./Constants";
import * as Entities from "./Entities";
import * as DateTimeUtilities from "./QueryBuilder/DateTimeUtilities";

// For use exclusively with Tables API.

enum DataTypes {
  Guid = 0,
  Double = 1,
  String = 2,
  Binary = 5,
  Boolean = 8,
  DateTime = 9,
  Int32 = 16,
  Int64 = 18,
}

var tablesIndexers = {
  Value: "$v",
  Type: "$t",
};

export var keyProperties = {
  PartitionKey: "$pk",
  Id: "id",
  Id2: "$id", // This should always be the same value as Id
  Timestamp: "_ts",
  resourceId: "_rid",
  self: "_self",
  etag: "_etag",
  attachments: "_attachments",
};

export function convertDocumentsToEntities(documents: any[]): Entities.ITableEntityForTablesAPI[] {
  let results: Entities.ITableEntityForTablesAPI[] = [];
  documents &&
    documents.forEach((document) => {
      if (!document.hasOwnProperty(keyProperties.PartitionKey) || !document.hasOwnProperty(keyProperties.Id)) {
        //Document does not match the current required format for Tables, so we ignore it
        return; // The rest of the key properties should be guaranteed as DocumentDB properties
      }
      let entity: Entities.ITableEntityForTablesAPI = <Entities.ITableEntityForTablesAPI>{
        PartitionKey: {
          _: document[keyProperties.PartitionKey],
          $: Constants.TableType.String,
        },
        RowKey: {
          _: document[keyProperties.Id],
          $: Constants.TableType.String,
        },
        Timestamp: {
          // DocumentDB Timestamp is unix time so we convert to Javascript date here
          _: DateTimeUtilities.convertUnixToJSDate(document[keyProperties.Timestamp]).toUTCString(),
          $: Constants.TableType.DateTime,
        },
        _rid: {
          _: document[keyProperties.resourceId],
          $: Constants.TableType.String,
        },
        _self: {
          _: document[keyProperties.self],
          $: Constants.TableType.String,
        },
        _etag: {
          _: document[keyProperties.etag],
          $: Constants.TableType.String,
        },
        _attachments: {
          _: document[keyProperties.attachments],
          $: Constants.TableType.String,
        },
      };
      for (var property in document) {
        if (document.hasOwnProperty(property)) {
          if (
            property !== keyProperties.PartitionKey &&
            property !== keyProperties.Id &&
            property !== keyProperties.Timestamp &&
            property !== keyProperties.resourceId &&
            property !== keyProperties.self &&
            property !== keyProperties.etag &&
            property !== keyProperties.attachments &&
            property !== keyProperties.Id2
          ) {
            if (!document[property].hasOwnProperty("$v") || !document[property].hasOwnProperty("$t")) {
              return; //Document property does not match the current required format for Tables, so we ignore it
            }
            if (DataTypes[document[property][tablesIndexers.Type]] === DataTypes[DataTypes.DateTime]) {
              // Convert Ticks datetime to javascript date for better visualization in table
              entity[property] = {
                _: DateTimeUtilities.convertTicksToJSDate(document[property][tablesIndexers.Value]).toUTCString(),
                $: DataTypes[document[property][tablesIndexers.Type]],
              };
            } else {
              entity[property] = {
                _: document[property][tablesIndexers.Value],
                $: DataTypes[document[property][tablesIndexers.Type]],
              };
            }
          }
        }
      }
      results.push(entity);
    });
  return results;
}

// Do not use this to create a document to send to the server, only for delete and for giving rid/self/collection to the utility methods.
export function convertEntitiesToDocuments(
  entities: Entities.ITableEntityForTablesAPI[],
  collection: ViewModels.Collection,
): any[] {
  let results: any[] = [];
  entities &&
    entities.forEach((entity) => {
      let document: any = {
        $id: entity.RowKey._,
        id: entity.RowKey._,
        ts: DateTimeUtilities.convertJSDateToUnix(entity.Timestamp._), // Convert back to unix time
        rid: entity._rid._,
        self: entity._self._,
        etag: entity._etag._,
        attachments: entity._attachments._,
        collection: collection,
      };
      if (collection.partitionKey) {
        document["partitionKey"] = collection.partitionKey;
        document[collection.partitionKeyProperties[0]] = entity.PartitionKey._;
        document["partitionKeyValue"] = entity.PartitionKey._;
      }
      for (var property in entity) {
        if (
          property !== Constants.EntityKeyNames.PartitionKey &&
          property !== Constants.EntityKeyNames.RowKey &&
          property !== Constants.EntityKeyNames.Timestamp &&
          property !== keyProperties.resourceId &&
          property !== keyProperties.self &&
          property !== keyProperties.etag &&
          property !== keyProperties.attachments &&
          property !== keyProperties.Id2
        ) {
          if (entity[property].$ === Constants.TableType.DateTime) {
            // Convert javascript date back to ticks with 20 zeros padding
            document[property] = {
              $t: (<any>DataTypes)[entity[property].$],
              $v: DateTimeUtilities.convertJSDateToTicksWithPadding(entity[property]._),
            };
          } else {
            document[property] = {
              $t: (<any>DataTypes)[entity[property].$],
              $v: entity[property]._,
            };
          }
        }
      }
      results.push(document);
    });
  return results;
}

export function convertEntityToNewDocument(entity: Entities.ITableEntityForTablesAPI): any {
  let document: any = {
    $pk: entity.PartitionKey._,
    $id: entity.RowKey._,
    id: entity.RowKey._,
  };
  for (const property in entity) {
    if (
      property !== Constants.EntityKeyNames.PartitionKey &&
      property !== Constants.EntityKeyNames.RowKey &&
      property !== Constants.EntityKeyNames.Timestamp &&
      property !== keyProperties.resourceId &&
      property !== keyProperties.self &&
      property !== keyProperties.etag &&
      property !== keyProperties.attachments &&
      property !== keyProperties.Id2
    ) {
      const propertyValue = entity[property]._;
      let parsedValue;
      switch (entity[property].$) {
        case Constants.TableType.DateTime:
          parsedValue = DateTimeUtilities.convertJSDateToTicksWithPadding(propertyValue);
          break;
        case Constants.TableType.Boolean:
          parsedValue = propertyValue.toString().toLowerCase() === "true";
          break;
        case Constants.TableType.Int32:
          parsedValue = parseInt(propertyValue, 10);
          break;
        case Constants.TableType.Int64:
          parsedValue = propertyValue.toString();
          break;
        case Constants.TableType.Double:
          parsedValue = parseFloat(propertyValue);
          break;
        default:
          parsedValue = propertyValue;
      }

      document[property] = {
        $t: (<any>DataTypes)[entity[property].$],
        $v: parsedValue,
      };
    }
  }
  return document;
}
