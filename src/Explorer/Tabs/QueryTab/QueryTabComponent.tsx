import { FeedOptions } from "@azure/cosmos";
import { OnExecuteQueryClick } from "Explorer/QueryCopilot/Shared/QueryCopilotClient";
import { QueryCopilotResults } from "Explorer/QueryCopilot/Shared/QueryCopilotResults";
import { QueryCopilotSidebar } from "Explorer/QueryCopilot/V2/Sidebar/QueryCopilotSidebar";
import { QueryResultSection } from "Explorer/Tabs/QueryTab/QueryResultSection";
import { QueryCopilotState, useQueryCopilot } from "hooks/useQueryCopilot";
import React, { Fragment } from "react";
import SplitterLayout from "react-splitter-layout";
import "react-splitter-layout/lib/index.css";
import LaunchCopilot from "../../../../images/CopilotTabIcon.svg";
import ExecuteQueryIcon from "../../../../images/ExecuteQuery.svg";
import SaveQueryIcon from "../../../../images/save-cosmos.svg";
import { NormalizedEventKey, QueryCopilotSampleDatabaseId } from "../../../Common/Constants";
import { getErrorMessage } from "../../../Common/ErrorHandlingUtils";
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
}

interface IQueryTabStates {
  toggleState: ToggleState;
  sqlQueryEditorContent: string;
  selectedContent: string;
  queryResults: ViewModels.QueryResults;
  error: string;
  isExecutionError: boolean;
  isExecuting: boolean;
  showCopilotSidebar: boolean;
  queryCopilotGeneratedQuery: string;
}

export default class QueryTabComponent extends React.Component<IQueryTabComponentProps, IQueryTabStates> {
  public queryEditorId: string;
  public executeQueryButton: Button;
  public saveQueryButton: Button;
  public launchCopilotButton: Button;
  public splitterId: string;
  public isPreferredApiMongoDB: boolean;
  public isCloseClicked: boolean;
  public isCopilotTabActive: boolean;
  private _iterator: MinimalQueryIterator;

  constructor(props: IQueryTabComponentProps) {
    super(props);

    this.state = {
      toggleState: ToggleState.Result,
      sqlQueryEditorContent: props.queryText || "SELECT * FROM c",
      selectedContent: "",
      queryResults: undefined,
      error: "",
      isExecutionError: this.props.isExecutionError,
      isExecuting: false,
      showCopilotSidebar: useQueryCopilot.getState().showCopilotSidebar,
      queryCopilotGeneratedQuery: useQueryCopilot.getState().query,
    };
    this.isCloseClicked = false;
    this.splitterId = this.props.tabId + "_splitter";
    this.queryEditorId = `queryeditor${this.props.tabId}`;
    this.isPreferredApiMongoDB = this.props.isPreferredApiMongoDB;
    this.isCopilotTabActive = QueryCopilotSampleDatabaseId === this.props.collection.databaseId;

    this.executeQueryButton = {
      enabled: !!this.state.sqlQueryEditorContent && this.state.sqlQueryEditorContent.length > 0,
      visible: true,
    };

    const isSaveQueryBtnEnabled = userContext.apiType === "SQL" || userContext.apiType === "Gremlin";
    this.saveQueryButton = {
      enabled: isSaveQueryBtnEnabled,
      visible: isSaveQueryBtnEnabled,
    };

    this.launchCopilotButton = {
      enabled: userContext.apiType === "SQL" && true,
      visible: userContext.apiType === "SQL" && true,
    };

    this.props.tabsBaseInstance.updateNavbarWithTabsButtons();
    props.onTabAccessor({
      onTabClickEvent: this.onTabClick.bind(this),
      onSaveClickEvent: this.getCurrentEditorQuery.bind(this),
      onCloseClickEvent: this.onCloseClick.bind(this),
    });
  }

  public onCloseClick(isClicked: boolean): void {
    this.isCloseClicked = isClicked;
    if (useQueryCopilot.getState().wasCopilotUsed && this.isCopilotTabActive) {
      useQueryCopilot.getState().resetQueryCopilotStates();
    }
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
    this._iterator = undefined;
    setTimeout(async () => {
      await this._executeQueryDocumentsPage(0);
    }, 100);
  };

