import * as ko from "knockout";
import ExecuteQueryIcon from "../../../images/ExecuteQuery.svg";
import SaveQueryIcon from "../../../images/save-cosmos.svg";
import * as Constants from "../../Common/Constants";
import { queryDocuments } from "../../Common/dataAccess/queryDocuments";
import { queryDocumentsPage } from "../../Common/dataAccess/queryDocumentsPage";
import { getErrorMessage, getErrorStack } from "../../Common/ErrorHandlingUtils";
import { HashMap } from "../../Common/HashMap";
import * as HeadersUtility from "../../Common/HeadersUtility";
import { MinimalQueryIterator } from "../../Common/IteratorUtilities";
import { Splitter, SplitterBounds, SplitterDirection } from "../../Common/Splitter";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { Action } from "../../Shared/Telemetry/TelemetryConstants";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";
import * as QueryUtils from "../../Utils/QueryUtils";
import { CommandButtonComponentProps } from "../Controls/CommandButton/CommandButtonComponent";
import template from "./QueryTab.html";
import TabsBase from "./TabsBase";

enum ToggleState {
  Result,
  QueryMetrics,
}

export default class QueryTab extends TabsBase implements ViewModels.WaitsForTemplate {
  public static readonly component = { name: "query-tab", template };
  public queryEditorId: string;
  public executeQueryButton: ViewModels.Button;
  public fetchNextPageButton: ViewModels.Button;
  public saveQueryButton: ViewModels.Button;
  public initialEditorContent: ko.Observable<string>;
  public maybeSubQuery: ko.Computed<boolean>;
  public sqlQueryEditorContent: ko.Observable<string>;
  public selectedContent: ko.Observable<string>;
  public sqlStatementToExecute: ko.Observable<string>;
  public queryResults: ko.Observable<string>;
  public error: ko.Observable<string>;
  public statusMessge: ko.Observable<string>;
  public statusIcon: ko.Observable<string>;
  public allResultsMetadata: ko.ObservableArray<ViewModels.QueryResultsMetadata>;
  public showingDocumentsDisplayText: ko.Observable<string>;
  public requestChargeDisplayText: ko.Observable<string>;
  public isTemplateReady: ko.Observable<boolean>;
  public splitterId: string;
  public splitter: Splitter;
  public isPreferredApiMongoDB: boolean;

  public queryMetrics: ko.Observable<HashMap<DataModels.QueryMetrics>>;
  public aggregatedQueryMetrics: ko.Observable<DataModels.QueryMetrics>;
  public activityId: ko.Observable<string>;
  public roundTrips: ko.Observable<number>;
  public toggleState: ko.Observable<ToggleState>;
  public isQueryMetricsEnabled: ko.Computed<boolean>;

  protected monacoSettings: ViewModels.MonacoEditorSettings;
  private _executeQueryButtonTitle: ko.Observable<string>;
  protected _iterator: MinimalQueryIterator;
  private _isSaveQueriesEnabled: ko.Computed<boolean>;
  private _resourceTokenPartitionKey: string;

  _partitionKey: DataModels.PartitionKey;

