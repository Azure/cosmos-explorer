import React, { Fragment } from "react";
import SplitterLayout from "react-splitter-layout";
import "react-splitter-layout/lib/index.css";
import ExecuteQueryIcon from "../../../../images/ExecuteQuery.svg";
import SaveQueryIcon from "../../../../images/save-cosmos.svg";
import * as Constants from "../../../Common/Constants";
import { NormalizedEventKey } from "../../../Common/Constants";
import { queryDocuments } from "../../../Common/dataAccess/queryDocuments";
import { queryDocumentsPage } from "../../../Common/dataAccess/queryDocumentsPage";
import { getErrorMessage } from "../../../Common/ErrorHandlingUtils";
import * as HeadersUtility from "../../../Common/HeadersUtility";
import { MinimalQueryIterator } from "../../../Common/IteratorUtilities";
import { Splitter } from "../../../Common/Splitter";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import "../../../Explorer/Tabs/QueryTab.less";
import { userContext } from "../../../UserContext";
import * as QueryUtils from "../../../Utils/QueryUtils";
import { CommandButtonComponentProps } from "../../Controls/CommandButton/CommandButtonComponent";
import { EditorReact } from "../../Controls/Editor/EditorReact";
import Explorer from "../../Explorer";
import TabsBase from "../TabsBase";
import { TabsManager } from "../TabsManager";
import "./QueryTabComponent.less";

enum ToggleState {
  Result,
  QueryMetrics,
}

export interface ITabAccessor {
  onTabClickEvent: () => void;
  onSaveClickEvent: () => string;
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
  tabManager?: TabsManager;
  onTabAccessor: (instance: ITabAccessor) => void;
}

interface IQueryTabStates {
  queryMetrics: Map<string, DataModels.QueryMetrics>;
  aggregatedQueryMetrics: DataModels.QueryMetrics;
  activityId: string;
  roundTrips: number;
  toggleState: ToggleState;
  isQueryMetricsEnabled: boolean;
  showingDocumentsDisplayText: string;
  requestChargeDisplayText: string;
  initialEditorContent: string;
  sqlQueryEditorContent: string;
  selectedContent: string;
  _executeQueryButtonTitle: string;
  sqlStatementToExecute: string;
  queryResults: string;
  statusMessge: string;
  statusIcon: string;
  allResultsMetadata: ViewModels.QueryResultsMetadata[];
  error: string;
  isTemplateReady: boolean;
  _isSaveQueriesEnabled: boolean;
  isExecutionError: boolean;
  isExecuting: boolean;
  temp: number;
}

export default class QueryTabComponent extends React.Component<IQueryTabComponentProps, IQueryTabStates> {
  public queryEditorId: string;
  public executeQueryButton: Button;
  public fetchNextPageButton: Button;
  public saveQueryButton: Button;
  public splitterId: string;
  public splitter: Splitter;
  public isPreferredApiMongoDB: boolean;
  public resultsDisplay: string;
  protected monacoSettings: ViewModels.MonacoEditorSettings;
  protected _iterator: MinimalQueryIterator;
  private _resourceTokenPartitionKey: string;
  _partitionKey: DataModels.PartitionKey;
  public maybeSubQuery: boolean;

  constructor(props: IQueryTabComponentProps) {
    super(props);
    const defaultQueryText = props.queryText !== void 0 ? props.queryText : "SELECT * FROM c";
    this.state = {
      queryMetrics: new Map(),
      aggregatedQueryMetrics: undefined,
      activityId: "",
      roundTrips: undefined,
      toggleState: ToggleState.Result,
      isQueryMetricsEnabled: userContext.apiType === "SQL" || false,
      showingDocumentsDisplayText: this.resultsDisplay,
      requestChargeDisplayText: "",
      initialEditorContent: defaultQueryText,
      sqlQueryEditorContent: defaultQueryText,
      selectedContent: "",
      _executeQueryButtonTitle: "Execute Query",
      sqlStatementToExecute: defaultQueryText,
      queryResults: "",
      statusMessge: "",
      statusIcon: "",
      allResultsMetadata: [],
      error: "",
      isTemplateReady: false,
      _isSaveQueriesEnabled: userContext.apiType === "SQL" || userContext.apiType === "Gremlin",
      isExecutionError: this.props.isExecutionError,
      isExecuting: false,
      temp: 0,
    };
    this.splitterId = this.props.tabId + "_splitter";
    this.queryEditorId = `queryeditor${this.props.tabId}`;
    this._partitionKey = props.partitionKey;
    this.isPreferredApiMongoDB = false;
    this.monacoSettings = new ViewModels.MonacoEditorSettings("sql", false);
    this.executeQueryButton = {
      enabled: !!this.state.sqlQueryEditorContent && this.state.sqlQueryEditorContent.length > 0,
      visible: true,
    };
    const sql = this.state.sqlQueryEditorContent;
    this.maybeSubQuery = sql && /.*\(.*SELECT.*\)/i.test(sql);
    this.saveQueryButton = {
      enabled: this.state._isSaveQueriesEnabled,
      visible: this.state._isSaveQueriesEnabled,
    };
    this.fetchNextPageButton = {
      enabled: (() => {
        const allResultsMetadata = this.state.allResultsMetadata || [];
        const numberOfResultsMetadata = allResultsMetadata.length;

        if (numberOfResultsMetadata === 0) {
          return false;
        }

        if (allResultsMetadata[numberOfResultsMetadata - 1].hasMoreResults) {
          return true;
        }

        return false;
      })(),
      visible: true,
    };

    this.props.container.onUpdateTabsButtons(this.getTabsButtons());
    this._buildCommandBarOptions();
    props.onTabAccessor({
      onTabClickEvent: this.onTabClick.bind(this),
      onSaveClickEvent: this.getCurrentEditorQuery.bind(this),
    });
  }

