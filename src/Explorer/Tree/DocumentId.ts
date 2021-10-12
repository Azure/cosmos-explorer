/* eslint-disable @typescript-eslint/no-explicit-any */
import * as ko from "knockout";
import * as DataModels from "../../Contracts/DataModels";
import { useDialog } from "../Controls/Dialog";
import DocumentsTab from "../Tabs/DocumentsTab";

export default class DocumentId {
  public container: DocumentsTab;
  public rid: string;
  public self: string;
  public ts: string;
  public id: ko.Observable<string>;
  public partitionKeyProperty: string;
  public partitionKey: DataModels.PartitionKey;
  public partitionKeyValue: any;
  public stringPartitionKeyValue: string;
  public isDirty: ko.Observable<boolean>;

  constructor(container: DocumentsTab, data: any, partitionKeyValue: any) {
    this.container = container;
    this.self = data._self;
    this.rid = data._rid;
    this.ts = data._ts;
    this.partitionKeyValue = partitionKeyValue;
    this.partitionKeyProperty = container && container.partitionKeyProperty;
    this.partitionKey = container && container.partitionKey;
    this.stringPartitionKeyValue = this.getPartitionKeyValueAsString();
    this.id = ko.observable(data.id);
    this.isDirty = ko.observable(false);
  }

  public click(): void {
    if (this.container.isEditorDirty()) {
      useDialog
        .getState()
        .showOkCancelModalDialog(
          "Unsaved changes",
          "Your unsaved changes will be lost. Do you want to continue?",
          "OK",
          () => this.loadDocument(),
          "Cancel",
          undefined
        );
    } else {
      this.loadDocument();
    }
  }

  public partitionKeyHeader() {
    if (!this.partitionKeyProperty) {
      return undefined;
    }

    if (this.partitionKeyValue === undefined) {
      return [{}];
    }

    return [this.partitionKeyValue];
  }

  public getPartitionKeyValueAsString(): string {
    const partitionKeyValue: any = this.partitionKeyValue;
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
  }

  public async loadDocument(): Promise<void> {
    await this.container.selectDocument(this);
  }
}
