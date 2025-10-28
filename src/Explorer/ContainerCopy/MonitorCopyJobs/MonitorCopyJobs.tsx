/* eslint-disable react/display-name */
import { MessageBar, MessageBarType, Stack } from "@fluentui/react";
import ShimmerTree, { IndentLevel } from "Common/ShimmerTree";
import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import { getCopyJobs, updateCopyJobStatus } from "../Actions/CopyJobActions";
import { convertToCamelCase } from "../CopyJobUtils";
import { CopyJobStatusType } from "../Enums";
import CopyJobsNotFound from "../MonitorCopyJobs/Components/CopyJobs.NotFound";
import { CopyJobType } from "../Types";
import CopyJobsList from "./Components/CopyJobsList";

const FETCH_INTERVAL_MS = 30 * 1000; // Interval time in milliseconds (30 seconds)

interface MonitorCopyJobsProps {}

export interface MonitorCopyJobsRef {
  refreshJobList: () => void;
}

const MonitorCopyJobs = forwardRef<MonitorCopyJobsRef, MonitorCopyJobsProps>((_props, ref) => {
  const [loading, setLoading] = React.useState(true); // Start with loading as true
  const [error, setError] = React.useState<string | null>(null);
  const [jobs, setJobs] = React.useState<CopyJobType[]>([]);
  const isUpdatingRef = React.useRef(false); // Use ref to track updating state
  const isFirstFetchRef = React.useRef(true); // Use ref to track the first fetch

  const indentLevels = React.useMemo<IndentLevel[]>(() => Array(7).fill({ level: 0, width: "100%" }), []);

  const fetchJobs = React.useCallback(async () => {
    if (isUpdatingRef.current) {
      return;
    } // Skip if an update is in progress
    try {
      if (isFirstFetchRef.current) {
        setLoading(true);
      } // Show loading spinner only for the first fetch
      setError(null);

      const response = await getCopyJobs();
      setJobs((prevJobs) => {
        // Only update jobs if they are different
        const isSame = JSON.stringify(prevJobs) === JSON.stringify(response);
        return isSame ? prevJobs : response;
      });
    } catch (error) {
      setError(error.message || "Failed to load copy jobs. Please try again later.");
    } finally {
      if (isFirstFetchRef.current) {
        setLoading(false); // Hide loading spinner after the first fetch
        isFirstFetchRef.current = false; // Mark the first fetch as complete
      }
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const intervalId = setInterval(fetchJobs, FETCH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [fetchJobs]);

  useImperativeHandle(ref, () => ({
    refreshJobList: () => {
      if (isUpdatingRef.current) {
        setError("Please wait for the current update to complete before refreshing.");
        return;
      }
      fetchJobs();
    },
  }));

  const handleActionClick = React.useCallback(async (job: CopyJobType, action: string) => {
    try {
      isUpdatingRef.current = true; // Mark as updating
      const updatedCopyJob = await updateCopyJobStatus(job, action);
      if (updatedCopyJob) {
        setJobs((prevJobs) =>
          prevJobs.map((prevJob) =>
            prevJob.Name === updatedCopyJob.properties.jobName
              ? {
                  ...prevJob,
                  Status: convertToCamelCase(updatedCopyJob.properties.status) as CopyJobStatusType,
                }
              : prevJob,
          ),
        );
      }
    } catch (error) {
      setError(error.message || "Failed to update copy job status. Please try again later.");
    } finally {
      isUpdatingRef.current = false; // Mark as not updating
    }
  }, []);

  const memoizedJobsList = React.useMemo(() => {
    if (loading) {
      return null;
    }
    if (jobs.length > 0) {
      return <CopyJobsList jobs={jobs} handleActionClick={handleActionClick} />;
    }
    return <CopyJobsNotFound />;
  }, [jobs, loading, handleActionClick]);

  return (
    <Stack className="monitorCopyJobs flexContainer">
      {loading && <ShimmerTree indentLevels={indentLevels} style={{ width: "100%", padding: "1rem 2.5rem" }} />}
      {error && (
        <MessageBar messageBarType={MessageBarType.error} isMultiline={false} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}
      {memoizedJobsList}
    </Stack>
  );
});

export default MonitorCopyJobs;
