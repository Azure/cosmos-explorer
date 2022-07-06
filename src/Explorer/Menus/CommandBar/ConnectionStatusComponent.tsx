import {
  FocusTrapCallout,
  FocusZone,
  FocusZoneTabbableElements,
  FontWeights,
  Icon,
  mergeStyleSets,
  ProgressIndicator,
  Stack,
  Text,
  TooltipHost,
} from "@fluentui/react";
import { useId } from "@fluentui/react-hooks";
import { ActionButton, DefaultButton } from "@fluentui/react/lib/Button";
import * as React from "react";
import "../../../../less/hostedexplorer.less";
import { ConnectionStatusType, ContainerStatusType, Notebook } from "../../../Common/Constants";
import Explorer from "../../Explorer";
import { useNotebook } from "../../Notebook/useNotebook";
import "../CommandBar/ConnectionStatusComponent.less";
interface Props {
  container: Explorer;
}
export const ConnectionStatus: React.FC<Props> = ({ container }: Props): JSX.Element => {
  const connectionInfo = useNotebook((state) => state.connectionInfo);
  const isPhoenixDisabled = useNotebook((state) => state.isPhoenixDisabled);

  const [second, setSecond] = React.useState("00");
  const [minute, setMinute] = React.useState("00");
  const [isActive, setIsActive] = React.useState(false);
  const [counter, setCounter] = React.useState(0);
  const [statusColor, setStatusColor] = React.useState("");
  const [toolTipContent, setToolTipContent] = React.useState("Connect to temporary workspace.");
  const [isBarDismissed, setIsBarDismissed] = React.useState<boolean>(false);
  const buttonId = useId("callout-button");
  const containerInfo = useNotebook((state) => state.containerStatus);

  const styles = mergeStyleSets({
    callout: {
      width: 320,
      padding: "20px 24px",
    },
    title: {
      marginBottom: 12,
      fontWeight: FontWeights.semilight,
    },
    buttons: {
      display: "flex",
      justifyContent: "flex-end",
      marginTop: 20,
    },
  });

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

  React.useEffect(() => {
    if (connectionInfo?.status === ConnectionStatusType.Reconnect) {
      setToolTipContent("Click here to Reconnect to temporary workspace.");
    } else if (connectionInfo?.status === ConnectionStatusType.Failed) {
      setStatusColor("status failed is-animating");
      setToolTipContent("Click here to Reconnect to temporary workspace.");
    }
  }, [connectionInfo.status]);

  React.useEffect(() => {
    if (isPhoenixDisabled) {
      setToolTipContent(Notebook.notebookDisabledText);
    }
  }, [isPhoenixDisabled]);

  const stopTimer = () => {
    setIsActive(false);
    setCounter(0);
    setSecond("00");
    setMinute("00");
  };

  const memoryUsageInfo = useNotebook((state) => state.memoryUsageInfo);
  const totalGB = memoryUsageInfo ? memoryUsageInfo.totalKB / Notebook.memoryGuageToGB : 0;
  const usedGB = totalGB > 0 ? totalGB - memoryUsageInfo.freeKB / Notebook.memoryGuageToGB : 0;

  if (
    connectionInfo &&
    (connectionInfo.status === ConnectionStatusType.Connect || connectionInfo.status === ConnectionStatusType.Reconnect)
  ) {
    return (
      <ActionButton
        className={isPhoenixDisabled ? "disableText commandReactBtn" : "commandReactBtn"}
        disabled={isPhoenixDisabled}
        onClick={() => !isPhoenixDisabled && container.allocateContainer()}
      >
        <TooltipHost content={toolTipContent}>
          <Stack className="connectionStatusContainer" horizontal>
            <Icon
              iconName="ConnectVirtualMachine"
              className={isPhoenixDisabled ? "connectIcon disableText" : "connectIcon"}
            />
            <span className={isPhoenixDisabled ? "disableText" : ""}>{connectionInfo.status}</span>
          </Stack>
        </TooltipHost>
      </ActionButton>
    );
  }

  if (connectionInfo && connectionInfo.status === ConnectionStatusType.Connecting && isActive === false) {
    stopTimer();
    setIsActive(true);
    setStatusColor("status connecting is-animating");
    setToolTipContent("Connecting to temporary workspace.");
  } else if (connectionInfo && connectionInfo.status === ConnectionStatusType.Connected && isActive === true) {
    stopTimer();
    setStatusColor("status connected is-animating");
    setToolTipContent("Connected to temporary workspace.");
  } else if (connectionInfo && connectionInfo.status === ConnectionStatusType.Failed && isActive === true) {
    stopTimer();
    setStatusColor("status failed is-animating");
    setToolTipContent("Click here to Reconnect to temporary workspace.");
  }
  return (
    <>
      <TooltipHost
        content={
          containerInfo?.status === ContainerStatusType.Active
            ? `Connected to temporary workspace. This temporary workspace will get disconnected in ${Math.round(
                containerInfo.durationLeftInMinutes
              )} minutes.`
            : toolTipContent
        }
      >
        <ActionButton
          id={buttonId}
          className={connectionInfo.status === ConnectionStatusType.Failed ? "commandReactBtn" : "connectedReactBtn"}
          onClick={(e: React.MouseEvent<HTMLSpanElement>) =>
            connectionInfo.status === ConnectionStatusType.Failed ? container.allocateContainer() : e.preventDefault()
          }
        >
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
                className={totalGB !== 0 && usedGB / totalGB > 0.8 ? "lowMemory" : ""}
                description={usedGB.toFixed(1) + " of " + totalGB.toFixed(1) + " GB"}
                percentComplete={totalGB !== 0 ? usedGB / totalGB : 0}
              />
            )}
          </Stack>
          {!isBarDismissed &&
          containerInfo.status &&
          containerInfo.status === ContainerStatusType.Active &&
          Math.round(containerInfo.durationLeftInMinutes) <= Notebook.remainingTimeForAlert ? (
            <FocusTrapCallout
              role="alertdialog"
              className={styles.callout}
              gapSpace={0}
              target={`#${buttonId}`}
              onDismiss={() => setIsBarDismissed(true)}
              setInitialFocus
            >
              <Text block variant="xLarge" className={styles.title}>
                Remaining Time
              </Text>
              <Text block variant="small">
                This temporary workspace will get disconnected in {Math.round(containerInfo.durationLeftInMinutes)}{" "}
                minutes. To save your work permanently, save your notebooks to a GitHub repository or download the
                notebooks to your local machine before the session ends.
              </Text>
              <FocusZone handleTabKey={FocusZoneTabbableElements.all} isCircularNavigation>
                <Stack className={styles.buttons} gap={8} horizontal>
                  <DefaultButton onClick={() => setIsBarDismissed(true)}>Dimiss</DefaultButton>
                </Stack>
              </FocusZone>
            </FocusTrapCallout>
          ) : undefined}
        </ActionButton>
      </TooltipHost>
    </>
  );
};
