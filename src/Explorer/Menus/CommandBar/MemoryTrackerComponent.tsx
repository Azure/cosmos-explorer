import { ProgressIndicator, Spinner, SpinnerSize, Stack } from "@fluentui/react";
import * as React from "react";
import { useNotebook } from "../../Notebook/useNotebook";

export const MemoryTracker: React.FC = (): JSX.Element => {
  const memoryUsageInfo = useNotebook((state) => state.memoryUsageInfo);
  if (!memoryUsageInfo) {
    return (
      <Stack className="memoryTrackerContainer" horizontal>
        <span>Memory</span>
        <Spinner size={SpinnerSize.medium} />
      </Stack>
    );
  }

  const totalGB = memoryUsageInfo.totalKB / 1048576;
  const usedGB = totalGB - memoryUsageInfo.freeKB / 1048576;

  return (
    <Stack className="memoryTrackerContainer" horizontal>
      <span>Memory</span>
      <ProgressIndicator
        className={usedGB / totalGB > 0.8 ? "lowMemory" : ""}
        description={usedGB.toFixed(1) + " of " + totalGB.toFixed(1) + " GB"}
        percentComplete={usedGB / totalGB}
      />
    </Stack>
  );
};
