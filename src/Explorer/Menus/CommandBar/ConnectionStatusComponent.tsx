import { ProgressIndicator, Spinner, SpinnerSize, Stack, TooltipHost } from "@fluentui/react";
import * as React from "react";
import { ConnectionStatusType } from "../../../Common/Constants";
import { useNotebook } from "../../Notebook/useNotebook";
import "../CommandBar/ConnectionStatusComponent.less";

export const ConnectionStatus: React.FC = (): JSX.Element => {
  const [milliSecond, setMilliSecond] = React.useState("000");
  const [second, setSecond] = React.useState("00");
  const [minute, setMinute] = React.useState("00");
  const [isActive, setIsActive] = React.useState(false);
  const [counter, setCounter] = React.useState(0);
  const [lastMilliSecond, setLastMilliSecond] = React.useState("000");
  const [lastSec, setLastSecond] = React.useState("00");
  const [lastMin, setLastMinute] = React.useState("00");
  const [toolTipContent, setToolTipContent] = React.useState("Connecting to hosted runtime environment.");
  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isActive) {
      intervalId = setInterval(() => {
        const milliSecondCounter = counter % 1000;
        const secondCounter = Math.floor(counter / 1000) % 60;
        const minuteCounter = Math.floor(counter / 60000);
        const computedMilliSecond: string =
          String(milliSecondCounter).length === 1
            ? `00${milliSecondCounter}`
            : String(milliSecondCounter).length === 2
            ? `0${milliSecondCounter}`
            : `${milliSecondCounter}`;
        const computedSecond: string = String(secondCounter).length === 1 ? `0${secondCounter}` : `${secondCounter}`;
        const computedMinute: string = String(minuteCounter).length === 1 ? `0${minuteCounter}` : `${minuteCounter}`;

        setMilliSecond(computedMilliSecond);
        setSecond(computedSecond);
        setMinute(computedMinute);

        setCounter((counter) => counter + 1);
      }, 1);
    }
    return () => clearInterval(intervalId);
  }, [isActive, counter]);

  const stopTimer = () => {
    setIsActive(false);
    setCounter(0);
    setMilliSecond("000");
    setSecond("00");
    setMinute("00");
  };

  const connectionInfo = useNotebook((state) => state.connectionInfo);
  if (!connectionInfo) {
    return (
      <Stack className="connectionStatusContainer" horizontal>
        <span>Connecting</span>
        <Spinner size={SpinnerSize.medium} />
      </Stack>
    );
  }
  if (connectionInfo && connectionInfo.status === ConnectionStatusType.Allocating && isActive === false) {
    setIsActive(true);
    setToolTipContent("Allocating to hosted runtime environment.");
  } else if (connectionInfo && connectionInfo.status === ConnectionStatusType.Connected && isActive === true) {
    setLastMinute(minute);
    setLastSecond(second);
    setLastMilliSecond(milliSecond);
    stopTimer();
  } else if (connectionInfo && connectionInfo.status === ConnectionStatusType.Failed && isActive === true) {
    setToolTipContent(
      "Failed to connect to hosted runtime environment. Please refresh to get connected to a hosted runtime."
    );
    stopTimer();
  }
  return (
    <TooltipHost content={toolTipContent}>
      <Stack className="connectionStatusContainer" horizontal>
        <span className={connectionInfo.status === ConnectionStatusType.Failed ? "connectionStatusFailed" : ""}>
          {connectionInfo.status}
        </span>
        {connectionInfo.status === ConnectionStatusType.Allocating && isActive && (
          <ProgressIndicator description={minute + ":" + second + ":" + milliSecond} />
        )}
        {connectionInfo.status === ConnectionStatusType.Connected && (
          <ProgressIndicator description={lastMin + ":" + lastSec + ":" + lastMilliSecond} percentComplete={1} />
        )}
      </Stack>
    </TooltipHost>
  );
};
