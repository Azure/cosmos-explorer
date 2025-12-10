import { Item, ItemDefinition, PartitionKey, PartitionKeyDefinition, QueryIterator, Resource } from "@azure/cosmos";
import {
  Button,
  Link,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  TableRowId,
  makeStyles,
  shorthands,
} from "@fluentui/react-components";
import { QueryCopilotSampleContainerId, QueryCopilotSampleDatabaseId } from "Common/Constants";
import { getErrorMessage, getErrorStack } from "Common/ErrorHandlingUtils";
import MongoUtility from "Common/MongoUtility";
import { createDocument } from "Common/dataAccess/createDocument";
import {
  deleteDocument as deleteNoSqlDocument,
  deleteDocuments as deleteNoSqlDocuments,
} from "Common/dataAccess/deleteDocument";
import { queryDocuments } from "Common/dataAccess/queryDocuments";
import { readDocument } from "Common/dataAccess/readDocument";
import { updateDocument } from "Common/dataAccess/updateDocument";
import { ActionType, OpenCollectionTab, TabKind } from "Contracts/ActionContracts";
import { CommandButtonComponentProps } from "Explorer/Controls/CommandButton/CommandButtonComponent";
import { useDialog } from "Explorer/Controls/Dialog";
import { EditorReact } from "Explorer/Controls/Editor/EditorReact";
import { InputDataList, InputDatalistDropdownOptionSection } from "Explorer/Controls/InputDataList/InputDataList";
import { ProgressModalDialog } from "Explorer/Controls/ProgressModalDialog";
import { useCommandBar } from "Explorer/Menus/CommandBar/CommandBarComponentAdapter";
import { querySampleDocuments, readSampleDocument } from "Explorer/QueryCopilot/QueryCopilotUtilities";
import {
  ColumnsSelection,
  FilterHistory,
  SubComponentName,
  TabDivider,
  deleteDocumentsTabSubComponentState,
  readDocumentsTabSubComponentState,
  saveDocumentsTabSubComponentState,
} from "Explorer/Tabs/DocumentsTabV2/DocumentsTabStateUtil";
import { usePrevious } from "Explorer/Tabs/DocumentsTabV2/SelectionHelper";
import { CosmosFluentProvider, LayoutConstants, cosmosShorthands, tokens } from "Explorer/Theme/ThemeUtil";
import { useSelectedNode } from "Explorer/useSelectedNode";
import { KeyboardAction, KeyboardActionGroup, useKeyboardActionGroup } from "KeyboardShortcuts";
import { isFabric } from "Platform/Fabric/FabricUtil";
import { QueryConstants } from "Shared/Constants";
import { LocalStorageUtility, StorageKey } from "Shared/StorageUtility";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import { userContext } from "UserContext";
import { logConsoleError, logConsoleInfo } from "Utils/NotificationConsoleUtils";
import { Allotment } from "allotment";
import { useClientWriteEnabled } from "hooks/useClientWriteEnabled";
import React, { KeyboardEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "react-string-format";
import DeleteDocumentIcon from "../../../../images/DeleteDocument.svg";
import NewDocumentIcon from "../../../../images/NewDocument.svg";
import UploadIcon from "../../../../images/Upload_16x16.svg";
import DiscardIcon from "../../../../images/discard.svg";
import RefreshIcon from "../../../../images/refresh-cosmos.svg";
import SaveIcon from "../../../../images/save-cosmos.svg";
import * as Constants from "../../../Common/Constants";
import * as HeadersUtility from "../../../Common/HeadersUtility";
import * as Logger from "../../../Common/Logger";
import * as MongoProxyClient from "../../../Common/MongoProxyClient";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import { CollectionBase, UploadDetailsRecord } from "../../../Contracts/ViewModels";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import * as QueryUtils from "../../../Utils/QueryUtils";
import { defaultQueryFields, extractPartitionKeyValues } from "../../../Utils/QueryUtils";
import DocumentId from "../../Tree/DocumentId";
import ObjectId from "../../Tree/ObjectId";
import TabsBase from "../TabsBase";
import { ColumnDefinition, DocumentsTableComponent, DocumentsTableComponentItem } from "./DocumentsTableComponent";

const MAX_FILTER_HISTORY_COUNT = 100; // Datalist will become scrollable, so we can afford to keep more items than fit on the screen
const NO_SQL_THROTTLING_DOC_URL =
  "https://learn.microsoft.com/azure/cosmos-db/nosql/troubleshoot-request-rate-too-large";
const MONGO_THROTTLING_DOC_URL = "https://learn.microsoft.com/azure/cosmos-db/mongodb/prevent-rate-limiting-errors";
const DATA_EXPLORER_DOC_URL = "https://learn.microsoft.com/en-us/azure/cosmos-db/data-explorer";

const loadMoreHeight = LayoutConstants.rowHeight;
export const useDocumentsTabStyles = makeStyles({
  container: {
    height: "100%",
  },
  filterRow: {
    minHeight: tokens.layoutRowHeight,
    fontSize: tokens.fontSizeBase200,
    display: "flex",
    columnGap: tokens.spacingHorizontalS,
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalL,
    alignItems: "center",
    ...cosmosShorthands.borderBottom(),
  },
  tableContainer: {
    marginRight: tokens.spacingHorizontalXXXL,
  },
  tableRow: {
    height: tokens.layoutRowHeight,
  },
  tableCell: {
    ...cosmosShorthands.borderLeft(),
  },
  tableHeader: {
    display: "flex",
  },
  tableHeaderFiller: {
    width: "20px",
    boxShadow: `0px -1px ${tokens.colorNeutralStroke2} inset`,
  },
  loadMore: {
    ...cosmosShorthands.borderTop(),
    display: "grid",
    alignItems: "center",
    justifyItems: "center",
    width: "100%",
    height: `${loadMoreHeight}px`,
    textAlign: "center",
    ":focus": {
      ...shorthands.outline("1px", "dotted"),
    },
  },
  floatingControlsContainer: {
    position: "relative",
  },
  floatingControls: {
    position: "absolute",
    top: "6px",
    right: 0,
    float: "right",
    backgroundColor: "white",
    zIndex: 1,
  },
  refreshBtn: {
    position: "absolute",
    top: "3px",
    right: "4px",
    float: "right",
    zIndex: 1,
    backgroundColor: "transparent",
  },
  deleteProgressContent: {
    paddingTop: tokens.spacingVerticalL,
  },
  smallScreenContent: {
    "@media (max-width: 420px)": {
      flexWrap: "wrap",
      minHeight: "max-content",
      padding: "4px",
    },
  },
});

export class DocumentsTabV2 extends TabsBase {
  public partitionKey: DataModels.PartitionKey;
  private documentIds: DocumentId[];
  private title: string;
  private resourceTokenPartitionKey: string;

  protected persistedState: OpenCollectionTab;

  constructor(options: ViewModels.DocumentsTabOptions) {
    super(options);

    this.documentIds = options.documentIds();
    this.title = options.title;
    this.partitionKey = options.partitionKey;
    this.resourceTokenPartitionKey = options.resourceTokenPartitionKey;

    this.persistedState = {
      actionType: ActionType.OpenCollectionTab,
      tabKind: options.isPreferredApiMongoDB ? TabKind.MongoDocuments : TabKind.SQLDocuments,
      databaseResourceId: options.collection.databaseId,
      collectionResourceId: options.collection.id(),
    };
  }

  public render(): JSX.Element {
    return (
      <DocumentsTabComponent
        isPreferredApiMongoDB={userContext.apiType === "Mongo"}
        documentIds={this.documentIds}
        collection={this.collection}
        partitionKey={this.partitionKey}
        onLoadStartKey={this.onLoadStartKey}
        tabTitle={this.title}
        resourceTokenPartitionKey={this.resourceTokenPartitionKey}
        onExecutionErrorChange={(isExecutionError: boolean) => this.isExecutionError(isExecutionError)}
        onIsExecutingChange={(isExecuting: boolean) => this.isExecuting(isExecuting)}
        isTabActive={this.isActive()}
      />
    );
  }

  public onActivate(): void {
    super.onActivate();
    this.collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Documents);
  }
}

// Use this value to initialize the very time the component is rendered
const RESET_INDEX = -1;

// Auto-select first row. Define as constant to show where first row is selected
export const INITIAL_SELECTED_ROW_INDEX = 0;

// From TabsBase.renderObjectForEditor()
let renderObjectForEditor = (
  value: unknown,
  replacer: (this: unknown, key: string, value: unknown) => unknown,
  space: string | number,
): string => JSON.stringify(value, replacer, space);