  public onSaveQueryClick = (): void => {
    useSidePanel.getState().openSidePanel("Save Query", <SaveQueryPane explorer={this.props.collection.container} />);
  };

  public launchQueryCopilotChat = (): void => {
    useQueryCopilot.getState().setShowCopilotSidebar(!useQueryCopilot.getState().showCopilotSidebar);
  };

  public onSavedQueriesClick = (): void => {
    useSidePanel
      .getState()
      .openSidePanel("Open Saved Queries", <BrowseQueriesPane explorer={this.props.collection.container} />);
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

  public handleCopilotKeyDown = (event: KeyboardEvent): void => {
    if (this.isCopilotTabActive && event.altKey && event.key === "c") {
      this.launchQueryCopilotChat();
    }
  };

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
    if (this._iterator === undefined) {
      this._iterator = this.props.isPreferredApiMongoDB
        ? queryIterator(
            this.props.collection.databaseId,
            this.props.viewModelcollection,
            this.state.selectedContent || this.state.sqlQueryEditorContent,
          )
        : queryDocuments(
            this.props.collection.databaseId,
            this.props.collection.id(),
            this.state.selectedContent || this.state.sqlQueryEditorContent,
            { enableCrossPartitionQuery: HeadersUtility.shouldEnableCrossPartitionKey() } as FeedOptions,
          );
    }

    await this._queryDocumentsPage(firstItemIndex);
  }

  private async _queryDocumentsPage(firstItemIndex: number): Promise<void> {
    this.props.tabsBaseInstance.isExecutionError(false);
    this.setState({
      isExecutionError: false,
    });

    const queryDocuments = async (firstItemIndex: number) =>
      await queryDocumentsPage(this.props.collection && this.props.collection.id(), this._iterator, firstItemIndex);
    this.props.tabsBaseInstance.isExecuting(true);
    this.setState({
      isExecuting: true,
    });

    try {
      const queryResults: ViewModels.QueryResults = await QueryUtils.queryPagesUntilContentPresent(
        firstItemIndex,
        queryDocuments,
      );
      this.setState({ queryResults, error: "" });
    } catch (error) {
      this.props.tabsBaseInstance.isExecutionError(true);
      this.setState({
        isExecutionError: true,
      });
      const errorMessage = getErrorMessage(error);
      this.setState({
        error: errorMessage,
      });

      document.getElementById("error-display").focus();
    } finally {
      this.props.tabsBaseInstance.isExecuting(false);
      this.setState({
        isExecuting: false,
      });
      this.togglesOnFocus();
    }
  }

  protected getTabsButtons(): CommandButtonComponentProps[] {
    const buttons: CommandButtonComponentProps[] = [];
    if (this.executeQueryButton.visible) {
      const label = this.state.selectedContent?.length > 0 ? "Execute Selection" : "Execute Query";
      buttons.push({
        iconSrc: ExecuteQueryIcon,
        iconAlt: label,
        onCommandClick: this.isCopilotTabActive ? () => OnExecuteQueryClick() : this.onExecuteQueryClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.executeQueryButton.enabled,
      });
    }

    if (this.saveQueryButton.visible) {
      const label = "Save Query";
      buttons.push({
        iconSrc: SaveQueryIcon,
        iconAlt: label,
        onCommandClick: this.onSaveQueryClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.saveQueryButton.enabled,
      });
    }

    if (this.launchCopilotButton.visible && this.isCopilotTabActive) {
      const mainButtonLabel = "Launch Copilot";
      const chatPaneLabel = "Open Copilot in chat pane (ALT+C)";
      const copilotSettingLabel = "Copilot settings";

      const openCopilotChatButton: CommandButtonComponentProps = {
        iconAlt: chatPaneLabel,
        onCommandClick: this.launchQueryCopilotChat,
        commandButtonLabel: chatPaneLabel,
        ariaLabel: chatPaneLabel,
        hasPopup: false,
      };

      const copilotSettingsButton: CommandButtonComponentProps = {
        iconAlt: copilotSettingLabel,
        onCommandClick: () => undefined,
        commandButtonLabel: copilotSettingLabel,
        ariaLabel: copilotSettingLabel,
        hasPopup: false,
      };

      const launchCopilotButton = {
        iconSrc: LaunchCopilot,
        iconAlt: mainButtonLabel,
        onCommandClick: this.launchQueryCopilotChat,
        commandButtonLabel: mainButtonLabel,
        ariaLabel: mainButtonLabel,
        hasPopup: false,
        children: [openCopilotChatButton, copilotSettingsButton],
      };
      buttons.push(launchCopilotButton);
    }

    return buttons;
  }

