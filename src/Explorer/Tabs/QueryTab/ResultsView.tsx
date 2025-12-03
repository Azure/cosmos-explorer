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
  createTableColumn
} from "@fluentui/react-components";
import { ArrowDownloadRegular, ChevronDown20Regular, ChevronRight20Regular, CircleFilled, CopyRegular } from "@fluentui/react-icons";
import copy from "clipboard-copy";
import { HttpHeaders } from "Common/Constants";
import MongoUtility from "Common/MongoUtility";
import { QueryMetrics } from "Contracts/DataModels";
import { EditorReact } from "Explorer/Controls/Editor/EditorReact";
import { IDocument } from "Explorer/Tabs/QueryTab/QueryTabComponent";
import { useQueryTabStyles } from "Explorer/Tabs/QueryTab/Styles";
import { useQueryMetadataStore } from "Explorer/Tabs/QueryTab/useQueryMetadataStore";
import React, { useCallback, useEffect, useState } from "react";
import { userContext } from "UserContext";
import { logConsoleProgress } from "Utils/NotificationConsoleUtils";
import { client } from "../../../Common/CosmosClient";
import { handleError } from "../../../Common/ErrorHandlingUtils";
import { ResultsViewProps } from "./QueryResultSection";
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
          value: `${aggregatedQueryMetrics.runtimeExecutionTimes?.userDefinedFunctionExecutionTime?.toString() || 0
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

interface IIndexMetric {
  index: string;
  impact: string;
  section: "Included" | "Not Included" | "Header";
}
const IndexAdvisorTab: React.FC = () => {
  const { userQuery, databaseId, containerId } = useQueryMetadataStore();
  const [loading, setLoading] = useState(true);
  const [indexMetrics, setIndexMetrics] = useState<any>(null);
  const [showIncluded, setShowIncluded] = useState(true);
  const [showNotIncluded, setShowNotIncluded] = useState(true);
  const [selectedIndexes, setSelectedIndexes] = useState<any[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [updateMessageShown, setUpdateMessageShown] = useState(false);
  const [included, setIncludedIndexes] = useState<IIndexMetric[]>([]);
  const [notIncluded, setNotIncludedIndexes] = useState<IIndexMetric[]>([]);

  useEffect(() => {
    async function fetchIndexMetrics() {
      const clearMessage = logConsoleProgress(`Querying items with IndexMetrics in container ${containerId}`);
      try {
        const querySpec = {
          query: userQuery || "SELECT TOP 10 c.id FROM c WHERE c.Item = 'value1234' ",
        };
        const sdkResponse = await client()
          .database(databaseId)
          .container(containerId)
          .items.query(querySpec, {
            populateIndexMetrics: true,
          })
          .fetchAll();
        setIndexMetrics(sdkResponse.indexMetrics);
      } catch (error) {
        handleError(error, "queryItemsWithIndexMetrics", `Error querying items from ${containerId}`);
      } finally {
        clearMessage();
        setLoading(false);
      }
    }
    if (userQuery && databaseId && containerId) {
      fetchIndexMetrics();
    }
  }, [userQuery, databaseId, containerId]);

  useEffect(() => {
    if (!indexMetrics) return;

    const included: any[] = [];
    const notIncluded: any[] = [];
    const lines = indexMetrics.split("\n").map((line: string) => line.trim()).filter(Boolean);
    let currentSection = "";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("Utilized Single Indexes") || line.startsWith("Utilized Composite Indexes")) {
        currentSection = "included";
      } else if (line.startsWith("Potential Single Indexes") || line.startsWith("Potential Composite Indexes")) {
        currentSection = "notIncluded";
      } else if (line.startsWith("Index Spec:")) {
        const index = line.replace("Index Spec:", "").trim();
        const impactLine = lines[i + 1];
        const impact = impactLine?.includes("Index Impact Score:") ? impactLine.split(":")[1].trim() : "Unknown";

        const isComposite = index.includes(",");
        const indexObj: any = { index, impact };
        if (isComposite) {
          indexObj.composite = index.split(",").map((part: string) => {
            const [path, order] = part.trim().split(/\s+/);
            return {
              path: path.trim(),
              order: order?.toLowerCase() === "desc" ? "descending" : "ascending",
            };
          });
        } else {
          let path = "/unknown/*";
          const pathRegex = /\/[^\/\s*?]+(?:\/[^\/\s*?]+)*(\/\*|\?)/;
          const match = index.match(pathRegex);
          if (match) {
            path = match[0];
          } else {
            const simplePathRegex = /\/[^\/\s]+/;
            const simpleMatch = index.match(simplePathRegex);
            if (simpleMatch) {
              path = simpleMatch[0] + "/*";
            }
          }
          indexObj.path = path;
        }

        if (currentSection === "included") {
          included.push(indexObj);
        } else if (currentSection === "notIncluded") {
          notIncluded.push(indexObj);
        }
      }
    }
    setIncludedIndexes(included);
    setNotIncludedIndexes(notIncluded);
  }, [indexMetrics]);

  useEffect(() => {
    const allSelected = notIncluded.length > 0 && notIncluded.every((item) => selectedIndexes.some((s) => s.index === item.index));
    setSelectAll(allSelected);
  }, [selectedIndexes, notIncluded]);

  const handleCheckboxChange = (indexObj: any, checked: boolean) => {
    if (checked) {
      setSelectedIndexes((prev) => [...prev, indexObj]);
    } else {
      setSelectedIndexes((prev) =>
        prev.filter((item) => item.index !== indexObj.index)
      );
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedIndexes(checked ? notIncluded : []);
  };

  const handleUpdatePolicy = async () => {
    if (selectedIndexes.length === 0) {
      console.log("No indexes selected for update");
      return;
    }
    try {
      const { resource: containerDef } = await client()
        .database(databaseId)
        .container(containerId)
        .read();

      const newIncludedPaths = selectedIndexes
        .filter(index => !index.composite)
        .map(index => {

          return {
            path: index.path,
          };
        });

      const newCompositeIndexes = selectedIndexes
        .filter(index => index.composite)
        .map(index => index.composite);

      const updatedPolicy = {
        ...containerDef.indexingPolicy,
        includedPaths: [
          ...(containerDef.indexingPolicy?.includedPaths || []),
          ...newIncludedPaths,
        ],
        compositeIndexes: [
          ...(containerDef.indexingPolicy?.compositeIndexes || []),
          ...newCompositeIndexes,
        ],
      };

      await client()
        .database(databaseId)
        .container(containerId)
        .replace({
          id: containerId,
          partitionKey: containerDef.partitionKey,
          indexingPolicy: updatedPolicy,
        });

      const newIncluded = [...included, ...notIncluded.filter(item =>
        selectedIndexes.find(s => s.index === item.index)
      )];
      const newNotIncluded = notIncluded.filter(item =>
        !selectedIndexes.find(s => s.index === item.index)
      );

      setSelectedIndexes([]);
      setSelectAll(false);
      setIndexMetricsFromParsed(newIncluded, newNotIncluded);
      setUpdateMessageShown(true);
    } catch (err) {
      console.error("Failed to update indexing policy:", err);
    }
  };

  const setIndexMetricsFromParsed = (included: { index: string; impact: string }[], notIncluded: { index: string; impact: string }[]) => {
    const serialize = (sectionTitle: string, items: { index: string; impact: string }[], isUtilized: boolean) =>
      items.length
        ? `${sectionTitle}\n` +
        items
          .map((item) => `Index Spec: ${item.index}\nIndex Impact Score: ${item.impact}`)
          .join("\n") + "\n"
        : "";
    const composedMetrics =
      serialize("Utilized Single Indexes", included, true) +
      serialize("Potential Single Indexes", notIncluded, false);

    setIndexMetrics(composedMetrics.trim());
  };

  const renderImpactDots = (impact: string) => {
    let count = 0;
    if (impact === "High") count = 3;
    else if (impact === "Medium") count = 2;
    else if (impact === "Low") count = 1;

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {Array.from({ length: count }).map((_, i) => (
          <CircleFilled
            key={i}
            style={{
              color: "#0078D4",
              fontSize: "12px",
              display: "inline-flex",
            }}
          />
        ))}
      </div>
    );
  };

  const renderRow = (item: IIndexMetric, index: number) => {
    const isHeader = item.section === "Header";
    const isNotIncluded = item.section === "Not Included";
    const isIncluded = item.section === "Included";

    return (
      <TableRow key={index}>
        <TableCell colSpan={2}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "30px 30px 1fr 50px 120px",
              alignItems: "center",
              gap: "8px",
            }}>
            {isNotIncluded ? (
              <Checkbox
                checked={selectedIndexes.some((selected) => selected.index === item.index)}
                onChange={(_, data) => handleCheckboxChange(item, data.checked === true)}
              />
            ) : isHeader && item.index === "Not Included in Current Policy" && notIncluded.length > 0 ? (
              <Checkbox
                checked={selectAll}
                onChange={(_, data) => handleSelectAll(data.checked === true)}
              />
            ) : (
              <div style={{ width: "18px", height: "18px" }}></div>
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
                {item.index === "Included in Current Policy"
                  ? showIncluded
                    ? <ChevronDown20Regular />
                    : <ChevronRight20Regular />
                  : showNotIncluded
                    ? <ChevronDown20Regular />
                    : <ChevronRight20Regular />
                }
              </span>
            ) : (
              <div style={{ width: "24px" }}></div>
            )}
            <div style={{ fontWeight: isHeader ? "bold" : "normal" }}>
              {item.index}
            </div>
            <div style={{ fontSize: isHeader ? 0 : undefined }}>
              {isHeader ? null : item.impact}
            </div>
            <div>
              {isHeader ? null : renderImpactDots(item.impact)}
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
  };
  const generateIndexMetricItems = (

    included: { index: string; impact: string }[],
    notIncluded: { index: string; impact: string }[]
  ): IIndexMetric[] => {
    const items: IIndexMetric[] = [];

    items.push({ index: "Not Included in Current Policy", impact: "", section: "Header" });
    if (showNotIncluded) {
      notIncluded.forEach((item) =>
        items.push({ ...item, section: "Not Included" })
      );
    }
    items.push({ index: "Included in Current Policy", impact: "", section: "Header" });
    if (showIncluded) {
      included.forEach((item) =>
        items.push({ ...item, section: "Included" })
      );
    }
    return items;
  };

  if (loading) {
    return <div>
      <Spinner
        size="small"
        style={{
          '--spinner-size': '16px',
          '--spinner-thickness': '2px',
          '--spinner-color': '#0078D4',
        } as React.CSSProperties} />
    </div>;
  }

  return (
    <div>
      <div style={{ padding: "1rem", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {updateMessageShown ? (
          <>
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                backgroundColor: "#107C10",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
              <FontIcon iconName="CheckMark" style={{ color: "white", fontSize: 12 }} />
            </span>
            <span>
              Your indexing policy has been updated with the new included paths. You may review the changes in Scale & Settings.
            </span>
          </>
        ) : (
          "Here is an analysis on the indexes utilized for executing the query. Based on the analysis, Cosmos DB recommends adding the selected indexes to your indexing policy to optimize the performance of this particular query."
        )}
      </div>
      <div style={{ padding: "1rem", fontSize: "1.3rem", fontWeight: "bold" }}>Indexes analysis</div>
      <Table style={{ display: "block", alignItems: "center", marginBottom: "7rem" }}>
        <TableHeader>
          <TableRow >
            <TableCell colSpan={2}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "30px 30px 1fr 50px 120px",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: "bold",
                }}
              >
                <div style={{ width: "18px", height: "18px" }}></div>
                <div style={{ width: "24px" }}></div>
                <div>Index</div>
                <div><span style={{ whiteSpace: "nowrap" }}>Estimated Impact</span></div>
              </div>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {generateIndexMetricItems(included, notIncluded).map(renderRow)}
        </TableBody>
      </Table>
      {selectedIndexes.length > 0 && (
        <div style={{ padding: "1rem", marginTop: "-7rem", flexWrap: "wrap" }}>
          <button
            onClick={handleUpdatePolicy}
            style={{
              backgroundColor: "#0078D4",
              color: "white",
              padding: "8px 16px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "1rem",
            }}
          >
            Update Indexing Policy with selected index(es)
          </button>
        </div>
      )}
    </div>
  );
};
export const ResultsView: React.FC<ResultsViewProps> = ({ isMongoDB, queryResults, executeQueryDocumentsPage }) => {
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
        {activeTab === ResultsTabs.IndexAdvisor && <IndexAdvisorTab />}
      </div>
    </div>
  );
};
