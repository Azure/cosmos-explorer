/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { FeedOptions } from "@azure/cosmos";
import { AuthType } from "AuthType";
import QueryError, { createMonacoErrorLocationResolver, createMonacoMarkersForQueryErrors } from "Common/QueryError";
import { SplitterDirection } from "Common/Splitter";
import { Platform, configContext } from "ConfigContext";
import { useDialog } from "Explorer/Controls/Dialog";
import { monaco } from "Explorer/LazyMonaco";
import { QueryResultSection } from "Explorer/Tabs/QueryTab/QueryResultSection";
import { QueryTabStyles, useQueryTabStyles } from "Explorer/Tabs/QueryTab/Styles";
import { CosmosFluentProvider } from "Explorer/Theme/ThemeUtil";
import { KeyboardAction } from "KeyboardShortcuts";
import { Keys, t } from "Localization";
import { QueryConstants } from "Shared/Constants";
import { LocalStorageUtility, StorageKey } from "Shared/StorageUtility";
import { Allotment } from "allotment";
import { useClientWriteEnabled } from "hooks/useClientWriteEnabled";
import { TabsState, useTabs } from "hooks/useTabs";
import { useMonacoTheme } from "hooks/useTheme";
import React, { Fragment, createRef } from "react";
import "react-splitter-layout/lib/index.css";
import { format } from "react-string-format";
import create from "zustand";
import DownloadQueryIcon from "../../../../images/DownloadQuery.svg";
import CancelQueryIcon from "../../../../images/Entity_cancel.svg";
import ExecuteQueryIcon from "../../../../images/ExecuteQuery.svg";
import CheckIcon from "../../../../images/check-1.svg";
import SaveQueryIcon from "../../../../images/save-cosmos.svg";
import { NormalizedEventKey } from "../../../Common/Constants";
import * as HeadersUtility from "../../../Common/HeadersUtility";
import { MinimalQueryIterator } from "../../../Common/IteratorUtilities";
import { queryIterator } from "../../../Common/MongoProxyClient";
import { queryDocuments } from "../../../Common/dataAccess/queryDocuments";
import { queryDocumentsPage } from "../../../Common/dataAccess/queryDocumentsPage";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import { userContext } from "../../../UserContext";
import * as QueryUtils from "../../../Utils/QueryUtils";
import { useSidePanel } from "../../../hooks/useSidePanel";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import { EditorReact } from "../../Controls/Editor/EditorReact";
import Explorer from "../../Explorer";
import { useCommandBar } from "../../Menus/CommandBar/CommandBarComponentAdapter";
import { BrowseQueriesPane } from "../../Panes/BrowseQueriesPane/BrowseQueriesPane";
import { SaveQueryPane } from "../../Panes/SaveQueryPane/SaveQueryPane";
import TabsBase from "../TabsBase";
import "./QueryTabComponent.less";

export interface QueryMetadataStore {
  userQuery: string;
  databaseId: string;
  containerId: string;
  setMetadata: (query1: string, db: string, container: string) => void;
}

export const useQueryMetadataStore = create<QueryMetadataStore>((set) => ({
  userQuery: "",
  databaseId: "",
  containerId: "",
  setMetadata: (query1, db, container) => set({ userQuery: query1, databaseId: db, containerId: container }),
}));

enum ToggleState {
  Result,
  QueryMetrics,
}

export interface IDocument {
  metric: string;
  value: string;
  toolTip: string;
}

export interface ITabAccessor {
  onTabClickEvent: () => void;
  onSaveClickEvent: () => string;
  onCloseClickEvent: (isClicked: boolean) => void;
}

export interface Button {
  visible: boolean;
  enabled: boolean;
  isSelected?: boolean;
}