  public getCurrentEditorQuery(): string {
    return this.state.sqlQueryEditorContent;
  }

  public onTabClick(): void {
    setTimeout(() => {
      this.props.container.onUpdateTabsButtons(this.getTabsButtons());
    }, 100);
  }

  public onExecuteQueryClick = async (): Promise<void> => {
    const sqlStatement = this.state.selectedContent || this.state.sqlQueryEditorContent;

    this.setState({
      sqlStatementToExecute: sqlStatement,
      allResultsMetadata: [],
      queryResults: "",
    });

    this._iterator = undefined;
    setTimeout(async () => {
      await this._executeQueryDocumentsPage(0);
    }, 100);
  };

  public onSaveQueryClick = (): void => {
    this.props.collection && this.props.collection.container && this.props.collection.container.openSaveQueryPanel();
  };

  public onSavedQueriesClick = (): void => {
    this.props.collection &&
      this.props.collection.container &&
      this.props.collection.container.openBrowseQueriesPanel();
  };

  public async onFetchNextPageClick(): Promise<void> {
    const allResultsMetadata = (this.state.allResultsMetadata && this.state.allResultsMetadata) || [];
    const metadata: ViewModels.QueryResultsMetadata = allResultsMetadata[allResultsMetadata.length - 1];
    const firstResultIndex: number = (metadata && Number(metadata.firstItemIndex)) || 1;
    const itemCount: number = (metadata && Number(metadata.itemCount)) || 0;

    await this._executeQueryDocumentsPage(firstResultIndex + itemCount - 1);
  }

  //eslint-disable-next-line
  public onErrorDetailsClick = (): boolean => {
    this.props.collection && this.props.collection.container.expandConsole();

    return false;
  };

