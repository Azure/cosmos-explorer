import { DetailsList, DetailsListLayoutMode, IColumn, Pivot, PivotItem, SelectionMode, Text } from "@fluentui/react";
import React, { Fragment } from "react";
import SplitterLayout from "react-splitter-layout";
import "react-splitter-layout/lib/index.css";
import DownloadQueryMetrics from "../../../../images/DownloadQuery.svg";
import ExecuteQueryIcon from "../../../../images/ExecuteQuery.svg";
import InfoColor from "../../../../images/info_color.svg";
import QueryEditorNext from "../../../../images/Query-Editor-Next.svg";
import RunQuery from "../../../../images/RunQuery.png";
import SaveQueryIcon from "../../../../images/save-cosmos.svg";
import * as Constants from "../../../Common/Constants";
import { NormalizedEventKey } from "../../../Common/Constants";
import { queryDocuments } from "../../../Common/dataAccess/queryDocuments";
import { queryDocumentsPage } from "../../../Common/dataAccess/queryDocumentsPage";
import { getErrorMessage } from "../../../Common/ErrorHandlingUtils";
import * as HeadersUtility from "../../../Common/HeadersUtility";
import { MinimalQueryIterator } from "../../../Common/IteratorUtilities";
import { queryIterator } from "../../../Common/MongoProxyClient";
import MongoUtility from "../../../Common/MongoUtility";
import { Splitter } from "../../../Common/Splitter";
import { InfoTooltip } from "../../../Common/Tooltip/InfoTooltip";
import * as DataModels from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import { useNotificationConsole } from "../../../hooks/useNotificationConsole";
import { useSidePanel } from "../../../hooks/useSidePanel";
import { userContext } from "../../../UserContext";
import * as QueryUtils from "../../../Utils/QueryUtils";
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
  isQueryMetricsEnabled: boolean;
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
  columns: IColumn[];
  items: IDocument[];
}

export default class QueryTabComponent extends React.Component<IQueryTabComponentProps, IQueryTabStates> {
  public queryEditorId: string;
  public executeQueryButton: Button;
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
  public isCloseClicked: boolean;
  public allItems: IDocument[];
  public defaultQueryText: string;

  constructor(props: IQueryTabComponentProps) {
    super(props);
    const columns: IColumn[] = [
      {
        key: "column2",
        name: "METRIC",
        minWidth: 200,
        data: String,
        fieldName: "metric",
        onRender: this.onRenderColumnItem,
      },
      {
        key: "column3",
        name: "VALUE",
        minWidth: 200,
        data: String,
        fieldName: "value",
      },
    ];

    if (this.props.isPreferredApiMongoDB) {
      this.defaultQueryText = props.queryText;
    } else {
      this.defaultQueryText = props.queryText !== void 0 ? props.queryText : "SELECT * FROM c";
    }

    this.state = {
      queryMetrics: new Map(),
      aggregatedQueryMetrics: undefined,
      activityId: "",
      roundTrips: undefined,
      toggleState: ToggleState.Result,
      isQueryMetricsEnabled: userContext.apiType === "SQL" || false,
      showingDocumentsDisplayText: this.resultsDisplay,
      requestChargeDisplayText: "",
      initialEditorContent: this.defaultQueryText,
      sqlQueryEditorContent: this.defaultQueryText,
      selectedContent: "",
      _executeQueryButtonTitle: "Execute Query",
      sqlStatementToExecute: this.defaultQueryText,
      queryResults: "",
      statusMessge: "",
      statusIcon: "",
      allResultsMetadata: [],
      error: "",
      isTemplateReady: false,
      _isSaveQueriesEnabled: userContext.apiType === "SQL" || userContext.apiType === "Gremlin",
      isExecutionError: this.props.isExecutionError,
      isExecuting: false,
      columns: columns,
      items: [],
    };
    this.isCloseClicked = false;
    this.splitterId = this.props.tabId + "_splitter";
    this.queryEditorId = `queryeditor${this.props.tabId}`;
    this._partitionKey = props.partitionKey;
    this.isPreferredApiMongoDB = this.props.isPreferredApiMongoDB;
    this.monacoSettings = new ViewModels.MonacoEditorSettings(this.props.monacoEditorSetting, false);

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

    this._buildCommandBarOptions();
    props.onTabAccessor({
      onTabClickEvent: this.onTabClick.bind(this),
      onSaveClickEvent: this.getCurrentEditorQuery.bind(this),
      onCloseClickEvent: this.onCloseClick.bind(this),
    });
  }

