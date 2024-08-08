import { Item, ItemDefinition, PartitionKey, PartitionKeyDefinition, QueryIterator, Resource } from "@azure/cosmos";
import {
  Button,
  Input,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  TableRowId,
  makeStyles,
  shorthands,
} from "@fluentui/react-components";
import { ArrowClockwise16Filled, ArrowResetRegular, Dismiss16Filled } from "@fluentui/react-icons";
import { KeyCodes, QueryCopilotSampleContainerId, QueryCopilotSampleDatabaseId } from "Common/Constants";
import { getErrorMessage, getErrorStack } from "Common/ErrorHandlingUtils";
import MongoUtility from "Common/MongoUtility";
import { StyleConstants } from "Common/StyleConstants";
import { createDocument } from "Common/dataAccess/createDocument";
import {
  deleteDocument as deleteNoSqlDocument,
  deleteDocuments as deleteNoSqlDocuments,
} from "Common/dataAccess/deleteDocument";
import { queryDocuments } from "Common/dataAccess/queryDocuments";
import { readDocument } from "Common/dataAccess/readDocument";
import { updateDocument } from "Common/dataAccess/updateDocument";
import { Platform, configContext } from "ConfigContext";
import { CommandButtonComponentProps } from "Explorer/Controls/CommandButton/CommandButtonComponent";
import { useDialog } from "Explorer/Controls/Dialog";
import { EditorReact } from "Explorer/Controls/Editor/EditorReact";
import Explorer from "Explorer/Explorer";
import { useCommandBar } from "Explorer/Menus/CommandBar/CommandBarComponentAdapter";
import { querySampleDocuments, readSampleDocument } from "Explorer/QueryCopilot/QueryCopilotUtilities";
import {
  TabDivider,
  deleteSubComponentState,
  readSubComponentState,
  saveSubComponentState,
} from "Explorer/Tabs/DocumentsTabV2/DocumentsTabStateUtil";
import { CosmosFluentProvider, LayoutConstants, cosmosShorthands, tokens } from "Explorer/Theme/ThemeUtil";
import { useSelectedNode } from "Explorer/useSelectedNode";
import { KeyboardAction, KeyboardActionGroup, useKeyboardActionGroup } from "KeyboardShortcuts";
import { QueryConstants } from "Shared/Constants";
import { LocalStorageUtility, StorageKey } from "Shared/StorageUtility";
import { Action } from "Shared/Telemetry/TelemetryConstants";
import { userContext } from "UserContext";
import { logConsoleError } from "Utils/NotificationConsoleUtils";
import { Allotment } from "allotment";
import React, { KeyboardEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "react-string-format";
import DeleteDocumentIcon from "../../../../images/DeleteDocument.svg";
import NewDocumentIcon from "../../../../images/NewDocument.svg";
import UploadIcon from "../../../../images/Upload_16x16.svg";
import DiscardIcon from "../../../../images/discard.svg";
import SaveIcon from "../../../../images/save-cosmos.svg";
import * as Constants from "../../../Common/Constants";
import * as HeadersUtility from "../../../Common/HeadersUtility";
import * as Logger from "../../../Common/Logger";
import * as MongoProxyClient from "../../../Common/MongoProxyClient";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import * as QueryUtils from "../../../Utils/QueryUtils";
import { extractPartitionKeyValues } from "../../../Utils/QueryUtils";
import DocumentId from "../../Tree/DocumentId";
import ObjectId from "../../Tree/ObjectId";
import TabsBase from "../TabsBase";
import { DocumentsTableComponent, DocumentsTableComponentItem } from "./DocumentsTableComponent";

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
  filterInput: {
    flexGrow: 1,
  },
  appliedFilter: {
    flexGrow: 1,
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
});

export class DocumentsTabV2 extends TabsBase {
  public partitionKey: DataModels.PartitionKey;
  private documentIds: DocumentId[];
  private title: string;
  private resourceTokenPartitionKey: string;

