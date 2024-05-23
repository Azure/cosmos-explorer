import { getDataTransferJobs } from "Common/dataAccess/dataTransfers";
import { DataTransferJobGetResults } from "Utils/arm/generatedClients/dataTransferService/types";
import create, { UseStore } from "zustand";

export interface DataTransferJobsState {
  dataTransferJobs: DataTransferJobGetResults[];
  pollingDataTransferJobs: Set<string>;
  setDataTransferJobs: (dataTransferJobs: DataTransferJobGetResults[]) => void;
  setPollingDataTransferJobs: (pollingDataTransferJobs: Set<string>) => void;
}

type DataTransferJobStore = UseStore<DataTransferJobsState>;

export const useDataTransferJobs: DataTransferJobStore = create((set) => ({
  dataTransferJobs: [],
  pollingDataTransferJobs: new Set<string>(),
  setDataTransferJobs: (dataTransferJobs: DataTransferJobGetResults[]) => set({ dataTransferJobs }),
  setPollingDataTransferJobs: (pollingDataTransferJobs: Set<string>) => set({ pollingDataTransferJobs }),
}));

export const refreshDataTransferJobs = async (
  subscriptionId: string,
  resourceGroup: string,
  accountName: string,
): Promise<DataTransferJobGetResults[]> => {
  const dataTransferJobs: DataTransferJobGetResults[] = await getDataTransferJobs(
    subscriptionId,
    resourceGroup,
    accountName,
  );
  const jobRegex = /^Portal_(.+)_(\d{10,})$/;
  const sortedJobs: DataTransferJobGetResults[] = dataTransferJobs?.sort(
    (a, b) =>
      new Date(b?.properties?.lastUpdatedUtcTime).getTime() - new Date(a?.properties?.lastUpdatedUtcTime).getTime(),
  );
  const filteredJobs = sortedJobs.filter((job) => jobRegex.test(job?.properties?.jobName));
  useDataTransferJobs.getState().setDataTransferJobs(filteredJobs);
  return filteredJobs;
};

export const updateDataTransferJob = (updateJob: DataTransferJobGetResults) => {
  const updatedDataTransferJobs = useDataTransferJobs
    .getState()
    .dataTransferJobs.map((job: DataTransferJobGetResults) =>
      job?.properties?.jobName === updateJob?.properties?.jobName ? updateJob : job,
    );
  useDataTransferJobs.getState().setDataTransferJobs(updatedDataTransferJobs);
};

export const addToPolling = (addJob: string) => {
  const pollingJobs = useDataTransferJobs.getState().pollingDataTransferJobs;
  pollingJobs.add(addJob);
  useDataTransferJobs.getState().setPollingDataTransferJobs(pollingJobs);
};

export const removeFromPolling = (removeJob: string) => {
  const pollingJobs = useDataTransferJobs.getState().pollingDataTransferJobs;
  pollingJobs.delete(removeJob);
  useDataTransferJobs.getState().setPollingDataTransferJobs(pollingJobs);
};