  public onRenderColumnItem(item: IDocument): JSX.Element {
    if (item.toolTip !== "") {
      return (
        <>
          <InfoTooltip>{`${item.toolTip}`}</InfoTooltip>
          <Text style={{ paddingLeft: 10, margin: 0 }}>{`${item.metric}`}</Text>
        </>
      );
    } else {
      return undefined;
    }
  }

  public generateDetailsList(): IDocument[] {
    const items: IDocument[] = [];
    const allItems: IDocument[] = [
      {
        metric: "Request Charge",
        value: this.state.requestChargeDisplayText,
        toolTip: "Request Charge",
        isQueryMetricsEnabled: true,
      },
      {
        metric: "Showing Results",
        value: this.state.showingDocumentsDisplayText,
        toolTip: "Showing Results",
        isQueryMetricsEnabled: true,
      },
      {
        metric: "Retrieved document count",
        value:
          this.state.aggregatedQueryMetrics.retrievedDocumentCount !== undefined
            ? this.state.aggregatedQueryMetrics.retrievedDocumentCount.toString()
            : "",
        toolTip: "Total number of retrieved documents",
        isQueryMetricsEnabled: this.state.isQueryMetricsEnabled,
      },
      {
        metric: "Retrieved document size",
        value:
          this.state.aggregatedQueryMetrics.retrievedDocumentSize !== undefined
            ? this.state.aggregatedQueryMetrics.retrievedDocumentSize.toString() + " bytes"
            : "",
        toolTip: "Total size of retrieved documents in bytes",
        isQueryMetricsEnabled: this.state.isQueryMetricsEnabled,
      },
      {
        metric: "Output document count",
        value:
          this.state.aggregatedQueryMetrics.outputDocumentCount !== undefined
            ? this.state.aggregatedQueryMetrics.outputDocumentCount.toString()
            : "",
        toolTip: "Number of output documents",
        isQueryMetricsEnabled: this.state.isQueryMetricsEnabled,
      },
      {
        metric: "Output document size",
        value:
          this.state.aggregatedQueryMetrics.outputDocumentSize !== undefined
            ? this.state.aggregatedQueryMetrics.outputDocumentSize.toString() + " bytes"
            : "",
        toolTip: "Total size of output documents in bytes",
        isQueryMetricsEnabled: this.state.isQueryMetricsEnabled,
      },
      {
        metric: "Index hit document count",
        value:
          this.state.aggregatedQueryMetrics.indexHitDocumentCount !== undefined
            ? this.state.aggregatedQueryMetrics.indexHitDocumentCount.toString()
            : "",
        toolTip: "Total number of documents matched by the filter",
        isQueryMetricsEnabled: this.state.isQueryMetricsEnabled,
      },
      {
        metric: "Index lookup time",
        value:
          this.state.aggregatedQueryMetrics.indexLookupTime !== undefined
            ? this.state.aggregatedQueryMetrics.indexLookupTime.toString() + " ms"
            : "",
        toolTip: "Time spent in physical index layer",
        isQueryMetricsEnabled: this.state.isQueryMetricsEnabled,
      },
      {
        metric: "Document load time",
        value:
          this.state.aggregatedQueryMetrics.documentLoadTime !== undefined
            ? this.state.aggregatedQueryMetrics.documentLoadTime.toString() + " ms"
            : "",
        toolTip: "Time spent in loading documents",
        isQueryMetricsEnabled: this.state.isQueryMetricsEnabled,
      },
      {
        metric: "Query engine execution time",
        value:
          this.state.aggregatedQueryMetrics.runtimeExecutionTimes.queryEngineExecutionTime !== undefined
            ? this.state.aggregatedQueryMetrics.runtimeExecutionTimes.queryEngineExecutionTime.toString() + " ms"
            : "",
        toolTip:
          "Time spent by the query engine to execute the query expression (excludes other execution times like load documents or write results)",
        isQueryMetricsEnabled: this.state.isQueryMetricsEnabled,
      },
      {
        metric: "System function execution time",
        value:
          this.state.aggregatedQueryMetrics.runtimeExecutionTimes.systemFunctionExecutionTime !== undefined
            ? this.state.aggregatedQueryMetrics.runtimeExecutionTimes.systemFunctionExecutionTime.toString() + " ms"
            : "",
        toolTip: "Total time spent executing system (built-in) functions",
        isQueryMetricsEnabled: this.state.isQueryMetricsEnabled,
      },
      {
        metric: "User defined function execution time",
        value:
          this.state.aggregatedQueryMetrics.runtimeExecutionTimes.userDefinedFunctionExecutionTime !== undefined
            ? this.state.aggregatedQueryMetrics.runtimeExecutionTimes.userDefinedFunctionExecutionTime.toString() +
              " ms"
            : "",
        toolTip: "Total time spent executing user-defined functions",
        isQueryMetricsEnabled: this.state.isQueryMetricsEnabled,
      },
      {
        metric: "Document write time",
        value:
          this.state.aggregatedQueryMetrics.documentWriteTime !== undefined
            ? this.state.aggregatedQueryMetrics.documentWriteTime.toString() + " ms"
            : "",
        toolTip: "Time spent to write query result set to response buffer",
        isQueryMetricsEnabled: this.state.isQueryMetricsEnabled,
      },
      {
        metric: "Round Trips",
        value: this.state.roundTrips ? this.state.roundTrips.toString() : "",
        toolTip: "",
        isQueryMetricsEnabled: true,
      },
      {
        metric: "Activity id",
        value: this.state.activityId ? this.state.activityId : "",
        toolTip: "",
        isQueryMetricsEnabled: true,
      },
    ];

    allItems.forEach((item) => {
      if (item.metric === "Round Trips" || item.metric === "Activity id") {
        if (item.metric === "Round Trips" && this.state.roundTrips !== undefined) {
          items.push(item);
        } else if (item.metric === "Activity id" && this.state.activityId !== undefined) {
          items.push(item);
        }
      } else {
        if (item.isQueryMetricsEnabled) {
          items.push(item);
        }
      }
    });
    return items;
  }

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
    useSidePanel.getState().openSidePanel("Save Query", <SaveQueryPane explorer={this.props.collection.container} />);
  };

  public onSavedQueriesClick = (): void => {
    useSidePanel
      .getState()
      .openSidePanel("Open Saved Queries", <BrowseQueriesPane explorer={this.props.collection.container} />);
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
    useNotificationConsole.getState().expandConsole();

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
      if (this.isPreferredApiMongoDB) {
        this._initIteratorMongo();
      } else {
        this._initIterator();
      }
    }

    await this._queryDocumentsPage(firstItemIndex);
  }

  private async _queryDocumentsPage(firstItemIndex: number): Promise<void> {
    let results: string;

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

      const documents = queryResults.documents;
      if (this.isPreferredApiMongoDB) {
        results = MongoUtility.tojson(documents, undefined, false);
      } else {
        results = this.props.tabsBaseInstance.renderObjectForEditor(documents, undefined, 4);
      }

      const resultsDisplay: string =
        queryResults.itemCount > 0 ? `${queryResults.firstItemIndex} - ${queryResults.lastItemIndex}` : `0 - 0`;

      this.setState({
        showingDocumentsDisplayText: resultsDisplay,
        requestChargeDisplayText: `${queryResults.requestCharge} RUs`,
        queryResults: results,
      });

      this._updateQueryMetricsMap(queryResults.headers[Constants.HttpHeaders.queryMetrics]);

      if (queryResults.itemCount === 0 && metadata !== undefined && metadata.itemCount >= 0) {
        // we let users query for the next page because the SDK sometimes specifies there are more elements
        // even though there aren't any so we should not update the prior query results.
        return;
      }
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
      this.allItems = this.generateDetailsList();
      this.setState({
        items: this.allItems,
      });
      return;
    }

    Object.keys(metricsMap).forEach((key: string) => {
      this.state.queryMetrics.set(key, metricsMap[key]);
    });

    this._aggregateQueryMetrics(this.state.queryMetrics);
    this.allItems = this.generateDetailsList();
    this.setState({
      items: this.allItems,
    });
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

  protected _initIteratorMongo(): Promise<MinimalQueryIterator> {
    //eslint-disable-next-line
    const options: any = {};
    options.enableCrossPartitionQuery = HeadersUtility.shouldEnableCrossPartitionKey();
    this._iterator = queryIterator(
      this.props.collection.databaseId,
      this.props.viewModelcollection,
      this.state.sqlStatementToExecute
    );
    const mongoPromise: Promise<MinimalQueryIterator> = new Promise((resolve) => {
      resolve(this._iterator);
    });
    return mongoPromise;
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
        selectedContent: selectedContent,
        _executeQueryButtonTitle: "Execute Selection",
      });
    } else {
      this.setState({
        selectedContent: "",
        _executeQueryButtonTitle: "Execute Query",
      });
    }
    useCommandBar.getState().setContextButtons(this.getTabsButtons());
  }

  componentDidMount(): void {
    useCommandBar.getState().setContextButtons(this.getTabsButtons());
  }

  render(): JSX.Element {
    return (
      <Fragment>
        <div className="tab-pane" id={this.props.tabId} role="tabpanel">
          <div className="tabPaneContentContainer">
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
                {this.isPreferredApiMongoDB && this.state.sqlQueryEditorContent.length === 0 && (
                  <div className="mongoQueryHelper">
                    Start by writing a Mongo query, for example: <strong>{"{'id':'foo'}"}</strong> or{" "}
                    <strong>
                      {"{ "}
                      {" }"}
                    </strong>{" "}
                    to get all the documents.
                  </div>
                )}
                {this.maybeSubQuery && (
                  <div className="warningErrorContainer" aria-live="assertive">
                    <div className="warningErrorContent">
                      <span>
                        <img className="paneErrorIcon" src={InfoColor} alt="Error" />
                      </span>
                      <span className="warningErrorDetailsLinkContainer">
                        We have detected you may be using a subquery. Non-correlated subqueries are not currently
                        supported.
                        <a href="https://docs.microsoft.com/en-us/azure/cosmos-db/sql-query-subquery">
                          Please see Cosmos sub query documentation for further information
                        </a>
                      </span>
                    </div>
                  </div>
                )}
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
                          <img src={RunQuery} alt="Execute Query Watermark" />
                        </p>
                        <p className="queryEditorWatermarkText">Execute a query to see the results</p>
                      </div>
                    )}
                  {(this.state.allResultsMetadata.length > 0 || !!this.state.error || this.state.queryResults) && (
                    <div className="queryResultsErrorsContent">
                      {!this.state.error && (
                        <Pivot aria-label="Successful execution" style={{ height: "100%" }}>
                          <PivotItem
                            headerText="Results"
                            headerButtonProps={{
                              "data-order": 1,
                              "data-title": "Results",
                            }}
                            style={{ height: "100%" }}
                          >
                            <div className="result-metadata">
                              <span>
                                <span>{this.state.showingDocumentsDisplayText}</span>
                              </span>
                              {this.state.allResultsMetadata[this.state.allResultsMetadata.length - 1]
                                .hasMoreResults && (
                                <>
                                  <span className="queryResultDivider">|</span>
                                  <span className="queryResultNextEnable">
                                    <a onClick={this.onFetchNextPageClick.bind(this)}>
                                      <span>Load more</span>
                                      <img className="queryResultnextImg" src={QueryEditorNext} alt="Fetch next page" />
                                    </a>
                                  </span>
                                </>
                              )}
                            </div>
                            {this.state.queryResults &&
                              this.state.queryResults.length > 0 &&
                              this.state.allResultsMetadata.length > 0 &&
                              !this.state.error && (
                                <div
                                  style={{
                                    paddingBottom: "100px",
                                    height: "100%",
                                  }}
                                >
                                  <EditorReact
                                    language={"json"}
                                    content={this.state.queryResults}
                                    isReadOnly={true}
                                    ariaLabel={"Query results"}
                                  />
                                </div>
                              )}
                          </PivotItem>
                          <PivotItem
                            headerText="Query Stats"
                            headerButtonProps={{
                              "data-order": 2,
                              "data-title": "Query Stats",
                            }}
                            style={{ height: "100%", overflowY: "scroll" }}
                          >
                            {this.state.allResultsMetadata.length > 0 && !this.state.error && (
                              <div className="queryMetricsSummaryContainer">
                                <div className="queryMetricsSummary">
                                  <h5>Query Statistics</h5>
                                  <DetailsList
                                    items={this.state.items}
                                    columns={this.state.columns}
                                    selectionMode={SelectionMode.none}
                                    layoutMode={DetailsListLayoutMode.justified}
                                    compact={true}
                                  />
                                </div>
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
                                        src={DownloadQueryMetrics}
                                        alt="download query metrics csv"
                                      />
                                      <span>Per-partition query metrics (CSV)</span>
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </PivotItem>
                        </Pivot>
                      )}
                      {/* <!-- Query Errors Content - Start--> */}
                      {!!this.state.error && (
                        <div className="tab-pane active">
                          <div className="errorContent">
                            <span className="errorMessage">{this.state.error}</span>
                            <span className="errorDetailsLink">
                              <a
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
