import * as ko from "knockout";
import Q from "q";
import * as Constants from "../../Common/Constants";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import { AccessibleVerticalList } from "../Tree/AccessibleVerticalList";
import { KeyCodes } from "../../Common/Constants";
import * as ErrorParserUtility from "../../Common/ErrorParserUtility";
import DocumentId from "../Tree/DocumentId";
import editable from "../../Common/EditableUtility";
import * as HeadersUtility from "../../Common/HeadersUtility";
import TabsBase from "./TabsBase";
import { DocumentsGridMetrics } from "../../Common/Constants";
import { QueryUtils } from "../../Utils/QueryUtils";
import { Splitter, SplitterBounds, SplitterDirection } from "../../Common/Splitter";
import TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import Toolbar from "../Controls/Toolbar/Toolbar";
import NewDocumentIcon from "../../../images/NewDocument.svg";
import SaveIcon from "../../../images/save-cosmos.svg";
import DiscardIcon from "../../../images/discard.svg";
import DeleteDocumentIcon from "../../../images/DeleteDocument.svg";
import UploadIcon from "../../../images/Upload_16x16.svg";
import SynapseIcon from "../../../images/synapse-link.svg";
import { extractPartitionKey, PartitionKeyDefinition, QueryIterator, ItemDefinition, Resource } from "@azure/cosmos";
import { ConsoleDataType } from "../Menus/NotificationConsole/NotificationConsoleComponent";
import { NotificationConsoleUtils } from "../../Utils/NotificationConsoleUtils";

export default class DocumentsTab extends TabsBase implements ViewModels.DocumentsTab {
  public selectedDocumentId: ko.Observable<ViewModels.DocumentId>;
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
  public toolbarViewModel = ko.observable<Toolbar>();
  public newDocumentButton: ViewModels.Button;
  public saveNewDocumentButton: ViewModels.Button;
  public saveExisitingDocumentButton: ViewModels.Button;
  public discardNewDocumentChangesButton: ViewModels.Button;
  public discardExisitingDocumentChangesButton: ViewModels.Button;
  public deleteExisitingDocumentButton: ViewModels.Button;
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
  public partitionKeyPropertyHeader: string;
  public partitionKeyProperty: string;
  public documentIds: ko.ObservableArray<ViewModels.DocumentId>;

  private _documentsIterator: QueryIterator<ItemDefinition & Resource>;
  private _resourceTokenPartitionKey: string;
  protected _selfLink: string;

