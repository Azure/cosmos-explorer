import { useState } from "react";

export interface NotebookHooks {
  lastRefreshTime: number;
  refreshList: () => void;
}

export const useNotebooks = (): NotebookHooks => {
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(undefined);

  const refreshList = (): void => {
    setLastRefreshTime(new Date().getTime());
  }

  return { lastRefreshTime, refreshList };
};