// Export to expose to unit tests
export const getSaveNewDocumentButtonState = (editorState: ViewModels.DocumentExplorerState) => ({
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

// Export to expose to unit tests
export const getDiscardNewDocumentChangesButtonState = (editorState: ViewModels.DocumentExplorerState) => ({
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

// Export to expose to unit tests
export const getSaveExistingDocumentButtonState = (editorState: ViewModels.DocumentExplorerState) => ({
  enabled: (() => {
    switch (editorState) {
      case ViewModels.DocumentExplorerState.existingDocumentDirtyValid:
        return true;
      default:
        return false;
    }
  })(),

  visible: (() => {
    switch (editorState) {
      case ViewModels.DocumentExplorerState.existingDocumentNoEdits:
      case ViewModels.DocumentExplorerState.existingDocumentDirtyInvalid:
      case ViewModels.DocumentExplorerState.existingDocumentDirtyValid:
        return true;
      default:
        return false;
    }
  })(),
});

// Export to expose to unit tests
export const getDiscardExistingDocumentChangesButtonState = (editorState: ViewModels.DocumentExplorerState) => ({
  enabled: (() => {
    switch (editorState) {
      case ViewModels.DocumentExplorerState.existingDocumentDirtyInvalid:
      case ViewModels.DocumentExplorerState.existingDocumentDirtyValid:
        return true;
      default:
        return false;
    }
  })(),

  visible: (() => {
    switch (editorState) {
      case ViewModels.DocumentExplorerState.existingDocumentNoEdits:
      case ViewModels.DocumentExplorerState.existingDocumentDirtyInvalid:
      case ViewModels.DocumentExplorerState.existingDocumentDirtyValid:
        return true;
      default:
        return false;
    }
  })(),
});

type UiKeyboardEvent = (e: KeyboardEvent | React.SyntheticEvent<Element, Event>) => void;

// Export to expose to unit tests
export type ButtonsDependencies = {
  selectedRows: Set<TableRowId>;
  editorState: ViewModels.DocumentExplorerState;
  isPreferredApiMongoDB: boolean;
  clientWriteEnabled: boolean;
  onNewDocumentClick: UiKeyboardEvent;
  onSaveNewDocumentClick: UiKeyboardEvent;
  onRevertNewDocumentClick: UiKeyboardEvent;
  onSaveExistingDocumentClick: UiKeyboardEvent;
  onRevertExistingDocumentClick: UiKeyboardEvent;
  onDeleteExistingDocumentsClick: UiKeyboardEvent;
  onUploadDocumentsClick: UiKeyboardEvent;
};

// Export to expose to unit tests
export const NEW_DOCUMENT_BUTTON_ID = "mongoNewDocumentBtn";
export const SAVE_BUTTON_ID = "saveBtn";
export const UPDATE_BUTTON_ID = "updateBtn";
export const DISCARD_BUTTON_ID = "discardBtn";
export const DELETE_BUTTON_ID = "deleteBtn";
export const UPLOAD_BUTTON_ID = "uploadItemBtn";

// Export to expose in unit tests
export const getTabsButtons = ({
  selectedRows,
  editorState,
  isPreferredApiMongoDB,
  clientWriteEnabled,
  onNewDocumentClick,
  onSaveNewDocumentClick,
  onRevertNewDocumentClick,
  onSaveExistingDocumentClick,
  onRevertExistingDocumentClick,
  onDeleteExistingDocumentsClick,
  onUploadDocumentsClick,
}: ButtonsDependencies): CommandButtonComponentProps[] => {
  if (isFabric() && userContext.fabricContext?.isReadOnly) {
    // All the following buttons require write access
    return [];
  }

  const buttons: CommandButtonComponentProps[] = [];
  const label = !isPreferredApiMongoDB ? "New Item" : "New Document";
  if (getNewDocumentButtonState(editorState).visible) {
    buttons.push({
      iconSrc: NewDocumentIcon,
      iconAlt: label,
      keyboardAction: KeyboardAction.NEW_ITEM,
      onCommandClick: onNewDocumentClick,
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: false,
      disabled:
        !getNewDocumentButtonState(editorState).enabled ||
        !clientWriteEnabled ||
        useSelectedNode.getState().isQueryCopilotCollectionSelected(),
      id: NEW_DOCUMENT_BUTTON_ID,
    });
  }

  if (getSaveNewDocumentButtonState(editorState).visible) {
    const label = "Save";
    buttons.push({
      iconSrc: SaveIcon,
      iconAlt: label,
      keyboardAction: KeyboardAction.SAVE_ITEM,
      onCommandClick: onSaveNewDocumentClick,
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: false,
      disabled:
        !getSaveNewDocumentButtonState(editorState).enabled ||
        !clientWriteEnabled ||
        useSelectedNode.getState().isQueryCopilotCollectionSelected(),
      id: SAVE_BUTTON_ID,
    });
  }

  if (getDiscardNewDocumentChangesButtonState(editorState).visible) {
    const label = "Discard";
    buttons.push({
      iconSrc: DiscardIcon,
      iconAlt: label,
      keyboardAction: KeyboardAction.CANCEL_OR_DISCARD,
      onCommandClick: onRevertNewDocumentClick,
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: false,
      disabled:
        !getDiscardNewDocumentChangesButtonState(editorState).enabled ||
        useSelectedNode.getState().isQueryCopilotCollectionSelected(),
      id: DISCARD_BUTTON_ID,
    });
  }

  if (getSaveExistingDocumentButtonState(editorState).visible) {
    const label = "Update";
    buttons.push({
      iconSrc: SaveIcon,
      iconAlt: label,
      keyboardAction: KeyboardAction.SAVE_ITEM,
      onCommandClick: onSaveExistingDocumentClick,
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: false,
      disabled:
        !getSaveExistingDocumentButtonState(editorState).enabled ||
        !clientWriteEnabled ||
        useSelectedNode.getState().isQueryCopilotCollectionSelected(),
      id: UPDATE_BUTTON_ID,
    });
  }

  if (getDiscardExistingDocumentChangesButtonState(editorState).visible) {
    const label = "Discard";
    buttons.push({
      iconSrc: DiscardIcon,
      iconAlt: label,
      keyboardAction: KeyboardAction.CANCEL_OR_DISCARD,
      onCommandClick: onRevertExistingDocumentClick,
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: false,
      disabled:
        !getDiscardExistingDocumentChangesButtonState(editorState).enabled ||
        useSelectedNode.getState().isQueryCopilotCollectionSelected(),
      id: DISCARD_BUTTON_ID,
    });
  }

  if (selectedRows.size > 0) {
    const label = "Delete";
    buttons.push({
      iconSrc: DeleteDocumentIcon,
      iconAlt: label,
      keyboardAction: KeyboardAction.DELETE_ITEM,
      onCommandClick: onDeleteExistingDocumentsClick,
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: false,
      disabled: useSelectedNode.getState().isQueryCopilotCollectionSelected() || !clientWriteEnabled,
      id: DELETE_BUTTON_ID,
    });
  }

  if (!isPreferredApiMongoDB) {
    const label = "Upload Item";
    buttons.push({
      id: UPLOAD_BUTTON_ID,
      iconSrc: UploadIcon,
      iconAlt: label,
      onCommandClick: onUploadDocumentsClick,
      commandButtonLabel: label,
      ariaLabel: label,
      hasPopup: true,
      disabled:
        useSelectedNode.getState().isDatabaseNodeOrNoneSelected() ||
        !useClientWriteEnabled.getState().clientWriteEnabled ||
        useSelectedNode.getState().isQueryCopilotCollectionSelected(),
    });
  }

  return buttons;
};

const updateNavbarWithTabsButtons = (isTabActive: boolean, dependencies: ButtonsDependencies): void => {
  if (isTabActive) {
    useCommandBar.getState().setContextButtons(getTabsButtons(dependencies));
  }
};

const getNewDocumentButtonState = (editorState: ViewModels.DocumentExplorerState) => ({
  enabled: (() => {
    switch (editorState) {
      case ViewModels.DocumentExplorerState.noDocumentSelected:
      case ViewModels.DocumentExplorerState.existingDocumentNoEdits:
        return true;
      default:
        return false;
    }
  })(),
  visible: true,
});

const _loadNextPageInternal = (
  iterator: QueryIterator<ItemDefinition & Resource>,
): Promise<DataModels.DocumentId[]> => {
  return iterator.fetchNext().then((response) => response.resources);
};

// Export to expose to unit tests
export const showPartitionKey = (collection: ViewModels.CollectionBase, isPreferredApiMongoDB: boolean) => {
  if (!collection) {
    return false;
  }

  if (!collection.partitionKey) {
    return false;
  }

  if (collection.partitionKey.systemKey && isPreferredApiMongoDB) {
    return false;
  }

  return true;
};

// Export to expose to unit tests
/**
 * Build default query
 * @param isMongo true if mongo api
 * @param filter
 * @param partitionKeyProperties optional for mongo
 * @param partitionKey  optional for mongo
 * @param additionalField
 * @returns
 */
export const buildQuery = (
  isMongo: boolean,
  filter: string,
  partitionKeyProperties?: string[],
  partitionKey?: DataModels.PartitionKey,
  additionalField?: string[],
): string => {
  if (isMongo) {
    return filter || "{}";
  }

  // Filter out fields starting with "/" (partition keys)
  return QueryUtils.buildDocumentsQuery(
    filter,
    partitionKeyProperties,
    partitionKey,
    additionalField?.filter((f) => !f.startsWith("/")) || [],
  );
};

/**
 * Export to expose to unit tests
 *
 * Add array2 to array1 without duplicates
 * @param array1
 * @param array2
 * @return array1 with array2 added without duplicates
 */
export const addStringsNoDuplicate = (array1: string[], array2: string[]): string[] => {
  const result = [...array1];
  array2.forEach((item) => {
    if (!result.includes(item)) {
      result.push(item);
    }
  });
  return result;
};

// Export to expose to unit tests
export interface IDocumentsTabComponentProps {
  isPreferredApiMongoDB: boolean;
  documentIds: DocumentId[]; // TODO: this contains ko observables. We need to convert them to React state.
  collection: ViewModels.CollectionBase;
  partitionKey: DataModels.PartitionKey;
  onLoadStartKey: number;
  tabTitle: string;
  resourceTokenPartitionKey?: string;
  onExecutionErrorChange: (isExecutionError: boolean) => void;
  onIsExecutingChange: (isExecuting: boolean) => void;
  isTabActive: boolean;
}

const getDefaultSqlFilters = (partitionKeys: string[]) =>
  ['WHERE c.id = "foo"', "ORDER BY c._ts DESC", 'WHERE c.id = "foo" ORDER BY c._ts DESC', "ORDER BY c._ts ASC"].concat(
    partitionKeys.map((partitionKey) => `WHERE c.${partitionKey} = "foo"`),
  );
const defaultMongoFilters = ['{"id":"foo"}', "{ qty: { $gte: 20 } }"];

// Extend DocumentId to include fields displayed in the table
type ExtendedDocumentId = DocumentId & { tableFields?: DocumentsTableComponentItem };

// This is based on some heuristics
const calculateOffset = (columnNumber: number): number => columnNumber * 16 - 27;

// Export to expose to unit tests
export const DocumentsTabComponent: React.FunctionComponent<IDocumentsTabComponentProps> = ({
  isPreferredApiMongoDB,
  documentIds: _documentIds,
  collection: _collection,
  partitionKey: _partitionKey,
  onLoadStartKey: _onLoadStartKey,
  tabTitle,
  resourceTokenPartitionKey,
  onExecutionErrorChange,
  onIsExecutingChange,
  isTabActive,
}): JSX.Element => {
  const [filterContent, setFilterContent] = useState<string>(() =>
    readDocumentsTabSubComponentState<string>(SubComponentName.CurrentFilter, _collection, ""),
  );

  const [documentIds, setDocumentIds] = useState<ExtendedDocumentId[]>([]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const styles = useDocumentsTabStyles();

  // Query
  const [documentsIterator, setDocumentsIterator] = useState<{
    iterator: QueryIterator<ItemDefinition & Resource>;
    applyFilterButtonPressed: boolean;
  }>(undefined);
  const [queryAbortController, setQueryAbortController] = useState<AbortController>(undefined);
  const [cancelQueryTimeoutID, setCancelQueryTimeoutID] = useState<NodeJS.Timeout>(undefined);

  const [onLoadStartKey, setOnLoadStartKey] = useState<number>(_onLoadStartKey);

  const [initialDocumentContent, setInitialDocumentContent] = useState<string>(undefined);
  const [selectedDocumentContent, setSelectedDocumentContent] = useState<string>(undefined);
  const [selectedDocumentContentBaseline, setSelectedDocumentContentBaseline] = useState<string>(undefined);

  // Table user clicked on this row
  const [clickedRowIndex, setClickedRowIndex] = useState<number>(RESET_INDEX);
  // Table multiple selection
  const [selectedRows, setSelectedRows] = React.useState<Set<TableRowId>>(() => new Set<TableRowId>());

  // Command buttons
  const [editorState, setEditorState] = useState<ViewModels.DocumentExplorerState>(
    ViewModels.DocumentExplorerState.noDocumentSelected,
  );

  // State
  const clientWriteEnabled = useClientWriteEnabled((state) => state.clientWriteEnabled);
  const [tabStateData, setTabStateData] = useState<TabDivider>(() =>
    readDocumentsTabSubComponentState<TabDivider>(SubComponentName.MainTabDivider, _collection, {
      leftPaneWidthPercent: 35,
    }),
  );

  const isQueryCopilotSampleContainer =
    _collection?.isSampleCollection &&
    _collection?.databaseId === QueryCopilotSampleDatabaseId &&
    _collection?.id() === QueryCopilotSampleContainerId;

  // For Mongo only
  const [continuationToken, setContinuationToken] = useState<string>(undefined);

  // User's filter history
  const [lastFilterContents, setLastFilterContents] = useState<FilterHistory>(() =>
    readDocumentsTabSubComponentState<FilterHistory>(SubComponentName.FilterHistory, _collection, [] as FilterHistory),
  );

  // For progress bar for bulk delete (noSql)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = React.useState(false);
  const [bulkDeleteProcess, setBulkDeleteProcess] = useState<{
    pendingIds: DocumentId[];
    successfulIds: DocumentId[];
    throttledIds: DocumentId[];
    failedIds: DocumentId[];
    beforeExecuteMs: number; // Delay before executing delete. Used for retrying throttling after a specified delay
    hasBeenThrottled: boolean; // Keep track if the operation has been throttled at least once
  }>(undefined);
  const [bulkDeleteOperation, setBulkDeleteOperation] = useState<{
    onCompleted: (documentIds: DocumentId[]) => void;
    onFailed: (reason?: unknown) => void;
    count: number;
    collection: CollectionBase;
  }>(undefined);
  const [bulkDeleteMode, setBulkDeleteMode] = useState<"inProgress" | "completed" | "aborting" | "aborted">(undefined);
  const [abortController, setAbortController] = useState<AbortController | undefined>(undefined);

  const setKeyboardActions = useKeyboardActionGroup(KeyboardActionGroup.ACTIVE_TAB);

  /**
   * Recursively delete all documents by retrying throttled requests (429).
   * This only works for NoSQL, because the bulk response includes status for each delete document request.
   * Recursion is implemented using React useEffect (as opposed to recursively calling setTimeout), because it
   * has to update the <ProgressModalDialog> or check if the user is aborting the operation via state React
   * variables.
   *
   * Inputs are the bulkDeleteOperation, bulkDeleteProcess and bulkDeleteMode state variables.
   * When the bulkDeleteProcess changes, the function in the useEffect is triggered and checks if the process
   * was aborted or completed, which will resolve the promise.
   * Otherwise, it will attempt to delete documents of the pending and throttled ids arrays.
   * Once deletion is completed, the function updates bulkDeleteProcess with the results, which will trigger
   * the function to be called again.
   */
  useEffect(() => {
    if (!bulkDeleteOperation || !bulkDeleteProcess || !bulkDeleteMode) {
      return;
    }

    if (bulkDeleteMode === "completed" || bulkDeleteMode === "aborted") {
      // no op in the case function is called again
      return;
    }

    if (bulkDeleteProcess.pendingIds.length === 0 && bulkDeleteProcess.throttledIds.length === 0) {
      // Successfully deleted all documents
      bulkDeleteOperation.onCompleted(bulkDeleteProcess.successfulIds);
      setBulkDeleteMode("completed");
      return;
    }

    if (bulkDeleteMode === "aborting") {
      // Operation was aborted
      abortController?.abort();
      bulkDeleteOperation.onCompleted(bulkDeleteProcess.successfulIds);
      setBulkDeleteMode("aborted");
      setAbortController(undefined);
      return;
    }

    // Start deleting documents or retry throttled requests
    const newPendingIds = bulkDeleteProcess.pendingIds.concat(bulkDeleteProcess.throttledIds);
    const timeout = bulkDeleteProcess.beforeExecuteMs || 0;

    const ac = new AbortController();
    setAbortController(ac);
    setTimeout(() => {
      deleteNoSqlDocuments(bulkDeleteOperation.collection, [...newPendingIds], ac.signal)
        .then((deleteResult) => {
          let retryAfterMilliseconds = 0;
          const newSuccessful: DocumentId[] = [];
          const newThrottled: DocumentId[] = [];
          const newFailed: DocumentId[] = [];
          deleteResult.forEach((result) => {
            if (result.statusCode === Constants.HttpStatusCodes.NoContent) {
              newSuccessful.push(result.documentId);
            } else if (result.statusCode === Constants.HttpStatusCodes.TooManyRequests) {
              newThrottled.push(result.documentId);
              retryAfterMilliseconds = Math.max(result.retryAfterMilliseconds, retryAfterMilliseconds);
            } else if (result.statusCode >= 400) {
              newFailed.push(result.documentId);
              logConsoleError(
                `Failed to delete document ${result.documentId.id()} with status code ${result.statusCode}`,
              );
            }
          });

          logConsoleInfo(`Successfully deleted ${newSuccessful.length} document(s)`);

          if (newThrottled.length > 0) {
            logConsoleError(
              `Failed to delete ${newThrottled.length} document(s) due to "Request too large" (429) error. Retrying...`,
            );
          }

          // Update result of the bulk delete: method is called again, because the state variables changed
          // it will decide at the next call what to do
          setBulkDeleteProcess((prev) => ({
            pendingIds: [],
            successfulIds: prev.successfulIds.concat(newSuccessful),
            throttledIds: newThrottled,
            failedIds: prev.failedIds.concat(newFailed),
            beforeExecuteMs: retryAfterMilliseconds,
            hasBeenThrottled: prev.hasBeenThrottled || newThrottled.length > 0,
          }));
        })
        .catch((error) => {
          console.error("Error deleting documents", error);
          setBulkDeleteProcess((prev) => ({
            pendingIds: [],
            throttledIds: [],
            successfulIds: prev.successfulIds,
            failedIds: prev.failedIds.concat(prev.pendingIds),
            beforeExecuteMs: undefined,
            hasBeenThrottled: prev.hasBeenThrottled,
          }));
          bulkDeleteOperation.onFailed(error);
        });
    }, timeout);
  }, [bulkDeleteOperation, bulkDeleteProcess, bulkDeleteMode]);

  const partitionKey: DataModels.PartitionKey = useMemo(
    () => _partitionKey || (_collection && _collection.partitionKey),
    [_collection, _partitionKey],
  );
  const partitionKeyPropertyHeaders: string[] = useMemo(
    () =>
      isPreferredApiMongoDB && partitionKey?.systemKey
        ? []
        : _collection?.partitionKeyPropertyHeaders || partitionKey?.paths,
    [_collection?.partitionKeyPropertyHeaders, partitionKey?.paths, partitionKey?.systemKey, isPreferredApiMongoDB],
  );
  let partitionKeyProperties = useMemo(() => {
    return partitionKeyPropertyHeaders?.map((partitionKeyPropertyHeader) =>
      partitionKeyPropertyHeader.replace(/[/]+/g, ".").substring(1).replace(/[']+/g, ""),
    );
  }, [partitionKeyPropertyHeaders]);

  const getInitialColumnSelection = () => {
    const defaultColumnsIds = ["id"];
    if (showPartitionKey(_collection, isPreferredApiMongoDB)) {
      defaultColumnsIds.push(...partitionKeyPropertyHeaders);
    }

    return defaultColumnsIds;
  };

  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>(() => {
    const persistedColumnsSelection = readDocumentsTabSubComponentState<ColumnsSelection>(
      SubComponentName.ColumnsSelection,
      _collection,
      undefined,
    );

    if (!persistedColumnsSelection) {
      return getInitialColumnSelection();
    }

    return persistedColumnsSelection.selectedColumnIds;
  });

  // new DocumentId() requires a DocumentTab which we mock with only the required properties
  const newDocumentId = useCallback(
    (
      rawDocument: DataModels.DocumentId,
      partitionKeyProperties: string[],
      partitionKeyValue: string[],
    ): ExtendedDocumentId => {
      const extendedDocumentId = new DocumentId(
        {
          partitionKey,
          partitionKeyProperties,
          // Fake unused mocks
          isEditorDirty: () => false,
          selectDocument: () => Promise.reject(),
        },
        rawDocument,
        partitionKeyValue,
      ) as ExtendedDocumentId;
      extendedDocumentId.tableFields = { ...rawDocument };
      return extendedDocumentId;
    },
    [partitionKey],
  );

  useEffect(() => {
    setDocumentIds(_documentIds);
  }, [_documentIds]);

  // This is executed in onActivate() in the original code.
  useEffect(() => {
    setKeyboardActions({
      [KeyboardAction.CLEAR_SEARCH]: () => {
        updateFilterContent("");
        refreshDocumentsGrid(true);
        return true;
      },
    });

    if (!documentsIterator) {
      try {
        refreshDocumentsGrid(false);
      } catch (error) {
        if (onLoadStartKey !== null && onLoadStartKey !== undefined) {
          TelemetryProcessor.traceFailure(
            Action.Tab,
            {
              databaseName: _collection.databaseId,
              collectionName: _collection.id(),

              dataExplorerArea: Constants.Areas.Tab,
              tabTitle,
              error: getErrorMessage(error),
              errorStack: getErrorStack(error),
            },
            onLoadStartKey,
          );
          setOnLoadStartKey(undefined);
        }
      }
    }

    updateNavbarWithTabsButtons(isTabActive, {
      selectedRows,
      editorState,
      isPreferredApiMongoDB,
      clientWriteEnabled,
      onNewDocumentClick,
      onSaveNewDocumentClick,
      onRevertNewDocumentClick,
      onSaveExistingDocumentClick,
      onRevertExistingDocumentClick,
      onDeleteExistingDocumentsClick,
      onUploadDocumentsClick,
    });
  }, []);

  const isEditorDirty = useCallback((): boolean => {
    switch (editorState) {
      case ViewModels.DocumentExplorerState.noDocumentSelected:
      case ViewModels.DocumentExplorerState.existingDocumentNoEdits:
        return false;

      case ViewModels.DocumentExplorerState.newDocumentValid:
      case ViewModels.DocumentExplorerState.newDocumentInvalid:
      case ViewModels.DocumentExplorerState.existingDocumentDirtyInvalid:
        return true;

      case ViewModels.DocumentExplorerState.existingDocumentDirtyValid:
        return true;

      default:
        return false;
    }
  }, [editorState]);

  const confirmDiscardingChange = useCallback(
    (onDiscard: () => void, onCancelDiscard?: () => void): void => {
      if (isEditorDirty()) {
        useDialog
          .getState()
          .showOkCancelModalDialog(
            "Unsaved changes",
            "Your unsaved changes will be lost. Do you want to continue?",
            "OK",
            onDiscard,
            "Cancel",
            onCancelDiscard,
          );
      } else {
        onDiscard();
      }
    },
    [isEditorDirty],
  );

  // Update parent (tab) if isExecuting has changed
  useEffect(() => {
    onIsExecutingChange(isExecuting);
  }, [onIsExecutingChange, isExecuting]);

  const onNewDocumentClick = useCallback(
    (): void => confirmDiscardingChange(() => initializeNewDocument()),
    [confirmDiscardingChange],
  );

  const initializeNewDocument = (): void => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newDocument: any = {
      id: "replace_with_new_document_id",
    };
    partitionKeyProperties.forEach((partitionKeyProperty) => {
      let target = newDocument;
      const keySegments = partitionKeyProperty.split(".");
      const finalSegment = keySegments.pop();

      // Initialize nested objects as needed
      keySegments.forEach((segment) => {
        target = target[segment] = target[segment] || {};
      });

      target[finalSegment] = "replace_with_new_partition_key_value";
    });
    const defaultDocument: string = renderObjectForEditor(newDocument, null, 4);

    setInitialDocumentContent(defaultDocument);
    setSelectedDocumentContent(defaultDocument);
    setSelectedDocumentContentBaseline(defaultDocument);
    setSelectedRows(new Set());
    setClickedRowIndex(undefined);
    setEditorState(ViewModels.DocumentExplorerState.newDocumentValid);
  };

  let onSaveNewDocumentClick = useCallback((): Promise<unknown> => {
    onExecutionErrorChange(false);
    const startKey: number = TelemetryProcessor.traceStart(Action.CreateDocument, {
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle,
    });
    const sanitizedContent = selectedDocumentContent.replace("\n", "");
    const document = JSON.parse(sanitizedContent);
    setIsExecuting(true);
    return createDocument(_collection, document)
      .then(
        (savedDocument: DataModels.DocumentId) => {
          // TODO: Reuse initDocumentEditor() to remove code duplication
          const value: string = renderObjectForEditor(savedDocument || {}, null, 4);
          setSelectedDocumentContentBaseline(value);
          setSelectedDocumentContent(value);
          setInitialDocumentContent(value);
          const partitionKeyValueArray: PartitionKey[] = extractPartitionKeyValues(
            savedDocument,
            partitionKey as PartitionKeyDefinition,
          );
          const id = newDocumentId(savedDocument, partitionKeyProperties, partitionKeyValueArray as string[]);
          const ids = documentIds;
          ids.push(id);

          setDocumentIds(ids);
          setEditorState(ViewModels.DocumentExplorerState.existingDocumentNoEdits);

          // Update column choices
          setColumnDefinitionsFromDocument(savedDocument);

          TelemetryProcessor.traceSuccess(
            Action.CreateDocument,
            {
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle,
            },
            startKey,
          );
        },
        (error) => {
          onExecutionErrorChange(true);
          const errorMessage = getErrorMessage(error);
          useDialog.getState().showOkModalDialog("Create document failed", errorMessage);
          TelemetryProcessor.traceFailure(
            Action.CreateDocument,
            {
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle,
              error: errorMessage,
              errorStack: getErrorStack(error),
            },
            startKey,
          );
        },
      )
      .then(() => {
        setSelectedRows(new Set([documentIds.length - 1]));
        setClickedRowIndex(documentIds.length - 1);
      })
      .finally(() => setIsExecuting(false));
  }, [
    onExecutionErrorChange,
    tabTitle,
    selectedDocumentContent,
    _collection,
    partitionKey,
    newDocumentId,
    partitionKeyProperties,
    documentIds,
  ]);

  const onRevertNewDocumentClick = useCallback((): void => {
    setInitialDocumentContent("");
    setSelectedDocumentContent("");
    setEditorState(ViewModels.DocumentExplorerState.noDocumentSelected);
  }, [setInitialDocumentContent, setSelectedDocumentContent, setEditorState]);

  let onSaveExistingDocumentClick = useCallback((): Promise<void> => {
    const documentContent = JSON.parse(selectedDocumentContent);

    const partitionKeyValueArray: PartitionKey[] = extractPartitionKeyValues(
      documentContent,
      partitionKey as PartitionKeyDefinition,
    );

    const selectedDocumentId = documentIds[clickedRowIndex as number];
    const originalPartitionKeyValue = selectedDocumentId.partitionKeyValue;
    selectedDocumentId.partitionKeyValue = partitionKeyValueArray;

    onExecutionErrorChange(false);
    const startKey: number = TelemetryProcessor.traceStart(Action.UpdateDocument, {
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle,
    });
    setIsExecuting(true);
    return updateDocument(_collection, selectedDocumentId, documentContent)
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
          setEditorState(ViewModels.DocumentExplorerState.existingDocumentNoEdits);
          TelemetryProcessor.traceSuccess(
            Action.UpdateDocument,
            {
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle,
            },
            startKey,
          );

          // Update column choices
          selectedDocumentId.tableFields = { ...documentContent };
          setColumnDefinitionsFromDocument(documentContent);
        },
        (error) => {
          // in case of any kind of failures of accidently changing partition key, restore the original
          // so that when user navigates away from current document and comes back,
          // it doesnt fail to load due to using the invalid partition keys
          selectedDocumentId.partitionKeyValue = originalPartitionKeyValue;
          onExecutionErrorChange(true);
          const errorMessage = getErrorMessage(error);
          useDialog.getState().showOkModalDialog("Update document failed", errorMessage);
          TelemetryProcessor.traceFailure(
            Action.UpdateDocument,
            {
              dataExplorerArea: Constants.Areas.Tab,
              tabTitle,
              error: errorMessage,
              errorStack: getErrorStack(error),
            },
            startKey,
          );
        },
      )
      .finally(() => setIsExecuting(false));
  }, [
    onExecutionErrorChange,
    tabTitle,
    selectedDocumentContent,
    _collection,
    partitionKey,
    documentIds,
    clickedRowIndex,
  ]);

  const onRevertExistingDocumentClick = useCallback((): void => {
    setSelectedDocumentContentBaseline(initialDocumentContent);
    setSelectedDocumentContent(selectedDocumentContentBaseline);
  }, [initialDocumentContent, selectedDocumentContentBaseline, setSelectedDocumentContent]);

  /**
   * Trigger a useEffect() to bulk delete noSql documents
   * @param collection
   * @param documentIds
   * @returns
   */
  const _bulkDeleteNoSqlDocuments = (collection: CollectionBase, documentIds: DocumentId[]): Promise<DocumentId[]> =>
    new Promise<DocumentId[]>((resolve, reject) => {
      setBulkDeleteOperation({
        onCompleted: resolve,
        onFailed: reject,
        count: documentIds.length,
        collection,
      });
      setBulkDeleteProcess({
        pendingIds: [...documentIds],
        throttledIds: [],
        successfulIds: [],
        failedIds: [],
        beforeExecuteMs: 0,
        hasBeenThrottled: false,
      });
      setIsBulkDeleteDialogOpen(true);
      setBulkDeleteMode("inProgress");
    });

  /**
   * Implementation using bulk delete NoSQL API
   * @param list of document ids to delete
   * @returns Promise of list of deleted document ids
   */
  const _deleteDocuments = useCallback(
    async (toDeleteDocumentIds: DocumentId[]): Promise<DocumentId[]> => {
      onExecutionErrorChange(false);
      const startKey: number = TelemetryProcessor.traceStart(Action.DeleteDocuments, {
        dataExplorerArea: Constants.Areas.Tab,
        tabTitle,
      });
      setIsExecuting(true);

      let deletePromise;
      if (!isPreferredApiMongoDB) {
        if (partitionKey.systemKey) {
          // ----------------------------------------------------------------------------------------------------
          // TODO: Once JS SDK Bug fix for bulk deleting legacy containers (whose systemKey==1) is released:
          // Remove the check for systemKey, remove call to deleteNoSqlDocument(). deleteNoSqlDocuments() should
          // always be called for NoSQL.
          deletePromise = deleteNoSqlDocument(_collection, toDeleteDocumentIds[0]).then(() => {
            useDialog.getState().showOkModalDialog("Delete document", "Document successfully deleted.");
            return [toDeleteDocumentIds[0]];
          });
          // ----------------------------------------------------------------------------------------------------
        } else {
          deletePromise = _bulkDeleteNoSqlDocuments(_collection, toDeleteDocumentIds);
        }
      } else {
        deletePromise = MongoProxyClient.deleteDocuments(
          _collection.databaseId,
          _collection as ViewModels.Collection,
          toDeleteDocumentIds,
        ).then(({ deletedCount, isAcknowledged }) => {
          if (deletedCount === toDeleteDocumentIds.length && isAcknowledged) {
            return toDeleteDocumentIds;
          }
          throw new Error(`Delete failed with deletedCount: ${deletedCount} and isAcknowledged: ${isAcknowledged}`);
        });
      }

      return deletePromise
        .then(
          (deletedIds) => {
            TelemetryProcessor.traceSuccess(
              Action.DeleteDocuments,
              {
                dataExplorerArea: Constants.Areas.Tab,
                tabTitle,
              },
              startKey,
            );
            return deletedIds;
          },
          (error) => {
            onExecutionErrorChange(true);
            console.error(error);
            TelemetryProcessor.traceFailure(
              Action.DeleteDocuments,
              {
                dataExplorerArea: Constants.Areas.Tab,
                tabTitle,
                error: getErrorMessage(error),
                errorStack: getErrorStack(error),
              },
              startKey,
            );
            throw error;
          },
        )
        .finally(() => {
          setIsExecuting(false);
        });
    },
    [_collection, isPreferredApiMongoDB, onExecutionErrorChange, tabTitle, partitionKey.systemKey],
  );

  const deleteDocuments = useCallback(
    (toDeleteDocumentIds: DocumentId[]): void => {
      onExecutionErrorChange(false);
      setIsExecuting(true);
      _deleteDocuments(toDeleteDocumentIds)
        .then(
          (deletedIds: DocumentId[]) => {
            const deletedIdsSet = new Set(deletedIds.map((documentId) => documentId.id));
            const newDocumentIds = [...documentIds.filter((documentId) => !deletedIdsSet.has(documentId.id))];
            setDocumentIds(newDocumentIds);

            setSelectedDocumentContent(undefined);
            setClickedRowIndex(undefined);
            setSelectedRows(new Set());
            setEditorState(ViewModels.DocumentExplorerState.noDocumentSelected);
          },
          (error: Error) => {
            if (error instanceof MongoProxyClient.ThrottlingError) {
              useDialog
                .getState()
                .showOkModalDialog(
                  "Delete documents",
                  `Some documents failed to delete due to a rate limiting error. Please try again later. To prevent this in the future, consider increasing the throughput on your container or database.`,
                  {
                    linkText: "Learn More",
                    linkUrl: MONGO_THROTTLING_DOC_URL,
                  },
                );
            } else {
              useDialog
                .getState()
                .showOkModalDialog("Delete documents", `Deleting document(s) failed (${error.message})`);
            }
          },
        )
        .finally(() => setIsExecuting(false));
    },
    [onExecutionErrorChange, _deleteDocuments, documentIds],
  );

  const onDeleteExistingDocumentsClick = useCallback(async (): Promise<void> => {
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

    useDialog
      .getState()
      .showOkCancelModalDialog(
        "Confirm delete",
        msg,
        "Delete",
        () => deleteDocuments(Array.from(selectedRows).map((index) => documentIds[index as number])),
        "Cancel",
        undefined,
      );
  }, [deleteDocuments, documentIds, isPreferredApiMongoDB, selectedRows]);

  const onUploadDocumentsClick = useCallback((): void => {
    if (!isPreferredApiMongoDB) {
      const onSuccessUpload = (data: UploadDetailsRecord[]) => {
        const addedIdsSet = new Set(
          data
            .reduce(
              (result: ItemDefinition[], record) =>
                result.concat(record.resources && record.resources.length ? record.resources : []),
              [],
            )
            .map((document) => {
              const partitionKeyValueArray: PartitionKey[] = extractPartitionKeyValues(
                document,
                partitionKey as PartitionKeyDefinition,
              );
              return newDocumentId(
                document as ItemDefinition & Resource,
                partitionKeyProperties,
                partitionKeyValueArray as string[],
              );
            }),
        );

        const documents = new Set(documentIds);
        addedIdsSet.forEach((item) => documents.add(item));
        setDocumentIds(Array.from(documents));

        setSelectedDocumentContent(undefined);
        setClickedRowIndex(undefined);
        setSelectedRows(new Set());
        setEditorState(ViewModels.DocumentExplorerState.noDocumentSelected);
      };

      _collection.container.openUploadItemsPane(onSuccessUpload);
    }
  }, [_collection.container, documentIds, isPreferredApiMongoDB, newDocumentId, partitionKey, partitionKeyProperties]);

  // If editor state changes, update the nav
  useEffect(
    () =>
      updateNavbarWithTabsButtons(isTabActive, {
        selectedRows,
        editorState,
        isPreferredApiMongoDB,
        clientWriteEnabled,
        onNewDocumentClick,
        onSaveNewDocumentClick,
        onRevertNewDocumentClick,
        onSaveExistingDocumentClick,
        onRevertExistingDocumentClick,
        onDeleteExistingDocumentsClick,
        onUploadDocumentsClick,
      }),
    [
      selectedRows,
      editorState,
      isPreferredApiMongoDB,
      clientWriteEnabled,
      onNewDocumentClick,
      onSaveNewDocumentClick,
      onRevertNewDocumentClick,
      onSaveExistingDocumentClick,
      onRevertExistingDocumentClick,
      onDeleteExistingDocumentsClick,
      onUploadDocumentsClick,
      isTabActive,
    ],
  );

  const queryTimeoutEnabled = useCallback(
    (): boolean => !isPreferredApiMongoDB && LocalStorageUtility.getEntryBoolean(StorageKey.QueryTimeoutEnabled),
    [isPreferredApiMongoDB],
  );

  const createIterator = useCallback((): QueryIterator<ItemDefinition & Resource> => {
    const _queryAbortController = new AbortController();
    setQueryAbortController(_queryAbortController);
    const filter: string = filterContent.trim();
    const query: string = buildQuery(
      isPreferredApiMongoDB,
      filter,
      partitionKeyProperties,
      partitionKey,
      selectedColumnIds,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = {};
    // TODO: Property 'enableCrossPartitionQuery' does not exist on type 'FeedOptions'.
    options.enableCrossPartitionQuery = HeadersUtility.shouldEnableCrossPartitionKey();

    if (resourceTokenPartitionKey) {
      options.partitionKey = resourceTokenPartitionKey;
    }
    // Fixes compile error error TS2741: Property 'throwIfAborted' is missing in type 'AbortSignal' but required in type 'import("/home/runner/work/cosmos-explorer/cosmos-explorer/node_modules/node-abort-controller/index").AbortSignal'.
    options.abortSignal = _queryAbortController.signal;

    return isQueryCopilotSampleContainer
      ? querySampleDocuments(query, options)
      : queryDocuments(_collection.databaseId, _collection.id(), query, options);
  }, [
    filterContent,
    isPreferredApiMongoDB,
    partitionKeyProperties,
    partitionKey,
    resourceTokenPartitionKey,
    isQueryCopilotSampleContainer,
    _collection,
    selectedColumnIds,
  ]);

  const updateDocumentIds = (newDocumentsIds: DocumentId[]): void => {
    setDocumentIds(newDocumentsIds);

    if (onLoadStartKey !== null && onLoadStartKey !== undefined) {
      TelemetryProcessor.traceSuccess(
        Action.Tab,
        {
          databaseName: _collection.databaseId,
          collectionName: _collection.id(),

          dataExplorerArea: Constants.Areas.Tab,
          tabTitle,
        },
        onLoadStartKey,
      );
      setOnLoadStartKey(undefined);
    }
  };

  let loadNextPage = useCallback(
    (iterator: QueryIterator<ItemDefinition & Resource>, applyFilterButtonClicked: boolean): Promise<unknown> => {
      setIsExecuting(true);
      onExecutionErrorChange(false);
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
      return _loadNextPageInternal(iterator)
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

                const partitionKey = _partitionKey || (_collection && _collection.partitionKey);
                const partitionKeyPropertyHeaders = _collection?.partitionKeyPropertyHeaders || partitionKey?.paths;
                const partitionKeyProperties = partitionKeyPropertyHeaders?.map((partitionKeyPropertyHeader) =>
                  partitionKeyPropertyHeader.replace(/[/]+/g, ".").substring(1).replace(/[']+/g, ""),
                );

                return newDocumentId(rawDocument, partitionKeyProperties, partitionKeyValue);
              });

            const merged = currentDocuments.concat(nextDocumentIds);
            updateDocumentIds(merged);
          },
          (error) => {
            onExecutionErrorChange(true);
            const errorMessage = getErrorMessage(error);
            logConsoleError(errorMessage);
            if (onLoadStartKey !== null && onLoadStartKey !== undefined) {
              TelemetryProcessor.traceFailure(
                Action.Tab,
                {
                  databaseName: _collection.databaseId,
                  collectionName: _collection.id(),

                  dataExplorerArea: Constants.Areas.Tab,
                  tabTitle,
                  error: errorMessage,
                  errorStack: getErrorStack(error),
                },
                onLoadStartKey,
              );
              setOnLoadStartKey(undefined);
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
    },
    [
      onExecutionErrorChange,
      queryTimeoutEnabled,
      isExecuting,
      queryAbortController,
      documentIds,
      onLoadStartKey,
      _partitionKey,
      _collection,
      newDocumentId,
      tabTitle,
      cancelQueryTimeoutID,
    ],
  );

  useEffect(() => {
    if (documentsIterator) {
      loadNextPage(documentsIterator.iterator, documentsIterator.applyFilterButtonPressed);
    }
  }, [
    documentsIterator, // loadNextPage: disabled as it will trigger a circular dependency and infinite loop
  ]);

  const onLoadMoreKeyInput: KeyboardEventHandler<HTMLAnchorElement> = (event) => {
    if (event.key === " " || event.key === "Enter") {
      const focusElement = event.target as HTMLElement;
      loadNextPage(documentsIterator.iterator, false);
      focusElement && focusElement.focus();
      event.stopPropagation();
      event.preventDefault();
    }
  };

  const onFilterKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === Constants.NormalizedEventKey.Enter) {
      onApplyFilterClick();

      // Suppress the default behavior of the key
      e.preventDefault();
    }
  };

  const _isQueryCopilotSampleContainer =
    _collection?.isSampleCollection &&
    _collection?.databaseId === QueryCopilotSampleDatabaseId &&
    _collection?.id() === QueryCopilotSampleContainerId;

  // Table config here
  const tableItems: DocumentsTableComponentItem[] = documentIds.map((documentId) => {
    const item: DocumentsTableComponentItem = documentId.tableFields || { id: documentId.id() };

    if (partitionKeyPropertyHeaders && documentId.stringPartitionKeyValues) {
      for (let i = 0; i < partitionKeyPropertyHeaders.length; i++) {
        item[partitionKeyPropertyHeaders[i]] = documentId.stringPartitionKeyValues[i];
      }
    }

    return item;
  });

  const extractColumnDefinitionsFromDocument = (document: unknown): ColumnDefinition[] => {
    let columnDefinitions: ColumnDefinition[] = Object.keys(document)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((key) => typeof (document as any)[key] === "string" || typeof (document as any)[key] === "number") // Only allow safe types for displayable React children
      .map((key) =>
        key === "id"
          ? { id: key, label: isPreferredApiMongoDB ? "_id" : "id", isPartitionKey: false }
          : { id: key, label: key, isPartitionKey: false },
      );

    if (showPartitionKey(_collection, isPreferredApiMongoDB)) {
      columnDefinitions.push(
        ...partitionKeyPropertyHeaders.map((key) => ({ id: key, label: key, isPartitionKey: true })),
      );

      // Remove properties that are the partition keys, since they are already included
      columnDefinitions = columnDefinitions.filter(
        (columnDefinition) => !partitionKeyProperties.includes(columnDefinition.id),
      );
    }

    return columnDefinitions;
  };

  /**
   * Extract column definitions from document and add to the definitions
   * @param document
   */
  const setColumnDefinitionsFromDocument = (document: unknown): void => {
    const currentIds = new Set(columnDefinitions.map((columnDefinition) => columnDefinition.id));
    extractColumnDefinitionsFromDocument(document).forEach((columnDefinition) => {
      if (!currentIds.has(columnDefinition.id)) {
        columnDefinitions.push(columnDefinition);
      }
    });
    setColumnDefinitions([...columnDefinitions]);
  };

  /**
   * replicate logic of selectedDocument.click();
   * Document has been clicked on in table
   * @param tabRowId
   */
  const onDocumentClicked = (tabRowId: TableRowId, currentDocumentIds: DocumentId[]) => {
    const index = tabRowId as number;
    setClickedRowIndex(index);
    loadDocument(currentDocumentIds[index]);
  };

  let loadDocument = (documentId: DocumentId) =>
    (_isQueryCopilotSampleContainer ? readSampleDocument(documentId) : readDocument(_collection, documentId)).then(
      (content) => {
        initDocumentEditor(documentId, content);

        // Update columns
        setColumnDefinitionsFromDocument(content);
      },
    );

  const initDocumentEditor = (documentId: DocumentId, documentContent: unknown): void => {
    if (documentId) {
      const content: string = renderObjectForEditor(documentContent, null, 4);
      setSelectedDocumentContentBaseline(content);
      setSelectedDocumentContent(content);
      setInitialDocumentContent(content);

      const newState = documentId
        ? ViewModels.DocumentExplorerState.existingDocumentNoEdits
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
      setEditorState(ViewModels.DocumentExplorerState.existingDocumentNoEdits);
      return;
    }

    // Mongo uses BSON format for _id, trying to parse it as JSON blocks normal flow in an edit
    // Bypass validation for mongo
    if (isPreferredApiMongoDB) {
      onValidDocumentEdit();
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

    setEditorState(ViewModels.DocumentExplorerState.existingDocumentDirtyValid);
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
      editorState === ViewModels.DocumentExplorerState.existingDocumentNoEdits ||
      editorState === ViewModels.DocumentExplorerState.existingDocumentDirtyValid
    ) {
      setEditorState(ViewModels.DocumentExplorerState.existingDocumentDirtyInvalid);
      return;
    }
  };

  const tableContainerRef = useRef(null);
  const [tableContainerSizePx, setTableContainerSizePx] = useState<{ height: number; width: number }>(undefined);
  useEffect(() => {
    if (!tableContainerRef.current) {
      return undefined;
    }
    const resizeObserver = new ResizeObserver(() => {
      setTableContainerSizePx({
        height: tableContainerRef.current.offsetHeight - loadMoreHeight,
        width: tableContainerRef.current.offsetWidth,
      });
    });
    resizeObserver.observe(tableContainerRef.current);
    return () => resizeObserver.disconnect(); // clean up
  }, []);

  // Column definition is a map<id, ColumnDefinition> to garantee uniqueness
  const [columnDefinitions, setColumnDefinitions] = useState<ColumnDefinition[]>(() => {
    const persistedColumnsSelection = readDocumentsTabSubComponentState<ColumnsSelection>(
      SubComponentName.ColumnsSelection,
      _collection,
      undefined,
    );

    if (!persistedColumnsSelection) {
      return extractColumnDefinitionsFromDocument({
        id: "id",
      });
    }

    return persistedColumnsSelection.columnDefinitions;
  });

  const onSelectedRowsChange = (selectedRows: Set<TableRowId>) => {
    confirmDiscardingChange(() => {
      if (selectedRows.size === 0) {
        setSelectedDocumentContent(undefined);
        setClickedRowIndex(undefined);
        setEditorState(ViewModels.DocumentExplorerState.noDocumentSelected);
      }

      // Find if clickedRow is in selectedRows.If not, clear clickedRow and content
      if (clickedRowIndex !== undefined && !selectedRows.has(clickedRowIndex)) {
        setClickedRowIndex(undefined);
        setSelectedDocumentContent(undefined);
        setEditorState(ViewModels.DocumentExplorerState.noDocumentSelected);
      }

      // If only one selection, we consider as a click
      if (selectedRows.size === 1) {
        setEditorState(ViewModels.DocumentExplorerState.existingDocumentNoEdits);
        onDocumentClicked(selectedRows.values().next().value, documentIds);
      }

      setSelectedRows(selectedRows);
    });
  };

  // ********* Override here for mongo (from MongoDocumentsTab) **********
  if (isPreferredApiMongoDB) {
    loadDocument = (documentId: DocumentId) =>
      MongoProxyClient.readDocument(_collection.databaseId, _collection as ViewModels.Collection, documentId).then(
        (content) => {
          initDocumentEditor(documentId, content);
        },
      );

    renderObjectForEditor = (value: unknown): string => MongoUtility.tojson(value, null, false);

    const _hasShardKeySpecified = (document: unknown): boolean => {
      const partitionKeyDefinition: PartitionKeyDefinition = _getPartitionKeyDefinition() as PartitionKeyDefinition;
      return partitionKeyDefinition.systemKey || Boolean(extractPartitionKeyValues(document, partitionKeyDefinition));
    };

    const _getPartitionKeyDefinition = (): DataModels.PartitionKey => {
      let partitionKey: DataModels.PartitionKey = _partitionKey;

      if (
        _partitionKey &&
        _partitionKey.paths &&
        _partitionKey.paths.length &&
        _partitionKey.paths.length > 0 &&
        _partitionKey.paths[0].indexOf("$v") > -1
      ) {
        // Convert BsonSchema2 to /path format
        partitionKey = {
          kind: partitionKey.kind,
          paths: ["/" + partitionKeyProperties?.[0].replace(/\./g, "/")],
          version: partitionKey.version,
        };
      }

      return partitionKey;
    };

    partitionKeyProperties = partitionKeyProperties.map((partitionKeyProperty, i) => {
      if (partitionKeyProperty && ~partitionKeyProperty.indexOf(`"`)) {
        partitionKeyProperty = partitionKeyProperty.replace(/["]+/g, "");
      }

      if (partitionKeyProperty && partitionKeyProperty.indexOf("$v") > -1) {
        // From $v.shard.$v.key.$v > shard.key
        partitionKeyProperty = partitionKeyProperty.replace(/.\$v/g, "").replace(/\$v./g, "");
        partitionKeyPropertyHeaders[i] = "/" + partitionKeyProperty;
      }

      return partitionKeyProperty;
    });

    onSaveNewDocumentClick = useCallback((): Promise<unknown> => {
      const documentContent = JSON.parse(selectedDocumentContent);
      const startKey: number = TelemetryProcessor.traceStart(Action.CreateDocument, {
        dataExplorerArea: Constants.Areas.Tab,
        tabTitle,
      });

      const partitionKeyProperty = partitionKeyProperties?.[0];
      if (partitionKeyProperty !== "_id" && !_hasShardKeySpecified(documentContent)) {
        const message = `The document is lacking the shard property: ${partitionKeyProperty}`;
        useDialog.getState().showOkModalDialog("Create document failed", message);
        onExecutionErrorChange(true);
        TelemetryProcessor.traceFailure(
          Action.CreateDocument,
          {
            dataExplorerArea: Constants.Areas.Tab,
            tabTitle,
            error: message,
          },
          startKey,
        );
        Logger.logError("Failed to save new document: Document shard key not defined", "MongoDocumentsTab");
        throw new Error("Document without shard key");
      }

      onExecutionErrorChange(false);
      setIsExecuting(true);
      return MongoProxyClient.createDocument(
        _collection.databaseId,
        _collection as ViewModels.Collection,
        partitionKeyProperties?.[0],
        documentContent,
      )
        .then(
          (savedDocument: { _self: unknown }) => {
            const partitionKeyArray: PartitionKey[] = extractPartitionKeyValues(
              savedDocument,
              _getPartitionKeyDefinition() as PartitionKeyDefinition,
            );

            const id = new ObjectId(this, savedDocument, partitionKeyArray);
            const ids = documentIds;
            ids.push(id);
            delete savedDocument._self;

            const value: string = renderObjectForEditor(savedDocument || {}, null, 4);
            setSelectedDocumentContentBaseline(value);
            setSelectedDocumentContent(value);
            setInitialDocumentContent(value);

            setDocumentIds(ids);
            setEditorState(ViewModels.DocumentExplorerState.existingDocumentNoEdits);
            TelemetryProcessor.traceSuccess(
              Action.CreateDocument,
              {
                dataExplorerArea: Constants.Areas.Tab,
                tabTitle,
              },
              startKey,
            );
          },
          (error) => {
            onExecutionErrorChange(true);
            const errorMessage = getErrorMessage(error);
            useDialog.getState().showOkModalDialog("Create document failed", errorMessage);
            TelemetryProcessor.traceFailure(
              Action.CreateDocument,
              {
                dataExplorerArea: Constants.Areas.Tab,
                tabTitle,
                error: errorMessage,
                errorStack: getErrorStack(error),
              },
              startKey,
            );
          },
        )
        .then(() => setSelectedRows(new Set([documentIds.length - 1])))
        .finally(() => setIsExecuting(false));
    }, [
      selectedDocumentContent,
      tabTitle,
      partitionKeyProperties,
      _hasShardKeySpecified,
      onExecutionErrorChange,
      _collection,
      _getPartitionKeyDefinition,
      documentIds,
    ]);

    onSaveExistingDocumentClick = (): Promise<void> => {
      const documentContent = selectedDocumentContent;
      onExecutionErrorChange(false);
      setIsExecuting(true);
      const startKey: number = TelemetryProcessor.traceStart(Action.UpdateDocument, {
        dataExplorerArea: Constants.Areas.Tab,
        tabTitle,
      });

      const selectedDocumentId = documentIds[clickedRowIndex as number];
      return MongoProxyClient.updateDocument(
        _collection.databaseId,
        _collection as ViewModels.Collection,
        selectedDocumentId,
        documentContent,
      )
        .then(
          (updatedDocument: { _rid: string }) => {
            const value: string = renderObjectForEditor(updatedDocument || {}, null, 4);
            setSelectedDocumentContentBaseline(value);

            documentIds.forEach((documentId: DocumentId) => {
              if (documentId.rid === updatedDocument._rid) {
                const partitionKeyArray: PartitionKey[] = extractPartitionKeyValues(
                  updatedDocument,
                  _getPartitionKeyDefinition() as PartitionKeyDefinition,
                );

                const id = new ObjectId(this, updatedDocument, partitionKeyArray);
                documentId.id(id.id());
              }
            });
            setEditorState(ViewModels.DocumentExplorerState.existingDocumentNoEdits);
            TelemetryProcessor.traceSuccess(
              Action.UpdateDocument,
              {
                dataExplorerArea: Constants.Areas.Tab,
                tabTitle,
              },
              startKey,
            );
          },
          (error) => {
            onExecutionErrorChange(true);
            const errorMessage = getErrorMessage(error);
            useDialog.getState().showOkModalDialog("Update document failed", errorMessage);
            TelemetryProcessor.traceFailure(
              Action.UpdateDocument,
              {
                dataExplorerArea: Constants.Areas.Tab,
                tabTitle,
                error: errorMessage,
                errorStack: getErrorStack(error),
              },
              startKey,
            );
          },
        )
        .finally(() => setIsExecuting(false));
    };

    loadNextPage = (): Promise<unknown> => {
      setIsExecuting(true);
      onExecutionErrorChange(false);
      const filter: string = filterContent.trim();
      const query: string = buildQuery(isPreferredApiMongoDB, filter, selectedColumnIds);

      return MongoProxyClient.queryDocuments(
        _collection.databaseId,
        _collection as ViewModels.Collection,
        true,
        query,
        continuationToken,
      )
        .then(
          ({ continuationToken: newContinuationToken, documents }) => {
            setContinuationToken(newContinuationToken);
            const currentDocumentsRids = documentIds.map((currentDocument) => currentDocument.rid);
            const nextDocumentIds = documents
              .filter((d: { _rid: string }) => {
                return currentDocumentsRids.indexOf(d._rid) < 0;
              })
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((rawDocument: any) => {
                const partitionKeyValue = rawDocument._partitionKeyValue;
                return newDocumentId(rawDocument, partitionKeyProperties, [partitionKeyValue]);
              });

            const merged = documentIds.concat(nextDocumentIds);
            updateDocumentIds(merged);
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error: any) => {
            if (onLoadStartKey !== null && onLoadStartKey !== undefined) {
              TelemetryProcessor.traceFailure(
                Action.Tab,
                {
                  databaseName: _collection.databaseId,
                  collectionName: _collection.id(),

                  dataExplorerArea: Constants.Areas.Tab,
                  tabTitle,
                  error: getErrorMessage(error),
                  errorStack: getErrorStack(error),
                },
                _onLoadStartKey,
              );
              setOnLoadStartKey(undefined);
            }
          },
        )
        .finally(() => setIsExecuting(false));
    };
  }
  // ***************** Mongo ***************************

  const onApplyFilterClick = (): void => {
    refreshDocumentsGrid(true);

    // Remove duplicates, but keep order
    if (lastFilterContents.includes(filterContent)) {
      lastFilterContents.splice(lastFilterContents.indexOf(filterContent), 1);
    }

    // Save filter content to local storage
    lastFilterContents.unshift(filterContent);

    // Keep the list size under MAX_FILTER_HISTORY_COUNT. Drop last element if needed.
    const limitedLastFilterContents = lastFilterContents.slice(0, MAX_FILTER_HISTORY_COUNT);

    setLastFilterContents(limitedLastFilterContents);
    saveDocumentsTabSubComponentState<FilterHistory>(SubComponentName.FilterHistory, _collection, lastFilterContents);
  };

  const refreshDocumentsGrid = useCallback(
    (applyFilterButtonPressed: boolean): void => {
      // clear documents grid
      setDocumentIds([]);
      setContinuationToken(undefined); // For mongo
      try {
        // reset iterator which will autoload documents (in useEffect)
        setDocumentsIterator({
          iterator: createIterator(),
          applyFilterButtonPressed,
        });

        // If apply filter is pressed, reset current selected document
        if (applyFilterButtonPressed) {
          setClickedRowIndex(RESET_INDEX);
          setEditorState(ViewModels.DocumentExplorerState.noDocumentSelected);
          setSelectedDocumentContent(undefined);
        }
      } catch (error) {
        console.error(error);
        useDialog.getState().showOkModalDialog("Refresh documents grid failed", getErrorMessage(error));
      }
    },
    [createIterator, filterContent],
  );

  /**
   * While retrying, display: retrying now.
   * If completed and all documents were deleted, display: all documents deleted.
   * @returns 429 warning message
   */
  const get429WarningMessageNoSql = (): string => {
    let message = 'Some delete requests failed due to a "Request too large" exception (429)';

    if (bulkDeleteOperation.count === bulkDeleteProcess.successfulIds.length) {
      message += ", but were successfully retried.";
    } else if (bulkDeleteMode === "inProgress" || bulkDeleteMode === "aborting") {
      message += ". Retrying now.";
    } else {
      message += ".";
    }

    return (message +=
      " To prevent this in the future, consider increasing the throughput on your container or database.");
  };

  const onColumnSelectionChange = (newSelectedColumnIds: string[]): void => {
    // Do not allow to unselecting all columns
    if (newSelectedColumnIds.length === 0) {
      return;
    }

    setSelectedColumnIds(newSelectedColumnIds);

    saveDocumentsTabSubComponentState<ColumnsSelection>(SubComponentName.ColumnsSelection, _collection, {
      selectedColumnIds: newSelectedColumnIds,
      columnDefinitions,
    });
  };

  const prevSelectedColumnIds = usePrevious({ selectedColumnIds, setSelectedColumnIds });

  useEffect(() => {
    // If we are adding a field, let's refresh to include the field in the query
    let addedField = false;
    for (const field of selectedColumnIds) {
      if (
        !defaultQueryFields.includes(field) &&
        prevSelectedColumnIds &&
        !prevSelectedColumnIds.selectedColumnIds.includes(field)
      ) {
        addedField = true;
        break;
      }
    }

    if (addedField) {
      refreshDocumentsGrid(false);
    }
  }, [prevSelectedColumnIds, refreshDocumentsGrid, selectedColumnIds]);

  // TODO: remove partitionKey.systemKey when JS SDK bug is fixed
  const isBulkDeleteDisabled = partitionKey.systemKey && !isPreferredApiMongoDB;
  //  -------------------------------------------------------

  const getFilterChoices = (): InputDatalistDropdownOptionSection[] => {
    const options: InputDatalistDropdownOptionSection[] = [];
    const nonBlankLastFilters = lastFilterContents.filter((filter) => filter.trim() !== "");
    if (nonBlankLastFilters.length > 0) {
      options.push({
        label: "Saved filters",
        options: nonBlankLastFilters,
      });
    }
    options.push({
      label: "Default filters",
      options: isPreferredApiMongoDB ? defaultMongoFilters : getDefaultSqlFilters(partitionKeyProperties),
    });
    return options;
  };

  const updateFilterContent = (filter: string): void => {
    if (filter === "" || filter === undefined) {
      deleteDocumentsTabSubComponentState(SubComponentName.CurrentFilter, _collection);
    } else {
      saveDocumentsTabSubComponentState<string>(SubComponentName.CurrentFilter, _collection, filter, true);
    }
    setFilterContent(filter);
  };

  return (
    <CosmosFluentProvider className={styles.container}>
      <div data-testid={"DocumentsTab"} className="tab-pane active" role="tabpanel" style={{ display: "flex" }}>
        <div data-testid={"DocumentsTab/Filter"} className={`${styles.filterRow} ${styles.smallScreenContent}`}>
          {!isPreferredApiMongoDB && <span> SELECT * FROM c </span>}
          <InputDataList
            dropdownOptions={getFilterChoices()}
            placeholder={
              isPreferredApiMongoDB
                ? "Type a query predicate (e.g., {´a´:´foo´}), or choose one from the drop down list, or leave empty to query all documents."
                : "Type a query predicate (e.g., WHERE c.id=´1´), or choose one from the drop down list, or leave empty to query all documents."
            }
            title="Type a query predicate or choose one from the list."
            value={filterContent}
            onChange={updateFilterContent}
            onKeyDown={onFilterKeyDown}
            bottomLink={{ text: "Learn more", url: DATA_EXPLORER_DOC_URL }}
          />
          <Button
            appearance="primary"
            data-testid={"DocumentsTab/ApplyFilter"}
            size="small"
            onClick={() => {
              if (isExecuting) {
                if (!isPreferredApiMongoDB) {
                  queryAbortController.abort();
                }
              } else {
                onApplyFilterClick();
              }
            }}
            disabled={isExecuting && isPreferredApiMongoDB}
            aria-label={!isExecuting || isPreferredApiMongoDB ? "Apply filter" : "Cancel"}
            tabIndex={0}
          >
            {!isExecuting || isPreferredApiMongoDB ? "Apply Filter" : "Cancel"}
          </Button>
        </div>
        <Allotment
          onDragEnd={(sizes: number[]) => {
            tabStateData.leftPaneWidthPercent = (100 * sizes[0]) / (sizes[0] + sizes[1]);
            saveDocumentsTabSubComponentState<TabDivider>(SubComponentName.MainTabDivider, _collection, tabStateData);
            setTabStateData(tabStateData);
          }}
        >
          <Allotment.Pane preferredSize={`${tabStateData.leftPaneWidthPercent}%`} minSize={55}>
            <div
              data-testid={"DocumentsTab/DocumentsPane"}
              style={{ height: "100%", width: "100%", overflow: "hidden" }}
              ref={tableContainerRef}
            >
              <div className={styles.tableContainer}>
                <div
                  style={
                    {
                      height: "100%",
                      width: `calc(100% + ${calculateOffset(selectedColumnIds.length)}px)`,
                    } /* Fix to make table not resize beyond parent's width */
                  }
                >
                  <DocumentsTableComponent
                    onRefreshTable={() => refreshDocumentsGrid(false)}
                    items={tableItems}
                    onSelectedRowsChange={onSelectedRowsChange}
                    selectedRows={selectedRows}
                    size={tableContainerSizePx}
                    selectedColumnIds={selectedColumnIds}
                    columnDefinitions={columnDefinitions}
                    isRowSelectionDisabled={
                      isBulkDeleteDisabled || (isFabric() && userContext.fabricContext?.isReadOnly)
                    }
                    onColumnSelectionChange={onColumnSelectionChange}
                    defaultColumnSelection={getInitialColumnSelection()}
                    collection={_collection}
                    isColumnSelectionDisabled={isPreferredApiMongoDB}
                  />
                </div>
                {tableContainerSizePx?.width >= calculateOffset(selectedColumnIds.length) + 200 && (
                  <div
                    title="Refresh"
                    className={styles.refreshBtn}
                    role="button"
                    onClick={() => refreshDocumentsGrid(false)}
                    aria-label="Refresh"
                    tabIndex={0}
                  >
                    <img src={RefreshIcon} alt="Refresh" />
                  </div>
                )}
              </div>
              {tableItems.length > 0 && (
                <a
                  className={styles.loadMore}
                  data-testid={"DocumentsTab/LoadMore"}
                  role="button"
                  tabIndex={0}
                  onClick={() => loadNextPage(documentsIterator.iterator, false)}
                  onKeyDown={onLoadMoreKeyInput}
                >
                  Load more
                </a>
              )}
            </div>
          </Allotment.Pane>
          <Allotment.Pane minSize={30}>
            <div data-testid={"DocumentsTab/ResultsPane"} style={{ height: "100%", width: "100%" }}>
              {isTabActive && selectedDocumentContent && selectedRows.size <= 1 && (
                <EditorReact
                  language={"json"}
                  content={selectedDocumentContent}
                  isReadOnly={false}
                  ariaLabel={"Document editor"}
                  lineNumbers={"on"}
                  theme={"_theme"}
                  onContentChanged={_onEditorContentChange}
                  enableWordWrapContextMenuItem={true}
                />
              )}
              {selectedRows.size > 1 && (
                <span style={{ margin: 10 }}>Number of selected documents: {selectedRows.size}</span>
              )}
            </div>
          </Allotment.Pane>
        </Allotment>
      </div>
      {bulkDeleteOperation && (
        <ProgressModalDialog
          isOpen={isBulkDeleteDialogOpen}
          dismissText="Abort"
          onDismiss={() => {
            setIsBulkDeleteDialogOpen(false);
            setBulkDeleteOperation(undefined);
          }}
          onCancel={() => setBulkDeleteMode("aborting")}
          title={`Deleting ${bulkDeleteOperation.count} document(s)`}
          message={`Successfully deleted ${bulkDeleteProcess.successfulIds.length} document(s).`}
          maxValue={bulkDeleteOperation.count}
          value={bulkDeleteProcess.successfulIds.length}
          mode={bulkDeleteMode}
        >
          <div className={styles.deleteProgressContent}>
            {(bulkDeleteMode === "aborting" || bulkDeleteMode === "aborted") && (
              <div style={{ paddingBottom: tokens.spacingVerticalL }}>Deleting document(s) was aborted.</div>
            )}
            {(bulkDeleteProcess.failedIds.length > 0 ||
              (bulkDeleteProcess.throttledIds.length > 0 && bulkDeleteMode !== "inProgress")) && (
              <MessageBar intent="error" style={{ marginBottom: tokens.spacingVerticalL }}>
                <MessageBarBody>
                  <MessageBarTitle>Error</MessageBarTitle>
                  Failed to delete{" "}
                  {bulkDeleteMode === "inProgress"
                    ? bulkDeleteProcess.failedIds.length
                    : bulkDeleteProcess.failedIds.length + bulkDeleteProcess.throttledIds.length}{" "}
                  document(s).
                </MessageBarBody>
              </MessageBar>
            )}
            {bulkDeleteProcess.hasBeenThrottled && (
              <MessageBar intent="warning">
                <MessageBarBody>
                  <MessageBarTitle>Warning</MessageBarTitle>
                  {get429WarningMessageNoSql()}{" "}
                  <Link href={NO_SQL_THROTTLING_DOC_URL} target="_blank">
                    Learn More
                  </Link>
                </MessageBarBody>
              </MessageBar>
            )}
          </div>
        </ProgressModalDialog>
      )}
    </CosmosFluentProvider>
  );
};
