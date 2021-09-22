import { Icon, ProgressIndicator, Stack, TooltipHost } from "@fluentui/react";
import { ActionButton } from "@fluentui/react/lib/Button";
import * as React from "react";
import "../../../../less/hostedexplorer.less";
import { ConnectionStatusType } from "../../../Common/Constants";
import Explorer from "../../Explorer";
import { useNotebook } from "../../Notebook/useNotebook";
import "../CommandBar/ConnectionStatusComponent.less";
interface Props {
  container: Explorer;
}
export const ConnectionStatus: React.FC<Props> = ({ container }: Props): JSX.Element => {
  const [second, setSecond] = React.useState("00");
  const [minute, setMinute] = React.useState("00");
  const [isActive, setIsActive] = React.useState(false);
  const [counter, setCounter] = React.useState(0);
  const [statusColor, setStatusColor] = React.useState("status connecting is-animating");
  const [toolTipContent, setToolTipContent] = React.useState("Connect to temporary run time environment.");
  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isActive) {
      intervalId = setInterval(() => {
        const secondCounter = counter % 60;
        const minuteCounter = Math.floor(counter / 60);
        const computedSecond: string = String(secondCounter).length === 1 ? `0${secondCounter}` : `${secondCounter}`;
        const computedMinute: string = String(minuteCounter).length === 1 ? `0${minuteCounter}` : `${minuteCounter}`;

        setSecond(computedSecond);
        setMinute(computedMinute);

        setCounter((counter) => counter + 1);
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isActive, counter]);

  const stopTimer = () => {
    setIsActive(false);
    setCounter(0);
    setSecond("00");
    setMinute("00");
  };

  const connectionInfo = useNotebook((state) => state.connectionInfo);
  const memoryUsageInfo = useNotebook((state) => state.memoryUsageInfo);

  const totalGB = memoryUsageInfo ? memoryUsageInfo.totalKB / 1048576 : 0;
  const usedGB = totalGB > 0 ? totalGB - memoryUsageInfo.freeKB / 1048576 : 0;

  if (
    connectionInfo &&
    (connectionInfo.status === ConnectionStatusType.Connect || connectionInfo.status === ConnectionStatusType.ReConnect)
  ) {
    return (
      <ActionButton className="commandReactBtn" onClick={() => container.allocateContainer()}>
        <TooltipHost content={toolTipContent}>
          <Stack className="connectionStatusContainer" horizontal>
            <Icon iconName="ConnectVirtualMachine" className="connectIcon" />
            <span>{connectionInfo.status}</span>
          </Stack>
        </TooltipHost>
      </ActionButton>
    );
  }

  if (connectionInfo && connectionInfo.status === ConnectionStatusType.Connecting && isActive === false) {
    setIsActive(true);
    setStatusColor("status connecting is-animating");
    setToolTipContent("Connecting to temporary run time environment.");
  } else if (connectionInfo && connectionInfo.status === ConnectionStatusType.Connected && isActive === true) {
    stopTimer();
    setStatusColor("status connected is-animating");
    setToolTipContent("Connected to temporary runtime environment.");
  } else if (connectionInfo && connectionInfo.status === ConnectionStatusType.Failed && isActive === true) {
    stopTimer();
    setStatusColor("status failed is-animating");
    setToolTipContent("Click here to Reconnect to temporary run time environment");
  }
  return (
    <ActionButton
      className={connectionInfo.status === ConnectionStatusType.Failed ? "commandReactBtn" : "connectedReactBtn"}
      onClick={(e: React.MouseEvent<HTMLSpanElement>) =>
        connectionInfo.status === ConnectionStatusType.Failed ? container.allocateContainer() : e.preventDefault()
      }
    >
      <TooltipHost content={toolTipContent}>
        <Stack className="connectionStatusContainer" horizontal>
          <i className={statusColor}></i>
          <span className={connectionInfo.status === ConnectionStatusType.Failed ? "connectionStatusFailed" : ""}>
            {connectionInfo.status}
          </span>
          {connectionInfo.status === ConnectionStatusType.Connecting && isActive && (
            <ProgressIndicator description={minute + ":" + second} />
          )}
          {connectionInfo.status === ConnectionStatusType.Connected && !isActive && (
            <ProgressIndicator
              className={usedGB / totalGB > 0.8 ? "lowMemory" : ""}
              description={usedGB.toFixed(1) + " of " + totalGB.toFixed(1) + " GB"}
              percentComplete={usedGB / totalGB}
            />
          )}
        </Stack>
      </TooltipHost>
    </ActionButton>
  );
};
