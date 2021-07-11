import { extractPartitionKey, PartitionKeyDefinition } from "@azure/cosmos";
import { IColumn, IImageProps, ImageFit } from "@fluentui/react";
import { Resource } from "../../../src/Contracts/DataModels";
import * as DataModels from "../../Contracts/DataModels";
import DocumentId from "../Tree/DocumentId";

export interface IDocumentsTabContentState {
  columns: IColumn[];
  isModalSelection: boolean;
  isCompactMode: boolean;
  announcedMessage?: string;
  isSuggestionVisible: boolean;
  filter: string;
  isFilterOptionVisible: boolean;
  isEditorVisible: boolean;
  documentContent: string;
  documentIds: Array<DocumentId>;
  documentSqlIds: Array<Resource>;
  editorKey: string;
  selectedDocumentId?: DocumentId;
  selectedSqlDocumentId?: Resource;
  isEditorContentEdited: boolean;
  isAllDocumentsVisible: boolean;
}

export interface IDocument {
  value: string;
  id: string;
}

export interface IButton {
  visible: boolean;
  enabled: boolean;
  isSelected?: boolean;
}

export const imageProps: Partial<IImageProps> = {
  imageFit: ImageFit.centerContain,
  width: 40,
  height: 40,
  style: { marginTop: "15px" },
};

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
  const { partitionKeyProperty, partitionKeyValue, id } = row;
  const documentContent = JSON.stringify({
    _id1: id(),
    [partitionKeyProperty]: partitionKeyValue || "",
  });
  const formattedDocumentContent = documentContent.replace(/,/g, ",\n").replace("{", "{\n").replace("}", "\n}");
  return formattedDocumentContent;
}

export function formatSqlDocumentContent(row: Resource): string {
  const { id, _rid, _self, _ts, _etag, _partitionKeyValue } = row;
  const documentContent = JSON.stringify({
    id: id || "",
    _rid: _rid || "",
    _self: _self || "",
    _ts: _ts || "",
    _etag: _etag || "",
    _partitionKeyValue: _partitionKeyValue || "",
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
    ? [{ value: `{"_id": "foo"}` }, { value: "{ qty: { $gte: 20 } }" }]
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

export const tabButtonVisibility = (visible: boolean, enabled: boolean): { visible: boolean; enabled: boolean } => {
  return {
    visible,
    enabled,
  };
};

export const getfilterText = (isPreferredApiMongoDB: boolean, filter: string): string => {
  if (isPreferredApiMongoDB) {
    if (filter) {
      return `Filter : ${filter}`;
    }
    return "No filter applied";
  }
  return `Select * from C ${filter}`;
};

export const getConfirmationMessage = (apiType: string): string => {
  return apiType !== "Mongo"
    ? "Are you sure you want to delete the selected item ?"
    : "Are you sure you want to delete the selected document ?";
};