  constructor(options: ViewModels.DocumentsTabOptions) {
    super(options);
    this.isPreferredApiMongoDB = !!this.collection
      ? this.collection.container.isPreferredApiMongoDB()
      : options.isPreferredApiMongoDB;

    this.idHeader = this.isPreferredApiMongoDB ? "_id" : "id";

    this.documentContentsGridId = `documentContentsGrid${this.tabId}`;
    this.documentContentsContainerId = `documentContentsContainer${this.tabId}`;
    this.editorState = ko.observable<ViewModels.DocumentExplorerState>(
      ViewModels.DocumentExplorerState.noDocumentSelected
    );
    this.selectedDocumentId = ko.observable<ViewModels.DocumentId>();
    this.selectedDocumentContent = editable.observable<string>("");
    this.initialDocumentContent = ko.observable<string>("");
    this.partitionKey = options.partitionKey || (this.collection && this.collection.partitionKey);
    this._resourceTokenPartitionKey = options.resourceTokenPartitionKey;
    this.documentIds = options.documentIds;
    this._selfLink = options.selfLink || (this.collection && this.collection.self);

    this.partitionKeyPropertyHeader =
      (this.collection && this.collection.partitionKeyPropertyHeader) || this._getPartitionKeyPropertyHeader();
    this.partitionKeyProperty = !!this.partitionKeyPropertyHeader
      ? this.partitionKeyPropertyHeader
          .replace(/[/]+/g, ".")
          .substr(1)
          .replace(/[']+/g, "")
      : null;

    this.isFilterExpanded = ko.observable<boolean>(false);
    this.isFilterCreated = ko.observable<boolean>(true);
    this.filterContent = ko.observable<string>("");
    this.appliedFilter = ko.observable<string>("");
    this.displayedError = ko.observable<string>("");
    this.lastFilterContents = ko.observableArray<string>([
      'WHERE c.id = "foo"',
      "ORDER BY c._ts DESC",
      'WHERE c.id = "foo" ORDER BY c._ts DESC'
    ]);

    this.dataContentsGridScrollHeight = ko.observable<string>(null);

    // initialize splitter only after template has been loaded so dom elements are accessible
    super.onTemplateReady((isTemplateReady: boolean) => {
      if (isTemplateReady) {
        const tabContainer: HTMLElement = document.getElementById("content");
        const splitterBounds: SplitterBounds = {
          min: Constants.DocumentsGridMetrics.DocumentEditorMinWidthRatio * tabContainer.clientWidth,
          max: Constants.DocumentsGridMetrics.DocumentEditorMaxWidthRatio * tabContainer.clientWidth
        };
        this.splitter = new Splitter({
          splitterId: "h_splitter2",
          leftId: this.documentContentsContainerId,
          bounds: splitterBounds,
          direction: SplitterDirection.Vertical
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
      })
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
      })
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
      })
    };

    this.saveExisitingDocumentButton = {
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
      })
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
      })
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
      })
    };

    this.applyFilterButton = {
      enabled: ko.computed<boolean>(() => {
        return true;
      }),

      visible: ko.computed<boolean>(() => {
        return true;
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

  public onApplyFilterClick(): Q.Promise<any> {
    // clear documents grid
    this.documentIds([]);
    return this.createIterator()
      .then(
        // reset iterator
        iterator => {
          this._documentsIterator = iterator;
        }
      )
      .then(
        // load documents
        () => {
          return this.loadNextPage();
        }
      )
      .then(() => {
        // collapse filter
        this.appliedFilter(this.filterContent());
        this.isFilterExpanded(false);
        const focusElement = document.getElementById("errorStatusIcon");
        focusElement && focusElement.focus();
      })
      .catch(reason => {
        const message = ErrorParserUtility.parse(reason)[0].message;
        window.alert(message);
      });
  }

  public refreshDocumentsGrid(): Q.Promise<any> {
    return this.onApplyFilterClick();
  }

  public onRefreshButtonKeyDown = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      this.refreshDocumentsGrid();
      event.stopPropagation();
      return false;
    }
    return true;
  };

  public onDocumentIdClick(clickedDocumentId: ViewModels.DocumentId): Q.Promise<any> {
    if (this.editorState() !== ViewModels.DocumentExplorerState.noDocumentSelected) {
      return Q();
    }

    this.editorState(ViewModels.DocumentExplorerState.exisitingDocumentNoEdits);

    return Q();
  }

  public onNewDocumentClick = (): Q.Promise<any> => {
    if (this.isEditorDirty() && !this._isIgnoreDirtyEditor()) {
      return Q();
    }
    this.selectedDocumentId(null);

    const defaultDocument: string = this.renderObjectForEditor({ id: "replace_with_new_document_id" }, null, 4);
    this.initialDocumentContent(defaultDocument);
    this.selectedDocumentContent.setBaseline(defaultDocument);
    this.editorState(ViewModels.DocumentExplorerState.newDocumentValid);

    return Q();
  };

  public onSaveNewDocumentClick = (): Q.Promise<any> => {
    this.isExecutionError(false);
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateDocument, {
      databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
      defaultExperience: this.collection && this.collection.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle()
    });
    const document = JSON.parse(this.selectedDocumentContent());
    this.isExecuting(true);
    return this.documentClientUtility
      .createDocument(this.collection, document)
      .then(
        (savedDocument: any) => {
          const value: string = this.renderObjectForEditor(savedDocument || {}, null, 4);
          this.selectedDocumentContent.setBaseline(value);
          this.initialDocumentContent(value);
          const partitionKeyValueArray = extractPartitionKey(
            savedDocument,
            this.partitionKey as PartitionKeyDefinition
          );
          const partitionKeyValue = partitionKeyValueArray && partitionKeyValueArray[0];
          let id = new DocumentId(this, savedDocument, partitionKeyValue);
          let ids = this.documentIds();
          ids.push(id);

          this.selectedDocumentId(id);
          this.documentIds(ids);
          this.editorState(ViewModels.DocumentExplorerState.exisitingDocumentNoEdits);
          TelemetryProcessor.traceSuccess(
            Action.CreateDocument,
            {
              databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
              defaultExperience: this.collection && this.collection.container.defaultExperience(),
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle()
            },
            startKey
          );
        },
        reason => {
          this.isExecutionError(true);
          const message = ErrorParserUtility.parse(reason)[0].message;
          window.alert(message);
          TelemetryProcessor.traceFailure(
            Action.CreateDocument,
            {
              databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
              defaultExperience: this.collection && this.collection.container.defaultExperience(),
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle()
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

  public onSaveExisitingDocumentClick = (): Q.Promise<any> => {
    const selectedDocumentId = this.selectedDocumentId();
    const documentContent = JSON.parse(this.selectedDocumentContent());

    const partitionKeyValueArray = extractPartitionKey(documentContent, this.partitionKey as PartitionKeyDefinition);
    const partitionKeyValue = partitionKeyValueArray && partitionKeyValueArray[0];

    selectedDocumentId.partitionKeyValue = partitionKeyValue;

    this.isExecutionError(false);
    const startKey: number = TelemetryProcessor.traceStart(Action.UpdateDocument, {
      databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
      defaultExperience: this.collection && this.collection.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle()
    });
    this.isExecuting(true);
    return this.documentClientUtility
      .updateDocument(this.collection, selectedDocumentId, documentContent)
      .then(
        (updatedDocument: any) => {
          const value: string = this.renderObjectForEditor(updatedDocument || {}, null, 4);
          this.selectedDocumentContent.setBaseline(value);
          this.initialDocumentContent(value);
          this.documentIds().forEach((documentId: ViewModels.DocumentId) => {
            if (documentId.rid === updatedDocument._rid) {
              documentId.id(updatedDocument.id);
            }
          });
          this.editorState(ViewModels.DocumentExplorerState.exisitingDocumentNoEdits);
          TelemetryProcessor.traceSuccess(
            Action.UpdateDocument,
            {
              databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
              defaultExperience: this.collection && this.collection.container.defaultExperience(),
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle()
            },
            startKey
          );
        },
        reason => {
          this.isExecutionError(true);
          const message = ErrorParserUtility.parse(reason)[0].message;
          window.alert(message);
          TelemetryProcessor.traceFailure(
            Action.UpdateDocument,
            {
              databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
              defaultExperience: this.collection && this.collection.container.defaultExperience(),
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle()
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

  public onDeleteExisitingDocumentClick = (): Q.Promise<any> => {
    const selectedDocumentId = this.selectedDocumentId();
    const msg = !this.isPreferredApiMongoDB
      ? "Are you sure you want to delete the selected item ?"
      : "Are you sure you want to delete the selected document ?";

    if (window.confirm(msg)) {
      return this._deleteDocument(selectedDocumentId);
    }

    return Q();
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

  public onTabClick(): Q.Promise<any> {
    return super.onTabClick().then(() => {
      this.collection && this.collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Documents);
    });
  }

  public onActivate(): Q.Promise<any> {
    return super.onActivate().then(() => {
      if (this._documentsIterator) {
        return Q.resolve(this._documentsIterator);
      }

      return this.createIterator().then(
        (iterator: QueryIterator<ItemDefinition & Resource>) => {
          this._documentsIterator = iterator;
          return this.loadNextPage();
        },
        error => {
          if (this.onLoadStartKey != null && this.onLoadStartKey != undefined) {
            TelemetryProcessor.traceFailure(
              Action.Tab,
              {
                databaseAccountName: this.collection.container.databaseAccount().name,
                databaseName: this.collection.databaseId,
                collectionName: this.collection.id(),
                defaultExperience: this.collection.container.defaultExperience(),
                dataExplorerArea: Constants.Areas.Tab,
                tabTitle: this.tabTitle(),
                error: error
              },
              this.onLoadStartKey
            );
            this.onLoadStartKey = null;
          }
        }
      );
    });
  }

  public onRefreshClick(): Q.Promise<any> {
    return this.refreshDocumentsGrid().then(() => {
      this.selectedDocumentContent("");
      this.selectedDocumentId(null);
      this.editorState(ViewModels.DocumentExplorerState.noDocumentSelected);
    });
  }
  private _isIgnoreDirtyEditor = (): boolean => {
    var msg: string = "Changes will be lost. Do you want to continue?";
    return window.confirm(msg);
  };

  protected __deleteDocument(documentId: ViewModels.DocumentId): Q.Promise<any> {
    return this.documentClientUtility.deleteDocument(this.collection, documentId);
  }

  private _deleteDocument(selectedDocumentId: ViewModels.DocumentId): Q.Promise<any> {
    this.isExecutionError(false);
    const startKey: number = TelemetryProcessor.traceStart(Action.DeleteDocument, {
      databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
      defaultExperience: this.collection && this.collection.container.defaultExperience(),
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle()
    });
    this.isExecuting(true);
    return this.__deleteDocument(selectedDocumentId)
      .then(
        (result: any) => {
          this.documentIds.remove((documentId: ViewModels.DocumentId) => documentId.rid === selectedDocumentId.rid);
          this.selectedDocumentContent("");
          this.selectedDocumentId(null);
          this.editorState(ViewModels.DocumentExplorerState.noDocumentSelected);
          TelemetryProcessor.traceSuccess(
            Action.DeleteDocument,
            {
              databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
              defaultExperience: this.collection && this.collection.container.defaultExperience(),
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle()
            },
            startKey
          );
        },
        reason => {
          this.isExecutionError(true);
          console.error(reason);
          TelemetryProcessor.traceFailure(
            Action.DeleteDocument,
            {
              databaseAccountName: this.collection && this.collection.container.databaseAccount().name,
              defaultExperience: this.collection && this.collection.container.defaultExperience(),
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: this.tabTitle()
            },
            startKey
          );
        }
      )
      .finally(() => this.isExecuting(false));
  }

  public createIterator(): Q.Promise<QueryIterator<ItemDefinition & Resource>> {
    let filters = this.lastFilterContents();
    const filter: string = this.filterContent().trim();
    const query: string = this.buildQuery(filter);
    let options: any = {};
    options.enableCrossPartitionQuery = HeadersUtility.shouldEnableCrossPartitionKey();

    if (this._resourceTokenPartitionKey) {
      options.partitionKey = this._resourceTokenPartitionKey;
    }

    return this.documentClientUtility.queryDocuments(this.collection.databaseId, this.collection.id(), query, options);
  }

  public selectDocument(documentId: ViewModels.DocumentId): Q.Promise<any> {
    this.selectedDocumentId(documentId);
    return this.documentClientUtility.readDocument(this.collection, documentId).then((content: any) => {
      this.initDocumentEditor(documentId, content);
    });
  }

  public loadNextPage(): Q.Promise<any> {
    this.isExecuting(true);
    this.isExecutionError(false);
    return this._loadNextPageInternal()
      .then(
        (documentsIdsResponse = []) => {
          const currentDocuments = this.documentIds();
          const currentDocumentsRids = currentDocuments.map(currentDocument => currentDocument.rid);
          const nextDocumentIds = documentsIdsResponse
            // filter documents already loaded in observable
            .filter((d: any) => {
              return currentDocumentsRids.indexOf(d._rid) < 0;
            })
            // map raw response to view model
            .map((rawDocument: any) => {
              const partitionKeyValue = rawDocument._partitionKeyValue;
              return <ViewModels.DocumentId>new DocumentId(this, rawDocument, partitionKeyValue);
            });

          const merged = currentDocuments.concat(nextDocumentIds);
          this.documentIds(merged);
          if (this.onLoadStartKey != null && this.onLoadStartKey != undefined) {
            TelemetryProcessor.traceSuccess(
              Action.Tab,
              {
                databaseAccountName: this.collection.container.databaseAccount().name,
                databaseName: this.collection.databaseId,
                collectionName: this.collection.id(),
                defaultExperience: this.collection.container.defaultExperience(),
                dataExplorerArea: Constants.Areas.Tab,
                tabTitle: this.tabTitle()
              },
              this.onLoadStartKey
            );
            this.onLoadStartKey = null;
          }
        },
        error => {
          this.isExecutionError(true);
          NotificationConsoleUtils.logConsoleMessage(
            ConsoleDataType.Error,
            typeof error === "string" ? error : JSON.stringify(error)
          );
          if (this.onLoadStartKey != null && this.onLoadStartKey != undefined) {
            TelemetryProcessor.traceFailure(
              Action.Tab,
              {
                databaseAccountName: this.collection.container.databaseAccount().name,
                databaseName: this.collection.databaseId,
                collectionName: this.collection.id(),
                defaultExperience: this.collection.container.defaultExperience(),
                dataExplorerArea: Constants.Areas.Tab,
                tabTitle: this.tabTitle(),
                error: error
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

  protected _loadNextPageInternal(): Q.Promise<DataModels.DocumentId[]> {
    return Q(this._documentsIterator.fetchNext().then(response => response.resources));
  }

  protected _onEditorContentChange(newContent: string) {
    try {
      let parsed: any = JSON.parse(newContent);
      this.onValidDocumentEdit();
    } catch (e) {
      this.onInvalidDocumentEdit();
    }
  }

  public initDocumentEditor(documentId: ViewModels.DocumentId, documentContent: any): Q.Promise<any> {
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
    return QueryUtils.buildDocumentsQuery(filter, this.partitionKeyProperty, this.partitionKey);
  }

  protected getTabsButtons(): ViewModels.NavbarButtonConfig[] {
    const buttons: ViewModels.NavbarButtonConfig[] = [];
    const label = !this.isPreferredApiMongoDB ? "New Item" : "New Document";
    if (this.newDocumentButton.visible()) {
      buttons.push({
        iconSrc: NewDocumentIcon,
        iconAlt: label,
        onCommandClick: this.onNewDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.newDocumentButton.enabled()
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
        disabled: !this.saveNewDocumentButton.enabled()
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
        disabled: !this.discardNewDocumentChangesButton.enabled()
      });
    }

    if (this.saveExisitingDocumentButton.visible()) {
      const label = "Update";
      buttons.push({
        iconSrc: SaveIcon,
        iconAlt: label,
        onCommandClick: this.onSaveExisitingDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.saveExisitingDocumentButton.enabled()
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
        disabled: !this.discardExisitingDocumentChangesButton.enabled()
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
        disabled: !this.deleteExisitingDocumentButton.enabled()
      });
    }

    if (!this.isPreferredApiMongoDB) {
      buttons.push(DocumentsTab._createUploadButton(this.collection.container));
    }

    const features = this.collection.container.features() || {};

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
        this.saveExisitingDocumentButton.visible,
        this.saveExisitingDocumentButton.enabled,
        this.discardExisitingDocumentChangesButton.visible,
        this.discardExisitingDocumentChangesButton.enabled,
        this.deleteExisitingDocumentButton.visible,
        this.deleteExisitingDocumentButton.enabled
      ])
    ).subscribe(() => this.updateNavbarWithTabsButtons());
    this.updateNavbarWithTabsButtons();
  }

  private _getPartitionKeyPropertyHeader(): string {
    return (
      (this.partitionKey &&
        this.partitionKey.paths &&
        this.partitionKey.paths.length > 0 &&
        this.partitionKey.paths[0]) ||
      null
    );
  }

  public static _createUploadButton(container: ViewModels.Explorer): ViewModels.NavbarButtonConfig {
    const label = "Upload Item";
    return {
      iconSrc: UploadIcon,
      iconAlt: label,
      onCommandClick: () => {
        const selectedCollection: ViewModels.Collection = container.findSelectedCollection();
        const focusElement = document.getElementById("itemImportLink");
        selectedCollection && container.uploadItemsPane.open();
        focusElement && focusElement.focus();
      },
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled: container.isDatabaseNodeOrNoneSelected()
    };
  }
}
