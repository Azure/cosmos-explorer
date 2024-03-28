import {
  FeedOptions,
  Item,
  ItemDefinition,
  PartitionKey,
  PartitionKeyDefinition,
  QueryIterator,
  Resource,
} from "@azure/cosmos";
import { FluentProvider, TableRowId } from "@fluentui/react-components";
import Split from "@uiw/react-split";
import { KeyCodes, QueryCopilotSampleContainerId, QueryCopilotSampleDatabaseId } from "Common/Constants";
import { getErrorMessage, getErrorStack } from "Common/ErrorHandlingUtils";
import { createDocument } from "Common/dataAccess/createDocument";
import { deleteDocument } from "Common/dataAccess/deleteDocument";
import { queryDocuments } from "Common/dataAccess/queryDocuments";
import { readDocument } from "Common/dataAccess/readDocument";
import { updateDocument } from "Common/dataAccess/updateDocument";
import { Platform, configContext } from "ConfigContext";
import { CommandButtonComponentProps } from "Explorer/Controls/CommandButton/CommandButtonComponent";
import { useDialog } from "Explorer/Controls/Dialog";
import { EditorReact } from "Explorer/Controls/Editor/EditorReact";
import { useCommandBar } from "Explorer/Menus/CommandBar/CommandBarComponentAdapter";
import { querySampleDocuments, readSampleDocument } from "Explorer/QueryCopilot/QueryCopilotUtilities";
import DocumentsTab from "Explorer/Tabs/DocumentsTab";
import { dataExplorerLightTheme } from "Explorer/Theme/ThemeUtil";
import { useSelectedNode } from "Explorer/useSelectedNode";
import { QueryConstants } from "Shared/Constants";
import { LocalStorageUtility, StorageKey } from "Shared/StorageUtility";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import { userContext } from "UserContext";
import { logConsoleError } from "Utils/NotificationConsoleUtils";
import React, { KeyboardEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "react-string-format";
import DeleteDocumentIcon from "../../../../images/DeleteDocument.svg";
import NewDocumentIcon from "../../../../images/NewDocument.svg";
import CloseIcon from "../../../../images/close-black.svg";
import DiscardIcon from "../../../../images/discard.svg";
import SaveIcon from "../../../../images/save-cosmos.svg";
import * as Constants from "../../../Common/Constants";
import * as HeadersUtility from "../../../Common/HeadersUtility";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import * as QueryUtils from "../../../Utils/QueryUtils";
import { extractPartitionKeyValues } from "../../../Utils/QueryUtils";
import DocumentId from "../../Tree/DocumentId";
import TabsBase from "../TabsBase";
import { DocumentsTableComponent, DocumentsTableComponentItem } from "./DocumentsTableComponent";

export class DocumentsTabV2 extends TabsBase {
  public partitionKey: DataModels.PartitionKey;

  private documentIds: DocumentId[];
  private title: string;

  constructor(options: ViewModels.DocumentsTabOptions) {
    super(options);

    this.documentIds = options.documentIds();
    this.title = options.title;
  }

  public render(): JSX.Element {
    if (!this.isActive) {
      return <></>;
    }

    return (
      <DocumentsTabComponent
        isPreferredApiMongoDB={undefined}
        documentIds={this.documentIds}
        tabId={this.tabId}
        collection={this.collection}
        partitionKey={this.partitionKey}
        onLoadStartKey={this.onLoadStartKey}
        tabTitle={this.title}
      />
    );
  }

  public onActivate(): void {
    super.onActivate();
    this.collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Documents);
  }
}

// From TabsBase.renderObjectForEditor()
const renderObjectForEditor = (
  value: unknown,
  replacer: (this: unknown, key: string, value: unknown) => unknown,
  space: string | number,
): string => JSON.stringify(value, replacer, space);

