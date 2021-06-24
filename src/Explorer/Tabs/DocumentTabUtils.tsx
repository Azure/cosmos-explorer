import { extractPartitionKey, PartitionKeyDefinition } from "@azure/cosmos";
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
