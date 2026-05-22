import type { CompositePath, IndexingPolicy } from "@azure/cosmos";
import { FontIcon } from "@fluentui/react";
import {
  Button,
  Checkbox,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  SelectTabData,
  SelectTabEvent,
  Spinner,
  Tab,
  TabList,
  Table,
  TableBody,
  TableCell,
  TableColumnDefinition,
  TableHeader,
  TableRow,
  createTableColumn,
} from "@fluentui/react-components";
import { ArrowDownloadRegular, ChevronDown20Regular, ChevronRight20Regular, CopyRegular } from "@fluentui/react-icons";
import copy from "clipboard-copy";
import { HttpHeaders } from "Common/Constants";
import MongoUtility from "Common/MongoUtility";
import { QueryMetrics } from "Contracts/DataModels";
import { QueryResults } from "Contracts/ViewModels";
import { EditorReact } from "Explorer/Controls/Editor/EditorReact";
import {
  parseIndexMetrics,
  renderImpactDots,
  type IndexMetricsResponse,
} from "Explorer/Tabs/QueryTab/IndexAdvisorUtils";
import { IDocument } from "Explorer/Tabs/QueryTab/QueryTabComponent";
import { useQueryTabStyles } from "Explorer/Tabs/QueryTab/Styles";
import React, { useCallback, useEffect, useState } from "react";
import { userContext } from "UserContext";
import { logConsoleProgress } from "Utils/NotificationConsoleUtils";
import create from "zustand";
import { client } from "../../../Common/CosmosClient";
import { handleError } from "../../../Common/ErrorHandlingUtils";
import { sampleDataClient } from "../../../Common/SampleDataClient";
import { ResultsViewProps } from "./QueryResultSection";
import { useIndexAdvisorStyles } from "./StylesAdvisor";
enum ResultsTabs {
  Results = "results",
  QueryStats = "queryStats",
  IndexAdvisor = "indexadv",
}
const ResultsTab: React.FC<ResultsViewProps> = ({ queryResults, isMongoDB, executeQueryDocumentsPage }) => {
  const styles = useQueryTabStyles();
  /* eslint-disable react/prop-types */
  const queryResultsString = queryResults
    ? isMongoDB
      ? MongoUtility.tojson(queryResults.documents, undefined, false)
      : JSON.stringify(queryResults.documents, undefined, 4)
    : "";

  const onClickCopyResults = (): void => {
    copy(queryResultsString);
  };

  const onFetchNextPageClick = async (): Promise<void> => {
    const { firstItemIndex, itemCount } = queryResults;
    await executeQueryDocumentsPage(firstItemIndex + itemCount - 1);
  };

  const ExportResults: React.FC = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setShowDropdown(false);
        }
      };

      if (showDropdown) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [showDropdown]);

    const escapeCsvValue = (value: string): string => {
      return `"${value.replace(/"/g, '""')}"`;
    };

    const formatValueForCsv = (value: string | object): string => {
      if (value === null || value === undefined) {
        return "";
      }
      if (typeof value === "object") {
        return escapeCsvValue(JSON.stringify(value));
      }
      return escapeCsvValue(String(value));
    };

    const exportToCsv = () => {
      try {
        const allHeadersSet = new Set<string>();
        queryResults.documents.forEach((doc) => {
          Object.keys(doc).forEach((key) => allHeadersSet.add(key));
        });

        const allHeaders = Array.from(allHeadersSet);
        const csvHeader = allHeaders.map(escapeCsvValue).join(",");
        const csvData = queryResults.documents
          .map((doc) =>
            allHeaders.map((header) => (doc[header] !== undefined ? formatValueForCsv(doc[header]) : "")).join(","),
          )
          .join("\n");

        const csvContent = `sep=,\n${csvHeader}\n${csvData}`;
        downloadFile(csvContent, "query-results.csv", "text/csv");
      } catch (error) {
        console.error("Failed to export CSV:", error);
      }
    };

    const exportToJson = () => {
      try {
        downloadFile(queryResultsString, "query-results.json", "application/json");
      } catch (error) {
        console.error("Failed to export JSON:", error);
      }
    };

    const downloadFile = (content: string, fileName: string, contentType: string) => {
      const blob = new Blob([content], { type: contentType });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    const handleExport = (format: "CSV" | "JSON") => {
      setShowDropdown(false);
      if (format === "CSV") {
        exportToCsv();
      } else {
        exportToJson();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent, format: "CSV" | "JSON") => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleExport(format);
      } else if (e.key === "Escape") {
        setShowDropdown(false);
      }
    };

    return (
      <div style={{ position: "relative", display: "inline-block" }} ref={dropdownRef}>
        <Button
          onClick={() => setShowDropdown((v) => !v)}
          size="small"
          appearance="transparent"
          icon={<ArrowDownloadRegular />}
          title="Download Query Results"
          aria-haspopup="listbox"
          aria-expanded={showDropdown}
        />
        {showDropdown && (
          <div
            style={{
              position: "absolute",
              right: 0,
              zIndex: 10,
              background: "white",
              border: "1px solid #ccc",
              borderRadius: 2,
              minWidth: 60,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              marginTop: 4,
            }}
            role="listbox"
            tabIndex={-1}
          >
            <button
              style={{
                display: "block",
                width: "100%",
                padding: "8px 16px",
                background: "none",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#f3f3f3")}
              onMouseOut={(e) => (e.currentTarget.style.background = "none")}
              onClick={() => handleExport("JSON")}
              onKeyDown={(e) => handleKeyDown(e, "JSON")}
              role="option"
              tabIndex={0}
            >
              JSON
            </button>
            <button
              style={{
                display: "block",
                width: "100%",
                padding: "8px 16px",
                background: "none",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#f3f3f3")}
              onMouseOut={(e) => (e.currentTarget.style.background = "none")}
              onClick={() => handleExport("CSV")}
              onKeyDown={(e) => handleKeyDown(e, "CSV")}
              role="option"
              tabIndex={0}
            >
              CSV
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={styles.queryResultsBar}>
        <div>
          {queryResults.itemCount > 0 ? `${queryResults.firstItemIndex} - ${queryResults.lastItemIndex}` : `0 - 0`}
        </div>
        {queryResults.hasMoreResults && (
          <a href="#" onClick={() => onFetchNextPageClick()}>
            Load more
          </a>
        )}
        <div className={styles.flexGrowSpacer} />
        <Button
          size="small"
          appearance="transparent"
          icon={<CopyRegular />}
          title="Copy to Clipboard"
          aria-label="Copy"
          onClick={onClickCopyResults}
        />
        <ExportResults />
      </div>
      <div className={styles.queryResultsViewer}>
        <EditorReact language={"json"} content={queryResultsString} isReadOnly={true} ariaLabel={"Query results"} />
      </div>
    </>
  );
};

const QueryStatsTab: React.FC<Pick<ResultsViewProps, "queryResults">> = ({ queryResults }) => {
  const styles = useQueryTabStyles();
  const queryMetrics = React.useRef(queryResults?.headers?.[HttpHeaders.queryMetrics]);
  React.useEffect(() => {
    const latestQueryMetrics = queryResults?.headers?.[HttpHeaders.queryMetrics];
    if (latestQueryMetrics && Object.keys(latestQueryMetrics).length > 0) {
      queryMetrics.current = latestQueryMetrics;
    }
  }, [queryResults]);

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

  const columns: TableColumnDefinition<IDocument>[] = [
    createTableColumn<IDocument>({
      columnId: "metric",
      renderHeaderCell: () => "Metric",
      renderCell: (item) => item.metric,
    }),
    createTableColumn<IDocument>({
      columnId: "value",
      renderHeaderCell: () => "Value",
      renderCell: (item) => item.value,
    }),
  ];

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

  const onDownloadQueryMetricsCsvClick = (): boolean => {
    downloadQueryMetricsCsvData();
    return false;
  };

  return (
    <div className={styles.metricsGridContainer}>
      <DataGrid
        data-test="QueryTab/ResultsPane/ResultsView/QueryStatsList"
        className={styles.queryStatsGrid}
        items={generateQueryStatsItems()}
        columns={columns}
        sortable
        getRowId={(item) => item.metric}
        focusMode="composite"
      >
        <DataGridHeader>
          <DataGridRow>
            {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<IDocument>>
          {({ item, rowId }) => (
            <DataGridRow<IDocument> key={rowId} data-test={`Row:${rowId}`}>
              {({ columnId, renderCell }) => (
                <DataGridCell data-test={`Row:${rowId}/Column:${columnId}`}>{renderCell(item)}</DataGridCell>
              )}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
      <div className={styles.metricsGridButtons}>
        {userContext.apiType === "SQL" && (
          <Button appearance="subtle" onClick={() => onDownloadQueryMetricsCsvClick()} icon={<ArrowDownloadRegular />}>
            Per-partition query metrics (CSV)
          </Button>
        )}
      </div>
    </div>
  );
};

export interface IIndexMetric {
  index: string;
  impact: string;
  section: "Included" | "Not Included" | "Header";
  path?: string;
  composite?: { path: string; order: string }[];
}
export const IndexAdvisorTab: React.FC<{
  queryResults?: QueryResults;
  queryEditorContent?: string;
  databaseId?: string;
  containerId?: string;
}> = ({ queryResults, queryEditorContent, databaseId, containerId }) => {
  const style = useIndexAdvisorStyles();

  const [loading, setLoading] = useState(false);
  const [indexMetrics, setIndexMetrics] = useState<IndexMetricsResponse | null>(null);
  const [showIncluded, setShowIncluded] = useState(true);
  const [showNotIncluded, setShowNotIncluded] = useState(true);
  const [selectedIndexes, setSelectedIndexes] = useState<IIndexMetric[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [updateMessageShown, setUpdateMessageShown] = useState(false);
  const [included, setIncludedIndexes] = useState<IIndexMetric[]>([]);
  const [notIncluded, setNotIncludedIndexes] = useState<IIndexMetric[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [justUpdatedPolicy, setJustUpdatedPolicy] = useState(false);
  const indexingMetricsDocLink = "https://learn.microsoft.com/azure/cosmos-db/nosql/index-metrics";

  const fetchIndexMetrics = async () => {
    if (!queryEditorContent || !databaseId || !containerId) {
      return;
    }

    setLoading(true);
    const clearMessage = logConsoleProgress(`Querying items with IndexMetrics in container ${containerId}`);
    try {
      const querySpec = {
        query: queryEditorContent,
      };

      // Use sampleDataClient for CopilotSampleDB, regular client for other databases
      const cosmosClient = databaseId === "CopilotSampleDB" ? sampleDataClient() : client();

      const sdkResponse = await cosmosClient
        .database(databaseId)
        .container(containerId)
        .items.query(querySpec, {
          populateIndexMetrics: true,
        })
        .fetchAll();

      const parsedMetrics =
        typeof sdkResponse.indexMetrics === "string" ? JSON.parse(sdkResponse.indexMetrics) : sdkResponse.indexMetrics;

      setIndexMetrics(parsedMetrics);
    } catch (error) {
      handleError(error, "queryItemsWithIndexMetrics", `Error querying items from ${containerId}`);
    } finally {
      clearMessage();
      setLoading(false);
    }
  };

  // Fetch index metrics when query results change (i.e., when Execute Query is clicked)
  useEffect(() => {
    if (queryEditorContent && databaseId && containerId && queryResults) {
      fetchIndexMetrics();
    }
  }, [queryResults]);

  useEffect(() => {
    if (!indexMetrics) {
      return;
    }

    const { included, notIncluded } = parseIndexMetrics(indexMetrics);
    setIncludedIndexes(included);
    setNotIncludedIndexes(notIncluded);
    if (justUpdatedPolicy) {
      setJustUpdatedPolicy(false);
    } else {
      setUpdateMessageShown(false);
    }
  }, [indexMetrics]);

  useEffect(() => {
    const allSelected =
      notIncluded.length > 0 && notIncluded.every((item) => selectedIndexes.some((s) => s.index === item.index));
    setSelectAll(allSelected);
  }, [selectedIndexes, notIncluded]);

  const handleCheckboxChange = (indexObj: IIndexMetric, checked: boolean) => {
    if (checked) {
      setSelectedIndexes((prev) => [...prev, indexObj]);
    } else {
      setSelectedIndexes((prev) => prev.filter((item) => item.index !== indexObj.index));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedIndexes(checked ? notIncluded : []);
  };

  const handleUpdatePolicy = async () => {
    setIsUpdating(true);
    try {
      const containerRef = client().database(databaseId).container(containerId);
      const { resource: containerDef } = await containerRef.read();

      const newIncludedPaths = selectedIndexes
        .filter((index) => !index.composite)
        .map((index) => {
          return {
            path: index.path,
          };
        });

      const newCompositeIndexes: CompositePath[][] = selectedIndexes
        .filter((index) => Array.isArray(index.composite))
        .map(
          (index) =>
            (index.composite as { path: string; order: string }[]).map((comp) => ({
              path: comp.path,
              order: comp.order === "descending" ? "descending" : "ascending",
            })) as CompositePath[],
        );

      const updatedPolicy: IndexingPolicy = {
        ...containerDef.indexingPolicy,
        includedPaths: [...(containerDef.indexingPolicy?.includedPaths || []), ...newIncludedPaths],
        compositeIndexes: [...(containerDef.indexingPolicy?.compositeIndexes || []), ...newCompositeIndexes],
        automatic: containerDef.indexingPolicy?.automatic ?? true,
        indexingMode: containerDef.indexingPolicy?.indexingMode ?? "consistent",
        excludedPaths: containerDef.indexingPolicy?.excludedPaths ?? [],
      };
      await containerRef.replace({
        id: containerId,
        partitionKey: containerDef.partitionKey,
        indexingPolicy: updatedPolicy,
      });
      useIndexingPolicyStore.getState().setIndexingPolicyFor(containerId, updatedPolicy);
      const selectedIndexSet = new Set(selectedIndexes.map((s) => s.index));
      const updatedNotIncluded: typeof notIncluded = [];
      const newlyIncluded: typeof included = [];
      for (const item of notIncluded) {
        if (selectedIndexSet.has(item.index)) {
          newlyIncluded.push(item);
        } else {
          updatedNotIncluded.push(item);
        }
      }
      const newIncluded = [...included, ...newlyIncluded];
      const newNotIncluded = updatedNotIncluded;
      setIncludedIndexes(newIncluded);
      setNotIncludedIndexes(newNotIncluded);
      setSelectedIndexes([]);
      setSelectAll(false);
      setUpdateMessageShown(true);
      setJustUpdatedPolicy(true);
    } catch (err) {
      console.error("Failed to update indexing policy:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderRow = (item: IIndexMetric, index: number) => {
    const isHeader = item.section === "Header";
    const isNotIncluded = item.section === "Not Included";

    return (
      <TableRow key={index}>
        <TableCell colSpan={2}>
          <div className={style.indexAdvisorGrid}>
            {isNotIncluded ? (
              <Checkbox
                checked={selectedIndexes.some((selected) => selected.index === item.index)}
                onChange={(_, data) => handleCheckboxChange(item, data.checked === true)}
              />
            ) : isHeader && item.index === "Not Included in Current Policy" && notIncluded.length > 0 ? (
              <Checkbox checked={selectAll} onChange={(_, data) => handleSelectAll(data.checked === true)} />
            ) : (
              <div className={style.indexAdvisorCheckboxSpacer}></div>
            )}
            {isHeader ? (
              <span
                style={{ cursor: "pointer" }}
                onClick={() => {
                  if (item.index === "Included in Current Policy") {
                    setShowIncluded(!showIncluded);
                  } else if (item.index === "Not Included in Current Policy") {
                    setShowNotIncluded(!showNotIncluded);
                  }
                }}
              >
                {item.index === "Included in Current Policy" ? (
                  showIncluded ? (
                    <ChevronDown20Regular />
                  ) : (
                    <ChevronRight20Regular />
                  )
                ) : showNotIncluded ? (
                  <ChevronDown20Regular />
                ) : (
                  <ChevronRight20Regular />
                )}
              </span>
            ) : (
              <div className={style.indexAdvisorChevronSpacer}></div>
            )}
            <div className={isHeader ? style.indexAdvisorRowBold : style.indexAdvisorRowNormal}>{item.index}</div>
            <div className={isHeader ? style.indexAdvisorRowImpactHeader : style.indexAdvisorRowImpact}>
              {!isHeader && item.impact}
            </div>
            <div>{!isHeader && renderImpactDots(item.impact)}</div>
          </div>
        </TableCell>
      </TableRow>
    );
  };
  const indexMetricItems = React.useMemo(() => {
    const items: IIndexMetric[] = [];
    items.push({ index: "Not Included in Current Policy", impact: "", section: "Header" });
    if (showNotIncluded) {
      notIncluded.forEach((item) => items.push({ ...item, section: "Not Included" }));
    }
    items.push({ index: "Included in Current Policy", impact: "", section: "Header" });
    if (showIncluded) {
      included.forEach((item) => items.push({ ...item, section: "Included" }));
    }
    return items;
  }, [included, notIncluded, showIncluded, showNotIncluded]);

  if (loading) {
    return (
      <div>
        <Spinner
          size="small"
          style={
            {
              "--spinner-size": "16px",
              "--spinner-thickness": "2px",
              "--spinner-color": "#0078D4",
            } as React.CSSProperties
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className={style.indexAdvisorMessage}>
        {updateMessageShown ? (
          <>
            <span className={style.indexAdvisorSuccessIcon}>
              <FontIcon iconName="CheckMark" style={{ color: "white", fontSize: 12 }} />
            </span>
            <span>
              Your indexing policy has been updated with the new included paths. You may review the changes in Scale &
              Settings.
            </span>
          </>
        ) : (
          <>
            <span>
              Index Advisor uses Indexing Metrics to suggest query paths that, when included in your indexing policy,
              can improve the performance of this query by reducing RU costs and lowering latency.{" "}
              <a href={indexingMetricsDocLink} target="_blank" rel="noopener noreferrer">
                Learn more about Indexing Metrics
              </a>
              .{" "}
            </span>
          </>
        )}
      </div>
      <div className={style.indexAdvisorTitle}>Indexes analysis</div>
      <Table className={style.indexAdvisorTable}>
        <TableHeader>
          <TableRow>
            <TableCell colSpan={2}>
              <div className={style.indexAdvisorGrid}>
                <div className={style.indexAdvisorCheckboxSpacer}></div>
                <div className={style.indexAdvisorChevronSpacer}></div>
                <div>Index</div>
                <div>
                  <span style={{ whiteSpace: "nowrap" }}>Estimated Impact</span>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>{indexMetricItems.map(renderRow)}</TableBody>
      </Table>
      {selectedIndexes.length > 0 && (
        <div className={style.indexAdvisorButtonBar}>
          {isUpdating ? (
            <div className={style.indexAdvisorButtonSpinner}>
              <Spinner size="tiny" />{" "}
            </div>
          ) : (
            <button onClick={handleUpdatePolicy} className={style.indexAdvisorButton}>
              Update Indexing Policy with selected index(es)
            </button>
          )}
        </div>
      )}
    </div>
  );
};
export const ResultsView: React.FC<ResultsViewProps> = ({
  isMongoDB,
  queryResults,
  executeQueryDocumentsPage,
  queryEditorContent,
  databaseId,
  containerId,
}) => {
  const styles = useQueryTabStyles();
  const [activeTab, setActiveTab] = useState<ResultsTabs>(ResultsTabs.Results);

  const onTabSelect = useCallback((event: SelectTabEvent, data: SelectTabData) => {
    setActiveTab(data.value as ResultsTabs);
  }, []);
  return (
    <div data-test="QueryTab/ResultsPane/ResultsView" className={styles.queryResultsTabPanel}>
      <TabList selectedValue={activeTab} onTabSelect={onTabSelect}>
        <Tab
          data-test="QueryTab/ResultsPane/ResultsView/ResultsTab"
          id={ResultsTabs.Results}
          value={ResultsTabs.Results}
        >
          Results
        </Tab>
        <Tab
          data-test="QueryTab/ResultsPane/ResultsView/QueryStatsTab"
          id={ResultsTabs.QueryStats}
          value={ResultsTabs.QueryStats}
        >
          Query Stats
        </Tab>
        <Tab
          data-test="QueryTab/ResultsPane/ResultsView/IndexAdvisorTab"
          id={ResultsTabs.IndexAdvisor}
          value={ResultsTabs.IndexAdvisor}
        >
          Index Advisor
        </Tab>
      </TabList>
      <div className={styles.queryResultsTabContentContainer}>
        {activeTab === ResultsTabs.Results && (
          <ResultsTab
            queryResults={queryResults}
            isMongoDB={isMongoDB}
            executeQueryDocumentsPage={executeQueryDocumentsPage}
          />
        )}
        {activeTab === ResultsTabs.QueryStats && <QueryStatsTab queryResults={queryResults} />}
        {activeTab === ResultsTabs.IndexAdvisor && (
          <IndexAdvisorTab
            queryResults={queryResults}
            queryEditorContent={queryEditorContent}
            databaseId={databaseId}
            containerId={containerId}
          />
        )}
      </div>
    </div>
  );
};
export interface IndexingPolicyStore {
  indexingPolicies: { [containerId: string]: IndexingPolicy };
  setIndexingPolicyFor: (containerId: string, indexingPolicy: IndexingPolicy) => void;
}

export const useIndexingPolicyStore = create<IndexingPolicyStore>((set) => ({
  indexingPolicies: {},
  setIndexingPolicyFor: (containerId, indexingPolicy) =>
    set((state) => ({
      indexingPolicies: {
        ...state.indexingPolicies,
        [containerId]: { ...indexingPolicy },
      },
    })),
}));