const DocumentsTabComponent: React.FunctionComponent<{
  isPreferredApiMongoDB: boolean;
  documentIds: DocumentId[]; // TODO: this contains ko observables. We need to convert them to React state.
  tabId: string;
  collection: ViewModels.CollectionBase;
  partitionKey: DataModels.PartitionKey;
  onLoadStartKey: number;
  tabTitle: string;
}> = (props) => {
  const [isFilterCreated, setIsFilterCreated] = useState<boolean>(true);
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);
  const [appliedFilter, setAppliedFilter] = useState<string>("");
  const [filterContent, setFilterContent] = useState<string>("");
  const [lastFilterContents, setLastFilterContents] = useState<string[]>([
    'WHERE c.id = "foo"',
    "ORDER BY c._ts DESC",
    'WHERE c.id = "foo" ORDER BY c._ts DESC',
  ]);
  const [documentIds, setDocumentIds] = useState<DocumentId[]>([]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false); // TODO isExecuting is a member of TabsBase. We may need to update this field.
  const [dataContentsGridScrollHeight, setDataContentsGridScrollHeight] = useState<string>(undefined);

  // Query
  const [documentsIterator, setDocumentsIterator] = useState<{
    iterator: QueryIterator<ItemDefinition & Resource>;
    applyFilterButtonPressed: boolean;
  }>(undefined);
  const [queryAbortController, setQueryAbortController] = useState<AbortController>(undefined);
  const [resourceTokenPartitionKey, setResourceTokenPartitionKey] = useState<string>(undefined);
  const [isQueryCopilotSampleContainer, setIsQueryCopilotSampleContainer] = useState<boolean>(false);
  const [cancelQueryTimeoutID, setCancelQueryTimeoutID] = useState<NodeJS.Timeout>(undefined);

  const [isExecutionError, setIsExecutionError] = useState<boolean>(false);
  const [onLoadStartKey, setOnLoadStartKey] = useState<number>(props.onLoadStartKey);

  const [initialDocumentContent, setInitialDocumentContent] = useState<string>(undefined);
  const [selectedDocumentContent, setSelectedDocumentContent] = useState<string>(undefined);
  const [selectedDocumentContentBaseline, setSelectedDocumentContentBaseline] = useState<string>(undefined);

  // Table user clicked on this row
  const [clickedRow, setClickedRow] = useState<TableRowId>(undefined);
  // Table multiple selection
  const [selectedRows, setSelectedRows] = React.useState<Set<TableRowId>>(() => new Set<TableRowId>([0]));

  // Command buttons
  const [editorState, setEditorState] = useState<ViewModels.DocumentExplorerState>(
    ViewModels.DocumentExplorerState.noDocumentSelected,
  );

  const getNewDocumentButtonState = () => ({
    enabled: (() => {
      switch (editorState) {
        case ViewModels.DocumentExplorerState.noDocumentSelected:
        case ViewModels.DocumentExplorerState.exisitingDocumentNoEdits:
          return true;
        default:
          return false;
      }
    })(),
    visible: true,
  });

  const getSaveNewDocumentButtonState = () => ({
    enabled: (() => {
      switch (editorState) {
        case ViewModels.DocumentExplorerState.newDocumentValid:
          return true;
        default:
          return false;
      }
    })(),

    visible: (() => {
      switch (editorState) {
        case ViewModels.DocumentExplorerState.newDocumentValid:
        case ViewModels.DocumentExplorerState.newDocumentInvalid:
          return true;
        default:
          return false;
      }
    })(),
  });

  const getDiscardNewDocumentChangesButtonState = () => ({
    enabled: (() => {
      switch (editorState) {
        case ViewModels.DocumentExplorerState.newDocumentValid:
        case ViewModels.DocumentExplorerState.newDocumentInvalid:
          return true;
        default:
          return false;
      }
    })(),

    visible: (() => {
      switch (editorState) {
        case ViewModels.DocumentExplorerState.newDocumentValid:
        case ViewModels.DocumentExplorerState.newDocumentInvalid:
          return true;
        default:
          return false;
      }
    })(),
  });

  const getSaveExistingDocumentButtonState = () => ({
    enabled: (() => {
      switch (editorState) {
        case ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid:
          return true;
        default:
          return false;
      }
    })(),

    visible: (() => {
      switch (editorState) {
        case ViewModels.DocumentExplorerState.exisitingDocumentNoEdits:
        case ViewModels.DocumentExplorerState.exisitingDocumentDirtyInvalid:
        case ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid:
          return true;
        default:
          return false;
      }
    })(),
  });

  const getDiscardExisitingDocumentChangesButtonState = () => ({
    enabled: (() => {
      switch (editorState) {
        case ViewModels.DocumentExplorerState.exisitingDocumentDirtyInvalid:
        case ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid:
          return true;
        default:
          return false;
      }
    })(),

    visible: (() => {
      switch (editorState) {
        case ViewModels.DocumentExplorerState.exisitingDocumentNoEdits:
        case ViewModels.DocumentExplorerState.exisitingDocumentDirtyInvalid:
        case ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid:
          return true;
        default:
          return false;
      }
    })(),
  });

  const getDeleteExisitingDocumentButtonState = () => ({
    enabled: (() => {
      switch (editorState) {
        case ViewModels.DocumentExplorerState.exisitingDocumentNoEdits:
        case ViewModels.DocumentExplorerState.exisitingDocumentDirtyInvalid:
        case ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid:
          return true;
        default:
          return false;
      }
    })(),

    visible: (() => {
      switch (editorState) {
        case ViewModels.DocumentExplorerState.exisitingDocumentNoEdits:
        case ViewModels.DocumentExplorerState.exisitingDocumentDirtyInvalid:
        case ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid:
          return selectedRows.size > 0;
        default:
          return false;
      }
    })(),
  });

  const applyFilterButton = {
    enabled: true,
    visible: true,
  };

  const documentContentsContainerId = `documentContentsContainer${props.tabId}`;
  const documentContentsGridId = `documentContentsGrid${props.tabId}`;

  const partitionKey: DataModels.PartitionKey =
    props.partitionKey || (props.collection && props.collection.partitionKey);
  const partitionKeyPropertyHeaders: string[] = props.collection?.partitionKeyPropertyHeaders || partitionKey?.paths;
  const partitionKeyProperties = partitionKeyPropertyHeaders?.map((partitionKeyPropertyHeader) =>
    partitionKeyPropertyHeader.replace(/[/]+/g, ".").substring(1).replace(/[']+/g, ""),
  );

  const isPreferredApiMongoDB = useMemo(
    () => userContext.apiType === "Mongo" || props.isPreferredApiMongoDB,
    [props.isPreferredApiMongoDB],
  );

  const updateNavbarWithTabsButtons = (): void => {
    // if (this.isActive()) {
    useCommandBar.getState().setContextButtons(getTabsButtons());
    // }
  };

  useEffect(() => {
    setDocumentIds(props.documentIds);
  }, [props.documentIds]);

  // TODO: this is executed in onActivate() in the original code.
  useEffect(() => {
    if (!documentsIterator) {
      try {
        refreshDocumentsGrid();

        // // Select first document and load content
        // if (documentIds.length > 0) {
        //   documentIds[0].click();
        // }
      } catch (error) {
        if (onLoadStartKey !== null && onLoadStartKey !== undefined) {
          TelemetryProcessor.traceFailure(
            Action.Tab,
            {
              databaseName: props.collection.databaseId,
              collectionName: props.collection.id(),

              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: props.tabTitle,
              error: getErrorMessage(error),
              errorStack: getErrorStack(error),
            },
            onLoadStartKey,
          );
          setOnLoadStartKey(null);
        }
      }
    }

    updateNavbarWithTabsButtons();
  }, []);

  // If editor state changes, update the nav
  // TODO Put whatever the buttons callback use in the dependency array: find a better way to maintain
  useEffect(
    () => updateNavbarWithTabsButtons(),
    [
      editorState,
      selectedDocumentContent,
      selectedDocumentContentBaseline,
      initialDocumentContent,
      selectedRows,
      documentIds,
      clickedRow,
    ],
  );

  useEffect(() => {
    if (documentsIterator) {
      loadNextPage(documentsIterator.applyFilterButtonPressed);
    }
  }, [documentsIterator]);

  const onNewDocumentClick = useCallback((): void => {
    if (isEditorDirty()) {
      useDialog
        .getState()
        .showOkCancelModalDialog(
          "Unsaved changes",
          "Changes will be lost. Do you want to continue?",
          "OK",
          () => initializeNewDocument(),
          "Cancel",
          undefined,
        );
    } else {
      initializeNewDocument();
    }
  }, [editorState /* TODO isEditorDirty depends on more than just editorState */]);

  const initializeNewDocument = (): void => {
    // this.selectedDocumentId(null);
    const defaultDocument: string = renderObjectForEditor({ id: "replace_with_new_document_id" }, null, 4);
    setInitialDocumentContent(defaultDocument);
    setSelectedDocumentContent(defaultDocument);
    setSelectedDocumentContentBaseline(defaultDocument);
    setSelectedRows(new Set());
    setClickedRow(undefined);
    setEditorState(ViewModels.DocumentExplorerState.newDocumentValid);
  };

  const onSaveNewDocumentClick = (): Promise<unknown> => {
    setIsExecutionError(false);
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateDocument, {
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: props.tabTitle,
    });
    const sanitizedContent = selectedDocumentContent.replace("\n", "");
    const document = JSON.parse(sanitizedContent);
    setIsExecuting(true);
    return createDocument(props.collection, document)
      .then(
        (savedDocument: unknown) => {
          const value: string = renderObjectForEditor(savedDocument || {}, null, 4);
          setSelectedDocumentContentBaseline(value);
          setInitialDocumentContent(value);
          const partitionKeyValueArray: PartitionKey[] = extractPartitionKeyValues(
            savedDocument,
            partitionKey as PartitionKeyDefinition,
          );
          const id = new DocumentId(this, savedDocument, partitionKeyValueArray);
          const ids = documentIds;
          ids.push(id);

          // this.selectedDocumentId(id);
          setDocumentIds(ids);
          setEditorState(ViewModels.DocumentExplorerState.exisitingDocumentNoEdits);
          TelemetryProcessor.traceSuccess(
            Action.CreateDocument,
            {
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: props.tabTitle,
            },
            startKey,
          );
        },
        (error) => {
          setIsExecutionError(true);
          const errorMessage = getErrorMessage(error);
          useDialog.getState().showOkModalDialog("Create document failed", errorMessage);
          TelemetryProcessor.traceFailure(
            Action.CreateDocument,
            {
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: props.tabTitle,
              error: errorMessage,
              errorStack: getErrorStack(error),
            },
            startKey,
          );
        },
      )
      .finally(() => setIsExecuting(false));
  };

  const onRevertNewDocumentClick = (): void => {
    setInitialDocumentContent("");
    setSelectedDocumentContent("");
    setEditorState(ViewModels.DocumentExplorerState.noDocumentSelected);
  };

  const onSaveExistingDocumentClick = (): Promise<void> => {
    // const selectedDocumentId = this.selectedDocumentId();

    const documentContent = JSON.parse(selectedDocumentContent);

    const partitionKeyValueArray: PartitionKey[] = extractPartitionKeyValues(
      documentContent,
      partitionKey as PartitionKeyDefinition,
    );

    const selectedDocumentId = documentIds[clickedRow as number];
    selectedDocumentId.partitionKeyValue = partitionKeyValueArray;

    setIsExecutionError(false);
    const startKey: number = TelemetryProcessor.traceStart(Action.UpdateDocument, {
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: props.tabTitle,
    });
    setIsExecuting(true);
    return updateDocument(props.collection, selectedDocumentId, documentContent)
      .then(
        (updatedDocument: Item & { _rid: string }) => {
          const value: string = renderObjectForEditor(updatedDocument || {}, null, 4);
          setSelectedDocumentContentBaseline(value);
          setInitialDocumentContent(value);
          setSelectedDocumentContent(value);
          documentIds.forEach((documentId: DocumentId) => {
            if (documentId.rid === updatedDocument._rid) {
              documentId.id(updatedDocument.id);
            }
          });
          setEditorState(ViewModels.DocumentExplorerState.exisitingDocumentNoEdits);
          TelemetryProcessor.traceSuccess(
            Action.UpdateDocument,
            {
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: props.tabTitle,
            },
            startKey,
          );
        },
        (error) => {
          setIsExecutionError(true);
          const errorMessage = getErrorMessage(error);
          useDialog.getState().showOkModalDialog("Update document failed", errorMessage);
          TelemetryProcessor.traceFailure(
            Action.UpdateDocument,
            {
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle: props.tabTitle,
              error: errorMessage,
              errorStack: getErrorStack(error),
            },
            startKey,
          );
        },
      )
      .finally(() => setIsExecuting(false));
  };

  const onRevertExisitingDocumentClick = (): void => {
    setSelectedDocumentContentBaseline(initialDocumentContent);
    // this.initialDocumentContent.valueHasMutated();
    setSelectedDocumentContent(selectedDocumentContentBaseline);
    // setEditorState(ViewModels.DocumentExplorerState.exisitingDocumentNoEdits);
  };

  const onDeleteExisitingDocumentsClick = async (): Promise<void> => {
    // const selectedDocumentId = this.selectedDocumentId();

    // TODO: Rework this for localization
    const isPlural = selectedRows.size > 1;
    const documentName = !isPreferredApiMongoDB
      ? isPlural
        ? `the selected ${selectedRows.size} items`
        : "the selected item"
      : isPlural
        ? `the selected ${selectedRows.size} documents`
        : "the selected document";
    const msg = `Are you sure you want to delete ${documentName}?`;

    useDialog.getState().showOkCancelModalDialog(
      "Confirm delete",
      msg,
      "Delete",
      // async () => await _deleteDocuments(selectedDocumentId),
      () => deleteDocuments(Array.from(selectedRows).map((index) => documentIds[index as number])),
      "Cancel",
      undefined,
    );
  };

  const deleteDocuments = (toDeleteDocumentIds: DocumentId[]): void => {
    setIsExecutionError(false);
    setIsExecuting(true);
    const promises = toDeleteDocumentIds.map((documentId) => _deleteDocuments(documentId));
    Promise.all(promises)
      .then((deletedDocumentIds: DocumentId[]) => {
        const newDocumentIds = [...documentIds];
        deletedDocumentIds.forEach((deletedDocumentId) => {
          if (deletedDocumentId !== undefined) {
            // documentIds.remove((documentId: DocumentId) => documentId.rid === selectedDocumentId.rid);
            const index = toDeleteDocumentIds.findIndex((documentId) => documentId.rid === deletedDocumentId.rid);
            if (index !== -1) {
              newDocumentIds.splice(index, 1);
            }
          }
        });
        setDocumentIds(newDocumentIds);

        setSelectedDocumentContent(undefined);
        setClickedRow(undefined);
        setSelectedRows(new Set());
        setEditorState(ViewModels.DocumentExplorerState.noDocumentSelected);
      })
      .finally(() => setIsExecuting(false));
  };

  const _deleteDocuments = (documentId: DocumentId): Promise<DocumentId> => {
    // setIsExecutionError(false);
    const startKey: number = TelemetryProcessor.traceStart(Action.DeleteDocument, {
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: props.tabTitle,
    });
    // setIsExecuting(true);
    return deleteDocument(props.collection, documentId).then(
      () => {
        TelemetryProcessor.traceSuccess(
          Action.DeleteDocument,
          {
            dataExplorerArea: Constants.Areas.Tab,
            tabTitle: props.tabTitle,
          },
          startKey,
        );
        return documentId;
      },
      (error) => {
        setIsExecutionError(true);
        console.error(error);
        TelemetryProcessor.traceFailure(
          Action.DeleteDocument,
          {
            dataExplorerArea: Constants.Areas.Tab,
            tabTitle: props.tabTitle,
            error: getErrorMessage(error),
            errorStack: getErrorStack(error),
          },
          startKey,
        );
        return undefined;
      },
    );
    // .finally(() => setIsExecuting(false));
  };

  const onShowFilterClick = () => {
    setIsFilterCreated(true);
    setIsFilterExpanded(true);

    // TODO convert this
    $(".filterDocExpanded").addClass("active");
    $("#content").addClass("active");
    $(".querydropdown").focus();
  };

  const queryTimeoutEnabled = (): boolean =>
    !isPreferredApiMongoDB && LocalStorageUtility.getEntryBoolean(StorageKey.QueryTimeoutEnabled);

  const buildQuery = (filter: string): string => {
    return QueryUtils.buildDocumentsQuery(filter, partitionKeyProperties, partitionKey);
  };

  const createIterator = (): QueryIterator<ItemDefinition & Resource> => {
    const _queryAbortController = new AbortController();
    setQueryAbortController(_queryAbortController);
    const filter: string = filterContent.trim();
    const query: string = buildQuery(filter);
    const options: FeedOptions = {};
    options.enableCrossPartitionQuery = HeadersUtility.shouldEnableCrossPartitionKey();

    if (resourceTokenPartitionKey) {
      options.partitionKey = resourceTokenPartitionKey;
    }
    options.abortSignal = _queryAbortController.signal;
    return isQueryCopilotSampleContainer
      ? querySampleDocuments(query, options)
      : queryDocuments(props.collection.databaseId, props.collection.id(), query, options);
  };

  /**
   * Query first page of documents
   * Select and query first document and display content
   */
  // const autoPopulateContent = async (applyFilterButtonPressed?: boolean) => {
  //   // reset iterator
  //   setDocumentsIterator({
  //     iterator: createIterator(),
  //     applyFilterButtonPressed,
  //   });
  //   // load documents
  //   await loadNextPage(applyFilterButtonPressed);

  //   // // Select first document and load content
  //   // if (documentIds.length > 0) {
  //   //   documentIds[0].click();
  //   // }
  // };

  const refreshDocumentsGrid = async (applyFilterButtonPressed?: boolean): Promise<void> => {
    // clear documents grid
    setDocumentIds([]);
    try {
      // reset iterator
      // setDocumentsIterator(createIterator());
      // load documents
      // await autoPopulateContent(applyFilterButtonPressed);
      setDocumentsIterator({
        iterator: createIterator(),
        applyFilterButtonPressed,
      });

      // collapse filter
      setAppliedFilter(filterContent);
      setIsFilterExpanded(false);
      document.getElementById("errorStatusIcon")?.focus();
    } catch (error) {
      useDialog.getState().showOkModalDialog("Refresh documents grid failed", getErrorMessage(error));
    }
  };

  const onHideFilterClick = (): void => {
    setIsFilterExpanded(false);

    // this.isFilterExpanded(false);

    // $(".filterDocExpanded").removeClass("active");
    // $("#content").removeClass("active");
    // $(".queryButton").focus();
  };

  const onCloseButtonKeyDown: KeyboardEventHandler<HTMLSpanElement> = (event) => {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      onHideFilterClick();
      event.stopPropagation();
      return false;
    }
    return true;
  };

  // const accessibleDocumentList = new AccessibleVerticalList(documentIds);
  // accessibleDocumentList.setOnSelect(
  //   (selectedDocument: DocumentId) => selectedDocument && selectedDocument.click(),
  // );
  // this.selectedDocumentId.subscribe((newSelectedDocumentId: DocumentId) =>
  //   accessibleDocumentList.updateCurrentItem(newSelectedDocumentId),
  // );
  // this.documentIds.subscribe((newDocuments: DocumentId[]) => {
  //   accessibleDocumentList.updateItemList(newDocuments);
  //   if (newDocuments.length > 0) {
  //     this.dataContentsGridScrollHeight(
  //       newDocuments.length * DocumentsGridMetrics.IndividualRowHeight + DocumentsGridMetrics.BufferHeight + "px",
  //     );
  //   } else {
  //     this.dataContentsGridScrollHeight(
  //       DocumentsGridMetrics.IndividualRowHeight + DocumentsGridMetrics.BufferHeight + "px",
  //     );
  //   }
  // });

  const loadNextPage = (applyFilterButtonClicked?: boolean): Promise<unknown> => {
    setIsExecuting(true);
    setIsExecutionError(false);
    let automaticallyCancelQueryAfterTimeout: boolean;
    if (applyFilterButtonClicked && queryTimeoutEnabled()) {
      const queryTimeout: number = LocalStorageUtility.getEntryNumber(StorageKey.QueryTimeout);
      automaticallyCancelQueryAfterTimeout = LocalStorageUtility.getEntryBoolean(
        StorageKey.AutomaticallyCancelQueryAfterTimeout,
      );
      const cancelQueryTimeoutID: NodeJS.Timeout = setTimeout(() => {
        if (isExecuting) {
          if (automaticallyCancelQueryAfterTimeout) {
            queryAbortController.abort();
          } else {
            useDialog
              .getState()
              .showOkCancelModalDialog(
                QueryConstants.CancelQueryTitle,
                format(QueryConstants.CancelQuerySubTextTemplate, QueryConstants.CancelQueryTimeoutThresholdReached),
                "Yes",
                () => queryAbortController.abort(),
                "No",
                undefined,
              );
          }
        }
      }, queryTimeout);
      setCancelQueryTimeoutID(cancelQueryTimeoutID);
    }
    return _loadNextPageInternal()
      .then(
        (documentsIdsResponse = []) => {
          const currentDocuments = documentIds;
          const currentDocumentsRids = currentDocuments.map((currentDocument) => currentDocument.rid);
          const nextDocumentIds = documentsIdsResponse
            // filter documents already loaded in observable
            .filter((d: DataModels.DocumentId) => {
              return currentDocumentsRids.indexOf(d._rid) < 0;
            })
            // map raw response to view model
            .map((rawDocument: DataModels.DocumentId & { _partitionKeyValue: string[] }) => {
              const partitionKeyValue = rawDocument._partitionKeyValue;

              // TODO: Mock documentsTab. Fix this
              const partitionKey = props.partitionKey || (props.collection && props.collection.partitionKey);
              const partitionKeyPropertyHeaders = props.collection?.partitionKeyPropertyHeaders || partitionKey?.paths;
              const partitionKeyProperties = partitionKeyPropertyHeaders?.map((partitionKeyPropertyHeader) =>
                partitionKeyPropertyHeader.replace(/[/]+/g, ".").substring(1).replace(/[']+/g, ""),
              );

              return new DocumentId(
                {
                  partitionKey,
                  partitionKeyPropertyHeaders,
                  partitionKeyProperties,
                } as DocumentsTab,
                rawDocument,
                partitionKeyValue,
              );
            });

          const merged = currentDocuments.concat(nextDocumentIds);
          setDocumentIds(merged);
          if (onLoadStartKey !== null && onLoadStartKey !== undefined) {
            TelemetryProcessor.traceSuccess(
              Action.Tab,
              {
                databaseName: props.collection.databaseId,
                collectionName: props.collection.id(),

                dataExplorerArea: Constants.Areas.Tab,
                tabTitle: props.tabTitle, //tabTitle(),
              },
              onLoadStartKey,
            );
            setOnLoadStartKey(null);
          }
        },
        (error) => {
          setIsExecutionError(true);
          const errorMessage = getErrorMessage(error);
          logConsoleError(errorMessage);
          if (onLoadStartKey !== null && onLoadStartKey !== undefined) {
            TelemetryProcessor.traceFailure(
              Action.Tab,
              {
                databaseName: props.collection.databaseId,
                collectionName: props.collection.id(),

                dataExplorerArea: Constants.Areas.Tab,
                tabTitle: props.tabTitle, // tabTitle(),
                error: errorMessage,
                errorStack: getErrorStack(error),
              },
              onLoadStartKey,
            );
            setOnLoadStartKey(null);
          }
        },
      )
      .finally(() => {
        setIsExecuting(false);
        if (applyFilterButtonClicked && queryTimeoutEnabled()) {
          clearTimeout(cancelQueryTimeoutID);
          if (!automaticallyCancelQueryAfterTimeout) {
            useDialog.getState().closeDialog();
          }
        }
      });
  };

  const _loadNextPageInternal = (): Promise<DataModels.DocumentId[]> => {
    return documentsIterator.iterator.fetchNext().then((response) => response.resources);
  };

  const showPartitionKey = (() => {
    if (!props.collection) {
      return false;
    }

    if (!props.collection.partitionKey) {
      return false;
    }

    if (props.collection.partitionKey.systemKey && props.isPreferredApiMongoDB) {
      return false;
    }

    return true;
  })();

  const getTabsButtons = (): CommandButtonComponentProps[] => {
    if (configContext.platform === Platform.Fabric && userContext.fabricContext?.isReadOnly) {
      // All the following buttons require write access
      return [];
    }

    const buttons: CommandButtonComponentProps[] = [];
    const label = !isPreferredApiMongoDB ? "New Item" : "New Document";
    if (getNewDocumentButtonState().visible) {
      buttons.push({
        iconSrc: NewDocumentIcon,
        iconAlt: label,
        onCommandClick: onNewDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !getNewDocumentButtonState().enabled || useSelectedNode.getState().isQueryCopilotCollectionSelected(),
        id: "mongoNewDocumentBtn",
      });
    }

    if (getSaveNewDocumentButtonState().visible) {
      const label = "Save";
      buttons.push({
        iconSrc: SaveIcon,
        iconAlt: label,
        onCommandClick: onSaveNewDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled:
          !getSaveNewDocumentButtonState().enabled || useSelectedNode.getState().isQueryCopilotCollectionSelected(),
      });
    }

    if (getDiscardNewDocumentChangesButtonState().visible) {
      const label = "Discard";
      buttons.push({
        iconSrc: DiscardIcon,
        iconAlt: label,
        onCommandClick: onRevertNewDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled:
          !getDiscardNewDocumentChangesButtonState().enabled ||
          useSelectedNode.getState().isQueryCopilotCollectionSelected(),
      });
    }

    if (getSaveExistingDocumentButtonState().visible) {
      const label = "Update";
      buttons.push({
        iconSrc: SaveIcon,
        iconAlt: label,
        onCommandClick: onSaveExistingDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled:
          !getSaveExistingDocumentButtonState().enabled ||
          useSelectedNode.getState().isQueryCopilotCollectionSelected(),
      });
    }

    if (getDiscardExisitingDocumentChangesButtonState().visible) {
      const label = "Discard";
      buttons.push({
        iconSrc: DiscardIcon,
        iconAlt: label,
        onCommandClick: onRevertExisitingDocumentClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled:
          !getDiscardExisitingDocumentChangesButtonState().enabled ||
          useSelectedNode.getState().isQueryCopilotCollectionSelected(),
      });
    }

    if (getDeleteExisitingDocumentButtonState().visible) {
      const label = "Delete";
      buttons.push({
        iconSrc: DeleteDocumentIcon,
        iconAlt: label,
        onCommandClick: onDeleteExisitingDocumentsClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled:
          !getDeleteExisitingDocumentButtonState().enabled ||
          useSelectedNode.getState().isQueryCopilotCollectionSelected(),
      });
    }

    if (!isPreferredApiMongoDB) {
      buttons.push(DocumentsTab._createUploadButton(props.collection.container));
    }

    return buttons;
  };

  const _isQueryCopilotSampleContainer =
    props.collection?.isSampleCollection &&
    props.collection?.databaseId === QueryCopilotSampleDatabaseId &&
    props.collection?.id() === QueryCopilotSampleContainerId;

  // Table config here
  const tableItems: DocumentsTableComponentItem[] = documentIds.map((documentId) => {
    const item: Record<string, string> = {
      id: documentId.id(),
    };

    if (partitionKeyPropertyHeaders && documentId.partitionKeyProperties) {
      for (let i = 0; i < partitionKeyPropertyHeaders.length; i++) {
        item[partitionKeyPropertyHeaders[i]] = documentId.stringPartitionKeyValues[i];
      }
    }

    return item;
  });

  const isEditorDirty = (): boolean => {
    switch (editorState) {
      case ViewModels.DocumentExplorerState.noDocumentSelected:
      case ViewModels.DocumentExplorerState.exisitingDocumentNoEdits:
        return false;

      case ViewModels.DocumentExplorerState.newDocumentValid:
      case ViewModels.DocumentExplorerState.newDocumentInvalid:
      case ViewModels.DocumentExplorerState.exisitingDocumentDirtyInvalid:
        return true;

      case ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid:
        return true;
      // return (
      //   this.selectedDocumentContent.getEditableOriginalValue() !==
      //   this.selectedDocumentContent.getEditableCurrentValue()
      // );

      default:
        return false;
    }
  };

  /**
   * replicate logic of selectedDocument.click();
   * Document has been clicked on in table
   * @param tabRowId
   */
  const onDocumentClicked = (tabRowId: TableRowId) => {
    const index = tabRowId as number;
    setClickedRow(index);

    if (isEditorDirty()) {
      useDialog
        .getState()
        .showOkCancelModalDialog(
          "Unsaved changes",
          "Your unsaved changes will be lost. Do you want to continue?",
          "OK",
          () => loadDocument(documentIds[index]),
          "Cancel",
          undefined,
        );
    } else {
      loadDocument(documentIds[index]);
    }
  };

  const loadDocument = (documentId: DocumentId) =>
    (_isQueryCopilotSampleContainer ? readSampleDocument(documentId) : readDocument(props.collection, documentId)).then(
      (content) => {
        initDocumentEditor(documentId, content);
      },
    );

  const initDocumentEditor = (documentId: DocumentId, documentContent: unknown): void => {
    if (documentId) {
      const content: string = renderObjectForEditor(documentContent, null, 4);
      setSelectedDocumentContentBaseline(content);
      setSelectedDocumentContent(content);
      setInitialDocumentContent(content);

      const newState = documentId
        ? ViewModels.DocumentExplorerState.exisitingDocumentNoEdits
        : ViewModels.DocumentExplorerState.newDocumentValid;
      setEditorState(newState);
    }
  };

  const _onEditorContentChange = (newContent: string): void => {
    setSelectedDocumentContent(newContent);

    if (
      selectedDocumentContentBaseline === initialDocumentContent &&
      newContent === initialDocumentContent &&
      editorState !== ViewModels.DocumentExplorerState.newDocumentValid
    ) {
      setEditorState(ViewModels.DocumentExplorerState.exisitingDocumentNoEdits);
      return;
    }

    try {
      JSON.parse(newContent);
      onValidDocumentEdit();
    } catch (e) {
      onInvalidDocumentEdit();
    }
  };

  const onValidDocumentEdit = (): void => {
    if (
      editorState === ViewModels.DocumentExplorerState.newDocumentInvalid ||
      editorState === ViewModels.DocumentExplorerState.newDocumentValid
    ) {
      setEditorState(ViewModels.DocumentExplorerState.newDocumentValid);
      return;
    }

    setEditorState(ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid);
  };

  const onInvalidDocumentEdit = (): void => {
    if (
      editorState === ViewModels.DocumentExplorerState.newDocumentInvalid ||
      editorState === ViewModels.DocumentExplorerState.newDocumentValid
    ) {
      setEditorState(ViewModels.DocumentExplorerState.newDocumentInvalid);
      return;
    }

    if (
      editorState === ViewModels.DocumentExplorerState.exisitingDocumentNoEdits ||
      editorState === ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid
    ) {
      setEditorState(ViewModels.DocumentExplorerState.exisitingDocumentDirtyInvalid);
      return;
    }
  };

  const tableContainerRef = useRef(null);
  const [tableContainerSizePx, setTableContainerSizePx] = useState<{ height: number; width: number }>(undefined);
  useEffect(() => {
    if (!tableContainerRef.current) {
      return undefined;
    }
    const resizeObserver = new ResizeObserver(() =>
      setTableContainerSizePx({
        height: tableContainerRef.current.offsetHeight,
        width: tableContainerRef.current.offsetWidth,
      }),
    );
    resizeObserver.observe(tableContainerRef.current);
    return () => resizeObserver.disconnect(); // clean up
  }, []);

  const columnHeaders = {
    idHeader: isPreferredApiMongoDB ? "_id" : "id",
    partitionKeyHeaders: partitionKeyPropertyHeaders || [],
  };

  const onSelectedRowsChange = (selectedRows: Set<TableRowId>) => {
    if (selectedRows.size === 0) {
      setSelectedDocumentContent(undefined);
      setClickedRow(undefined);
    }

    // Find if clickedRow is in selectedRows.If not, clear clickedRow and content
    if (clickedRow !== undefined && !selectedRows.has(clickedRow)) {
      setClickedRow(undefined);
      setSelectedDocumentContent(undefined);
    }

    // If only one selection, we consider as a click
    if (selectedRows.size === 1) {
      const selectedRow = Array.from(selectedRows)[0];
      onDocumentClicked(selectedRow);
    }

    setSelectedRows(selectedRows);
  };

  return (
    <FluentProvider theme={dataExplorerLightTheme} style={{ height: "100%" }}>
      {editorState}
      <div
        className="tab-pane active"
        /* data-bind="
    setTemplateReady: true,
    attr:{
        id: tabId
    },
    visible: isActive"
    */
        role="tabpanel"
        style={{ display: "flex" }}
      >
        {/* <!-- Filter - Start --> */}
        {isFilterCreated && (
          <div className="filterdivs" /*data-bind="visible: isFilterCreated "*/>
            {/* <!-- Read-only Filter - Start --> */}
            {!isFilterExpanded && !isPreferredApiMongoDB && (
              <div
                className="filterDocCollapsed" /*data-bind="visible: !isFilterExpanded() && !isPreferredApiMongoDB"*/
              >
                <span className="selectQuery">SELECT * FROM c</span>
                <span className="appliedQuery" /*data-bind="text: appliedFilter"*/>{appliedFilter}</span>
                <button
                  className="filterbtnstyle queryButton"
                  onClick={onShowFilterClick}
                /*data-bind="click: onShowFilterClick"*/
                >
                  Edit Filter
                </button>
              </div>
            )}
            {!isFilterExpanded && isPreferredApiMongoDB && (
              <div className="filterDocCollapsed" /*data-bind="visible: !isFilterExpanded() && isPreferredApiMongoDB"*/>
                {appliedFilter.length > 0 && (
                  <span className="selectQuery" /*data-bind="visible: appliedFilter().length > 0"*/>Filter :</span>
                )}
                {!(appliedFilter.length > 0) && (
                  <span className="noFilterApplied" /*data-bind="visible: !appliedFilter().length > 0"*/>
                    No filter applied
                  </span>
                )}
                <span className="appliedQuery" /*data-bind="text: appliedFilter"*/>{appliedFilter}</span>
                <button
                  className="filterbtnstyle queryButton"
                  onClick={onShowFilterClick} /*data-bind="click: onShowFilterClick"*/
                >
                  Edit Filter
                </button>
              </div>
            )}
            {/* <!-- Read-only Filter - End --> */}

            {/* <!-- Editable Filter - start --> */}
            {isFilterExpanded && (
              <div className="filterDocExpanded" /*data-bind="visible: isFilterExpanded"*/>
                <div>
                  <div className="editFilterContainer">
                    {!isPreferredApiMongoDB && (
                      <span className="filterspan" /*data-bind="visible: !isPreferredApiMongoDB"*/>
                        {" "}
                        SELECT * FROM c{" "}
                      </span>
                    )}
                    <input
                      type="text"
                      list="filtersList"
                      className={`querydropdown ${filterContent.length === 0 ? "placeholderVisible" : ""}`}
                      title="Type a query predicate or choose one from the list."
                      placeholder={
                        isPreferredApiMongoDB
                          ? "Type a query predicate (e.g., {´a´:´foo´}), or choose one from the drop down list, or leave empty to query all documents."
                          : "Type a query predicate (e.g., WHERE c.id=´1´), or choose one from the drop down list, or leave empty to query all documents."
                      }
                      value={filterContent}
                      onChange={(e) => setFilterContent(e.target.value)}
                    /*
data-bind="
W  attr:{
      placeholder:isPreferredApiMongoDB?'Type a query predicate (e.g., {´a´:´foo´}), or choose one from the drop down list, or leave empty to query all documents.':'Type a query predicate (e.g., WHERE c.id=´1´), or choose one from the drop down list, or leave empty to query all documents.'
  },
  css: { placeholderVisible: filterContent().length === 0 },
  textInput: filterContent"
  */
                    />

                    <datalist id="filtersList" /*data-bind="foreach: lastFilterContents"*/>
                      {lastFilterContents.map((filter) => (
                        <option key={filter} value={filter} /*data-bind="value: $data"*/ />
                      ))}
                    </datalist>

                    <span className="filterbuttonpad">
                      <button
                        className="filterbtnstyle queryButton"
                        onClick={() => refreshDocumentsGrid(true)}
                        disabled={!applyFilterButton.enabled}
                        /* data-bind="
                                click: refreshDocumentsGrid.bind($data, true),
                                enable: applyFilterButton.enabled"
                      */
                        aria-label="Apply filter"
                        tabIndex={0}
                      >
                        Apply Filter
                      </button>
                    </span>
                    <span className="filterbuttonpad">
                      {!isPreferredApiMongoDB && isExecuting && (
                        <button
                          className="filterbtnstyle queryButton"
                          /* data-bind="
                                  visible: !isPreferredApiMongoDB && isExecuting,
                                  click: onAbortQueryClick"
                        */
                          aria-label="Cancel Query"
                          tabIndex={0}
                        >
                          Cancel Query
                        </button>
                      )}
                    </span>
                    <span
                      className="filterclose"
                      role="button"
                      aria-label="close filter"
                      tabIndex={0}
                      onClick={onHideFilterClick}
                      onKeyDown={onCloseButtonKeyDown}
                    /*data-bind="click: onHideFilterClick, event: { keydown: onCloseButtonKeyDown }"*/
                    >
                      <img src={CloseIcon} style={{ height: 14, width: 14 }} alt="Hide filter" />
                    </span>
                  </div>
                </div>
              </div>
            )}
            {/* <!-- Editable Filter - End --> */}
          </div>
        )}
        {/* <!-- Filter - End --> */}

        {/* <Split> doesn't like to be a flex child */}
        <div style={{ overflow: "hidden", height: "100%" }}>
          <Split>
            <div style={{ minWidth: 200, width: "20%" }} ref={tableContainerRef}>
              <DocumentsTableComponent
                style={{ width: 200 }}
                items={tableItems}
                onItemClicked={onDocumentClicked}
                onSelectedRowsChange={onSelectedRowsChange}
                selectedRows={selectedRows}
                size={tableContainerSizePx}
                columnHeaders={columnHeaders}
                onRefreshClicked={refreshDocumentsGrid}
              />
              <a
                className="loadMore"
                role="button"
                onClick={() => loadNextPage(false)}
                onKeyDown={() => loadNextPage(false)}
              >
                Load more
              </a>
            </div>
            <div style={{ minWidth: "20%", width: "100%" }}>
              {selectedDocumentContent && selectedRows.size <= 1 && (
                <EditorReact
                  language={"json"}
                  content={selectedDocumentContent}
                  isReadOnly={false}
                  ariaLabel={"Document editor"}
                  lineNumbers={"on"}
                  theme={"_theme"}
                  onContentChanged={_onEditorContentChange}
                />
              )}
              {selectedRows.size > 1 && (
                <span style={{ margin: 10 }}>Number of selected documents: {selectedRows.size}</span>
              )}
            </div>
          </Split>
        </div>
      </div>
    </FluentProvider>
  );
};
