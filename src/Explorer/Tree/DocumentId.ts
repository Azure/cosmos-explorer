import * as ko from "knockout";
import * as DataModels from "../../Contracts/DataModels";
import { useDialog } from "../Controls/Dialog";

/**
 * Replaces DocumentsTab so we can plug any object
 */
export interface IDocumentIdContainer {
  partitionKeyProperties?: string[];
  partitionKey: DataModels.PartitionKey;
  isEditorDirty: () => boolean;
  selectDocument: (documentId: DocumentId) => Promise<void>;
}
export default class DocumentId {
  public container: IDocumentIdContainer;
  public rid: string;
  public self: string;
  public ts: string;
  public id: ko.Observable<string>;
  public partitionKeyProperties: string[];
  public partitionKey: DataModels.PartitionKey;
  public partitionKeyValue: any[];
  public stringPartitionKeyValues: string[];
  public isDirty: ko.Observable<boolean>;

  constructor(container: IDocumentIdContainer, data: any, partitionKeyValue: any[]) {
    this.container = container;
    this.self = data._self;
    this.rid = data._rid;
    this.ts = data._ts;
    this.partitionKeyValue = partitionKeyValue;
    this.partitionKeyProperties = container?.partitionKeyProperties;
    this.partitionKey = container && container.partitionKey;
    this.stringPartitionKeyValues = this.getPartitionKeyValueAsString();
    this.id = ko.observable(data.id);
    this.isDirty = ko.observable(false);
  }

  public click() {
    if (this.container.isEditorDirty()) {
      useDialog
        .getState()
        .showOkCancelModalDialog(
          "Unsaved changes",
          "Your unsaved changes will be lost. Do you want to continue?",
          "OK",
          () => this.loadDocument(),
          "Cancel",
          undefined,
        );
    } else {
      this.loadDocument();
    }
  }

  public partitionKeyHeader(): Object {
    if (!this.partitionKeyProperties || this.partitionKeyProperties.length === 0) {
      return undefined;
    }

    if (!this.partitionKeyValue || this.partitionKeyValue.length === 0) {
      return [{}];
    }

    return [this.partitionKeyValue];
  }

  public getPartitionKeyValueAsString(): string[] {
    return this.partitionKeyValue?.map((partitionKeyValue) => {
      const typeOfPartitionKeyValue: string = typeof partitionKeyValue;

      if (
        typeOfPartitionKeyValue === "undefined" ||
        typeOfPartitionKeyValue === "null" ||
        typeOfPartitionKeyValue === "object"
      ) {
        return "";
      }

      if (typeOfPartitionKeyValue === "string") {
        return partitionKeyValue;
      }

      return JSON.stringify(partitionKeyValue);
    });
  }

  public async loadDocument(): Promise<void> {
    await this.container.selectDocument(this);
  }
}
