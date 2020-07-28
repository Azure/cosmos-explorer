import Q from "q";
import * as ko from "knockout";
import * as Constants from "../../Common/Constants";
import DocumentId from "./DocumentId";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { extractPartitionKey } from "@azure/cosmos";
import ConflictsTab from "../Tabs/ConflictsTab";
import { readDocument } from "../../Common/DocumentClientUtilityBase";

export default class ConflictId {
  public container: ConflictsTab;
  public rid: string;
  public self: string;
  public ts: string;
  public id: ko.Observable<string>;
  public partitionKeyProperty: string;
  public partitionKey: DataModels.PartitionKey;
  public partitionKeyValue: any;
  public stringPartitionKeyValue: string;
  public resourceId: string;
  public resourceType: string;
  public operationType: string;
  public content: string;
  public parsedContent: any;
  public isDirty: ko.Observable<boolean>;

  constructor(container: ConflictsTab, data: any) {
    this.container = container;
    this.self = data._self;
    this.rid = data._rid;
    this.ts = data._ts;
    this.resourceId = data.resourceId;
    this.resourceType = data.resourceType;
    this.operationType = data.operationType;
    this.content = data.content;
    if (this.content) {
      try {
        this.parsedContent = JSON.parse(this.content);
      } catch (error) {
        //TODO Handle this error
      }
    }
    this.partitionKeyProperty = container && container.partitionKeyProperty;
    this.partitionKey = container && container.partitionKey;
    this.partitionKeyValue = extractPartitionKey(this.parsedContent, this.partitionKey as any);
    this.stringPartitionKeyValue = this.getPartitionKeyValueAsString();
    this.id = ko.observable(data.id);
    this.isDirty = ko.observable(false);
  }

  public click() {
    if (
      !this.container.isEditorDirty() ||
      window.confirm("Your unsaved changes will be lost. Do you want to continue?")
    ) {
      this.loadConflict();
    }
    return;
  }

  public loadConflict(): Q.Promise<any> {
    const conflictsTab = this.container;
    this.container.selectedConflictId(this);

    if (this.operationType === Constants.ConflictOperationType.Create) {
      this.container.initDocumentEditorForCreate(this, this.content);
      return Q();
    }

    this.container.loadingConflictData(true);
    return readDocument(this.container.collection, this.buildDocumentIdFromConflict(this.partitionKeyValue)).then(
      (currentDocumentContent: any) => {
        this.container.loadingConflictData(false);
        if (this.operationType === Constants.ConflictOperationType.Replace) {
          this.container.initDocumentEditorForReplace(this, this.content, currentDocumentContent);
        } else {
          this.container.initDocumentEditorForDelete(this, currentDocumentContent);
        }
      },
      (reason: any) => {
        this.container.loadingConflictData(false);

        // Document could be deleted
        if (
          reason &&
          reason.code === Constants.HttpStatusCodes.NotFound &&
          this.operationType === Constants.ConflictOperationType.Delete
        ) {
          this.container.initDocumentEditorForNoOp(this);
          return Q();
        }

        return Q.reject(reason);
      }
    );
  }

  public getPartitionKeyValueAsString(): string {
    const partitionKeyValue = this.partitionKeyValue;
    const typeOfPartitionKeyValue = typeof partitionKeyValue;

    if (partitionKeyValue === undefined || partitionKeyValue === null) {
      return "";
    }

    if (typeOfPartitionKeyValue === "string") {
      return partitionKeyValue;
    }

    if (Array.isArray(partitionKeyValue)) {
      return partitionKeyValue.join("");
    }

    return JSON.stringify(partitionKeyValue);
  }

  public buildDocumentIdFromConflict(partitionKeyValue: any): DocumentId {
    const conflictDocumentRid = Constants.HashRoutePrefixes.docsWithIds(
      this.container.collection.getDatabase().rid,
      this.container.collection.rid,
      this.resourceId
    );
    const partitionKeyValueResolved = partitionKeyValue || this.partitionKeyValue;
    let id = this.resourceId;
    if (this.parsedContent) {
      try {
        id = this.parsedContent.id;
      } catch (error) {
        //TODO Handle this error
      }
    }
    const documentId = new DocumentId(
      null,
      {
        _rid: this.resourceId,
        _self: conflictDocumentRid,
        id,
        partitionKeyValue: partitionKeyValueResolved,
        partitionKeyProperty: this.partitionKeyProperty,
        partitionKey: this.partitionKey
      },
      partitionKeyValueResolved
    );

    documentId.partitionKeyProperty = this.partitionKeyProperty;
    documentId.partitionKey = this.partitionKey;

    return documentId;
  }
}
