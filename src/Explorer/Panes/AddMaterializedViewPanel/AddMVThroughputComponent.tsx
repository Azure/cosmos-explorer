import { Checkbox, Stack } from "@fluentui/react";
import { ThroughputInput } from "Explorer/Controls/ThroughputInput/ThroughputInput";
import { isFreeTierAccount } from "Explorer/Panes/AddCollectionPanel/AddCollectionPanelUtility";
import { useDatabases } from "Explorer/useDatabases";
import React from "react";
import { getCollectionName } from "Utils/APITypeUtils";
import { isServerlessAccount } from "Utils/CapabilityUtils";

export interface AddMVThroughputComponentProps {
  enableDedicatedThroughput: boolean;
  setEnabledDedicatedThroughput: React.Dispatch<React.SetStateAction<boolean>>;
  isSelectedSourceContainerSharedThroughput: () => boolean;
  showCollectionThroughputInput: () => boolean;
  materializedViewThroughputOnChange: (materializedViewThroughputValue: number) => void;
  isMaterializedViewAutoscaleOnChange: (isMaterializedViewAutoscaleValue: boolean) => void;
  setIsThroughputCapExceeded: React.Dispatch<React.SetStateAction<boolean>>;
  isCostAknowledgedOnChange: (isCostAknowledgedValue: boolean) => void;
}

export const AddMVThroughputComponent = (props: AddMVThroughputComponentProps): JSX.Element => {
  const {
    enableDedicatedThroughput,
    setEnabledDedicatedThroughput,
    isSelectedSourceContainerSharedThroughput,
    showCollectionThroughputInput,
    materializedViewThroughputOnChange,
    isMaterializedViewAutoscaleOnChange,
    setIsThroughputCapExceeded,
    isCostAknowledgedOnChange,
  } = props;

  return (
    <Stack>
      {!isServerlessAccount() && isSelectedSourceContainerSharedThroughput() && (
        <Stack horizontal verticalAlign="center">
          <Checkbox
            label={`Provision dedicated throughput for this ${getCollectionName().toLocaleLowerCase()}`}
            checked={enableDedicatedThroughput}
            styles={{
              text: { fontSize: 12 },
              checkbox: { width: 12, height: 12 },
              label: { padding: 0, alignItems: "center" },
            }}
            onChange={(_, isChecked: boolean) => setEnabledDedicatedThroughput(isChecked)}
          />
        </Stack>
      )}
      {showCollectionThroughputInput() && (
        <ThroughputInput
          showFreeTierExceedThroughputTooltip={isFreeTierAccount() && !useDatabases.getState().isFirstResourceCreated()}
          isDatabase={false}
          isSharded={false}
          isFreeTier={isFreeTierAccount()}
          isQuickstart={false}
          setThroughputValue={(throughput: number) => {
            materializedViewThroughputOnChange(throughput);
          }}
          setIsAutoscale={(isAutoscale: boolean) => {
            isMaterializedViewAutoscaleOnChange(isAutoscale);
          }}
          setIsThroughputCapExceeded={(isThroughputCapExceeded: boolean) => {
            setIsThroughputCapExceeded(isThroughputCapExceeded);
          }}
          onCostAcknowledgeChange={(isAcknowledged: boolean) => {
            isCostAknowledgedOnChange(isAcknowledged);
          }}
        />
      )}
    </Stack>
  );
};
