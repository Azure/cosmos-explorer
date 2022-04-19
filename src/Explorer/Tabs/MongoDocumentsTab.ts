/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { extractPartitionKey, PartitionKeyDefinition } from "@azure/cosmos";
import * as ko from "knockout";
import Q from "q";
import * as Constants from "../../Common/Constants";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";
import * as Logger from "../../Common/Logger";
import {
  createDocument,
  deleteDocument,
  queryDocuments,
  readDocument,
  updateDocument,
} from "../../Common/MongoProxyClient";
import MongoUtility from "../../Common/MongoUtility";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { useDialog } from "../Controls/Dialog";
import DocumentId from "../Tree/DocumentId";
import ObjectId from "../Tree/ObjectId";
import DocumentsTab from "./DocumentsTab";

export default class MongoDocumentsTab extends DocumentsTab {
  public collection: ViewModels.Collection;
  private continuationToken: string;

  constructor(options: ViewModels.DocumentsTabOptions) {
    super(options);
    this.lastFilterContents = ko.observableArray<string>(['{"id":"foo"}', "{ qty: { $gte: 20 } }"]);

    if (this.partitionKeyProperty && ~this.partitionKeyProperty.indexOf(`"`)) {
      this.partitionKeyProperty = this.partitionKeyProperty.replace(/["]+/g, "");
    }

    if (this.partitionKeyProperty && this.partitionKeyProperty.indexOf("$v") > -1) {
      // From $v.shard.$v.key.$v > shard.key
      this.partitionKeyProperty = this.partitionKeyProperty.replace(/.\$v/g, "").replace(/\$v./g, "");
      this.partitionKeyPropertyHeader = "/" + this.partitionKeyProperty;
    }

    this.isFilterExpanded = ko.observable<boolean>(true);
    super.buildCommandBarOptions.bind(this);
    super.buildCommandBarOptions();
  }

  public onSaveNewDocumentClick = (): Promise<void> => {
    const documentContent = JSON.parse(this.selectedDocumentContent());
    this.displayedError("");
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateDocument, {
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle(),
    });

    if (
      this.partitionKeyProperty &&
      this.partitionKeyProperty !== "_id" &&
      !this._hasShardKeySpecified(documentContent)
    ) {
      const message = `The document is lacking the shard property: ${this.partitionKeyProperty}`;
      this.displayedError(message);
      setTimeout(() => {
        this.displayedError("");
      }, Constants.ClientDefaults.errorNotificationTimeoutMs);
      this.isExecutionError(true);
      TelemetryProcessor.traceFailure(
        Action.CreateDocument,
        {
          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.tabTitle(),
          error: message,
        },
        startKey
      );
      Logger.logError("Failed to save new document: Document shard key not defined", "MongoDocumentsTab");
      throw new Error("Document without shard key");
    }

    this.isExecutionError(false);
    this.isExecuting(true);
    return createDocument(this.collection.databaseId, this.collection, this.partitionKeyProperty, documentContent)
      .then(
        (savedDocument: any) => {
          const partitionKeyArray = extractPartitionKey(
            savedDocument,
            this._getPartitionKeyDefinition() as PartitionKeyDefinition
          );

          const partitionKeyValue = partitionKeyArray && partitionKeyArray[0];

          const id = new ObjectId(this, savedDocument, partitionKeyValue);
          const ids = this.documentIds();
          ids.push(id);
          delete savedDocument._self;

          const value: string = this.renderObjectForEditor(savedDocument || {}, null, 4);
          this.selectedDocumentContent.setBaseline(value);

          this.selectedDocumentId(id);
          this.documentIds(ids);
          this.editorState(ViewModels.DocumentExplorerState.exisitingDocumentNoEdits);
          TelemetryProcessor.traceSuccess(
            Action.CreateDocument,
            {
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle(),
            },
            startKey
          );
        },
        (error) => {
          this.isExecutionError(true);
          const errorMessage = getErrorMessage(error);
          useDialog.getState().showOkModalDialog("Create document failed", errorMessage);
          TelemetryProcessor.traceFailure(
            Action.CreateDocument,
            {
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle(),
              error: errorMessage,
              errorStack: getErrorStack(error),
            },
            startKey
          );
        }
      )
      .finally(() => this.isExecuting(false));
  };

  public onSaveExisitingDocumentClick = (): Promise<void> => {
    const selectedDocumentId = this.selectedDocumentId();
    const documentContent = this.selectedDocumentContent();
    this.isExecutionError(false);
    this.isExecuting(true);
    const startKey: number = TelemetryProcessor.traceStart(Action.UpdateDocument, {
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle(),
    });

    return updateDocument(this.collection.databaseId, this.collection, selectedDocumentId, documentContent)
      .then(
        (updatedDocument: any) => {
          const value: string = this.renderObjectForEditor(updatedDocument || {}, null, 4);
          this.selectedDocumentContent.setBaseline(value);

          this.documentIds().forEach((documentId: DocumentId) => {
            if (documentId.rid === updatedDocument._rid) {
              const partitionKeyArray = extractPartitionKey(
                updatedDocument,
                this._getPartitionKeyDefinition() as PartitionKeyDefinition
              );

              const partitionKeyValue = partitionKeyArray && partitionKeyArray[0];

              const id = new ObjectId(this, updatedDocument, partitionKeyValue);
              documentId.id(id.id());
            }
          });
          this.editorState(ViewModels.DocumentExplorerState.exisitingDocumentNoEdits);
          TelemetryProcessor.traceSuccess(
            Action.UpdateDocument,
            {
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle(),
            },
            startKey
          );
        },
        (error) => {
          this.isExecutionError(true);
          const errorMessage = getErrorMessage(error);
          useDialog.getState().showOkModalDialog("Update document failed", errorMessage);
          TelemetryProcessor.traceFailure(
            Action.UpdateDocument,
            {
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle(),
              error: errorMessage,
              errorStack: getErrorStack(error),
            },
            startKey
          );
        }
      )
      .finally(() => this.isExecuting(false));
  };

  public buildQuery(filter: string): string {
    return filter || "{}";
  }

  public async selectDocument(documentId: DocumentId): Promise<void> {
    this.selectedDocumentId(documentId);
    const content = await readDocument(this.collection.databaseId, this.collection, documentId);
    this.initDocumentEditor(documentId, content);
  }

  public loadNextPage(): Q.Promise<void> {
    this.isExecuting(true);
    this.isExecutionError(false);
    const filter: string = this.filterContent().trim();
    const query: string = this.buildQuery(filter);

    return Q(queryDocuments(this.collection.databaseId, this.collection, true, query, this.continuationToken))
      .then(
        ({ continuationToken, documents }) => {
          this.continuationToken = continuationToken;
          let currentDocuments = this.documentIds();
          const currentDocumentsRids = currentDocuments.map((currentDocument) => currentDocument.rid);
          const nextDocumentIds = documents
            .filter((d: any) => {
              return currentDocumentsRids.indexOf(d._rid) < 0;
            })
            .map((rawDocument: any) => {
              const partitionKeyValue = rawDocument._partitionKeyValue;
              return new DocumentId(this, rawDocument, partitionKeyValue);
            });

          const merged = currentDocuments.concat(nextDocumentIds);

          this.documentIds(merged);
          currentDocuments = this.documentIds();
          if (this.filterContent().length > 0 && currentDocuments.length > 0) {
            currentDocuments[0].click();
          } else {
            this.selectedDocumentContent("");
            this.selectedDocumentId(null);
            this.editorState(ViewModels.DocumentExplorerState.noDocumentSelected);
          }
          if (this.onLoadStartKey !== null && this.onLoadStartKey !== undefined) {
            TelemetryProcessor.traceSuccess(
              Action.Tab,
              {
                databaseName: this.collection.databaseId,
                collectionName: this.collection.id(),

                dataExplorerArea: Constants.Areas.Tab,
                tabTitle: this.tabTitle(),
              },
              this.onLoadStartKey
            );
            this.onLoadStartKey = null;
          }
        },
        (error: Error) => {
          if (this.onLoadStartKey !== null && this.onLoadStartKey !== undefined) {
            TelemetryProcessor.traceFailure(
              Action.Tab,
              {
                databaseName: this.collection.databaseId,
                collectionName: this.collection.id(),

                dataExplorerArea: Constants.Areas.Tab,
                tabTitle: this.tabTitle(),
                error: getErrorMessage(error),
                errorStack: getErrorStack(error),
              },
              this.onLoadStartKey
            );
            this.onLoadStartKey = null;
          }
        }
      )
      .finally(() => this.isExecuting(false));
  }

  protected _onEditorContentChange(newContent: string): void {
    try {
      if (
        this.editorState() === ViewModels.DocumentExplorerState.newDocumentValid ||
        this.editorState() === ViewModels.DocumentExplorerState.newDocumentInvalid
      ) {
        const parsed: any = JSON.parse(newContent);
      }

      // Mongo uses BSON format for _id, trying to parse it as JSON blocks normal flow in an edit
      this.onValidDocumentEdit();
    } catch (e) {
      this.onInvalidDocumentEdit();
    }
  }

  /** Renders a Javascript object to be displayed inside Monaco Editor */
  public renderObjectForEditor(value: any, replacer: any, space: string | number): string {
    return MongoUtility.tojson(value, null, false);
  }

  private _hasShardKeySpecified(document: any): boolean {
    return Boolean(extractPartitionKey(document, this._getPartitionKeyDefinition() as PartitionKeyDefinition));
  }

  private _getPartitionKeyDefinition(): DataModels.PartitionKey {
    let partitionKey: DataModels.PartitionKey = this.partitionKey;

    if (
      this.partitionKey &&
      this.partitionKey.paths &&
      this.partitionKey.paths.length &&
      this.partitionKey.paths.length > 0 &&
      this.partitionKey.paths[0].indexOf("$v") > -1
    ) {
      // Convert BsonSchema2 to /path format
      partitionKey = {
        kind: partitionKey.kind,
        paths: ["/" + this.partitionKeyProperty.replace(/\./g, "/")],
        version: partitionKey.version,
      };
    }

    return partitionKey;
  }

  protected __deleteDocument(documentId: DocumentId): Promise<void> {
    return deleteDocument(this.collection.databaseId, this.collection, documentId);
  }
}