  public onChangeContent(newContent: string): void {
    this.setState({
      sqlQueryEditorContent: newContent,
      queryCopilotGeneratedQuery: "",
    });
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

    useCommandBar.getState().setContextButtons(this.getTabsButtons());
  }

  public onSelectedContent(selectedContent: string): void {
    if (selectedContent.trim().length > 0) {
      this.setState({
        selectedContent,
      });
    } else {
      this.setState({
        selectedContent: "",
      });
    }

    if (this.isCopilotTabActive) {
      selectedContent.trim().length > 0
        ? useQueryCopilot.getState().setSelectedQuery(selectedContent)
        : useQueryCopilot.getState().setSelectedQuery("");
    }

    useCommandBar.getState().setContextButtons(this.getTabsButtons());
  }

  public setEditorContent(): string {
    if (this.isCopilotTabActive && this.state.queryCopilotGeneratedQuery) {
      return this.state.queryCopilotGeneratedQuery;
    }

    return this.state.sqlQueryEditorContent;
  }

  private unsubscribeCopilotSidebar: () => void;

  componentDidMount(): void {
    this.unsubscribeCopilotSidebar = useQueryCopilot.subscribe((state: QueryCopilotState) => {
      if (this.state.showCopilotSidebar !== state.showCopilotSidebar) {
        this.setState({ showCopilotSidebar: state.showCopilotSidebar });
      }
      if (this.state.queryCopilotGeneratedQuery !== state.query) {
        this.setState({ queryCopilotGeneratedQuery: state.query });
      }
    });

    useCommandBar.getState().setContextButtons(this.getTabsButtons());
    document.addEventListener("keydown", this.handleCopilotKeyDown);
  }

  componentWillUnmount(): void {
    this.unsubscribeCopilotSidebar();
    document.removeEventListener("keydown", this.handleCopilotKeyDown);
  }

  private getEditorAndQueryResult(): JSX.Element {
    return (
      <Fragment>
        <div className="tab-pane" id={this.props.tabId} role="tabpanel">
          <div className="tabPaneContentContainer">
            <SplitterLayout vertical={true} primaryIndex={0} primaryMinSize={100} secondaryMinSize={200}>
              <Fragment>
                <div className="queryEditor" style={{ height: "100%" }}>
                  <EditorReact
                    language={"sql"}
                    content={this.setEditorContent()}
                    isReadOnly={false}
                    ariaLabel={"Editing Query"}
                    lineNumbers={"on"}
                    onContentChanged={(newContent: string) => this.onChangeContent(newContent)}
                    onContentSelected={(selectedContent: string) => this.onSelectedContent(selectedContent)}
                  />
                </div>
              </Fragment>
              {this.isCopilotTabActive ? (
                <QueryCopilotResults />
              ) : (
                <QueryResultSection
                  isMongoDB={this.props.isPreferredApiMongoDB}
                  queryEditorContent={this.state.sqlQueryEditorContent}
                  error={this.state.error}
                  queryResults={this.state.queryResults}
                  isExecuting={this.state.isExecuting}
                  executeQueryDocumentsPage={(firstItemIndex: number) =>
                    this._executeQueryDocumentsPage(firstItemIndex)
                  }
                />
              )}
            </SplitterLayout>
          </div>
        </div>
      </Fragment>
    );
  }

  render(): JSX.Element {
    const shouldScaleElements = this.state.showCopilotSidebar && this.isCopilotTabActive;
    return (
      <div style={{ display: "flex", flexDirection: "row", height: "100%" }}>
        <div style={{ width: shouldScaleElements ? "70%" : "100%", height: "100%" }}>
          {this.getEditorAndQueryResult()}
        </div>
        {shouldScaleElements && (
          <div style={{ width: "30%", height: "100%" }}>
            <QueryCopilotSidebar explorer={this.props.collection.container} />
          </div>
        )}
      </div>
    );
  }
}
