import { extractPartitionKey, ItemDefinition, PartitionKeyDefinition, QueryIterator, Resource } from "@azure/cosmos";
import { ReactTabKind, useTabs } from "hooks/useTabs";
import * as ko from "knockout";
import Q from "q";
import CopilotQueryTablesTab from "../../../images/CopilotQueryTablesTab.svg";
import DeleteDocumentIcon from "../../../images/DeleteDocument.svg";
import DiscardIcon from "../../../images/discard.svg";
import NewDocumentIcon from "../../../images/NewDocument.svg";
import SaveIcon from "../../../images/save-cosmos.svg";
import UploadIcon from "../../../images/Upload_16x16.svg";
import * as Constants from "../../Common/Constants";
import { DocumentsGridMetrics, KeyCodes } from "../../Common/Constants";
import { createDocument } from "../../Common/dataAccess/createDocument";
import { deleteDocument } from "../../Common/dataAccess/deleteDocument";
import { queryDocuments } from "../../Common/dataAccess/queryDocuments";
import { readDocument } from "../../Common/dataAccess/readDocument";
import { updateDocument } from "../../Common/dataAccess/updateDocument";
import editable from "../../Common/EditableUtility";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";
import * as HeadersUtility from "../../Common/HeadersUtility";
import { Splitter, SplitterBounds, SplitterDirection } from "../../Common/Splitter";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import { userContext } from "../../UserContext";
import { logConsoleError } from "../../Utils/NotificationConsoleUtils";
import * as QueryUtils from "../../Utils/QueryUtils";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import { useDialog } from "../Controls/Dialog";
import Explorer from "../Explorer";
import { AccessibleVerticalList } from "../Tree/AccessibleVerticalList";
import DocumentId from "../Tree/DocumentId";
import { useSelectedNode } from "../useSelectedNode";
import template from "./DocumentsTab.html";
import TabsBase from "./TabsBase";

export default class DocumentsTab extends TabsBase {
  public readonly html = template;
  public selectedDocumentId: ko.Observable<DocumentId>;
  public selectedDocumentContent: ViewModels.Editable<string>;
  public initialDocumentContent: ko.Observable<string>;
  public documentContentsGridId: string;
  public documentContentsContainerId: string;
  public filterContent: ko.Observable<string>;
  public appliedFilter: ko.Observable<string>;
  public lastFilterContents: ko.ObservableArray<string>;
  public isFilterExpanded: ko.Observable<boolean>;
  public isFilterCreated: ko.Observable<boolean>;
  public applyFilterButton: ViewModels.Button;
  public isEditorDirty: ko.Computed<boolean>;
  public editorState: ko.Observable<ViewModels.DocumentExplorerState>;
  public newDocumentButton: ViewModels.Button;
  public saveNewDocumentButton: ViewModels.Button;
  public saveExistingDocumentButton: ViewModels.Button;
  public discardNewDocumentChangesButton: ViewModels.Button;
  public discardExisitingDocumentChangesButton: ViewModels.Button;
  public deleteExisitingDocumentButton: ViewModels.Button;
  public copliotEntityButton: ViewModels.Button;
  public displayedError: ko.Observable<string>;
  public accessibleDocumentList: AccessibleVerticalList;
  public dataContentsGridScrollHeight: ko.Observable<string>;
  public isPreferredApiMongoDB: boolean;
  public shouldShowEditor: ko.Computed<boolean>;
  public splitter: Splitter;
  public showPartitionKey: boolean;
  public idHeader: string;

  // TODO need to refactor
  public partitionKey: DataModels.PartitionKey;
  public partitionKeyPropertyHeaders: string[];
  public partitionKeyProperties: string[];
  public documentIds: ko.ObservableArray<DocumentId>;

  private _documentsIterator: QueryIterator<ItemDefinition & Resource>;
  private _resourceTokenPartitionKey: string;