  constructor(options: ViewModels.DocumentsTabOptions) {
    super(options);

    this.documentIds = options.documentIds();
    this.title = options.title;
    this.partitionKey = options.partitionKey;
    this.resourceTokenPartitionKey = options.resourceTokenPartitionKey;
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
  _collection: ViewModels.CollectionBase;
  selectedRows: Set<TableRowId>;
  editorState: ViewModels.DocumentExplorerState;
  isPreferredApiMongoDB: boolean;
  onNewDocumentClick: UiKeyboardEvent;
  onSaveNewDocumentClick: UiKeyboardEvent;
  onRevertNewDocumentClick: UiKeyboardEvent;
  onSaveExistingDocumentClick: UiKeyboardEvent;
  onRevertExistingDocumentClick: UiKeyboardEvent;
  onDeleteExistingDocumentsClick: UiKeyboardEvent;
};

const createUploadButton = (container: Explorer): CommandButtonComponentProps => {
  const label = "Upload Item";
  return {
    id: UPLOAD_BUTTON_ID,
    iconSrc: UploadIcon,
    iconAlt: label,
    onCommandClick: () => {
      const selectedCollection: ViewModels.Collection = useSelectedNode.getState().findSelectedCollection();
      selectedCollection && container.openUploadItemsPanePane();
    },
    commandButtonLabel: label,
    ariaLabel: label,
    hasPopup: true,
    disabled:
      useSelectedNode.getState().isDatabaseNodeOrNoneSelected() ||
      useSelectedNode.getState().isQueryCopilotCollectionSelected(),
  };
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
  _collection,
  selectedRows,
  editorState,
  isPreferredApiMongoDB,
  onNewDocumentClick,
  onSaveNewDocumentClick,
  onRevertNewDocumentClick,
  onSaveExistingDocumentClick,
  onRevertExistingDocumentClick,
  onDeleteExistingDocumentsClick,
}: ButtonsDependencies): CommandButtonComponentProps[] => {
  if (configContext.platform === Platform.Fabric && userContext.fabricContext?.isReadOnly) {
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
      disabled: useSelectedNode.getState().isQueryCopilotCollectionSelected(),
      id: DELETE_BUTTON_ID,
    });
  }

  if (!isPreferredApiMongoDB) {
    buttons.push(createUploadButton(_collection.container));
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
export const buildQuery = (
  isMongo: boolean,
  filter: string,
  partitionKeyProperties?: string[],
  partitionKey?: DataModels.PartitionKey,
): string => {
  if (isMongo) {
    return filter || "{}";
  }

  return QueryUtils.buildDocumentsQuery(filter, partitionKeyProperties, partitionKey);
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

const getUniqueId = (collection: ViewModels.CollectionBase): string => `${collection.databaseId}-${collection.id()}`;

const defaultSqlFilters = ['WHERE c.id = "foo"', "ORDER BY c._ts DESC", 'WHERE c.id = "foo" ORDER BY c._ts DESC'];
const defaultMongoFilters = ['{"id":"foo"}', "{ qty: { $gte: 20 } }"];

const ResetFilterButton: React.FunctionComponent<{ onClick: () => void }> = ({ onClick }) => (
  <Menu positioning="below-end">
    <MenuTrigger disableButtonEnhancement>
      <Button
        appearance="transparent"
        icon={<ArrowResetRegular />}
        size="small"
        title="Delete recent filters"
        aria-label="Delete recent filters"
      />
    </MenuTrigger>
    <MenuPopover>
      <MenuList>
        <MenuItem onClick={onClick}>Clear filter history</MenuItem>
      </MenuList>
    </MenuPopover>
  </Menu>
);

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
  const [isFilterCreated, setIsFilterCreated] = useState<boolean>(true);
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);
  const [isFilterFocused, setIsFilterFocused] = useState<boolean>(false);
  const [appliedFilter, setAppliedFilter] = useState<string>("");
  const [filterContent, setFilterContent] = useState<string>("");
  const [documentIds, setDocumentIds] = useState<DocumentId[]>([]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const filterInput = useRef<HTMLInputElement>(null);
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
  const [selectedRows, setSelectedRows] = React.useState<Set<TableRowId>>(() => new Set<TableRowId>([0]));

  // Command buttons
  const [editorState, setEditorState] = useState<ViewModels.DocumentExplorerState>(
    ViewModels.DocumentExplorerState.noDocumentSelected,
  );

  // State
  const [tabStateData, setTabStateData] = useState<TabDivider>(() =>
    readSubComponentState("MainTabDivider", _collection, {
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
  const [lastFilterContents, setLastFilterContents] = useState<string[]>(() =>
    readSubComponentState("FilterHistory", _collection, []),
  );

  const setKeyboardActions = useKeyboardActionGroup(KeyboardActionGroup.ACTIVE_TAB);

  useEffect(() => {
    if (isFilterFocused) {
      filterInput.current?.focus();
    }
  }, [isFilterFocused]);

  // Clicked row must be defined
  useEffect(() => {
    if (documentIds.length > 0) {
      let currentClickedRowIndex = clickedRowIndex;
      if (
        (currentClickedRowIndex === RESET_INDEX &&
          editorState === ViewModels.DocumentExplorerState.noDocumentSelected) ||
        currentClickedRowIndex > documentIds.length - 1
      ) {
        // reset clicked row or the current clicked row is out of bounds
        currentClickedRowIndex = INITIAL_SELECTED_ROW_INDEX;
        setSelectedRows(new Set([INITIAL_SELECTED_ROW_INDEX]));
        onDocumentClicked(currentClickedRowIndex, documentIds);
      }
    }
  }, [documentIds, clickedRowIndex, editorState]);

  const applyFilterButton = {
    enabled: true,
    visible: true,
  };

  const partitionKey: DataModels.PartitionKey = useMemo(
    () => _partitionKey || (_collection && _collection.partitionKey),
    [_collection, _partitionKey],
  );
  const partitionKeyPropertyHeaders: string[] = useMemo(
    () => _collection?.partitionKeyPropertyHeaders || partitionKey?.paths,
    [_collection?.partitionKeyPropertyHeaders, partitionKey?.paths],
  );
  let partitionKeyProperties = useMemo(
    () =>
      partitionKeyPropertyHeaders?.map((partitionKeyPropertyHeader) =>
        partitionKeyPropertyHeader.replace(/[/]+/g, ".").substring(1).replace(/[']+/g, ""),
      ),
    [partitionKeyPropertyHeaders],
  );

  // new DocumentId() requires a DocumentTab which we mock with only the required properties
  const newDocumentId = useCallback(
    (rawDocument: DataModels.DocumentId, partitionKeyProperties: string[], partitionKeyValue: string[]) =>
      new DocumentId(
        {
          partitionKey,
          partitionKeyProperties,
          // Fake unused mocks
          isEditorDirty: () => false,
          selectDocument: () => Promise.reject(),
        },
        rawDocument,
        partitionKeyValue,
      ),
    [partitionKey],
  );

  useEffect(() => {
    setDocumentIds(_documentIds);
  }, [_documentIds]);

  // This is executed in onActivate() in the original code.
  useEffect(() => {
    setKeyboardActions({
      [KeyboardAction.SEARCH]: () => {
        onShowFilterClick();
        return true;
      },
      [KeyboardAction.CLEAR_SEARCH]: () => {
        setFilterContent("");
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
      _collection,
      selectedRows,
      editorState,
      isPreferredApiMongoDB,
      onNewDocumentClick,
      onSaveNewDocumentClick,
      onRevertNewDocumentClick,
      onSaveExistingDocumentClick,
      onRevertExistingDocumentClick,
      onDeleteExistingDocumentsClick,
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
   * Implementation using bulk delete NoSQL API
   */
  let _deleteDocuments = useCallback(
    async (toDeleteDocumentIds: DocumentId[]): Promise<DocumentId[]> => {
      onExecutionErrorChange(false);
      const startKey: number = TelemetryProcessor.traceStart(Action.DeleteDocuments, {
        dataExplorerArea: Constants.Areas.Tab,
        tabTitle,
      });
      setIsExecuting(true);

      // TODO: Once JS SDK Bug fix for bulk deleting legacy containers (whose systemKey==1) is released:
      // Remove the check for systemKey, remove call to deleteNoSqlDocument(). deleteNoSqlDocuments() should always be called.
      return (
        partitionKey.systemKey
          ? deleteNoSqlDocument(_collection, toDeleteDocumentIds[0]).then(() => [toDeleteDocumentIds[0]])
          : deleteNoSqlDocuments(_collection, toDeleteDocumentIds)
      )
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
        .finally(() => setIsExecuting(false));
    },
    [_collection, onExecutionErrorChange, tabTitle],
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
            useDialog
              .getState()
              .showOkModalDialog("Delete documents", `${deletedIds.length} document(s) successfully deleted.`);
          },
          (error: Error) =>
            useDialog
              .getState()
              .showOkModalDialog("Delete documents", `Document(s) deleted failed (${JSON.stringify(error)})`),
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

  // If editor state changes, update the nav
  useEffect(
    () =>
      updateNavbarWithTabsButtons(isTabActive, {
        _collection,
        selectedRows,
        editorState,
        isPreferredApiMongoDB,
        onNewDocumentClick,
        onSaveNewDocumentClick,
        onRevertNewDocumentClick,
        onSaveExistingDocumentClick,
        onRevertExistingDocumentClick: onRevertExistingDocumentClick,
        onDeleteExistingDocumentsClick: onDeleteExistingDocumentsClick,
      }),
    [
      _collection,
      selectedRows,
      editorState,
      isPreferredApiMongoDB,
      onNewDocumentClick,
      onSaveNewDocumentClick,
      onRevertNewDocumentClick,
      onSaveExistingDocumentClick,
      onRevertExistingDocumentClick,
      onDeleteExistingDocumentsClick,
      isTabActive,
    ],
  );

  const onShowFilterClick = () => {
    setIsFilterCreated(true);
    setIsFilterExpanded(true);
    setIsFilterFocused(true);
  };

  const queryTimeoutEnabled = useCallback(
    (): boolean => !isPreferredApiMongoDB && LocalStorageUtility.getEntryBoolean(StorageKey.QueryTimeoutEnabled),
    [isPreferredApiMongoDB],
  );

  const createIterator = useCallback((): QueryIterator<ItemDefinition & Resource> => {
    const _queryAbortController = new AbortController();
    setQueryAbortController(_queryAbortController);
    const filter: string = filterContent.trim();
    const query: string = buildQuery(isPreferredApiMongoDB, filter, partitionKeyProperties, partitionKey);
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
  ]);

  const onHideFilterClick = (): void => {
    setIsFilterExpanded(false);
  };

  const onCloseButtonKeyDown: KeyboardEventHandler<HTMLSpanElement> = (event) => {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      onHideFilterClick();
      event.stopPropagation();
      return false;
    }
    return true;
  };

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

  const onRefreshKeyInput: KeyboardEventHandler<HTMLButtonElement> = (event) => {
    if (event.key === " " || event.key === "Enter") {
      const focusElement = event.target as HTMLElement;
      refreshDocumentsGrid(false);
      focusElement && focusElement.focus();
      event.stopPropagation();
      event.preventDefault();
    }
  };

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
    if (e.key === "Enter") {
      onApplyFilterClick();

      // Suppress the default behavior of the key
      e.preventDefault();
    } else if (e.key === "Escape") {
      onHideFilterClick();

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
    const item: Record<string, string> & { id: string } = {
      id: documentId.id(),
    };

    if (partitionKeyPropertyHeaders && documentId.stringPartitionKeyValues) {
      for (let i = 0; i < partitionKeyPropertyHeaders.length; i++) {
        item[partitionKeyPropertyHeaders[i]] = documentId.stringPartitionKeyValues[i];
      }
    }

    return item;
  });

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

  const columnHeaders = {
    idHeader: isPreferredApiMongoDB ? "_id" : "id",
    partitionKeyHeaders: (showPartitionKey(_collection, isPreferredApiMongoDB) && partitionKeyPropertyHeaders) || [],
  };

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
      return Boolean(extractPartitionKeyValues(document, _getPartitionKeyDefinition() as PartitionKeyDefinition));
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

    partitionKeyProperties = partitionKeyProperties?.map((partitionKeyProperty, i) => {
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

    /**
     * Mongo implementation
     * TODO: update proxy to use mongo driver deleteMany
     */
    _deleteDocuments = (toDeleteDocumentIds: DocumentId[]): Promise<DocumentId[]> => {
      const promises = toDeleteDocumentIds.map((documentId) => _deleteDocument(documentId));
      return Promise.all(promises);
    };

    const __deleteDocument = async (documentId: DocumentId): Promise<DocumentId> => {
      await MongoProxyClient.deleteDocument(_collection.databaseId, _collection as ViewModels.Collection, documentId);
      return documentId;
    };

    const _deleteDocument = useCallback(
      (documentId: DocumentId): Promise<DocumentId> => {
        onExecutionErrorChange(false);
        const startKey: number = TelemetryProcessor.traceStart(Action.DeleteDocument, {
          dataExplorerArea: Constants.Areas.Tab,
          tabTitle,
        });
        setIsExecuting(true);
        return __deleteDocument(documentId)
          .then(
            (deletedDocumentId) => {
              TelemetryProcessor.traceSuccess(
                Action.DeleteDocument,
                {
                  dataExplorerArea: Constants.Areas.Tab,
                  tabTitle,
                },
                startKey,
              );
              return deletedDocumentId;
            },
            (error) => {
              onExecutionErrorChange(true);
              console.error(error);
              TelemetryProcessor.traceFailure(
                Action.DeleteDocument,
                {
                  dataExplorerArea: Constants.Areas.Tab,
                  tabTitle,
                  error: getErrorMessage(error),
                  errorStack: getErrorStack(error),
                },
                startKey,
              );
              return undefined;
            },
          )
          .finally(() => setIsExecuting(false));
      },
      [__deleteDocument, onExecutionErrorChange, tabTitle],
    );

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
      const query: string = buildQuery(isPreferredApiMongoDB, filter);

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
    setLastFilterContents([...lastFilterContents]);
    saveSubComponentState("FilterHistory", _collection, lastFilterContents);
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

        // collapse filter
        setAppliedFilter(filterContent);
        setIsFilterExpanded(false);

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

  const deleteRecentFilters = () => {
    setLastFilterContents([]);
    deleteSubComponentState("FilterHistory", _collection);
  };

  return (
    <CosmosFluentProvider className={styles.container}>
      <div className="tab-pane active" role="tabpanel" style={{ display: "flex" }}>
        {isFilterCreated && (
          <>
            {!isFilterExpanded && !isPreferredApiMongoDB && (
              <div className={styles.filterRow}>
                <span>SELECT * FROM c</span>
                <span className={styles.appliedFilter}>{appliedFilter}</span>
                <Button appearance="primary" size="small" onClick={onShowFilterClick}>
                  Edit Filter
                </Button>
              </div>
            )}
            {!isFilterExpanded && isPreferredApiMongoDB && (
              <div className={styles.filterRow}>
                {appliedFilter.length > 0 && <span>Filter :</span>}
                {!(appliedFilter.length > 0) && <span className="noFilterApplied">No filter applied</span>}
                <span className={styles.appliedFilter}>{appliedFilter}</span>
                <Button appearance="primary" size="small" onClick={onShowFilterClick}>
                  Edit Filter
                </Button>
              </div>
            )}
            {isFilterExpanded && (
              <div className={styles.filterRow}>
                {!isPreferredApiMongoDB && <span> SELECT * FROM c </span>}
                <Input
                  ref={filterInput}
                  type="text"
                  size="small"
                  list={`filtersList-${getUniqueId(_collection)}`}
                  className={`filterInput ${styles.filterInput}`}
                  title="Type a query predicate or choose one from the list."
                  placeholder={
                    isPreferredApiMongoDB
                      ? "Type a query predicate (e.g., {´a´:´foo´}), or choose one from the drop down list, or leave empty to query all documents."
                      : "Type a query predicate (e.g., WHERE c.id=´1´), or choose one from the drop down list, or leave empty to query all documents."
                  }
                  value={filterContent}
                  autoFocus={true}
                  onKeyDown={onFilterKeyDown}
                  onChange={(e) => setFilterContent(e.target.value)}
                  onBlur={() => setIsFilterFocused(false)}
                  contentAfter={<ResetFilterButton onClick={deleteRecentFilters} />}
                />

                <datalist id={`filtersList-${getUniqueId(_collection)}`}>
                  {addStringsNoDuplicate(
                    lastFilterContents,
                    isPreferredApiMongoDB ? defaultMongoFilters : defaultSqlFilters,
                  ).map((filter) => (
                    <option key={filter} value={filter} />
                  ))}
                </datalist>

                <Button
                  appearance="primary"
                  size="small"
                  onClick={onApplyFilterClick}
                  disabled={!applyFilterButton.enabled}
                  aria-label="Apply filter"
                  tabIndex={0}
                >
                  Apply Filter
                </Button>
                {!isPreferredApiMongoDB && isExecuting && (
                  <Button
                    appearance="primary"
                    size="small"
                    aria-label="Cancel Query"
                    onClick={() => queryAbortController.abort()}
                    tabIndex={0}
                  >
                    Cancel Query
                  </Button>
                )}
                <Button
                  aria-label="close filter"
                  tabIndex={0}
                  onClick={onHideFilterClick}
                  onKeyDown={onCloseButtonKeyDown}
                  appearance="transparent"
                  size="small"
                  icon={<Dismiss16Filled />}
                />
              </div>
            )}
          </>
        )}
        {/* <Split> doesn't like to be a flex child */}
        <div style={{ overflow: "hidden", height: "100%" }}>
          <Allotment
            onDragEnd={(sizes: number[]) => {
              tabStateData.leftPaneWidthPercent = (100 * sizes[0]) / (sizes[0] + sizes[1]);
              saveSubComponentState("MainTabDivider", _collection, tabStateData);
              setTabStateData(tabStateData);
            }}
          >
            <Allotment.Pane preferredSize={`${tabStateData.leftPaneWidthPercent}%`} minSize={55}>
              <div style={{ height: "100%", width: "100%", overflow: "hidden" }} ref={tableContainerRef}>
                <div className={styles.floatingControlsContainer}>
                  <div className={styles.floatingControls}>
                    <Button
                      appearance="transparent"
                      aria-label="Refresh"
                      size="small"
                      icon={<ArrowClockwise16Filled />}
                      style={{
                        color: StyleConstants.AccentMedium,
                      }}
                      onClick={() => refreshDocumentsGrid(false)}
                      onKeyDown={onRefreshKeyInput}
                    />
                  </div>
                </div>
                <div className={styles.tableContainer}>
                  <DocumentsTableComponent
                    items={tableItems}
                    onItemClicked={(index) => onDocumentClicked(index, documentIds)}
                    onSelectedRowsChange={onSelectedRowsChange}
                    selectedRows={selectedRows}
                    size={tableContainerSizePx}
                    columnHeaders={columnHeaders}
                    isSelectionDisabled={
                      (partitionKey.systemKey && !isPreferredApiMongoDB) ||
                      (configContext.platform === Platform.Fabric && userContext.fabricContext?.isReadOnly)
                    }
                    collection={_collection}
                  />
                </div>
                {tableItems.length > 0 && (
                  <a
                    className={styles.loadMore}
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
              <div style={{ height: "100%", width: "100%" }}>
                {isTabActive && selectedDocumentContent && selectedRows.size <= 1 && (
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
            </Allotment.Pane>
          </Allotment>
        </div>
      </div>
    </CosmosFluentProvider>
  );
};
