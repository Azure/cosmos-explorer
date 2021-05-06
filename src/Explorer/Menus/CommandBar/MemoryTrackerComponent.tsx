import { ProgressIndicator, Spinner, SpinnerSize, Stack } from "@fluentui/react";
import { Observable, Subscription } from "knockout";
import * as React from "react";
import { MemoryUsageInfo } from "../../../Contracts/DataModels";

interface MemoryTrackerProps {
  memoryUsageInfo: Observable<MemoryUsageInfo>;
}

export class MemoryTrackerComponent extends React.Component<MemoryTrackerProps> {
  private memoryUsageInfoSubscription: Subscription;

  public componentDidMount(): void {
    this.memoryUsageInfoSubscription = this.props.memoryUsageInfo.subscribe(() => {
      this.forceUpdate();
    });
  }

  public componentWillUnmount(): void {
    this.memoryUsageInfoSubscription && this.memoryUsageInfoSubscription.dispose();
  }

  public render(): JSX.Element {
    const memoryUsageInfo: MemoryUsageInfo = this.props.memoryUsageInfo();
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
  }
}