  constructor(options: ViewModels.DocumentsTabOptions) {
    super(options);
    this.isPreferredApiMongoDB = userContext.apiType === "Mongo" || options.isPreferredApiMongoDB;

    this.idHeader = this.isPreferredApiMongoDB ? "_id" : "id";

    this.documentContentsGridId = `documentContentsGrid${this.tabId}`;
    this.documentContentsContainerId = `documentContentsContainer${this.tabId}`;
    this.editorState = ko.observable<ViewModels.DocumentExplorerState>(
      ViewModels.DocumentExplorerState.noDocumentSelected
    );
    this.selectedDocumentId = ko.observable<DocumentId>();
    this.selectedDocumentContent = editable.observable<string>("");
    this.initialDocumentContent = ko.observable<string>("");
    this.partitionKey = options.partitionKey || (this.collection && this.collection.partitionKey);
    this._resourceTokenPartitionKey = options.resourceTokenPartitionKey;
    this.documentIds = options.documentIds;

    this.partitionKeyPropertyHeaders = this.collection?.partitionKeyPropertyHeaders || this.partitionKey?.paths;
    this.partitionKeyProperties = this.partitionKeyPropertyHeaders?.map((partitionKeyPropertyHeader) =>
      partitionKeyPropertyHeader.replace(/[/]+/g, ".").substring(1).replace(/[']+/g, "")
    );

    this.isFilterExpanded = ko.observable<boolean>(false);
    this.isFilterCreated = ko.observable<boolean>(true);
    this.filterContent = ko.observable<string>("");
    this.appliedFilter = ko.observable<string>("");
    this.displayedError = ko.observable<string>("");
    this.lastFilterContents = ko.observableArray<string>([
      'WHERE c.id = "foo"',
      "ORDER BY c._ts DESC",
      'WHERE c.id = "foo" ORDER BY c._ts DESC',
    ]);

    this.dataContentsGridScrollHeight = ko.observable<string>(null);

    // initialize splitter only after template has been loaded so dom elements are accessible
    super.onTemplateReady((isTemplateReady: boolean) => {
      if (isTemplateReady) {
        const tabContainer: HTMLElement = document.getElementById("content");
        const splitterBounds: SplitterBounds = {
          min: Constants.DocumentsGridMetrics.DocumentEditorMinWidthRatio * tabContainer.clientWidth,
          max: Constants.DocumentsGridMetrics.DocumentEditorMaxWidthRatio * tabContainer.clientWidth,
        };
        this.splitter = new Splitter({
          splitterId: "h_splitter2",
          leftId: this.documentContentsContainerId,
          bounds: splitterBounds,
          direction: SplitterDirection.Vertical,
        });
      }
    });

    this.accessibleDocumentList = new AccessibleVerticalList(this.documentIds());
    this.accessibleDocumentList.setOnSelect(
      (selectedDocument: DocumentId) => selectedDocument && selectedDocument.click()
    );
    this.selectedDocumentId.subscribe((newSelectedDocumentId: DocumentId) =>
      this.accessibleDocumentList.updateCurrentItem(newSelectedDocumentId)
    );
    this.documentIds.subscribe((newDocuments: DocumentId[]) => {
      this.accessibleDocumentList.updateItemList(newDocuments);
      if (newDocuments.length > 0) {
        this.dataContentsGridScrollHeight(
          newDocuments.length * DocumentsGridMetrics.IndividualRowHeight + DocumentsGridMetrics.BufferHeight + "px"
        );
      } else {
        this.dataContentsGridScrollHeight(
          DocumentsGridMetrics.IndividualRowHeight + DocumentsGridMetrics.BufferHeight + "px"
        );
      }
    });

    this.isEditorDirty = ko.computed<boolean>(() => {
      switch (this.editorState()) {
        case ViewModels.DocumentExplorerState.noDocumentSelected:
        case ViewModels.DocumentExplorerState.exisitingDocumentNoEdits:
          return false;

        case ViewModels.DocumentExplorerState.newDocumentValid:
        case ViewModels.DocumentExplorerState.newDocumentInvalid:
        case ViewModels.DocumentExplorerState.exisitingDocumentDirtyInvalid:
          return true;

        case ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid:
          return (
            this.selectedDocumentContent.getEditableOriginalValue() !==
            this.selectedDocumentContent.getEditableCurrentValue()
          );

        default:
          return false;
      }
    });

    this.newDocumentButton = {
      enabled: ko.computed<boolean>(() => {
        switch (this.editorState()) {
          case ViewModels.DocumentExplorerState.noDocumentSelected:
          case ViewModels.DocumentExplorerState.exisitingDocumentNoEdits:
            return true;
        }

        return false;
      }),

      visible: ko.computed<boolean>(() => {
        return true;
      }),
    };

    this.saveNewDocumentButton = {
      enabled: ko.computed<boolean>(() => {
        switch (this.editorState()) {
          case ViewModels.DocumentExplorerState.newDocumentValid:
            return true;
        }

        return false;
      }),

      visible: ko.computed<boolean>(() => {
        switch (this.editorState()) {
          case ViewModels.DocumentExplorerState.newDocumentValid:
          case ViewModels.DocumentExplorerState.newDocumentInvalid:
            return true;
        }

        return false;
      }),
    };

    this.discardNewDocumentChangesButton = {
      enabled: ko.computed<boolean>(() => {
        switch (this.editorState()) {
          case ViewModels.DocumentExplorerState.newDocumentValid:
          case ViewModels.DocumentExplorerState.newDocumentInvalid:
            return true;
        }

        return false;
      }),

      visible: ko.computed<boolean>(() => {
        switch (this.editorState()) {
          case ViewModels.DocumentExplorerState.newDocumentValid:
          case ViewModels.DocumentExplorerState.newDocumentInvalid:
            return true;
        }

        return false;
      }),
    };

    this.saveExistingDocumentButton = {
      enabled: ko.computed<boolean>(() => {
        switch (this.editorState()) {
          case ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid:
            return true;
        }

        return false;
      }),

      visible: ko.computed<boolean>(() => {
        switch (this.editorState()) {
          case ViewModels.DocumentExplorerState.exisitingDocumentNoEdits:
          case ViewModels.DocumentExplorerState.exisitingDocumentDirtyInvalid:
          case ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid:
            return true;
        }

        return false;
      }),
    };

    this.discardExisitingDocumentChangesButton = {
      enabled: ko.computed<boolean>(() => {
        switch (this.editorState()) {
          case ViewModels.DocumentExplorerState.exisitingDocumentDirtyInvalid:
          case ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid:
            return true;
        }

        return false;
      }),

      visible: ko.computed<boolean>(() => {
        switch (this.editorState()) {
          case ViewModels.DocumentExplorerState.exisitingDocumentNoEdits:
          case ViewModels.DocumentExplorerState.exisitingDocumentDirtyInvalid:
          case ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid:
            return true;
        }

        return false;
      }),
    };

    this.deleteExisitingDocumentButton = {
      enabled: ko.computed<boolean>(() => {
        switch (this.editorState()) {
          case ViewModels.DocumentExplorerState.exisitingDocumentNoEdits:
          case ViewModels.DocumentExplorerState.exisitingDocumentDirtyInvalid:
          case ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid:
            return true;
        }

        return false;
      }),

      visible: ko.computed<boolean>(() => {
        switch (this.editorState()) {
          case ViewModels.DocumentExplorerState.exisitingDocumentNoEdits:
          case ViewModels.DocumentExplorerState.exisitingDocumentDirtyInvalid:
          case ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid:
            return true;
        }

        return false;
      }),
    };

    this.applyFilterButton = {
      enabled: ko.computed<boolean>(() => {
        return true;
      }),

      visible: ko.computed<boolean>(() => {
        return true;
      }),
    };

    this.copliotEntityButton = {
      enabled: ko.computed<boolean>(() => {
        return userContext.features.enableCopilot;
      }),
      visible: ko.computed<boolean>(() => {
        return userContext.features.enableCopilot;
      })
    };

    this.buildCommandBarOptions();
    this.shouldShowEditor = ko.computed<boolean>(() => {
      const documentHasContent: boolean =
        this.selectedDocumentContent() != null && this.selectedDocumentContent().length > 0;
      const isNewDocument: boolean =
        this.editorState() === ViewModels.DocumentExplorerState.newDocumentValid ||
        this.editorState() === ViewModels.DocumentExplorerState.newDocumentInvalid;

      return documentHasContent || isNewDocument;
    });
    this.selectedDocumentContent.subscribe((newContent: string) => this._onEditorContentChange(newContent));

    this.showPartitionKey = this._shouldShowPartitionKey();
  }

  private _shouldShowPartitionKey(): boolean {
    if (!this.collection) {
      return false;
    }

    if (!this.collection.partitionKey) {
      return false;
    }

    if (this.collection.partitionKey.systemKey && this.isPreferredApiMongoDB) {
      return false;
    }

    return true;
  }

  public onShowFilterClick(): Q.Promise<any> {
    this.isFilterCreated(true);
    this.isFilterExpanded(true);

    $(".filterDocExpanded").addClass("active");
    $("#content").addClass("active");
    $(".querydropdown").focus();

    return Q();
  }

  public onHideFilterClick(): Q.Promise<any> {
    this.isFilterExpanded(false);

    $(".filterDocExpanded").removeClass("active");
    $("#content").removeClass("active");
    $(".queryButton").focus();
    return Q();
  }

  public onCloseButtonKeyDown = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      this.onHideFilterClick();
      event.stopPropagation();
      return false;
    }
    return true;
  };