export interface IQueryTabComponentProps {
  collection: ViewModels.CollectionBase;
  isExecutionError: boolean;
  tabId: string;
  tabsBaseInstance: TabsBase;
  queryText: string;
  partitionKey: DataModels.PartitionKey;
  container: Explorer;
  activeTab?: TabsBase;
  onTabAccessor: (instance: ITabAccessor) => void;
  isPreferredApiMongoDB?: boolean;
  monacoEditorSetting?: string;
  viewModelcollection?: ViewModels.Collection;
  splitterDirection?: "horizontal" | "vertical";
  queryViewSizePercent?: number;
  onUpdatePersistedState: (state: {
    queryText: string;
    splitterDirection: "vertical" | "horizontal";
    queryViewSizePercent: number;
  }) => void;
}

interface IQueryTabStates {
  toggleState: ToggleState;
  sqlQueryEditorContent: string;
  selectedContent: string;
  selection?: monaco.Selection;
  executedSelection?: monaco.Selection; // We need to capture the selection that was used when executing, in case the user changes their section while the query is executing.
  queryResults: ViewModels.QueryResults;
  isExecutionError: boolean;
  isExecuting: boolean;
  cancelQueryTimeoutID: NodeJS.Timeout;
  currentTabActive: boolean;
  queryResultsView: SplitterDirection;
  errors?: QueryError[];
  modelMarkers?: monaco.editor.IMarkerData[];
  queryViewSizePercent: number;
}

export const QueryTabComponent = (props: IQueryTabComponentProps): any => {
  const styles = useQueryTabStyles();
  const monacoTheme = useMonacoTheme();
  return <QueryTabComponentImpl styles={styles} monacoTheme={monacoTheme} {...{ ...props }} />;
};

type QueryTabComponentImplProps = IQueryTabComponentProps & {
  styles: QueryTabStyles;
  monacoTheme: string;
};

// Inner (legacy) class component. We only use this component via one of the two functional components above (since we need to use the `useQueryTabStyles` hook).
class QueryTabComponentImpl extends React.Component<QueryTabComponentImplProps, IQueryTabStates> {
  private static readonly DEBOUNCE_DELAY_MS = 1000;

  public queryEditorId: string;
  public executeQueryButton: Button;
  public saveQueryButton: Button;
  public splitterId: string;
  public isPreferredApiMongoDB: boolean;
  public isCloseClicked: boolean;
  private _iterator: MinimalQueryIterator;
  private queryAbortController: AbortController;
  queryEditor: React.RefObject<EditorReact>;
  private timeoutId: NodeJS.Timeout | undefined;

  constructor(props: QueryTabComponentImplProps) {
    super(props);
    this.queryEditor = createRef<EditorReact>();

    this.state = {
      toggleState: ToggleState.Result,
      sqlQueryEditorContent: props.isPreferredApiMongoDB ? "{}" : props.queryText || "SELECT * FROM c",
      selectedContent: "",
      queryResults: undefined,
      errors: [],
      isExecutionError: this.props.isExecutionError,
      isExecuting: false,
      cancelQueryTimeoutID: undefined,
      currentTabActive: true,
      queryResultsView:
        props.splitterDirection === "vertical" ? SplitterDirection.Vertical : SplitterDirection.Horizontal,
      queryViewSizePercent: props.queryViewSizePercent,
    };
    this.isCloseClicked = false;
    this.splitterId = this.props.tabId + "_splitter";
    this.queryEditorId = `queryeditor${this.props.tabId}`;
    this.isPreferredApiMongoDB = this.props.isPreferredApiMongoDB;
    this.executeQueryButton = {
      enabled: !!this.state.sqlQueryEditorContent && this.state.sqlQueryEditorContent.length > 0,
      visible: true,
    };

    const isSaveQueryBtnEnabled = userContext.apiType === "SQL" || userContext.apiType === "Gremlin";
    this.saveQueryButton = {
      enabled: isSaveQueryBtnEnabled,
      visible: isSaveQueryBtnEnabled,
    };

    this.props.tabsBaseInstance.updateNavbarWithTabsButtons();
    props.onTabAccessor({
      onTabClickEvent: this.onTabClick.bind(this),
      onSaveClickEvent: this.getCurrentEditorQuery.bind(this),
      onCloseClickEvent: this.onCloseClick.bind(this),
    });
  }