  public onErrorDetailsKeyPress = (event: React.KeyboardEvent<HTMLAnchorElement>): boolean => {
    if (event.key === NormalizedEventKey.Space || event.key === NormalizedEventKey.Enter) {
      this.onErrorDetailsClick();
      return false;
    }

    return true;
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

  public isResultToggled(): boolean {
    return this.state.toggleState === ToggleState.Result;
  }

  public isMetricsToggled(): boolean {
    return this.state.toggleState === ToggleState.QueryMetrics;
  }

  public onDownloadQueryMetricsCsvClick = (): boolean => {
    this._downloadQueryMetricsCsvData();
    return false;
  };

  public onDownloadQueryMetricsCsvKeyPress = (event: React.KeyboardEvent<HTMLAnchorElement>): boolean => {
    if (event.key === NormalizedEventKey.Space || NormalizedEventKey.Enter) {
      this._downloadQueryMetricsCsvData();
      return false;
    }

    return true;
  };

  //eslint-disable-next-line
  private async _executeQueryDocumentsPage(firstItemIndex: number): Promise<any> {
    this.setState({
      error: "",
      roundTrips: undefined,
    });

    if (this._iterator === undefined) {
      this._initIterator();
    }

    await this._queryDocumentsPage(firstItemIndex);
  }

  private async _queryDocumentsPage(firstItemIndex: number): Promise<void> {
    this.props.tabsBaseInstance.isExecutionError(false);
    this.setState({
      isExecutionError: false,
    });
    this._resetAggregateQueryMetrics();

    const queryDocuments = async (firstItemIndex: number) =>
      await queryDocumentsPage(this.props.collection && this.props.collection.id(), this._iterator, firstItemIndex);
    this.props.tabsBaseInstance.isExecuting(true);
    this.setState({
      isExecuting: true,
    });

    try {
      const queryResults: ViewModels.QueryResults = await QueryUtils.queryPagesUntilContentPresent(
        firstItemIndex,
        queryDocuments
      );
      const allResultsMetadata = (this.state.allResultsMetadata && this.state.allResultsMetadata) || [];
      const metadata: ViewModels.QueryResultsMetadata = allResultsMetadata[allResultsMetadata.length - 1];
      const resultsMetadata: ViewModels.QueryResultsMetadata = {
        hasMoreResults: queryResults.hasMoreResults,
        itemCount: queryResults.itemCount,
        firstItemIndex: queryResults.firstItemIndex,
        lastItemIndex: queryResults.lastItemIndex,
      };
      this.state.allResultsMetadata.push(resultsMetadata);

      this.setState({
        activityId: queryResults.activityId,
        roundTrips: queryResults.roundTrips,
      });

      this._updateQueryMetricsMap(queryResults.headers[Constants.HttpHeaders.queryMetrics]);

      if (queryResults.itemCount === 0 && metadata !== undefined && metadata.itemCount >= 0) {
        // we let users query for the next page because the SDK sometimes specifies there are more elements
        // even though there aren't any so we should not update the prior query results.
        return;
      }

      const documents = queryResults.documents;
      const results = this.props.tabsBaseInstance.renderObjectForEditor(documents, undefined, 4);

      const resultsDisplay: string =
        queryResults.itemCount > 0 ? `${queryResults.firstItemIndex} - ${queryResults.lastItemIndex}` : `0 - 0`;

      this.setState({
        showingDocumentsDisplayText: resultsDisplay,
        requestChargeDisplayText: `${queryResults.requestCharge} RUs`,
        queryResults: results,
      });
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

  private _updateQueryMetricsMap(metricsMap: { [partitionKeyRange: string]: DataModels.QueryMetrics }): void {
    if (!metricsMap) {
      return;
    }

    Object.keys(metricsMap).forEach((key: string) => {
      this.state.queryMetrics.set(key, metricsMap[key]);
    });
    this._aggregateQueryMetrics(this.state.queryMetrics);
  }

  private _aggregateQueryMetrics(metricsMap: Map<string, DataModels.QueryMetrics>): DataModels.QueryMetrics {
    if (!metricsMap) {
      return undefined;
    }

    const aggregatedMetrics: DataModels.QueryMetrics = this.state.aggregatedQueryMetrics;
    metricsMap.forEach((queryMetrics) => {
      if (queryMetrics) {
        aggregatedMetrics.documentLoadTime =
          queryMetrics.documentLoadTime &&
          this._normalize(queryMetrics.documentLoadTime.totalMilliseconds()) +
            this._normalize(aggregatedMetrics.documentLoadTime);
        aggregatedMetrics.documentWriteTime =
          queryMetrics.documentWriteTime &&
          this._normalize(queryMetrics.documentWriteTime.totalMilliseconds()) +
            this._normalize(aggregatedMetrics.documentWriteTime);
        aggregatedMetrics.indexHitDocumentCount =
          queryMetrics.indexHitDocumentCount &&
          this._normalize(queryMetrics.indexHitDocumentCount) +
            this._normalize(aggregatedMetrics.indexHitDocumentCount);
        aggregatedMetrics.outputDocumentCount =
          queryMetrics.outputDocumentCount &&
          this._normalize(queryMetrics.outputDocumentCount) + this._normalize(aggregatedMetrics.outputDocumentCount);
        aggregatedMetrics.outputDocumentSize =
          queryMetrics.outputDocumentSize &&
          this._normalize(queryMetrics.outputDocumentSize) + this._normalize(aggregatedMetrics.outputDocumentSize);
        aggregatedMetrics.indexLookupTime =
          queryMetrics.indexLookupTime &&
          this._normalize(queryMetrics.indexLookupTime.totalMilliseconds()) +
            this._normalize(aggregatedMetrics.indexLookupTime);
        aggregatedMetrics.retrievedDocumentCount =
          queryMetrics.retrievedDocumentCount &&
          this._normalize(queryMetrics.retrievedDocumentCount) +
            this._normalize(aggregatedMetrics.retrievedDocumentCount);
        aggregatedMetrics.retrievedDocumentSize =
          queryMetrics.retrievedDocumentSize &&
          this._normalize(queryMetrics.retrievedDocumentSize) +
            this._normalize(aggregatedMetrics.retrievedDocumentSize);
        aggregatedMetrics.vmExecutionTime =
          queryMetrics.vmExecutionTime &&
          this._normalize(queryMetrics.vmExecutionTime.totalMilliseconds()) +
            this._normalize(aggregatedMetrics.vmExecutionTime);
        aggregatedMetrics.totalQueryExecutionTime =
          queryMetrics.totalQueryExecutionTime &&
          this._normalize(queryMetrics.totalQueryExecutionTime.totalMilliseconds()) +
            this._normalize(aggregatedMetrics.totalQueryExecutionTime);

        aggregatedMetrics.runtimeExecutionTimes.queryEngineExecutionTime =
          aggregatedMetrics.runtimeExecutionTimes &&
          this._normalize(queryMetrics.runtimeExecutionTimes.queryEngineExecutionTime.totalMilliseconds()) +
            this._normalize(aggregatedMetrics.runtimeExecutionTimes.queryEngineExecutionTime);
        aggregatedMetrics.runtimeExecutionTimes.systemFunctionExecutionTime =
          aggregatedMetrics.runtimeExecutionTimes &&
          this._normalize(queryMetrics.runtimeExecutionTimes.systemFunctionExecutionTime.totalMilliseconds()) +
            this._normalize(aggregatedMetrics.runtimeExecutionTimes.systemFunctionExecutionTime);
        aggregatedMetrics.runtimeExecutionTimes.userDefinedFunctionExecutionTime =
          aggregatedMetrics.runtimeExecutionTimes &&
          this._normalize(queryMetrics.runtimeExecutionTimes.userDefinedFunctionExecutionTime.totalMilliseconds()) +
            this._normalize(aggregatedMetrics.runtimeExecutionTimes.userDefinedFunctionExecutionTime);
      }
    });

    return aggregatedMetrics;
  }

  public _downloadQueryMetricsCsvData(): void {
    const csvData: string = this._generateQueryMetricsCsvData();
    if (!csvData) {
      return;
    }

    if (navigator.msSaveBlob) {
      // for IE and Edge
      navigator.msSaveBlob(
        new Blob([csvData], { type: "data:text/csv;charset=utf-8" }),
        "PerPartitionQueryMetrics.csv"
      );
    } else {
      const downloadLink: HTMLAnchorElement = document.createElement("a");
      downloadLink.href = "data:text/csv;charset=utf-8," + encodeURI(csvData);
      downloadLink.target = "_self";
      downloadLink.download = "QueryMetricsPerPartition.csv";

      // for some reason, FF displays the download prompt only when
      // the link is added to the dom so we add and remove it
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
    }
  }

  protected _initIterator(): void {
    const options = QueryTabComponent.getIteratorOptions();
    if (this._resourceTokenPartitionKey) {
      options.partitionKey = this._resourceTokenPartitionKey;
    }

    this._iterator = queryDocuments(
      this.props.collection.databaseId,
      this.props.collection.id(),
      this.state.sqlStatementToExecute,
      options
    );
  }

  //eslint-disable-next-line
  public static getIteratorOptions(collection?: ViewModels.Collection): any {
    //eslint-disable-next-line
    const options: any = {};
    options.enableCrossPartitionQuery = HeadersUtility.shouldEnableCrossPartitionKey();
    return options;
  }

  private _normalize(value: number): number {
    if (!value) {
      return 0;
    }

    return value;
  }

  private _resetAggregateQueryMetrics(): void {
    this.setState({
      aggregatedQueryMetrics: {
        clientSideMetrics: {},
        documentLoadTime: undefined,
        documentWriteTime: undefined,
        indexHitDocumentCount: undefined,
        outputDocumentCount: undefined,
        outputDocumentSize: undefined,
        indexLookupTime: undefined,
        retrievedDocumentCount: undefined,
        retrievedDocumentSize: undefined,
        vmExecutionTime: undefined,
        queryPreparationTimes: undefined,
        runtimeExecutionTimes: {
          queryEngineExecutionTime: undefined,
          systemFunctionExecutionTime: undefined,
          userDefinedFunctionExecutionTime: undefined,
        },
        totalQueryExecutionTime: undefined,
      },
    });
  }

  private _generateQueryMetricsCsvData(): string {
    if (!this.state.queryMetrics) {
      return undefined;
    }

    const queryMetrics = this.state.queryMetrics;
    let csvData = "";
    const columnHeaders: string =
      [
        "Partition key range id",
        "Retrieved document count",
        "Retrieved document size (in bytes)",
        "Output document count",
        "Output document size (in bytes)",
        "Index hit document count",
        "Index lookup time (ms)",
        "Document load time (ms)",
        "Query engine execution time (ms)",
        "System function execution time (ms)",
        "User defined function execution time (ms)",
        "Document write time (ms)",
      ].join(",") + "\n";
    csvData = csvData + columnHeaders;
    queryMetrics.forEach((queryMetric, partitionKeyRangeId) => {
      const partitionKeyRangeData: string =
        [
          partitionKeyRangeId,
          queryMetric.retrievedDocumentCount,
          queryMetric.retrievedDocumentSize,
          queryMetric.outputDocumentCount,
          queryMetric.outputDocumentSize,
          queryMetric.indexHitDocumentCount,
          queryMetric.indexLookupTime && queryMetric.indexLookupTime.totalMilliseconds(),
          queryMetric.documentLoadTime && queryMetric.documentLoadTime.totalMilliseconds(),
          queryMetric.runtimeExecutionTimes &&
            queryMetric.runtimeExecutionTimes.queryEngineExecutionTime &&
            queryMetric.runtimeExecutionTimes.queryEngineExecutionTime.totalMilliseconds(),
          queryMetric.runtimeExecutionTimes &&
            queryMetric.runtimeExecutionTimes.systemFunctionExecutionTime &&
            queryMetric.runtimeExecutionTimes.systemFunctionExecutionTime.totalMilliseconds(),
          queryMetric.runtimeExecutionTimes &&
            queryMetric.runtimeExecutionTimes.userDefinedFunctionExecutionTime &&
            queryMetric.runtimeExecutionTimes.userDefinedFunctionExecutionTime.totalMilliseconds(),
          queryMetric.documentWriteTime && queryMetric.documentWriteTime.totalMilliseconds(),
        ].join(",") + "\n";
      csvData = csvData + partitionKeyRangeData;
    });

    return csvData;
  }

  protected getTabsButtons(): CommandButtonComponentProps[] {
    const buttons: CommandButtonComponentProps[] = [];
    if (this.executeQueryButton.visible) {
      const label = this.state._executeQueryButtonTitle;
      buttons.push({
        iconSrc: ExecuteQueryIcon,
        iconAlt: label,
        onCommandClick: this.onExecuteQueryClick,
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

    return buttons;
  }

  private _buildCommandBarOptions(): void {
    this.props.tabsBaseInstance.updateNavbarWithTabsButtons();
  }

  public onChangeContent(newContent: string): void {
    this.setState({
      sqlQueryEditorContent: newContent,
    });

    this.props.container.onUpdateTabsButtons(this.getTabsButtons());
  }

  public onSelectedContent(selectedContent: string): void {
    if (selectedContent.trim().length > 0) {
      this.setState({
        selectedContent: selectedContent,
        _executeQueryButtonTitle: "Execute Selection",
      });
    } else {
      this.setState({
        selectedContent: "",
        _executeQueryButtonTitle: "Execute Query",
      });
    }
    this.props.container.onUpdateTabsButtons(this.getTabsButtons());
  }

  render(): JSX.Element {
    this.props.container.onUpdateTabsButtons(this.getTabsButtons());

    return (
      <Fragment>
        <div className="tab-pane" id={this.props.tabId} role="tabpanel">
          <div className="tabPaneContentContainer">
            {this.isPreferredApiMongoDB && this.state.sqlQueryEditorContent.length === 0 && (
              <div className="mongoQueryHelper">
                Start by writing a Mongo query, for example: <strong>{{ id: "foo" }}</strong> or <strong>{}</strong> to
                get all the documents.
              </div>
            )}
            {this.maybeSubQuery && (
              <div className="warningErrorContainer" aria-live="assertive">
                <div className="warningErrorContent">
                  <span>
                    <img className="paneErrorIcon" src="/info_color.svg" alt="Error" />
                  </span>
                  <span className="warningErrorDetailsLinkContainer">
                    We have detected you may be using a subquery. Non-correlated subqueries are not currently supported.
                    <a href="https://docs.microsoft.com/en-us/azure/cosmos-db/sql-query-subquery">
                      Please see Cosmos sub query documentation for further information
                    </a>
                  </span>
                </div>
              </div>
            )}
            <SplitterLayout vertical={true} primaryIndex={0} primaryMinSize={100} secondaryMinSize={200}>
              <Fragment>
                <div className="queryEditor" style={{ height: "100%" }}>
                  <EditorReact
                    language={"sql"}
                    content={this.state.initialEditorContent}
                    isReadOnly={false}
                    ariaLabel={"Editing Query"}
                    lineNumbers={"on"}
                    onContentChanged={(newContent: string) => this.onChangeContent(newContent)}
                    onContentSelected={(selectedContent: string) => this.onSelectedContent(selectedContent)}
                  />
                </div>
              </Fragment>
              <Fragment>
                {/* <!-- Query Errors Tab - Start--> */}
                {!!this.state.error && (
                  <div className="active queryErrorsHeaderContainer">
                    <span className="queryErrors" data-toggle="tab">
                      Errors
                    </span>
                  </div>
                )}
                {/* <!-- Query Errors Tab - End --> */}
                {/* <!-- Query Results & Errors Content Container - Start--> */}
                <div className="queryResultErrorContentContainer">
                  {this.state.allResultsMetadata.length === 0 &&
                    !this.state.error &&
                    !this.state.queryResults &&
                    !this.props.tabsBaseInstance.isExecuting() && (
                      <div className="queryEditorWatermark">
                        <p>
                          <img src="images/RunQuery.png" alt="Execute Query Watermark" />
                        </p>
                        <p className="queryEditorWatermarkText">Execute a query to see the results</p>
                      </div>
                    )}
                  {(this.state.allResultsMetadata.length > 0 || !!this.state.error || this.state.queryResults) && (
                    <div className="queryResultsErrorsContent">
                      {!this.state.error && (
                        <>
                          <div className="togglesWithMetadata">
                            <div
                              className="toggles"
                              aria-label="Successful execution"
                              id="execute-query-toggles"
                              onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => this.onToggleKeyDown(event)}
                              tabIndex={0}
                            >
                              <div className="tab">
                                <input type="radio" className="radio" value="result" />
                                <span
                                  className={`toggleSwitch ${
                                    this.isResultToggled() ? "selectedToggle" : "unselectedToggle"
                                  }`}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => this.toggleResult()}
                                  aria-label="Results"
                                >
                                  Results
                                </span>
                              </div>
                              <div className="tab">
                                <input type="radio" className="radio" value="logs" />
                                <span
                                  className={`toggleSwitch ${
                                    this.isMetricsToggled() ? "selectedToggle" : "unselectedToggle"
                                  }`}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => this.toggleMetrics()}
                                  aria-label="Query stats"
                                >
                                  Query Stats
                                </span>
                              </div>
                            </div>
                            {this.isResultToggled() && (
                              <div className="result-metadata">
                                <span>
                                  <span>{this.state.showingDocumentsDisplayText}</span>
                                </span>
                                {this.fetchNextPageButton.enabled && <span className="queryResultDivider">|</span>}
                                {this.fetchNextPageButton.enabled && (
                                  <span className="queryResultNextEnable">
                                    <a onClick={this.onFetchNextPageClick}>
                                      <span>Load more</span>
                                      <img
                                        className="queryResultnextImg"
                                        src="images/Query-Editor-Next.svg"
                                        alt="Fetch next page"
                                      />
                                    </a>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {this.state.queryResults &&
                            this.state.queryResults.length > 0 &&
                            this.isResultToggled() &&
                            this.state.allResultsMetadata.length > 0 &&
                            !this.state.error && (
                              <EditorReact
                                language={"json"}
                                content={this.state.queryResults}
                                isReadOnly={true}
                                ariaLabel={"Query results"}
                              />
                            )}
                        </>
                      )}
                      {this.isMetricsToggled() && this.state.allResultsMetadata.length > 0 && !this.state.error && (
                        <div className="queryMetricsSummaryContainer">
                          <table className="queryMetricsSummary">
                            <caption>Query Statistics</caption>
                            <thead className="queryMetricsSummaryHead">
                              <tr className="queryMetricsSummaryHeader queryMetricsSummaryTuple">
                                <th title="METRIC" scope="col">
                                  METRIC
                                </th>
                                <th title="VALUE" scope="col">
                                  VALUE
                                </th>
                              </tr>
                            </thead>
                            <tbody className="queryMetricsSummaryBody">
                              <tr className="queryMetricsSummaryTuple">
                                <td title="Request Charge">Request Charge</td>
                                <td>
                                  <span>{this.state.requestChargeDisplayText}</span>
                                </td>
                              </tr>
                              <tr className="queryMetricsSummaryTuple">
                                <td title="Showing Results">Showing Results</td>
                                <td>
                                  <span>{this.state.showingDocumentsDisplayText}</span>
                                </td>
                              </tr>
                              {this.state.isQueryMetricsEnabled && (
                                <tr className="queryMetricsSummaryTuple">
                                  <td>
                                    <span title="Retrieved document count">Retrieved document count</span>
                                    <span className="queryMetricInfoTooltip" role="tooltip" tabIndex={0}>
                                      <img className="infoImg" src="images/info-bubble.svg" alt="More information" />
                                      <span className="queryMetricTooltipText">
                                        Total number of retrieved documents
                                      </span>
                                    </span>
                                  </td>
                                  <td>
                                    <span>{this.state.aggregatedQueryMetrics.retrievedDocumentCount}</span>
                                  </td>
                                </tr>
                              )}
                              {this.state.isQueryMetricsEnabled && (
                                <tr className="queryMetricsSummaryTuple">
                                  <td>
                                    <span title="Retrieved document size">Retrieved document size</span>
                                    <span className="queryMetricInfoTooltip" role="tooltip" tabIndex={0}>
                                      <img className="infoImg" src="images/info-bubble.svg" alt="More information" />
                                      <span className="queryMetricTooltipText">
                                        Total size of retrieved documents in bytes
                                      </span>
                                    </span>
                                  </td>
                                  <td>
                                    <span>{this.state.aggregatedQueryMetrics.retrievedDocumentSize}</span>
                                    <span>bytes</span>
                                  </td>
                                </tr>
                              )}
                              {this.state.isQueryMetricsEnabled && (
                                <tr className="queryMetricsSummaryTuple">
                                  <td>
                                    <span title="Output document count">Output document count</span>
                                    <span className="queryMetricInfoTooltip" role="tooltip" tabIndex={0}>
                                      <img className="infoImg" src="images/info-bubble.svg" alt="More information" />
                                      <span className="queryMetricTooltipText">Number of output documents</span>
                                    </span>
                                  </td>
                                  <td>
                                    <span>{this.state.aggregatedQueryMetrics.outputDocumentCount}</span>
                                  </td>
                                </tr>
                              )}
                              {this.state.isQueryMetricsEnabled && (
                                <tr className="queryMetricsSummaryTuple">
                                  <td>
                                    <span title="Output document size">Output document size</span>
                                    <span className="queryMetricInfoTooltip" role="tooltip" tabIndex={0}>
                                      <img className="infoImg" src="images/info-bubble.svg" alt="More information" />
                                      <span className="queryMetricTooltipText">
                                        Total size of output documents in bytes
                                      </span>
                                    </span>
                                  </td>
                                  <td>
                                    <span>{this.state.aggregatedQueryMetrics.outputDocumentSize}</span>
                                    <span>bytes</span>
                                  </td>
                                </tr>
                              )}
                              {this.state.isQueryMetricsEnabled && (
                                <tr className="queryMetricsSummaryTuple">
                                  <td>
                                    <span title="Index hit document count">Index hit document count</span>
                                    <span className="queryMetricInfoTooltip" role="tooltip" tabIndex={0}>
                                      <img className="infoImg" src="images/info-bubble.svg" alt="More information" />
                                      <span className="queryMetricTooltipText">
                                        Total number of documents matched by the filter
                                      </span>
                                    </span>
                                  </td>
                                  <td>
                                    <span>{this.state.aggregatedQueryMetrics.indexHitDocumentCount}</span>
                                  </td>
                                </tr>
                              )}
                              {this.state.isQueryMetricsEnabled && (
                                <tr className="queryMetricsSummaryTuple">
                                  <td>
                                    <span title="Index lookup time">Index lookup time</span>
                                    <span className="queryMetricInfoTooltip" role="tooltip" tabIndex={0}>
                                      <img className="infoImg" src="images/info-bubble.svg" alt="More information" />
                                      <span className="queryMetricTooltipText">Time spent in physical index layer</span>
                                    </span>
                                  </td>
                                  <td>
                                    <span>{this.state.aggregatedQueryMetrics.indexLookupTime}</span>
                                    <span>ms</span>
                                  </td>
                                </tr>
                              )}
                              {this.state.isQueryMetricsEnabled && (
                                <tr className="queryMetricsSummaryTuple">
                                  <td>
                                    <span title="Document load time">Document load time</span>
                                    <span className="queryMetricInfoTooltip" role="tooltip" tabIndex={0}>
                                      <img className="infoImg" src="images/info-bubble.svg" alt="More information" />
                                      <span className="queryMetricTooltipText">Time spent in loading documents</span>
                                    </span>
                                  </td>
                                  <td>
                                    <span>{this.state.aggregatedQueryMetrics.documentLoadTime}</span>
                                    <span>ms</span>
                                  </td>
                                </tr>
                              )}
                              {this.state.isQueryMetricsEnabled && (
                                <tr className="queryMetricsSummaryTuple">
                                  <td>
                                    <span title="Query engine execution time">Query engine execution time</span>
                                    <span className="queryMetricInfoTooltip" role="tooltip" tabIndex={0}>
                                      <img className="infoImg" src="images/info-bubble.svg" alt="More information" />
                                      <span className="queryMetricTooltipText queryEngineExeTimeInfo">
                                        Time spent by the query engine to execute the query expression (excludes other
                                        execution times like load documents or write results)
                                      </span>
                                    </span>
                                  </td>
                                  <td>
                                    <span>
                                      {this.state.aggregatedQueryMetrics.runtimeExecutionTimes.queryEngineExecutionTime}
                                    </span>
                                    <span>ms</span>
                                  </td>
                                </tr>
                              )}
                              {this.state.isQueryMetricsEnabled && (
                                <tr className="queryMetricsSummaryTuple">
                                  <td>
                                    <span title="System function execution time">System function execution time</span>
                                    <span className="queryMetricInfoTooltip" role="tooltip" tabIndex={0}>
                                      <img className="infoImg" src="images/info-bubble.svg" alt="More information" />
                                      <span className="queryMetricTooltipText">
                                        Total time spent executing system (built-in) functions
                                      </span>
                                    </span>
                                  </td>
                                  <td>
                                    <span>
                                      {
                                        this.state.aggregatedQueryMetrics.runtimeExecutionTimes
                                          .systemFunctionExecutionTime
                                      }
                                    </span>
                                    <span>ms</span>
                                  </td>
                                </tr>
                              )}
                              {this.state.isQueryMetricsEnabled && (
                                <tr className="queryMetricsSummaryTuple">
                                  <td>
                                    <span title="User defined function execution time">
                                      User defined function execution time
                                    </span>
                                    <span className="queryMetricInfoTooltip" role="tooltip" tabIndex={0}>
                                      <img className="infoImg" src="images/info-bubble.svg" alt="More information" />
                                      <span className="queryMetricTooltipText">
                                        Total time spent executing user-defined functions
                                      </span>
                                    </span>
                                  </td>
                                  <td>
                                    <span>
                                      {
                                        this.state.aggregatedQueryMetrics.runtimeExecutionTimes
                                          .userDefinedFunctionExecutionTime
                                      }
                                    </span>
                                    <span>ms</span>
                                  </td>
                                </tr>
                              )}
                              {this.state.isQueryMetricsEnabled && (
                                <tr className="queryMetricsSummaryTuple">
                                  <td>
                                    <span title="Document write time">Document write time</span>
                                    <span className="queryMetricInfoTooltip" role="tooltip" tabIndex={0}>
                                      <img className="infoImg" src="images/info-bubble.svg" alt="More information" />
                                      <span className="queryMetricTooltipText">
                                        Time spent to write query result set to response buffer
                                      </span>
                                    </span>
                                  </td>
                                  <td>
                                    <span>{this.state.aggregatedQueryMetrics.documentWriteTime}</span>
                                    <span>ms</span>
                                  </td>
                                </tr>
                              )}
                              {this.state.roundTrips !== undefined && (
                                <tr className="queryMetricsSummaryTuple">
                                  <td title="Round Trips">Round Trips</td>
                                  <td>
                                    <span>{this.state.roundTrips}</span>
                                  </td>
                                </tr>
                              )}
                              {/* <!-- TODO: Report activity id for mongo queries --> */}
                              {this.state.activityId !== undefined && (
                                <tr className="queryMetricsSummaryTuple">
                                  <td title="Activity id">Activity id</td>
                                  <td></td>
                                  <td>
                                    <span>{this.state.activityId}</span>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                          {this.state.isQueryMetricsEnabled && (
                            <div className="downloadMetricsLinkContainer">
                              <a
                                id="downloadMetricsLink"
                                role="button"
                                tabIndex={0}
                                onClick={() => this.onDownloadQueryMetricsCsvClick()}
                                onKeyPress={(event: React.KeyboardEvent<HTMLAnchorElement>) =>
                                  this.onDownloadQueryMetricsCsvKeyPress(event)
                                }
                              >
                                <img
                                  className="downloadCsvImg"
                                  src="images/DownloadQuery.svg"
                                  alt="download query metrics csv"
                                />
                                <span>Per-partition query metrics (CSV)</span>
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      {/* <!-- Query Errors Content - Start--> */}
                      {!!this.state.error && (
                        <div className="tab-pane active">
                          <div className="errorContent">
                            <span className="errorMessage">{this.state.error}</span>
                            <span className="errorDetailsLink">
                              <a
                                data-bind="click: $parent.onErrorDetailsClick, event: { keypress: $parent.onErrorDetailsKeyPress }"
                                onClick={() => this.onErrorDetailsClick()}
                                onKeyPress={(event: React.KeyboardEvent<HTMLAnchorElement>) =>
                                  this.onErrorDetailsKeyPress(event)
                                }
                                id="error-display"
                                tabIndex={0}
                                aria-label="Error details link"
                              >
                                More details
                              </a>
                            </span>
                          </div>
                        </div>
                      )}
                      {/* <!-- Query Errors Content - End--> */}
                    </div>
                  )}
                </div>
              </Fragment>
            </SplitterLayout>
          </div>
        </div>
      </Fragment>
    );
  }
}
