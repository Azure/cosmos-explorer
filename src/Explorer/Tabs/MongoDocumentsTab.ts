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

    this.partitionKeyProperties = this.partitionKeyProperties?.map((partitionKeyProperty, i) => {
      if (partitionKeyProperty && ~partitionKeyProperty.indexOf(`"`)) {
        partitionKeyProperty = partitionKeyProperty.replace(/["]+/g, "");
      }

      if (partitionKeyProperty && partitionKeyProperty.indexOf("$v") > -1) {
        // From $v.shard.$v.key.$v > shard.key
        partitionKeyProperty = partitionKeyProperty.replace(/.\$v/g, "").replace(/\$v./g, "");
        this.partitionKeyPropertyHeaders[i] = "/" + partitionKeyProperty;
      }

      return partitionKeyProperty;
    });

    this.isFilterExpanded = ko.observable<boolean>(true);
    super.buildCommandBarOptions.bind(this);
    super.buildCommandBarOptions();
  }

  public onSaveNewDocumentClick = (): Promise<any> => {
    const documentContent = JSON.parse(this.selectedDocumentContent());
    this.displayedError("");
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateDocument, {
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle(),
    });

    const partitionKeyProperty = this.partitionKeyProperties?.[0];
    if (partitionKeyProperty !== "_id" && !this._hasShardKeySpecified(documentContent)) {
      const message = `The document is lacking the shard property: ${partitionKeyProperty}`;
      this.displayedError(message);
      let that = this;
      setTimeout(() => {
        that.displayedError("");
      }, Constants.ClientDefaults.errorNotificationTimeoutMs);
      this.isExecutionError(true);
      TelemetryProcessor.traceFailure(
        Action.CreateDocument,
        {
          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.tabTitle(),
          error: message,
        },
        startKey,
      );
      Logger.logError("Failed to save new document: Document shard key not defined", "MongoDocumentsTab");
      throw new Error("Document without shard key");
    }

    this.isExecutionError(false);
    this.isExecuting(true);
    return createDocument(
      this.collection.databaseId,
      this.collection,
      this.partitionKeyProperties?.[0],
      documentContent,
    )
      .then(
        (savedDocument: any) => {
          let partitionKeyArray = extractPartitionKey(
            savedDocument,
            this._getPartitionKeyDefinition() as PartitionKeyDefinition,
          );

          let id = new ObjectId(this, savedDocument, partitionKeyArray);
          let ids = this.documentIds();
          ids.push(id);
          delete savedDocument._self;

          let value: string = this.renderObjectForEditor(savedDocument || {}, null, 4);
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
            startKey,
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
            startKey,
          );
        },
      )
      .finally(() => this.isExecuting(false));
  };

  public onSaveExistingDocumentClick = (): Promise<any> => {
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
          let value: string = this.renderObjectForEditor(updatedDocument || {}, null, 4);
          this.selectedDocumentContent.setBaseline(value);

          this.documentIds().forEach((documentId: DocumentId) => {
            if (documentId.rid === updatedDocument._rid) {
              const partitionKeyArray = extractPartitionKey(
                updatedDocument,
                this._getPartitionKeyDefinition() as PartitionKeyDefinition,
              );

              const id = new ObjectId(this, updatedDocument, partitionKeyArray);
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
            startKey,
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
            startKey,
          );
        },
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

  public loadNextPage(): Q.Promise<any> {
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
              return new DocumentId(this, rawDocument, [partitionKeyValue]);
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
          if (this.onLoadStartKey != null && this.onLoadStartKey != undefined) {
            TelemetryProcessor.traceSuccess(
              Action.Tab,
              {
                databaseName: this.collection.databaseId,
                collectionName: this.collection.id(),

                dataExplorerArea: Constants.Areas.Tab,
                tabTitle: this.tabTitle(),
              },
              this.onLoadStartKey,
            );
            this.onLoadStartKey = null;
          }
        },
        (error: any) => {
          if (this.onLoadStartKey != null && this.onLoadStartKey != undefined) {
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
              this.onLoadStartKey,
            );
            this.onLoadStartKey = null;
          }
        },
      )
      .finally(() => this.isExecuting(false));
  }

  protected _onEditorContentChange(newContent: string) {
    try {
      if (
        this.editorState() === ViewModels.DocumentExplorerState.newDocumentValid ||
        this.editorState() === ViewModels.DocumentExplorerState.newDocumentInvalid
      ) {
        let parsed: any = JSON.parse(newContent);
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
        paths: ["/" + this.partitionKeyProperties?.[0].replace(/\./g, "/")],
        version: partitionKey.version,
      };
    }

    return partitionKey;
  }

  protected __deleteDocument(documentId: DocumentId): Promise<void> {
    return deleteDocument(this.collection.databaseId, this.collection, documentId);
  }
}