  /**
   * Helper function to save the query text in the query tab state
   * Since it reads and writes to the same state, it is debounced
   */
  private saveQueryTabStateDebounced = () => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(async () => {
      this.props.onUpdatePersistedState({
        queryText: this.state.sqlQueryEditorContent,
        splitterDirection: this.state.queryResultsView,
        queryViewSizePercent: this.state.queryViewSizePercent,
      });
    }, QueryTabComponentImpl.DEBOUNCE_DELAY_MS);
  };

  public onCloseClick(isClicked: boolean): void {
    this.isCloseClicked = isClicked;
  }

  public getCurrentEditorQuery(): string {
    return this.state.sqlQueryEditorContent;
  }

  public onTabClick(): void {
    if (!this.isCloseClicked) {
      useCommandBar.getState().setContextButtons(this.getTabsButtons());
    } else {
      this.isCloseClicked = false;
    }
  }

  public onExecuteQueryClick = async (): Promise<void> => {
    const query1 = this.state.sqlQueryEditorContent;
    const db = this.props.collection.databaseId;
    const container = this.props.collection.id();
    useQueryMetadataStore.getState().setMetadata(query1, db, container);
    this._iterator = undefined;

    setTimeout(async () => {
      await this._executeQueryDocumentsPage(0);
    }, 100); // TODO: Revert this
  };

  public onDownloadQueryClick = (): void => {
    const text = this.getCurrentEditorQuery();
    const queryFile = new File([text], `SavedQuery.txt`, { type: "text/plain" });

    // It appears the most consistent to download a file from a blob is to create an anchor element and simulate clicking it
    const blobUrl = URL.createObjectURL(queryFile);
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = queryFile.name;
    document.body.appendChild(anchor); // Must put the anchor in the document.
    anchor.click();
    document.body.removeChild(anchor); // Clean up the anchor.
  };

  public onSaveQueryClick = (): void => {
    useSidePanel
      .getState()
      .openSidePanel(t(Keys.tabs.query.saveQuery), <SaveQueryPane explorer={this.props.collection.container} />);
  };

  public onSavedQueriesClick = (): void => {
    useSidePanel
      .getState()
      .openSidePanel(
        t(Keys.tabs.query.openSavedQueries),
        <BrowseQueriesPane explorer={this.props.collection.container} />,
      );
  };

  public toggleResult(): void {
    this.setState({
      toggleState: ToggleState.Result,
    });
  }

  public toggleMetrics(): void {
    this.setState({
      toggleState: ToggleState.QueryMetrics,
    });
  }

  public onToggleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): boolean => {
    if (event.key === NormalizedEventKey.LeftArrow) {
      this.toggleResult();
      event.stopPropagation();
      return false;
    } else if (event.key === NormalizedEventKey.RightArrow) {
      this.toggleMetrics();
      event.stopPropagation();
      return false;
    }

    return true;
  };

  public togglesOnFocus(): void {
    const focusElement = document.getElementById("execute-query-toggles");
    focusElement && focusElement.focus();
  }

  private async _executeQueryDocumentsPage(firstItemIndex: number): Promise<void> {
    // Capture the query content and the selection being executed (if any).
    const query = this.state.selectedContent || this.state.sqlQueryEditorContent;
    const selection = this.state.selection;
    this.setState({
      // Track the executed selection so that we can evaluate error positions relative to it, even if the user changes their current selection.
      executedSelection: selection,
    });

    this.queryAbortController = new AbortController();
    if (this._iterator === undefined) {
      this._iterator = this.props.isPreferredApiMongoDB
        ? queryIterator(this.props.collection.databaseId, this.props.viewModelcollection, query)
        : queryDocuments(this.props.collection.databaseId, this.props.collection.id(), query, {
            enableCrossPartitionQuery: HeadersUtility.shouldEnableCrossPartitionKey(),
            abortSignal: this.queryAbortController.signal,
          } as unknown as FeedOptions);
    }

    await this._queryDocumentsPage(firstItemIndex);
  }

  private async _queryDocumentsPage(firstItemIndex: number): Promise<void> {
    this.props.tabsBaseInstance.isExecutionError(false);
    this.setState({
      isExecutionError: false,
    });
    this.props.tabsBaseInstance.isExecutionWarning(false);
    const queryDocuments = async (firstItemIndex: number) =>
      await queryDocumentsPage(this.props.collection && this.props.collection.id(), this._iterator, firstItemIndex);
    this.props.tabsBaseInstance.isExecuting(true);
    this.setState({
      isExecuting: true,
    });
    let automaticallyCancelQueryAfterTimeout: boolean;
    if (this.queryTimeoutEnabled()) {
      const queryTimeout: number = LocalStorageUtility.getEntryNumber(StorageKey.QueryTimeout);
      automaticallyCancelQueryAfterTimeout = LocalStorageUtility.getEntryBoolean(
        StorageKey.AutomaticallyCancelQueryAfterTimeout,
      );
      const cancelQueryTimeoutID: NodeJS.Timeout = setTimeout(() => {
        if (this.state.isExecuting) {
          if (automaticallyCancelQueryAfterTimeout) {
            this.queryAbortController.abort();
          } else {
            useDialog
              .getState()
              .showOkCancelModalDialog(
                QueryConstants.CancelQueryTitle,
                format(QueryConstants.CancelQuerySubTextTemplate, QueryConstants.CancelQueryTimeoutThresholdReached),
                "Yes",
                () => this.queryAbortController.abort(),
                "No",
                undefined,
              );
          }
        }
      }, queryTimeout);
      this.setState({
        cancelQueryTimeoutID,
      });
    }
    useCommandBar.getState().setContextButtons(this.getTabsButtons());

    try {
      const queryResults: ViewModels.QueryResults = await QueryUtils.queryPagesUntilContentPresent(
        firstItemIndex,
        queryDocuments,
      );
      if (queryResults.ruThresholdExceeded) {
        this.props.tabsBaseInstance.isExecutionWarning(true);
      }
      this.setState({ queryResults, errors: [] });
    } catch (error) {
      this.props.tabsBaseInstance.isExecutionError(true);
      this.setState({
        isExecutionError: true,
      });

      // Try to parse this as a query error
      const queryErrors = QueryError.tryParse(
        error,
        createMonacoErrorLocationResolver(this.queryEditor.current.editor, this.state.executedSelection),
      );
      this.setState({
        errors: queryErrors,
        modelMarkers: createMonacoMarkersForQueryErrors(queryErrors),
      });
    } finally {
      this.props.tabsBaseInstance.isExecuting(false);
      this.setState({
        isExecuting: false,
        cancelQueryTimeoutID: undefined,
      });
      if (this.queryTimeoutEnabled()) {
        clearTimeout(this.state.cancelQueryTimeoutID);
        if (!automaticallyCancelQueryAfterTimeout) {
          useDialog.getState().closeDialog();
        }
      }
      this.togglesOnFocus();
      useCommandBar.getState().setContextButtons(this.getTabsButtons());
    }
  }

  protected getTabsButtons(): CommandButtonComponentProps[] {
    const buttons: CommandButtonComponentProps[] = [];
    if (this.executeQueryButton.visible) {
      const label =
        this.state.selectedContent?.length > 0 ? t(Keys.tabs.query.executeSelection) : t(Keys.tabs.query.executeQuery);
      buttons.push({
        iconSrc: ExecuteQueryIcon,
        iconAlt: label,
        keyboardAction: KeyboardAction.EXECUTE_ITEM,
        onCommandClick: this.onExecuteQueryClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.executeQueryButton.enabled,
      });
    }

    if (this.saveQueryButton.visible) {
      if (configContext.platform !== Platform.Fabric) {
        const label = t(Keys.tabs.query.saveQuery);
        buttons.push({
          iconSrc: SaveQueryIcon,
          iconAlt: label,
          keyboardAction: KeyboardAction.SAVE_ITEM,
          onCommandClick: this.onSaveQueryClick,
          commandButtonLabel: label,
          ariaLabel: label,
          hasPopup: false,
          disabled:
            !this.saveQueryButton.enabled ||
            (!useClientWriteEnabled.getState().clientWriteEnabled && userContext.authType === AuthType.AAD),
        });
      }

      buttons.push({
        iconSrc: DownloadQueryIcon,
        iconAlt: t(Keys.tabs.query.downloadQuery),
        keyboardAction: KeyboardAction.DOWNLOAD_ITEM,
        onCommandClick: this.onDownloadQueryClick,
        commandButtonLabel: t(Keys.tabs.query.downloadQuery),
        ariaLabel: t(Keys.tabs.query.downloadQuery),
        hasPopup: false,
        disabled: !this.saveQueryButton.enabled,
      });
    }

    if (!this.props.isPreferredApiMongoDB && this.state.isExecuting) {
      const label = t(Keys.tabs.query.cancelQuery);
      buttons.push({
        iconSrc: CancelQueryIcon,
        iconAlt: label,
        keyboardAction: KeyboardAction.CANCEL_OR_DISCARD,
        onCommandClick: () => this.queryAbortController.abort(),
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
      });
    }

    buttons.push(this.createViewButtons());

    return buttons;
  }

  private createViewButtons(): CommandButtonComponentProps {
    const verticalButton: CommandButtonComponentProps = {
      isSelected: this.state.queryResultsView === SplitterDirection.Vertical,
      iconSrc: this.state.queryResultsView === SplitterDirection.Vertical ? CheckIcon : undefined,
      commandButtonLabel: t(Keys.tabs.query.vertical),
      ariaLabel: t(Keys.tabs.query.vertical),
      onCommandClick: () => this._setViewLayout(SplitterDirection.Vertical),
      hasPopup: false,
    };
    const horizontalButton: CommandButtonComponentProps = {
      isSelected: this.state.queryResultsView === SplitterDirection.Horizontal,
      iconSrc: this.state.queryResultsView === SplitterDirection.Horizontal ? CheckIcon : undefined,
      commandButtonLabel: t(Keys.tabs.query.horizontal),
      ariaLabel: t(Keys.tabs.query.horizontal),
      onCommandClick: () => this._setViewLayout(SplitterDirection.Horizontal),
      hasPopup: false,
    };

    return {
      commandButtonLabel: t(Keys.tabs.query.view),
      ariaLabel: t(Keys.tabs.query.view),
      hasPopup: true,
      children: [verticalButton, horizontalButton],
    };
  }
  private _setViewLayout(direction: SplitterDirection): void {
    this.setState({ queryResultsView: direction }, () => this.saveQueryTabStateDebounced());

    // We'll need to refresh the context buttons to update the selected state of the view buttons
    setTimeout(() => {
      useCommandBar.getState().setContextButtons(this.getTabsButtons());
    }, 100);
  }

  public onChangeContent(newContent: string): void {
    this.setState(
      {
        sqlQueryEditorContent: newContent,

        // Clear the markers when the user edits the document.
        modelMarkers: [],
      },
      () => this.saveQueryTabStateDebounced(),
    );
    if (this.isPreferredApiMongoDB) {
      if (newContent.length > 0) {
        this.executeQueryButton = {
          enabled: true,
          visible: true,
        };
      } else {
        this.executeQueryButton = {
          enabled: false,
          visible: true,
        };
      }
    }

    this.saveQueryButton.enabled = newContent.length > 0;

    useCommandBar.getState().setContextButtons(this.getTabsButtons());
  }

  public onSelectedContent(selectedContent: string, selection: monaco.Selection): void {
    if (selectedContent.trim().length > 0) {
      this.setState({
        selectedContent,
        selection,
      });
    } else {
      this.setState({
        selectedContent: "",
        selection: undefined,
      });
    }

    useCommandBar.getState().setContextButtons(this.getTabsButtons());
  }

  public getEditorContent(): string {
    return this.state.sqlQueryEditorContent;
  }

  private queryTimeoutEnabled(): boolean {
    return !this.isPreferredApiMongoDB && LocalStorageUtility.getEntryBoolean(StorageKey.QueryTimeoutEnabled);
  }

  private unsubscribeClientWriteEnabled: () => void;

  componentDidMount(): void {
    useTabs.subscribe((state: TabsState) => {
      if (this.state.currentTabActive && state.activeTab?.tabId !== this.props.tabId) {
        this.setState({
          currentTabActive: false,
        });
      } else if (!this.state.currentTabActive && state.activeTab?.tabId === this.props.tabId) {
        this.setState({
          currentTabActive: true,
        });
      }
    });

    useCommandBar.getState().setContextButtons(this.getTabsButtons());

    this.unsubscribeClientWriteEnabled = useClientWriteEnabled.subscribe(() => {
      useCommandBar.getState().setContextButtons(this.getTabsButtons());
    });
  }

  componentWillUnmount(): void {
    if (this.unsubscribeClientWriteEnabled) {
      this.unsubscribeClientWriteEnabled();
    }
  }

  private getEditorAndQueryResult(): JSX.Element {
    const vertical = this.state.queryResultsView === SplitterDirection.Horizontal;
    return (
      <Fragment>
        <CosmosFluentProvider id={this.props.tabId} className={this.props.styles.queryTab} role="tabpanel">
          {/* Set 'key' to the value of vertical to force re-rendering when vertical changes, to work around https://github.com/johnwalley/allotment/issues/457 */}
          <Allotment
            key={vertical.toString()}
            vertical={vertical}
            onDragEnd={(sizes: number[]) => {
              const queryViewSizePercent = (100 * sizes[0]) / (sizes[0] + sizes[1]);
              this.setState({ queryViewSizePercent }, () => this.saveQueryTabStateDebounced());
            }}
          >
            <Allotment.Pane
              data-test="QueryTab/EditorPane"
              preferredSize={
                this.state.queryViewSizePercent !== undefined ? `${this.state.queryViewSizePercent}%` : undefined
              }
            >
              <EditorReact
                ref={this.queryEditor}
                className={this.props.styles.queryEditor}
                language={"sql"}
                content={this.getEditorContent()}
                modelMarkers={this.state.modelMarkers}
                isReadOnly={false}
                wordWrap={"on"}
                ariaLabel={t(Keys.tabs.query.editingQuery)}
                lineNumbers={"on"}
                theme={this.props.monacoTheme}
                onContentChanged={(newContent: string) => this.onChangeContent(newContent)}
                onContentSelected={(selectedContent: string, selection: monaco.Selection) =>
                  this.onSelectedContent(selectedContent, selection)
                }
              />
            </Allotment.Pane>
            <Allotment.Pane>
              <QueryResultSection
                isMongoDB={this.props.isPreferredApiMongoDB}
                queryEditorContent={this.state.sqlQueryEditorContent}
                errors={this.state.errors}
                isExecuting={this.state.isExecuting}
                queryResults={this.state.queryResults}
                databaseId={this.props.collection.databaseId}
                containerId={this.props.collection.id()}
                executeQueryDocumentsPage={(firstItemIndex: number) => this._executeQueryDocumentsPage(firstItemIndex)}
              />
            </Allotment.Pane>
          </Allotment>
        </CosmosFluentProvider>
      </Fragment>
    );
  }

  render(): JSX.Element {
    return (
      <div data-test="QueryTab" style={{ display: "flex", flexDirection: "row", height: "100%" }}>
        <div style={{ width: "100%", height: "100%" }}>{this.getEditorAndQueryResult()}</div>
      </div>
    );
  }
}
