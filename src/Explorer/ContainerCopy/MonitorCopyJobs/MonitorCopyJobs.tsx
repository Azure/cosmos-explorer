/* eslint-disable react/display-name */
import { MessageBar, MessageBarType, Stack } from "@fluentui/react";
import ShimmerTree, { IndentLevel } from "Common/ShimmerTree/ShimmerTree";
import Explorer from "Explorer/Explorer";
import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import { getCopyJobs, updateCopyJobStatus } from "../Actions/CopyJobActions";
import { convertToCamelCase, isEqual } from "../CopyJobUtils";
import { CopyJobStatusType } from "../Enums/CopyJobEnums";
import CopyJobsNotFound from "../MonitorCopyJobs/Components/CopyJobs.NotFound";
import { CopyJobType, JobActionUpdatorType } from "../Types/CopyJobTypes";
import CopyJobsList from "./Components/CopyJobsList";

const FETCH_INTERVAL_MS = 30 * 1000;
const SHIMMER_INDENT_LEVELS: IndentLevel[] = Array(7).fill({ level: 0, width: "100%" });

interface MonitorCopyJobsProps {
  explorer: Explorer;
}

export interface MonitorCopyJobsRef {
  refreshJobList: () => void;
}

const MonitorCopyJobs = forwardRef<MonitorCopyJobsRef, MonitorCopyJobsProps>(({ explorer }, ref) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [jobs, setJobs] = React.useState<CopyJobType[]>([]);
  const isUpdatingRef = React.useRef(false);
  const isFirstFetchRef = React.useRef(true);

  const fetchJobs = React.useCallback(async () => {
    if (isUpdatingRef.current) {
      return;
    }
    try {
      if (isFirstFetchRef.current) {
        setLoading(true);
      }
      setError(null);

      const response = await getCopyJobs();
      setJobs((prevJobs) => {
        return isEqual(prevJobs, response) ? prevJobs : response;
      });
    } catch (error) {
      setError(error.message || "Failed to load copy jobs. Please try again later.");
    } finally {
      if (isFirstFetchRef.current) {
        setLoading(false);
        isFirstFetchRef.current = false;
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

  const handleActionClick = React.useCallback(
    async (job: CopyJobType, action: string, setUpdatingJobAction: JobActionUpdatorType) => {
      try {
        isUpdatingRef.current = true;
        setUpdatingJobAction({ jobName: job.Name, action });
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
        isUpdatingRef.current = false;
        setUpdatingJobAction(null);
      }
    },
    [],
  );

  const renderJobsList = () => {
    if (loading) {
      return null;
    }
    if (jobs.length > 0) {
      return <CopyJobsList jobs={jobs} handleActionClick={handleActionClick} />;
    }
    return <CopyJobsNotFound explorer={explorer} />;
  };

  return (
    <Stack className="monitorCopyJobs flexContainer">
      {loading && (
        <ShimmerTree indentLevels={SHIMMER_INDENT_LEVELS} style={{ width: "100%", padding: "1rem 2.5rem" }} />
      )}
      {error && (
        <MessageBar messageBarType={MessageBarType.error} isMultiline={false} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}
      {renderJobsList()}
    </Stack>
  );
});

export default MonitorCopyJobs;