  constructor(options: ViewModels.QueryTabOptions) {
    super(options);
    this.queryEditorId = `queryeditor${this.tabId}`;
    this.showingDocumentsDisplayText = ko.observable<string>();
    this.requestChargeDisplayText = ko.observable<string>();
    const defaultQueryText = options.queryText != void 0 ? options.queryText : "SELECT * FROM c";
    this.initialEditorContent = ko.observable<string>(defaultQueryText);
    this.sqlQueryEditorContent = ko.observable<string>(defaultQueryText);
    this._executeQueryButtonTitle = ko.observable<string>("Execute Query");
    this.selectedContent = ko.observable<string>();
    this.selectedContent.subscribe((selectedContent: string) => {
      if (!selectedContent.trim()) {
        this._executeQueryButtonTitle("Execute Query");
      } else {
        this._executeQueryButtonTitle("Execute Selection");
      }
    });
    this.sqlStatementToExecute = ko.observable<string>("");
    this.queryResults = ko.observable<string>("");
    this.statusMessge = ko.observable<string>();
    this.statusIcon = ko.observable<string>();
    this.allResultsMetadata = ko.observableArray<ViewModels.QueryResultsMetadata>([]);
    this.error = ko.observable<string>();
    this._partitionKey = options.partitionKey;
    this._resourceTokenPartitionKey = options.resourceTokenPartitionKey;
    this.splitterId = this.tabId + "_splitter";
    this.isPreferredApiMongoDB = false;
    this.aggregatedQueryMetrics = ko.observable<DataModels.QueryMetrics>();
    this._resetAggregateQueryMetrics();
    this.queryMetrics = ko.observable<HashMap<DataModels.QueryMetrics>>(new HashMap<DataModels.QueryMetrics>());
    this.queryMetrics.subscribe((metrics: HashMap<DataModels.QueryMetrics>) =>
      this.aggregatedQueryMetrics(this._aggregateQueryMetrics(metrics))
    );
    this.isQueryMetricsEnabled = ko.computed<boolean>(() => {
      return (
        (this.collection && this.collection.container && this.collection.container.isPreferredApiDocumentDB()) || false
      );
    });
    this.activityId = ko.observable<string>();
    this.roundTrips = ko.observable<number>();
    this.toggleState = ko.observable<ToggleState>(ToggleState.Result);

    this.monacoSettings = new ViewModels.MonacoEditorSettings("sql", false);

    this.executeQueryButton = {
      enabled: ko.computed<boolean>(() => {
        return !!this.sqlQueryEditorContent() && this.sqlQueryEditorContent().length > 0;
      }),

      visible: ko.computed<boolean>(() => {
        return true;
      }),
    };

    this._isSaveQueriesEnabled = ko.computed<boolean>(() => {
      const container = this.collection && this.collection.container;
      return (container && (container.isPreferredApiDocumentDB() || container.isPreferredApiGraph())) || false;
    });

    this.maybeSubQuery = ko.computed<boolean>(function () {
      const sql = this.sqlQueryEditorContent();
      return sql && /.*\(.*SELECT.*\)/i.test(sql);
    }, this);

    this.saveQueryButton = {
      enabled: this._isSaveQueriesEnabled,
      visible: this._isSaveQueriesEnabled,
    };

    super.onTemplateReady((isTemplateReady: boolean) => {
      if (isTemplateReady) {
        const splitterBounds: SplitterBounds = {
          min: Constants.Queries.QueryEditorMinHeightRatio * window.innerHeight,
          max: $("#" + this.tabId).height() - Constants.Queries.QueryEditorMaxHeightRatio * window.innerHeight,
        };
        this.splitter = new Splitter({
          splitterId: this.splitterId,
          leftId: this.queryEditorId,
          bounds: splitterBounds,
          direction: SplitterDirection.Horizontal,
        });
      }
    });

    this.fetchNextPageButton = {
      enabled: ko.computed<boolean>(() => {
        const allResultsMetadata = this.allResultsMetadata() || [];
        const numberOfResultsMetadata = allResultsMetadata.length;

        if (numberOfResultsMetadata === 0) {
          return false;
        }

        if (allResultsMetadata[numberOfResultsMetadata - 1].hasMoreResults) {
          return true;
        }

        return false;
      }),

      visible: ko.computed<boolean>(() => {
        return true;
      }),
    };

    this._buildCommandBarOptions();
  }

  public onTabClick(): void {
    super.onTabClick();
    this.collection && this.collection.selectedSubnodeKind(ViewModels.CollectionTabKind.Query);
  }

  public onExecuteQueryClick = async (): Promise<void> => {
    const sqlStatement: string = this.selectedContent() || this.sqlQueryEditorContent();
    this.sqlStatementToExecute(sqlStatement);
    this.allResultsMetadata([]);
    this.queryResults("");
    this._iterator = undefined;

    await this._executeQueryDocumentsPage(0);
  };

  public onLoadQueryClick = (): void => {
    this.collection && this.collection.container && this.collection.container.loadQueryPane.open();
  };

