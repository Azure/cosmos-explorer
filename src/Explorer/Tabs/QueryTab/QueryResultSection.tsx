import {
  DetailsList,
  DetailsListLayoutMode,
  IColumn,
  Icon,
  IconButton,
  Link,
  Pivot,
  PivotItem,
  SelectionMode,
  Stack,
  Text,
  TooltipHost,
} from "@fluentui/react";
import { HttpHeaders, NormalizedEventKey } from "Common/Constants";
import MongoUtility from "Common/MongoUtility";
import { QueryMetrics } from "Contracts/DataModels";
import { EditorReact } from "Explorer/Controls/Editor/EditorReact";
import { IDocument } from "Explorer/Tabs/QueryTab/QueryTabComponent";
import { userContext } from "UserContext";
import copy from "clipboard-copy";
import { useNotificationConsole } from "hooks/useNotificationConsole";
import React from "react";
import CopilotCopy from "../../../../images/CopilotCopy.svg";
import DownloadQueryMetrics from "../../../../images/DownloadQuery.svg";
import QueryEditorNext from "../../../../images/Query-Editor-Next.svg";
import RunQuery from "../../../../images/RunQuery.png";
import InfoColor from "../../../../images/info_color.svg";
import { QueryResults } from "../../../Contracts/ViewModels";

interface QueryResultProps {
  isMongoDB: boolean;
  queryEditorContent: string;
  error: string;
  isExecuting: boolean;
  queryResults: QueryResults;
  executeQueryDocumentsPage: (firstItemIndex: number) => Promise<void>;
}

