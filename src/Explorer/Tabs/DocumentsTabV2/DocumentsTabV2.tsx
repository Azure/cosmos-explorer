import { ItemDefinition, QueryIterator, Resource } from '@azure/cosmos';
import { FluentProvider, Table, TableBody, TableCell, TableCellLayout, TableColumnDefinition, TableHeader, TableHeaderCell, TableRow, TableRowId, TableSelectionCell, createTableColumn, useArrowNavigationGroup, useTableFeatures, useTableSelection } from '@fluentui/react-components';
import Split from '@uiw/react-split';
import { KeyCodes, QueryCopilotSampleContainerId, QueryCopilotSampleDatabaseId } from "Common/Constants";
import { getErrorMessage, getErrorStack } from 'Common/ErrorHandlingUtils';
import { queryDocuments } from 'Common/dataAccess/queryDocuments';
import { readDocument } from 'Common/dataAccess/readDocument';
import { useDialog } from 'Explorer/Controls/Dialog';
import { querySampleDocuments, readSampleDocument } from 'Explorer/QueryCopilot/QueryCopilotUtilities';
import DocumentsTab from 'Explorer/Tabs/DocumentsTab';
import { dataExplorerLightTheme } from 'Explorer/Theme/ThemeUtil';
import { QueryConstants } from 'Shared/Constants';
import { LocalStorageUtility, StorageKey } from 'Shared/StorageUtility';
import { Action } from 'Shared/Telemetry/TelemetryConstants';
import { userContext } from "UserContext";
import { logConsoleError } from 'Utils/NotificationConsoleUtils';
import React, { KeyboardEventHandler, useEffect, useMemo, useState } from "react";
import { format } from "react-string-format";
import CloseIcon from "../../../../images/close-black.svg";
import * as Constants from "../../../Common/Constants";
import * as HeadersUtility from "../../../Common/HeadersUtility";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import * as TelemetryProcessor from "../../../Shared/Telemetry/TelemetryProcessor";
import * as QueryUtils from "../../../Utils/QueryUtils";
import DocumentId from "../../Tree/DocumentId";
import TabsBase from "../TabsBase";

