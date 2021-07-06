import { extractPartitionKey, PartitionKeyDefinition } from "@azure/cosmos";
import { Resource } from "../../../src/Contracts/DataModels";
import * as DataModels from "../../Contracts/DataModels";
import DocumentId from "../Tree/DocumentId";

export function hasShardKeySpecified(
  document: string,
  partitionKey: DataModels.PartitionKey,
  partitionKeyProperty: string
): boolean {
  return Boolean(
    extractPartitionKey(
      document,
      getPartitionKeyDefinition(partitionKey, partitionKeyProperty) as PartitionKeyDefinition
    )
  );
}

export function getPartitionKeyDefinition(
  partitionKey: DataModels.PartitionKey,
  partitionKeyProperty: string
): DataModels.PartitionKey {
  if (
    partitionKey &&
    partitionKey.paths &&
    partitionKey.paths.length &&
    partitionKey.paths.length > 0 &&
    partitionKey.paths[0].indexOf("$v") > -1
  ) {
    // Convert BsonSchema2 to /path format
    partitionKey = {
      kind: partitionKey.kind,
      paths: ["/" + partitionKeyProperty.replace(/\./g, "/")],
      version: partitionKey.version,
    };
  }
  return partitionKey;
}

export function formatDocumentContent(row: DocumentId): string {
  const { partitionKeyProperty, partitionKeyValue, rid, self, stringPartitionKeyValue, ts } = row;
  const documentContent = JSON.stringify({
    partitionKeyProperty: partitionKeyProperty || "",
    partitionKeyValue: partitionKeyValue || "",
    rid: rid || "",
    self: self || "",
    stringPartitionKeyValue: stringPartitionKeyValue || "",
    ts: ts || "",
  });
  const formattedDocumentContent = documentContent.replace(/,/g, ",\n").replace("{", "{\n").replace("}", "\n}");
  return formattedDocumentContent;
}

export function formatSqlDocumentContent(row: Resource): string {
  const { id, _rid, _self, _ts, _etag } = row;
  const documentContent = JSON.stringify({
    id: id || "",
    _rid: _rid || "",
    _self: _self || "",
    _ts: _ts || "",
    _etag: _etag || "",
  });
  const formattedDocumentContent = documentContent.replace(/,/g, ",\n").replace("{", "{\n").replace("}", "\n}");
  return formattedDocumentContent;
}

export function getFilterPlaceholder(isPreferredApiMongoDB: boolean): string {
  const filterPlaceholder = isPreferredApiMongoDB
    ? "Type a query predicate (e.g., {´a´:´foo´}), or choose one from the drop down list, or leave empty to query all documents."
    : "Type a query predicate (e.g., WHERE c.id=´1´), or choose one from the drop down list, or leave empty to query all documents.";
  return filterPlaceholder;
}

export function getFilterSuggestions(isPreferredApiMongoDB: boolean): { value: string }[] {
  const filterSuggestions = isPreferredApiMongoDB
    ? [{ value: `{"id": "foo"}` }, { value: "{ qty: { $gte: 20 } }" }]
    : [
      { value: 'WHERE c.id = "foo"' },
      { value: "ORDER BY c._ts DESC" },
      { value: 'WHERE c.id = "foo" ORDER BY c._ts DESC' },
    ];
  return filterSuggestions;
}

export function getDocumentItems(
  isPreferredApiMongoDB: boolean,
  documentIds: Array<DocumentId>,
  documentSqlIds: Array<Resource>,
  isAllDocumentsVisible: boolean
): Array<DocumentId> | Array<Resource> {
  if (isPreferredApiMongoDB) {
    return isAllDocumentsVisible ? documentIds : documentIds.slice(0, 5);
  }
  return isAllDocumentsVisible ? documentSqlIds : documentSqlIds.slice(0, 5);
}