  public async refreshDocumentsGrid(): Promise<void> {
    // clear documents grid
    this.documentIds([]);

    try {
      // reset iterator
      this._documentsIterator = this.createIterator();
      // load documents
      await this.loadNextPage();
      // collapse filter
      this.appliedFilter(this.filterContent());
      this.isFilterExpanded(false);
      document.getElementById("errorStatusIcon")?.focus();
    } catch (error) {
      useDialog.getState().showOkModalDialog("Refresh documents grid failed", getErrorMessage(error));
    }
  }

  public onRefreshButtonKeyDown = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      this.refreshDocumentsGrid();
      event.stopPropagation();
      return false;
    }
    return true;
  };

  public onDocumentIdClick(clickedDocumentId: DocumentId): Q.Promise<any> {
    if (this.editorState() !== ViewModels.DocumentExplorerState.noDocumentSelected) {
      return Q();
    }

    this.editorState(ViewModels.DocumentExplorerState.exisitingDocumentNoEdits);

    return Q();
  }

  public onNewDocumentClick = (): void => {
    if (this.isEditorDirty()) {
      useDialog
        .getState()
        .showOkCancelModalDialog(
          "Unsaved changes",
          "Changes will be lost. Do you want to continue?",
          "OK",
          () => this.initializeNewDocument(),
          "Cancel",
          undefined
        );
    } else {
      this.initializeNewDocument();
    }
  };

  private initializeNewDocument = (): void => {
    this.selectedDocumentId(null);
    const defaultDocument: string = this.renderObjectForEditor({ id: "replace_with_new_document_id" }, null, 4);
    this.initialDocumentContent(defaultDocument);
    this.selectedDocumentContent.setBaseline(defaultDocument);
    this.editorState(ViewModels.DocumentExplorerState.newDocumentValid);
  };

  public onSaveNewDocumentClick = (): Promise<any> => {
    this.isExecutionError(false);
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateDocument, {
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle(),
    });
    const document = JSON.parse(this.selectedDocumentContent());
    this.isExecuting(true);
    return createDocument(this.collection, document)
      .then(
        (savedDocument: any) => {
          const value: string = this.renderObjectForEditor(savedDocument || {}, null, 4);
          this.selectedDocumentContent.setBaseline(value);
          this.initialDocumentContent(value);
          const partitionKeyValueArray = extractPartitionKey(
            savedDocument,
            this.partitionKey as PartitionKeyDefinition
          );
          let id = new DocumentId(this, savedDocument, partitionKeyValueArray);
          let ids = this.documentIds();
          ids.push(id);

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

  public onRevertNewDocumentClick = (): Q.Promise<any> => {
    this.initialDocumentContent("");
    this.selectedDocumentContent("");
    this.editorState(ViewModels.DocumentExplorerState.noDocumentSelected);

    return Q();
  };

  public onSaveExistingDocumentClick = (): Promise<any> => {
    const selectedDocumentId = this.selectedDocumentId();
    const documentContent = JSON.parse(this.selectedDocumentContent());

    const partitionKeyValueArray = extractPartitionKey(documentContent, this.partitionKey as PartitionKeyDefinition);
    selectedDocumentId.partitionKeyValue = partitionKeyValueArray;

    this.isExecutionError(false);
    const startKey: number = TelemetryProcessor.traceStart(Action.UpdateDocument, {
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle(),
    });
    this.isExecuting(true);
    return updateDocument(this.collection, selectedDocumentId, documentContent)
      .then(
        (updatedDocument: any) => {
          const value: string = this.renderObjectForEditor(updatedDocument || {}, null, 4);
          this.selectedDocumentContent.setBaseline(value);
          this.initialDocumentContent(value);
          this.documentIds().forEach((documentId: DocumentId) => {
            if (documentId.rid === updatedDocument._rid) {
              documentId.id(updatedDocument.id);
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

  public onRevertExisitingDocumentClick = (): Q.Promise<any> => {
    this.selectedDocumentContent.setBaseline(this.initialDocumentContent());
    this.initialDocumentContent.valueHasMutated();
    this.editorState(ViewModels.DocumentExplorerState.exisitingDocumentNoEdits);

    return Q();
  };

  public onDeleteExisitingDocumentClick = async (): Promise<void> => {
    const selectedDocumentId = this.selectedDocumentId();
    const msg = !this.isPreferredApiMongoDB
      ? "Are you sure you want to delete the selected item ?"
      : "Are you sure you want to delete the selected document ?";

    useDialog
      .getState()
      .showOkCancelModalDialog(
        "Confirm delete",
        msg,
        "Delete",
        async () => await this._deleteDocument(selectedDocumentId),
        "Cancel",
        undefined
      );
  };

  public onValidDocumentEdit(): Q.Promise<any> {
    if (
      this.editorState() === ViewModels.DocumentExplorerState.newDocumentInvalid ||
      this.editorState() === ViewModels.DocumentExplorerState.newDocumentValid
    ) {
      this.editorState(ViewModels.DocumentExplorerState.newDocumentValid);
      return Q();
    }

    this.editorState(ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid);
    return Q();
  }

  public onInvalidDocumentEdit(): Q.Promise<any> {
    if (
      this.editorState() === ViewModels.DocumentExplorerState.newDocumentInvalid ||
      this.editorState() === ViewModels.DocumentExplorerState.newDocumentValid
    ) {
      this.editorState(ViewModels.DocumentExplorerState.newDocumentInvalid);
      return Q();
    }

    if (
      this.editorState() === ViewModels.DocumentExplorerState.exisitingDocumentNoEdits ||
      this.editorState() === ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid
    ) {
      this.editorState(ViewModels.DocumentExplorerState.exisitingDocumentDirtyInvalid);
      return Q();
    }

    return Q();
  }

  public onTabClick(): void {
    super.onTabClick();
    this.collection && this.collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Documents);
  }

  public async onActivate(): Promise<void> {
    super.onActivate();

    if (!this._documentsIterator) {
      try {
        this._documentsIterator = this.createIterator();
        await this.loadNextPage();
      } catch (error) {
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
            this.onLoadStartKey
          );
          this.onLoadStartKey = null;
        }
      }
    }
  }

  protected __deleteDocument(documentId: DocumentId): Promise<void> {
    return deleteDocument(this.collection, documentId);
  }

  private _deleteDocument(selectedDocumentId: DocumentId): Promise<void> {
    this.isExecutionError(false);
    const startKey: number = TelemetryProcessor.traceStart(Action.DeleteDocument, {
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle(),
    });
    this.isExecuting(true);
    return this.__deleteDocument(selectedDocumentId)
      .then(
        () => {
          this.documentIds.remove((documentId: DocumentId) => documentId.rid === selectedDocumentId.rid);
          this.selectedDocumentContent("");
          this.selectedDocumentId(null);
          this.editorState(ViewModels.DocumentExplorerState.noDocumentSelected);
          TelemetryProcessor.traceSuccess(
            Action.DeleteDocument,
            {
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle(),
            },
            startKey
          );
        },
        (error) => {
          this.isExecutionError(true);
          console.error(error);
          TelemetryProcessor.traceFailure(
            Action.DeleteDocument,
            {
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle(),
              error: getErrorMessage(error),
              errorStack: getErrorStack(error),
            },
            startKey
          );
        }
      )
      .finally(() => this.isExecuting(false));
  }

  public createIterator(): QueryIterator<ItemDefinition & Resource> {
    let filters = this.lastFilterContents();
    const filter: string = this.filterContent().trim();
    const query: string = this.buildQuery(filter);
    let options: any = {};
    options.enableCrossPartitionQuery = HeadersUtility.shouldEnableCrossPartitionKey();

    if (this._resourceTokenPartitionKey) {
      options.partitionKey = this._resourceTokenPartitionKey;
    }

    return queryDocuments(this.collection.databaseId, this.collection.id(), query, options);
  }

  public async selectDocument(documentId: DocumentId): Promise<void> {
    this.selectedDocumentId(documentId);
    const content = await readDocument(this.collection, documentId);
    this.initDocumentEditor(documentId, content);
  }

  public loadNextPage(): Q.Promise<any> {
    this.isExecuting(true);
    this.isExecutionError(false);
    return this._loadNextPageInternal()
      .then(
        (documentsIdsResponse = []) => {
          const currentDocuments = this.documentIds();
          const currentDocumentsRids = currentDocuments.map((currentDocument) => currentDocument.rid);
          const nextDocumentIds = documentsIdsResponse
            // filter documents already loaded in observable
            .filter((d: any) => {
              return currentDocumentsRids.indexOf(d._rid) < 0;
            })
            // map raw response to view model
            .map((rawDocument: any) => {
              const partitionKeyValue = rawDocument._partitionKeyValue;
              return new DocumentId(this, rawDocument, partitionKeyValue);
            });

          const merged = currentDocuments.concat(nextDocumentIds);
          this.documentIds(merged);
          if (this.onLoadStartKey != null && this.onLoadStartKey != undefined) {
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
        (error) => {
          this.isExecutionError(true);
          const errorMessage = getErrorMessage(error);
          logConsoleError(errorMessage);
          if (this.onLoadStartKey != null && this.onLoadStartKey != undefined) {
            TelemetryProcessor.traceFailure(
              Action.Tab,
              {
                databaseName: this.collection.databaseId,
                collectionName: this.collection.id(),

                dataExplorerArea: Constants.Areas.Tab,
                tabTitle: this.tabTitle(),
                error: errorMessage,
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

  public onLoadMoreKeyInput = (source: any, event: KeyboardEvent): void => {
    if (event.key === " " || event.key === "Enter") {
      const focusElement = document.getElementById(this.documentContentsGridId);
      this.loadNextPage();
      focusElement && focusElement.focus();
      event.stopPropagation();
      event.preventDefault();
    }
  };

  public onCopilotEntityClick = (): void => {
    useTabs.getState().openAndActivateReactTab(ReactTabKind.QueryCopilot)
  }

  protected _loadNextPageInternal(): Q.Promise<DataModels.DocumentId[]> {
    return Q(this._documentsIterator.fetchNext().then((response) => response.resources));
  }

  protected _onEditorContentChange(newContent: string) {
    try {
      let parsed: any = JSON.parse(newContent);
      this.onValidDocumentEdit();
    } catch (e) {
      this.onInvalidDocumentEdit();
    }
  }

  public initDocumentEditor(documentId: DocumentId, documentContent: any): Q.Promise<any> {
    if (documentId) {
      const content: string = this.renderObjectForEditor(documentContent, null, 4);
      this.selectedDocumentContent.setBaseline(content);
      this.initialDocumentContent(content);
      const newState = documentId
        ? ViewModels.DocumentExplorerState.exisitingDocumentNoEdits
        : ViewModels.DocumentExplorerState.newDocumentValid;
      this.editorState(newState);
    }

    return Q();
  }

  public buildQuery(filter: string): string {
    return QueryUtils.buildDocumentsQuery(filter, this.partitionKeyProperties, this.partitionKey);
  }

  protected getTabsButtons(): CommandButtonComponentProps[] {
    const buttons: CommandButtonComponentProps[] = [];
    const label = !this.isPreferredApiMongoDB ? "New Item" : "New Document";
    if (this.newDocumentButton.visible()) {
      buttons.push({
        iconSrc: NewDocumentIcon,
        iconAlt: label,
        onCommandClick: this.onNewDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.newDocumentButton.enabled(),
        id: "mongoNewDocumentBtn",
      });
    }

    if (this.saveNewDocumentButton.visible()) {
      const label = "Save";
      buttons.push({
        iconSrc: SaveIcon,
        iconAlt: label,
        onCommandClick: this.onSaveNewDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.saveNewDocumentButton.enabled(),
      });
    }

    if (this.discardNewDocumentChangesButton.visible()) {
      const label = "Discard";
      buttons.push({
        iconSrc: DiscardIcon,
        iconAlt: label,
        onCommandClick: this.onRevertNewDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.discardNewDocumentChangesButton.enabled(),
      });
    }

    if (this.saveExistingDocumentButton.visible()) {
      const label = "Update";
      buttons.push({
        iconSrc: SaveIcon,
        iconAlt: label,
        onCommandClick: this.onSaveExistingDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.saveExistingDocumentButton.enabled(),
      });
    }

    if (this.discardExisitingDocumentChangesButton.visible()) {
      const label = "Discard";
      buttons.push({
        iconSrc: DiscardIcon,
        iconAlt: label,
        onCommandClick: this.onRevertExisitingDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.discardExisitingDocumentChangesButton.enabled(),
      });
    }

    if (this.deleteExisitingDocumentButton.visible()) {
      const label = "Delete";
      buttons.push({
        iconSrc: DeleteDocumentIcon,
        iconAlt: label,
        onCommandClick: this.onDeleteExisitingDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.deleteExisitingDocumentButton.enabled(),
      });
    }

    if (!this.isPreferredApiMongoDB) {
      buttons.push(DocumentsTab._createUploadButton(this.collection.container));
    }

    if (this.copliotEntityButton.visible()) {
      const label = "Query Copliot";
      buttons.push({
        iconSrc: CopilotQueryTablesTab,
        iconAlt: label,
        onCommandClick: this.onCopilotEntityClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: true,
        disabled: !this.copliotEntityButton.enabled(),
      });
    }

    return buttons;
  }

  protected buildCommandBarOptions(): void {
    ko.computed(() =>
      ko.toJSON([
        this.newDocumentButton.visible,
        this.newDocumentButton.enabled,
        this.saveNewDocumentButton.visible,
        this.saveNewDocumentButton.enabled,
        this.discardNewDocumentChangesButton.visible,
        this.discardNewDocumentChangesButton.enabled,
        this.saveExistingDocumentButton.visible,
        this.saveExistingDocumentButton.enabled,
        this.discardExisitingDocumentChangesButton.visible,
        this.discardExisitingDocumentChangesButton.enabled,
        this.deleteExisitingDocumentButton.visible,
        this.deleteExisitingDocumentButton.enabled,
      ])
    ).subscribe(() => this.updateNavbarWithTabsButtons());
    this.updateNavbarWithTabsButtons();
  }

  public static _createUploadButton(container: Explorer): CommandButtonComponentProps {
    const label = "Upload Item";
    return {
      id: "uploadItemBtn",
      iconSrc: UploadIcon,
      iconAlt: label,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = useSelectedNode.getState().findSelectedCollection();
        selectedCollection && container.openUploadItemsPanePane();
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled: useSelectedNode.getState().isDatabaseNodeOrNoneSelected(),
    };
  }
}