type Item = {
  id: string;
  type: string;
};

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
    return <DocumentsTabComponent
      isPreferredApiMongoDB={undefined}
      documentIds={this.documentIds}
      tabId={this.tabId}
      collection={this.collection}
      partitionKey={this.partitionKey}
      onLoadStartKey={this.onLoadStartKey}
      tabTitle={this.title}
    />;
  }

  public onActivate(): void {
    super.onActivate();
    this.collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Documents);
  }
}

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
  const [shouldShowEditor, setShouldShowEditor] = useState<boolean>(false);

  // Query
  const [documentsIterator, setDocumentsIterator] = useState<{
    iterator: QueryIterator<ItemDefinition & Resource>,
    applyFilterButtonPressed: boolean
  }>(undefined);
  const [queryAbortController, setQueryAbortController] = useState<AbortController>(undefined);
  const [resourceTokenPartitionKey, setResourceTokenPartitionKey] = useState<string>(undefined);
  const [isQueryCopilotSampleContainer, setIsQueryCopilotSampleContainer] = useState<boolean>(false);
  const [cancelQueryTimeoutID, setCancelQueryTimeoutID] = useState<NodeJS.Timeout>(undefined);

  const [isExecutionError, setIsExecutionError] = useState<boolean>(false);
  const [onLoadStartKey, setOnLoadStartKey] = useState<number>(props.onLoadStartKey);

  // TODO remove this?
  const applyFilterButton = {
    enabled: true,
  };

  const documentContentsContainerId = `documentContentsContainer${props.tabId}`;
  const documentContentsGridId = `documentContentsGrid${props.tabId}`;

  const partitionKey: DataModels.PartitionKey = props.partitionKey || (props.collection && props.collection.partitionKey);
  const partitionKeyPropertyHeaders: string[] = props.collection?.partitionKeyPropertyHeaders || partitionKey?.paths;
  const partitionKeyProperties = partitionKeyPropertyHeaders?.map((partitionKeyPropertyHeader) =>
    partitionKeyPropertyHeader.replace(/[/]+/g, ".").substring(1).replace(/[']+/g, ""),
  );

  const isPreferredApiMongoDB = useMemo(() => userContext.apiType === "Mongo" || props.isPreferredApiMongoDB,
    [props.isPreferredApiMongoDB]);

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
  }, []);

  useEffect(() => {
    if (documentsIterator) {
      loadNextPage(documentsIterator.applyFilterButtonPressed);
    }
  }, [documentsIterator]);

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
    const options: any = {};
    options.enableCrossPartitionQuery = HeadersUtility.shouldEnableCrossPartitionKey();

    if (resourceTokenPartitionKey) {
      options.partitionKey = resourceTokenPartitionKey;
    }
    options.abortSignal = _queryAbortController.signal;
    return isQueryCopilotSampleContainer
      ? querySampleDocuments(query, options)
      : queryDocuments(props.collection.databaseId, props.collection.id(), query, options);
  }

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

  const onHideFilterClick = (): Q.Promise<any> => {
    // this.isFilterExpanded(false);

    $(".filterDocExpanded").removeClass("active");
    $("#content").removeClass("active");
    $(".queryButton").focus();
    return Q();
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

  const onRefreshButtonKeyDown: KeyboardEventHandler<HTMLSpanElement> = (event) => {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      refreshDocumentsGrid();
      event.stopPropagation();
      return false;
    }
    return true;
  };

  const loadNextPage = (applyFilterButtonClicked?: boolean): Promise<any> => {
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
            .filter((d: any) => {
              return currentDocumentsRids.indexOf(d._rid) < 0;
            })
            // map raw response to view model
            .map((rawDocument: any) => {
              const partitionKeyValue = rawDocument._partitionKeyValue;

              // TODO: Mock documentsTab. Fix this
              const partitionKey = props.partitionKey || (props.collection && props.collection.partitionKey);
              const partitionKeyPropertyHeaders = props.collection?.partitionKeyPropertyHeaders || partitionKey?.paths;
              const partitionKeyProperties = partitionKeyPropertyHeaders?.map((partitionKeyPropertyHeader) =>
                partitionKeyPropertyHeader.replace(/[/]+/g, ".").substring(1).replace(/[']+/g, ""),
              );

              return new DocumentId({
                partitionKey,
                partitionKeyPropertyHeaders,
                partitionKeyProperties
              } as DocumentsTab, rawDocument, partitionKeyValue);
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

  const onLoadMoreKeyInput: KeyboardEventHandler<HTMLAnchorElement> = (event): void => {
    if (event.key === " " || event.key === "Enter") {
      const focusElement = document.getElementById(this.documentContentsGridId);
      this.loadNextPage();
      focusElement && focusElement.focus();
      event.stopPropagation();
      event.preventDefault();
    }
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

  const _isQueryCopilotSampleContainer =
    props.collection?.isSampleCollection &&
    props.collection?.databaseId === QueryCopilotSampleDatabaseId &&
    props.collection?.id() === QueryCopilotSampleContainerId;

  /* Below is for the table config */
  const items = documentIds.map((documentId) => ({
    id: documentId.id(),
    // TODO: for now, merge all the pk values into a single string/column
    type: documentId.partitionKeyProperties ? documentId.stringPartitionKeyValues.join(",") : undefined,
  }));

  const columns: TableColumnDefinition<Item>[] = [
    createTableColumn<Item>({
      columnId: "id",
      compare: (a, b) => {
        return a.id.localeCompare(b.id);
      },
      renderHeaderCell: () => {
        return "id";
      },
      renderCell: (item) => {
        return (
          <TableCellLayout>{item.id}</TableCellLayout>
        );
      },
    }),
    createTableColumn<Item>({
      columnId: "type",
      compare: (a, b) => {
        return a.type.localeCompare(b.type);
      },
      renderHeaderCell: () => {
        return "/type";
      },
      renderCell: (item) => {
        return (
          <TableCellLayout>{item.type}</TableCellLayout>
        );
      },
    }),
  ];
  const [selectedRows, setSelectedRows] = React.useState<Set<TableRowId>>(
    () => new Set<TableRowId>([0])
  );

  const {
    getRows,
    selection: {
      allRowsSelected,
      someRowsSelected,
      toggleAllRows,
      toggleRow,
      isRowSelected,
    },
  } = useTableFeatures(
    {
      columns,
      items,
    },
    [
      useTableSelection({
        selectionMode: "multiselect",
        selectedItems: selectedRows,
        onSelectionChange: (e, data) => setSelectedRows(data.selectedItems),
      }),
    ]
  );

  const rows = getRows((row) => {
    const selected = isRowSelected(row.rowId);
    return {
      ...row,
      onClick: (e: React.MouseEvent) => toggleRow(e, row.rowId),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === " ") {
          e.preventDefault();
          toggleRow(e, row.rowId);
        }
      },
      selected,
      appearance: selected ? ("brand" as const) : ("none" as const),
    };
  });

  const toggleAllKeydown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === " ") {
        toggleAllRows(e);
        e.preventDefault();
      }
    },
    [toggleAllRows]
  );

  const [currentDocument, setCurrentDocument] = useState<unknown>(undefined);

  // Load document depending on selection
  useEffect(() => {
    if (selectedRows.size === 1 && documentIds.length > 0) {
      const documentId = documentIds[selectedRows.values().next().value];

      // TODO: replicate logic of selectedDocument.click();
      // TODO: Check if editor is dirty

      (_isQueryCopilotSampleContainer
        ? readSampleDocument(documentId)
        : readDocument(props.collection, documentId)).then((content) => {
          // this.initDocumentEditor(documentId, content);
          setCurrentDocument(content);
        });
    }
  }, [selectedRows, documentIds]);

  // Cell keyboard navigation
  const keyboardNavAttr = useArrowNavigationGroup({ axis: "grid" });

  /* End of table config */

  return <FluentProvider theme={dataExplorerLightTheme} style={{ overflow: "hidden" }}>
    <div
      className="tab-pane active tabdocuments flexContainer"
      data-bind="
    setTemplateReady: true,
    attr:{
        id: tabId
    },
    visible: isActive"
      role="tabpanel"
    >
      {/* <!-- Filter - Start --> */}
      {isFilterCreated &&
        <div className="filterdivs" /*data-bind="visible: isFilterCreated "*/>
          {/* <!-- Read-only Filter - Start --> */}
          {!isFilterExpanded && !isPreferredApiMongoDB &&
            <div className="filterDocCollapsed" /*data-bind="visible: !isFilterExpanded() && !isPreferredApiMongoDB"*/>
              <span className="selectQuery">SELECT * FROM c</span>
              <span className="appliedQuery" /*data-bind="text: appliedFilter"*/>{appliedFilter}</span>
              <button className="filterbtnstyle queryButton" onClick={onShowFilterClick}
                /*data-bind="click: onShowFilterClick"*/>Edit Filter</button>
            </div>
          }
          {!isFilterExpanded && isPreferredApiMongoDB &&
            <div className="filterDocCollapsed" /*data-bind="visible: !isFilterExpanded() && isPreferredApiMongoDB"*/>
              {appliedFilter.length > 0 &&
                <span className="selectQuery" /*data-bind="visible: appliedFilter().length > 0"*/>Filter :</span>
              }
              {!(appliedFilter.length > 0) &&
                <span className="noFilterApplied" /*data-bind="visible: !appliedFilter().length > 0"*/>No filter applied</span>
              }
              <span className="appliedQuery" /*data-bind="text: appliedFilter"*/>{appliedFilter}</span>
              <button className="filterbtnstyle queryButton" onClick={onShowFilterClick} /*data-bind="click: onShowFilterClick"*/>
                Edit Filter
              </button>
            </div>
          }
          {/* <!-- Read-only Filter - End --> */}

          {/* <!-- Editable Filter - start --> */}
          {isFilterExpanded &&
            <div className="filterDocExpanded" /*data-bind="visible: isFilterExpanded"*/>
              <div>
                <div className="editFilterContainer">
                  {!isPreferredApiMongoDB &&
                    <span className="filterspan" /*data-bind="visible: !isPreferredApiMongoDB"*/> SELECT * FROM c </span>
                  }
                  <input
                    type="text"
                    list="filtersList"
                    className={`querydropdown ${filterContent.length === 0 ? "placeholderVisible" : ""}`}
                    title="Type a query predicate or choose one from the list."
                    placeholder={isPreferredApiMongoDB ?
                      "Type a query predicate (e.g., {´a´:´foo´}), or choose one from the drop down list, or leave empty to query all documents." :
                      "Type a query predicate (e.g., WHERE c.id=´1´), or choose one from the drop down list, or leave empty to query all documents."}
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
                    {lastFilterContents.map((filter) =>
                      <option key={filter} value={filter} /*data-bind="value: $data"*/ />
                    )}
                  </datalist>

                  <span className="filterbuttonpad">
                    <button className="filterbtnstyle queryButton" onClick={() => refreshDocumentsGrid(true)}
                      disabled={!applyFilterButton.enabled}
                      /* data-bind="
                                click: refreshDocumentsGrid.bind($data, true),
                                enable: applyFilterButton.enabled"
                      */
                      aria-label="Apply filter" tabIndex={0}>Apply Filter</button>
                  </span>
                  <span className="filterbuttonpad">
                    {!isPreferredApiMongoDB && isExecuting &&
                      <button className="filterbtnstyle queryButton"
                        /* data-bind="
                                  visible: !isPreferredApiMongoDB && isExecuting,
                                  click: onAbortQueryClick"
                        */
                        aria-label="Cancel Query" tabIndex={0}>Cancel Query</button>
                    }
                  </span>
                  <span className="filterclose" role="button" aria-label="close filter" tabIndex={0}
                    onClick={() => onHideFilterClick()} onKeyDown={onCloseButtonKeyDown}
                    /*data-bind="click: onHideFilterClick, event: { keydown: onCloseButtonKeyDown }"*/>
                    <img src={CloseIcon} style={{ height: 14, width: 14 }} alt="Hide filter" />
                  </span>
                </div>
              </div>
            </div>
          }
          {/* <!-- Editable Filter - End --> */}
        </div>
      }
      {/* <!-- Filter - End --> */}

      <Split style={{ height: "100%" }}>
        <div style={{ minWidth: "20%", width: "20%" }}>
          <Table aria-label="Filtered documents table" size="extra-small" {...keyboardNavAttr} role="grid">
            <TableHeader>
              <TableRow>
                <TableSelectionCell
                  checked={
                    allRowsSelected ? true : someRowsSelected ? "mixed" : false
                  }
                  onClick={toggleAllRows}
                  onKeyDown={toggleAllKeydown}
                  checkboxIndicator={{ "aria-label": "Select all rows " }}
                />
                <TableHeaderCell>id</TableHeaderCell>
                <TableHeaderCell>/type</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ item, selected, onClick, onKeyDown, appearance }, index: number) => (
                <TableRow
                  key={item.id}
                  // onClick={onClick}
                  // onKeyDown={onKeyDown}
                  aria-selected={selected}
                  appearance={appearance}
                >
                  <TableSelectionCell
                    checked={selected}
                    checkboxIndicator={{ "aria-label": "Select row" }}
                    onClick={onClick}
                    onKeyDown={onKeyDown}
                  />
                  <TableCell onClick={e => setSelectedRows(new Set<TableRowId>([index]))} onKeyDown={onKeyDown}>
                    <TableCellLayout>{item.id}</TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout>{item.type}</TableCellLayout>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

        </div>
        <div style={{ minWidth: "20%", flex: 1 }}><pre>{JSON.stringify(currentDocument, undefined, " ")}</pre></div>
      </Split>

    </div >
  </FluentProvider>;
}