export const QueryResultSection: React.FC<QueryResultProps> = ({
  isMongoDB,
  queryEditorContent,
  error,
  queryResults,
  isExecuting,
  executeQueryDocumentsPage,
}: QueryResultProps): JSX.Element => {
  const queryMetrics = React.useRef(queryResults?.headers?.[HttpHeaders.queryMetrics]);

  React.useEffect(() => {
    const latestQueryMetrics = queryResults?.headers?.[HttpHeaders.queryMetrics];
    if (latestQueryMetrics && Object.keys(latestQueryMetrics).length > 0) {
      queryMetrics.current = latestQueryMetrics;
    }
  }, [queryResults]);

  const onRender = (item: IDocument): JSX.Element => (
    <>
      <Text style={{ paddingLeft: 10, margin: 0 }}>{`${item.metric}`}</Text>
    </>
  );
  const columns: IColumn[] = [
    {
      key: "column1",
      name: "Description",
      iconName: "Info",
      isIconOnly: true,
      minWidth: 10,
      maxWidth: 12,
      iconClassName: "iconheadercell",
      data: String,
      fieldName: "",
      onRender: (item: IDocument) => {
        if (item.toolTip !== "") {
          return (
            <>
              <TooltipHost content={`${item.toolTip}`}>
                <Link style={{ color: "#323130" }}>
                  <Icon iconName="Info" ariaLabel={`${item.toolTip}`} className="panelInfoIcon" tabIndex={0} />
                </Link>
              </TooltipHost>
            </>
          );
        } else {
          return undefined;
        }
      },
    },
    {
      key: "column2",
      name: "METRIC",
      minWidth: 200,
      data: String,
      fieldName: "metric",
      onRender,
    },
    {
      key: "column3",
      name: "VALUE",
      minWidth: 200,
      data: String,
      fieldName: "value",
    },
  ];
  const maybeSubQuery = queryEditorContent && /.*\(.*SELECT.*\)/i.test(queryEditorContent);
  const queryResultsString = queryResults
    ? isMongoDB
      ? MongoUtility.tojson(queryResults.documents, undefined, false)
      : JSON.stringify(queryResults.documents, undefined, 4)
    : "";

  const onErrorDetailsClick = (): boolean => {
    useNotificationConsole.getState().expandConsole();

    return false;
  };

  const onErrorDetailsKeyPress = (event: React.KeyboardEvent<HTMLAnchorElement>): boolean => {
    if (event.key === NormalizedEventKey.Space || event.key === NormalizedEventKey.Enter) {
      onErrorDetailsClick();
      return false;
    }

    return true;
  };

  const onDownloadQueryMetricsCsvClick = (): boolean => {
    downloadQueryMetricsCsvData();
    return false;
  };

  const onDownloadQueryMetricsCsvKeyPress = (event: React.KeyboardEvent<HTMLAnchorElement>): boolean => {
    if (event.key === NormalizedEventKey.Space || NormalizedEventKey.Enter) {
      downloadQueryMetricsCsvData();
      return false;
    }

    return true;
  };

  const downloadQueryMetricsCsvData = (): void => {
    const csvData: string = generateQueryMetricsCsvData();
    if (!csvData) {
      return;
    }

    if (navigator.msSaveBlob) {
      // for IE and Edge
      navigator.msSaveBlob(
        new Blob([csvData], { type: "data:text/csv;charset=utf-8" }),
        "PerPartitionQueryMetrics.csv",
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
  };

  const getAggregatedQueryMetrics = (): QueryMetrics => {
    const aggregatedQueryMetrics = {
      documentLoadTime: 0,
      documentWriteTime: 0,
      indexHitDocumentCount: 0,
      outputDocumentCount: 0,
      outputDocumentSize: 0,
      indexLookupTime: 0,
      retrievedDocumentCount: 0,
      retrievedDocumentSize: 0,
      vmExecutionTime: 0,
      runtimeExecutionTimes: {
        queryEngineExecutionTime: 0,
        systemFunctionExecutionTime: 0,
        userDefinedFunctionExecutionTime: 0,
      },
      totalQueryExecutionTime: 0,
    } as QueryMetrics;

    if (queryMetrics.current) {
      Object.keys(queryMetrics.current).forEach((partitionKeyRangeId) => {
        const queryMetricsPerPartition = queryMetrics.current[partitionKeyRangeId];
        if (!queryMetricsPerPartition) {
          return;
        }
        aggregatedQueryMetrics.documentLoadTime += queryMetricsPerPartition.documentLoadTime?.totalMilliseconds() || 0;
        aggregatedQueryMetrics.documentWriteTime +=
          queryMetricsPerPartition.documentWriteTime?.totalMilliseconds() || 0;
        aggregatedQueryMetrics.indexHitDocumentCount += queryMetricsPerPartition.indexHitDocumentCount || 0;
        aggregatedQueryMetrics.outputDocumentCount += queryMetricsPerPartition.outputDocumentCount || 0;
        aggregatedQueryMetrics.outputDocumentSize += queryMetricsPerPartition.outputDocumentSize || 0;
        aggregatedQueryMetrics.indexLookupTime += queryMetricsPerPartition.indexLookupTime?.totalMilliseconds() || 0;
        aggregatedQueryMetrics.retrievedDocumentCount += queryMetricsPerPartition.retrievedDocumentCount || 0;
        aggregatedQueryMetrics.retrievedDocumentSize += queryMetricsPerPartition.retrievedDocumentSize || 0;
        aggregatedQueryMetrics.vmExecutionTime += queryMetricsPerPartition.vmExecutionTime?.totalMilliseconds() || 0;
        aggregatedQueryMetrics.totalQueryExecutionTime +=
          queryMetricsPerPartition.totalQueryExecutionTime?.totalMilliseconds() || 0;
        aggregatedQueryMetrics.runtimeExecutionTimes.queryEngineExecutionTime +=
          queryMetricsPerPartition.runtimeExecutionTimes?.queryEngineExecutionTime?.totalMilliseconds() || 0;
        aggregatedQueryMetrics.runtimeExecutionTimes.systemFunctionExecutionTime +=
          queryMetricsPerPartition.runtimeExecutionTimes?.systemFunctionExecutionTime?.totalMilliseconds() || 0;
        aggregatedQueryMetrics.runtimeExecutionTimes.userDefinedFunctionExecutionTime +=
          queryMetricsPerPartition.runtimeExecutionTimes?.userDefinedFunctionExecutionTime?.totalMilliseconds() || 0;
      });
    }

    return aggregatedQueryMetrics;
  };

  const generateQueryMetricsCsvData = (): string => {
    if (queryMetrics.current) {
      let csvData =
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

      Object.keys(queryMetrics.current).forEach((partitionKeyRangeId) => {
        const queryMetricsPerPartition = queryMetrics.current[partitionKeyRangeId];
        csvData +=
          [
            partitionKeyRangeId,
            queryMetricsPerPartition.retrievedDocumentCount,
            queryMetricsPerPartition.retrievedDocumentSize,
            queryMetricsPerPartition.outputDocumentCount,
            queryMetricsPerPartition.outputDocumentSize,
            queryMetricsPerPartition.indexHitDocumentCount,
            queryMetricsPerPartition.indexLookupTime?.totalMilliseconds(),
            queryMetricsPerPartition.documentLoadTime?.totalMilliseconds(),
            queryMetricsPerPartition.runtimeExecutionTimes?.queryEngineExecutionTime?.totalMilliseconds(),
            queryMetricsPerPartition.runtimeExecutionTimes?.systemFunctionExecutionTime?.totalMilliseconds(),
            queryMetricsPerPartition.runtimeExecutionTimes?.userDefinedFunctionExecutionTime?.totalMilliseconds(),
            queryMetricsPerPartition.documentWriteTime?.totalMilliseconds(),
          ].join(",") + "\n";
      });

      return csvData;
    }

    return undefined;
  };

  const onFetchNextPageClick = async (): Promise<void> => {
    const { firstItemIndex, itemCount } = queryResults;
    await executeQueryDocumentsPage(firstItemIndex + itemCount - 1);
  };

  const generateQueryStatsItems = (): IDocument[] => {
    const items: IDocument[] = [
      {
        metric: "Request Charge",
        value: `${queryResults.requestCharge} RUs`,
        toolTip: "Request Charge",
      },
      {
        metric: "Showing Results",
        value: queryResults.itemCount > 0 ? `${queryResults.firstItemIndex} - ${queryResults.lastItemIndex}` : `0 - 0`,
        toolTip: "Showing Results",
      },
    ];

    if (userContext.apiType === "SQL") {
      const aggregatedQueryMetrics = getAggregatedQueryMetrics();
      items.push(
        {
          metric: "Retrieved document count",
          value: aggregatedQueryMetrics.retrievedDocumentCount?.toString() || "",
          toolTip: "Total number of retrieved documents",
        },
        {
          metric: "Retrieved document size",
          value: `${aggregatedQueryMetrics.retrievedDocumentSize?.toString() || 0} bytes`,
          toolTip: "Total size of retrieved documents in bytes",
        },
        {
          metric: "Output document count",
          value: aggregatedQueryMetrics.outputDocumentCount?.toString() || "",
          toolTip: "Number of output documents",
        },
        {
          metric: "Output document size",
          value: `${aggregatedQueryMetrics.outputDocumentSize?.toString() || 0} bytes`,
          toolTip: "Total size of output documents in bytes",
        },
        {
          metric: "Index hit document count",
          value: aggregatedQueryMetrics.indexHitDocumentCount?.toString() || "",
          toolTip: "Total number of documents matched by the filter",
        },
        {
          metric: "Index lookup time",
          value: `${aggregatedQueryMetrics.indexLookupTime?.toString() || 0} ms`,
          toolTip: "Time spent in physical index layer",
        },
        {
          metric: "Document load time",
          value: `${aggregatedQueryMetrics.documentLoadTime?.toString() || 0} ms`,
          toolTip: "Time spent in loading documents",
        },
        {
          metric: "Query engine execution time",
          value: `${aggregatedQueryMetrics.runtimeExecutionTimes?.queryEngineExecutionTime?.toString() || 0} ms`,
          toolTip:
            "Time spent by the query engine to execute the query expression (excludes other execution times like load documents or write results)",
        },
        {
          metric: "System function execution time",
          value: `${aggregatedQueryMetrics.runtimeExecutionTimes?.systemFunctionExecutionTime?.toString() || 0} ms`,
          toolTip: "Total time spent executing system (built-in) functions",
        },
        {
          metric: "User defined function execution time",
          value: `${
            aggregatedQueryMetrics.runtimeExecutionTimes?.userDefinedFunctionExecutionTime?.toString() || 0
          } ms`,
          toolTip: "Total time spent executing user-defined functions",
        },
        {
          metric: "Document write time",
          value: `${aggregatedQueryMetrics.documentWriteTime.toString() || 0} ms`,
          toolTip: "Time spent to write query result set to response buffer",
        },
      );
    }

    if (queryResults.roundTrips) {
      items.push({
        metric: "Round Trips",
        value: queryResults.roundTrips?.toString(),
        toolTip: "Number of round trips",
      });
    }

    if (queryResults.activityId) {
      items.push({
        metric: "Activity id",
        value: queryResults.activityId,
        toolTip: "",
      });
    }

    return items;
  };

  const onClickCopyResults = (): void => {
    copy(queryResultsString);
  };

  return (
    <Stack style={{ height: "100%" }}>
      {isMongoDB && queryEditorContent.length === 0 && (
        <div className="mongoQueryHelper">
          Start by writing a Mongo query, for example: <strong>{"{'id':'foo'}"}</strong> or{" "}
          <strong>
            {"{ "}
            {" }"}
          </strong>{" "}
          to get all the documents.
        </div>
      )}
      {maybeSubQuery && (
        <div className="warningErrorContainer" aria-live="assertive">
          <div className="warningErrorContent">
            <span>
              <img className="paneErrorIcon" src={InfoColor} alt="Error" />
            </span>
            <span className="warningErrorDetailsLinkContainer">
              We detected you may be using a subquery. To learn more about subqueries effectively,{" "}
              <a href="https://learn.microsoft.com/azure/cosmos-db/nosql/query/subquery">visit the documentation</a>
            </span>
          </div>
        </div>
      )}
      {/* <!-- Query Errors Tab - Start--> */}
      {error && (
        <div className="active queryErrorsHeaderContainer">
          <span className="queryErrors" data-toggle="tab">
            Errors
          </span>
        </div>
      )}
      {/* <!-- Query Errors Tab - End --> */}
      {/* <!-- Query Results & Errors Content Container - Start--> */}
      <div className="queryResultErrorContentContainer">
        {!queryResults && !error && !isExecuting && (
          <div className="queryEditorWatermark">
            <p>
              <img src={RunQuery} alt="Execute Query Watermark" />
            </p>
            <p className="queryEditorWatermarkText">Execute a query to see the results</p>
          </div>
        )}
        {(queryResults || !!error) && (
          <div className="queryResultsErrorsContent">
            {!error && (
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
                      <span>
                        {queryResults.itemCount > 0
                          ? `${queryResults.firstItemIndex} - ${queryResults.lastItemIndex}`
                          : `0 - 0`}
                      </span>
                    </span>
                    {queryResults.hasMoreResults && (
                      <>
                        <span className="queryResultDivider">|</span>
                        <span className="queryResultNextEnable">
                          <a onClick={() => onFetchNextPageClick()}>
                            <span>Load more</span>
                            <img className="queryResultnextImg" src={QueryEditorNext} alt="Fetch next page" />
                          </a>
                        </span>
                      </>
                    )}
                    <IconButton
                      style={{
                        height: "100%",
                        verticalAlign: "middle",
                        float: "right",
                      }}
                      iconProps={{ imageProps: { src: CopilotCopy } }}
                      title="Copy to Clipboard"
                      ariaLabel="Copy"
                      onClick={onClickCopyResults}
                    />
                  </div>
                  {queryResults && queryResultsString?.length > 0 && !error && (
                    <div
                      style={{
                        paddingBottom: "100px",
                        height: "100%",
                      }}
                    >
                      <EditorReact
                        language={"json"}
                        content={queryResultsString}
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
                  {queryResults && !error && (
                    <div className="queryMetricsSummaryContainer">
                      <div className="queryMetricsSummary">
                        <h3>Query Statistics</h3>
                        <DetailsList
                          items={generateQueryStatsItems()}
                          columns={columns}
                          selectionMode={SelectionMode.none}
                          layoutMode={DetailsListLayoutMode.justified}
                          compact={true}
                        />
                      </div>
                      {userContext.apiType === "SQL" && (
                        <div className="downloadMetricsLinkContainer">
                          <a
                            id="downloadMetricsLink"
                            role="button"
                            tabIndex={0}
                            onClick={() => onDownloadQueryMetricsCsvClick()}
                            onKeyPress={(event: React.KeyboardEvent<HTMLAnchorElement>) =>
                              onDownloadQueryMetricsCsvKeyPress(event)
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
            {!!error && (
              <div className="tab-pane active">
                <div className="errorContent">
                  <span className="errorMessage">{error}</span>
                  <span className="errorDetailsLink">
                    <a
                      onClick={() => onErrorDetailsClick()}
                      onKeyPress={(event: React.KeyboardEvent<HTMLAnchorElement>) => onErrorDetailsKeyPress(event)}
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
    </Stack>
  );
};
