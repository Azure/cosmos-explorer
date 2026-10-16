import { Stack, Text } from "@fluentui/react";
import {
  AnalyticalStorageContent,
  isSynapseLinkEnabled,
} from "Explorer/Panes/AddCollectionPanel/AddCollectionPanelUtility";
import React from "react";

export interface AnalyticalStoreComponentProps {
  enableAnalyticalStore: boolean;
  setEnableAnalyticalStore: React.Dispatch<React.SetStateAction<boolean>>;
}
export const AnalyticalStoreComponent = (props: AnalyticalStoreComponentProps): JSX.Element => {
  const { enableAnalyticalStore, setEnableAnalyticalStore } = props;

  const onEnableAnalyticalStoreRadioButtonChange = (checked: boolean): void => {
    if (checked && !enableAnalyticalStore) {
      setEnableAnalyticalStore(true);
    }
  };

  const onDisableAnalyticalStoreRadioButtonnChange = (checked: boolean): void => {
    if (checked && enableAnalyticalStore) {
      setEnableAnalyticalStore(false);
    }
  };

  return (
    <Stack className="panelGroupSpacing">
      <Text className="panelTextBold" variant="small">
        {AnalyticalStorageContent()}
      </Text>

      <Stack horizontal verticalAlign="center">
        <div role="radiogroup">
          <input
            className="panelRadioBtn"
            checked={enableAnalyticalStore}
            disabled={!isSynapseLinkEnabled()}
            aria-label="Enable analytical store"
            aria-checked={enableAnalyticalStore}
            name="analyticalStore"
            type="radio"
            role="radio"
            id="enableAnalyticalStoreBtn"
            tabIndex={0}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              onEnableAnalyticalStoreRadioButtonChange(event.target.checked);
            }}
          />
          <span className="panelRadioBtnLabel">On</span>

          <input
            className="panelRadioBtn"
            checked={!enableAnalyticalStore}
            disabled={!isSynapseLinkEnabled()}
            aria-label="Disable analytical store"
            aria-checked={!enableAnalyticalStore}
            name="analyticalStore"
            type="radio"
            role="radio"
            id="disableAnalyticalStoreBtn"
            tabIndex={0}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              onDisableAnalyticalStoreRadioButtonnChange(event.target.checked);
            }}
          />
          <span className="panelRadioBtnLabel">Off</span>
        </div>
      </Stack>
    </Stack>
  );
};
