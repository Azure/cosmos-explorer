/*  eslint-disable @typescript-eslint/no-explicit-any */
import {
  ConstrainMode,
  DetailsListLayoutMode,
  DetailsRow,
  IColumn,
  ScrollablePane,
  ScrollbarVisibility,
  ShimmeredDetailsList,
  Stack,
  Sticky,
  StickyPositionType,
} from "@fluentui/react";
import React, { useEffect } from "react";
import Pager from "../../../../Common/Pager";
import { openCopyJobDetailsPanel } from "../../Actions/CopyJobActions";
import { CopyJobType, HandleJobActionClickType } from "../../Types/CopyJobTypes";
import { getColumns } from "./CopyJobColumns";

interface CopyJobsListProps {
  jobs: CopyJobType[];
  handleActionClick: HandleJobActionClickType;
  pageSize?: number;
}

const styles = {
  container: { height: "calc(100vh - 25em)" } as React.CSSProperties,
  stackItem: { position: "relative", marginBottom: "20px" } as React.CSSProperties,
};

const PAGE_SIZE = 10;

const CopyJobsList: React.FC<CopyJobsListProps> = ({ jobs, handleActionClick, pageSize = PAGE_SIZE }) => {
  const [startIndex, setStartIndex] = React.useState(0);
  const [sortedJobs, setSortedJobs] = React.useState<CopyJobType[]>(jobs);
  const [sortedColumnKey, setSortedColumnKey] = React.useState<string | undefined>(undefined);
  const [isSortedDescending, setIsSortedDescending] = React.useState<boolean>(false);

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

  const columns: IColumn[] = React.useMemo(
    () => getColumns(handleSort, handleActionClick, sortedColumnKey, isSortedDescending),
    [handleSort, handleActionClick, sortedColumnKey, isSortedDescending],
  );

  const _handleRowClick = React.useCallback((job: CopyJobType) => {
    openCopyJobDetailsPanel(job);
  }, []);

  const _onRenderRow = React.useCallback((props: any) => {
    return (
      <div onClick={_handleRowClick.bind(null, props.item)}>
        <DetailsRow {...props} styles={{ root: { cursor: "pointer" } }} />
      </div>
    );
  }, []);

  return (
    <div style={styles.container}>
      <Stack verticalFill={true}>
        <Stack.Item verticalFill={true} grow={1} shrink={1} style={styles.stackItem}>
          <ScrollablePane scrollbarVisibility={ScrollbarVisibility.auto}>
            <ShimmeredDetailsList
              onRenderRow={_onRenderRow}
              checkboxVisibility={2}
              columns={columns}
              items={sortedJobs.slice(startIndex, startIndex + pageSize)}
              enableShimmer={false}
              constrainMode={ConstrainMode.unconstrained}
              layoutMode={DetailsListLayoutMode.justified}
              onRenderDetailsHeader={(props, defaultRender) => (
                <Sticky stickyPosition={StickyPositionType.Header} isScrollSynced>
                  {defaultRender({ ...props })}
                </Sticky>
              )}
            />
          </ScrollablePane>
        </Stack.Item>
        {sortedJobs.length > pageSize && (
          <Stack.Item>
            <Pager
              disabled={false}
              startIndex={startIndex}
              totalCount={sortedJobs.length}
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
