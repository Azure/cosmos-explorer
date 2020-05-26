import * as ko from "knockout";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";

export default class DocumentId implements ViewModels.DocumentId {
  public container: ViewModels.DocumentsTab;
  public rid: string;
  public self: string;
  public ts: string;
  public id: ko.Observable<string>;
  public partitionKeyProperty: string;
  public partitionKey: DataModels.PartitionKey;
  public partitionKeyValue: any;
  public stringPartitionKeyValue: string;
  public isDirty: ko.Observable<boolean>;

  constructor(container: ViewModels.DocumentsTab, data: any, partitionKeyValue: any) {
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

  public click() {
    if (!this.container.isEditorDirty() || window.confirm("Your unsaved changes will be lost.")) {
      this.loadDocument();
    }
    return;
  }

  public partitionKeyHeader(): Object {
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

  public loadDocument(): Q.Promise<any> {
    return this.container.selectDocument(this);
  }
}