  public onSaveQueryClick = (): void => {
    this.collection && this.collection.container && this.collection.container.openSaveQueryPanel();
  };

  public onSavedQueriesClick = (): void => {
    this.collection && this.collection.container && this.collection.container.browseQueriesPane.open();
  };

  public async onFetchNextPageClick(): Promise<void> {
    const allResultsMetadata = (this.allResultsMetadata && this.allResultsMetadata()) || [];
    const metadata: ViewModels.QueryResultsMetadata = allResultsMetadata[allResultsMetadata.length - 1];
    const firstResultIndex: number = (metadata && Number(metadata.firstItemIndex)) || 1;
    const itemCount: number = (metadata && Number(metadata.itemCount)) || 0;

    await this._executeQueryDocumentsPage(firstResultIndex + itemCount - 1);
  }

  public onErrorDetailsClick = (src: any, event: MouseEvent): boolean => {
    this.collection && this.collection.container.expandConsole();

    return false;
  };

  public onErrorDetailsKeyPress = (src: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Space || event.keyCode === Constants.KeyCodes.Enter) {
      this.onErrorDetailsClick(src, null);
      return false;
    }

    return true;
  };

  public toggleResult(): void {
    this.toggleState(ToggleState.Result);
    this.queryResults.valueHasMutated(); // needed to refresh the json-editor component
  }

  public toggleMetrics(): void {
    this.toggleState(ToggleState.QueryMetrics);
  }

  public onToggleKeyDown = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.LeftArrow) {
      this.toggleResult();
      event.stopPropagation();
      return false;
    } else if (event.keyCode === Constants.KeyCodes.RightArrow) {
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
    return this.toggleState() === ToggleState.Result;
  }

  public isMetricsToggled(): boolean {
    return this.toggleState() === ToggleState.QueryMetrics;
  }

  public onDownloadQueryMetricsCsvClick = (source: any, event: MouseEvent): boolean => {
    this._downloadQueryMetricsCsvData();
    return false;
  };

  public onDownloadQueryMetricsCsvKeyPress = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === Constants.KeyCodes.Space || Constants.KeyCodes.Enter) {
      this._downloadQueryMetricsCsvData();
      return false;
    }

    return true;
  };

  private async _executeQueryDocumentsPage(firstItemIndex: number): Promise<any> {
    this.error("");
    this.roundTrips(undefined);
    if (this._iterator === undefined) {
      this._initIterator();
    }

    await this._queryDocumentsPage(firstItemIndex);
  }

  // TODO: Position and enable spinner when request is in progress
  private async _queryDocumentsPage(firstItemIndex: number): Promise<void> {
    this.isExecutionError(false);
    this._resetAggregateQueryMetrics();
    const startKey: number = TelemetryProcessor.traceStart(Action.ExecuteQuery, {
      dataExplorerArea: Constants.Areas.Tab,
      tabTitle: this.tabTitle(),
    });
    let options: any = {};
    options.enableCrossPartitionQuery = HeadersUtility.shouldEnableCrossPartitionKey();

    const queryDocuments = async (firstItemIndex: number) =>
      await queryDocumentsPage(this.collection && this.collection.id(), this._iterator, firstItemIndex);
    this.isExecuting(true);

    try {
      const queryResults: ViewModels.QueryResults = await QueryUtils.queryPagesUntilContentPresent(
        firstItemIndex,
        queryDocuments
      );
      const allResultsMetadata = (this.allResultsMetadata && this.allResultsMetadata()) || [];
      const metadata: ViewModels.QueryResultsMetadata = allResultsMetadata[allResultsMetadata.length - 1];
      const resultsMetadata: ViewModels.QueryResultsMetadata = {
        hasMoreResults: queryResults.hasMoreResults,
        itemCount: queryResults.itemCount,
        firstItemIndex: queryResults.firstItemIndex,
        lastItemIndex: queryResults.lastItemIndex,
      };
      this.allResultsMetadata.push(resultsMetadata);
      this.activityId(queryResults.activityId);
      this.roundTrips(queryResults.roundTrips);

      this._updateQueryMetricsMap(queryResults.headers[Constants.HttpHeaders.queryMetrics]);

      if (queryResults.itemCount == 0 && metadata != null && metadata.itemCount >= 0) {
        // we let users query for the next page because the SDK sometimes specifies there are more elements
        // even though there aren't any so we should not update the prior query results.
        return;
      }

      const documents: any[] = queryResults.documents;
      const results = this.renderObjectForEditor(documents, null, 4);

      const resultsDisplay: string =
        queryResults.itemCount > 0 ? `${queryResults.firstItemIndex} - ${queryResults.lastItemIndex}` : `0 - 0`;
      this.showingDocumentsDisplayText(resultsDisplay);
      this.requestChargeDisplayText(`${queryResults.requestCharge} RUs`);
      this.queryResults(results);

      TelemetryProcessor.traceSuccess(
        Action.ExecuteQuery,
        {
          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.tabTitle(),
        },
        startKey
      );
    } catch (error) {
      this.isExecutionError(true);
      const errorMessage = getErrorMessage(error);
      this.error(errorMessage);
      TelemetryProcessor.traceFailure(
        Action.ExecuteQuery,
        {
          dataExplorerArea: Constants.Areas.Tab,
          tabTitle: this.tabTitle(),
          error: errorMessage,
          errorStack: getErrorStack(error),
        },
        startKey
      );
      document.getElementById("error-display").focus();
    } finally {
      this.isExecuting(false);
      this.togglesOnFocus();
    }
  }

  private _updateQueryMetricsMap(metricsMap: { [partitionKeyRange: string]: DataModels.QueryMetrics }): void {
    if (!metricsMap) {
      return;
    }

    Object.keys(metricsMap).forEach((key: string) => {
      this.queryMetrics().set(key, metricsMap[key]);
    });
    this.queryMetrics.valueHasMutated();
  }

  private _aggregateQueryMetrics(metricsMap: HashMap<DataModels.QueryMetrics>): DataModels.QueryMetrics {
    if (!metricsMap) {
      return null;
    }

    const aggregatedMetrics: DataModels.QueryMetrics = this.aggregatedQueryMetrics();
    metricsMap.forEach((partitionKeyRangeId: string, queryMetrics: DataModels.QueryMetrics) => {
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
    const options: any = QueryTab.getIteratorOptions(this.collection);
    if (this._resourceTokenPartitionKey) {
      options.partitionKey = this._resourceTokenPartitionKey;
    }

    this._iterator = queryDocuments(
      this.collection.databaseId,
      this.collection.id(),
      this.sqlStatementToExecute(),
      options
    );
  }

  public static getIteratorOptions(container: ViewModels.CollectionBase): any {
    let options: any = {};
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
    this.aggregatedQueryMetrics({
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
    });
  }

  private _generateQueryMetricsCsvData(): string {
    if (!this.queryMetrics()) {
      return null;
    }

    const queryMetrics: HashMap<DataModels.QueryMetrics> = this.queryMetrics();
    let csvData: string = "";
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
    queryMetrics.forEach((partitionKeyRangeId: string, queryMetric: DataModels.QueryMetrics) => {
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
    if (this.executeQueryButton.visible()) {
      const label = this._executeQueryButtonTitle();
      buttons.push({
        iconSrc: ExecuteQueryIcon,
        iconAlt: label,
        onCommandClick: this.onExecuteQueryClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.executeQueryButton.enabled(),
      });
    }

    if (this.saveQueryButton.visible()) {
      const label = "Save Query";
      buttons.push({
        iconSrc: SaveQueryIcon,
        iconAlt: label,
        onCommandClick: this.onSaveQueryClick,
        commandButtonLabel: label,
        ariaLabel: label,
        hasPopup: false,
        disabled: !this.saveQueryButton.enabled(),
      });
    }

    return buttons;
  }

  private _buildCommandBarOptions(): void {
    ko.computed(() =>
      ko.toJSON([this.executeQueryButton.visible, this.executeQueryButton.enabled, this._executeQueryButtonTitle])
    ).subscribe(() => this.updateNavbarWithTabsButtons());
    this.updateNavbarWithTabsButtons();
  }
}
