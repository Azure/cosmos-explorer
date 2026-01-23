/*  eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import {
  ConstrainMode,
  DetailsListLayoutMode,
  DetailsRow,
  IColumn,
  IDetailsRowProps,
  ScrollablePane,
  ScrollbarVisibility,
  ShimmeredDetailsList,
  Stack,
  Sticky,
  StickyPositionType,
  TextField,
} from "@fluentui/react";
import React, { useEffect, useMemo } from "react";
import Pager from "../../../../Common/Pager";
import { useThemeStore } from "../../../../hooks/useTheme";
import { getThemeTokens } from "../../../Theme/ThemeUtil";
import { openCopyJobDetailsPanel } from "../../Actions/CopyJobActions";
import { CopyJobType, HandleJobActionClickType } from "../../Types/CopyJobTypes";
import { getColumns } from "./CopyJobColumns";

interface CopyJobsListProps {
  jobs: CopyJobType[];
  handleActionClick: HandleJobActionClickType;
  pageSize?: number;
}

const styles = {
  container: { height: "100%" } as React.CSSProperties,
  stackItem: { position: "relative", marginBottom: "20px" } as React.CSSProperties,
  filterContainer: {
    margin: "15px 5px",
  },
};

const PAGE_SIZE = 15;

// Columns to search across
const searchableFields = ["Name", "Status", "LastUpdatedTime", "Mode"];

const CopyJobsList: React.FC<CopyJobsListProps> = ({ jobs, handleActionClick, pageSize = PAGE_SIZE }) => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const themeTokens = getThemeTokens(isDarkMode);
  const [startIndex, setStartIndex] = React.useState(0);
  const [sortedJobs, setSortedJobs] = React.useState<CopyJobType[]>(jobs);
  const [sortedColumnKey, setSortedColumnKey] = React.useState<string | undefined>(undefined);
  const [isSortedDescending, setIsSortedDescending] = React.useState<boolean>(false);
  const [filterText, setFilterText] = React.useState<string>("");

  const filteredJobs = useMemo(() => {
    if (!filterText) {
      return sortedJobs;
    }
    const lowerFilterText = filterText.toLowerCase();
    return sortedJobs.filter((job: any) => {
      return searchableFields.some((field) => {
        const value = job[field];
        if (value === undefined || value === null) {
          return false;
        }
        return String(value).toLowerCase().includes(lowerFilterText);
      });
    });
  }, [sortedJobs, filterText]);

  useEffect(() => {
    setSortedJobs(jobs);
    setStartIndex(0);
  }, [jobs]);

  const handleSort = (columnKey: string) => {
    const isDescending = sortedColumnKey === columnKey ? !isSortedDescending : false;
    const sorted = [...sortedJobs].sort((current: any, next: any) => {
      if (current[columnKey] < next[columnKey]) {
        return isDescending ? 1 : -1;
      }
      if (current[columnKey] > next[columnKey]) {
        return isDescending ? -1 : 1;
      }
      return 0;
    });
    setSortedJobs(sorted);
    setSortedColumnKey(columnKey);
    setIsSortedDescending(isDescending);
    setStartIndex(0);
  };

  const sortableColumns: IColumn[] = getColumns(handleSort, handleActionClick, sortedColumnKey, isSortedDescending);

  const handleFilterTextChange = (
    _event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    newValue?: string,
  ) => {
    setFilterText(newValue || "");
    setStartIndex(0);
  };

  const _handleRowClick = (job: CopyJobType) => {
    openCopyJobDetailsPanel(job);
  };

  const _onRenderRow = (props: IDetailsRowProps) => {
    return (
      <div onClick={_handleRowClick.bind(null, props.item)}>
        <DetailsRow {...props} styles={{ root: { cursor: "pointer" } }} />
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <Stack verticalFill={true}>
        <Stack.Item>
          <div style={styles.filterContainer}>
            <TextField
              data-test="CopyJobsList/FilterTextField"
              placeholder="Search jobs..."
              value={filterText}
              onChange={handleFilterTextChange}
            />
          </div>
        </Stack.Item>
        <Stack.Item verticalFill={true} grow={1} shrink={1} style={styles.stackItem}>
          <ScrollablePane scrollbarVisibility={ScrollbarVisibility.auto}>
            <ShimmeredDetailsList
              className="CopyJobListContainer"
              onRenderRow={_onRenderRow}
              checkboxVisibility={2}
              columns={sortableColumns}
              items={filteredJobs.slice(startIndex, startIndex + pageSize)}
              enableShimmer={false}
              constrainMode={ConstrainMode.unconstrained}
              layoutMode={DetailsListLayoutMode.justified}
              onRenderDetailsHeader={(props, defaultRender) => {
                const bgColor = themeTokens.colorNeutralBackground3;
                const textColor = themeTokens.colorNeutralForeground1;
                return (
                  <Sticky stickyPosition={StickyPositionType.Header} isScrollSynced stickyBackgroundColor={bgColor}>
                    <div style={{ backgroundColor: bgColor }}>
                      {defaultRender({
                        ...props,
                        styles: {
                          root: {
                            backgroundColor: bgColor,
                            selectors: {
                              ".ms-DetailsHeader-cellTitle": { color: textColor },
                              ".ms-DetailsHeader-cellName": { color: textColor },
                            },
                          },
                        },
                      })}
                    </div>
                  </Sticky>
                );
              }}
            />
          </ScrollablePane>
        </Stack.Item>
        {filteredJobs.length > pageSize && (
          <Stack.Item>
            <Pager
              disabled={false}
              startIndex={startIndex}
              totalCount={filteredJobs.length}
              pageSize={pageSize}
              onLoadPage={(startIdx /* pageSize */) => {
                setStartIndex(startIdx);
              }}
              showFirstLast={true}
              showItemCount={true}
            />
          </Stack.Item>
        )}
      </Stack>
    </div>
  );
};

export default CopyJobsList;
