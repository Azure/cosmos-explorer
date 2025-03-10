import { DefaultButton, Link, Stack, Text } from "@fluentui/react";
import * as Constants from "Common/Constants";
import Explorer from "Explorer/Explorer";
import {
  AnalyticalStorageContent,
  isSynapseLinkEnabled,
} from "Explorer/Panes/AddCollectionPanel/AddCollectionPanelUtility";
import React from "react";
import { getCollectionName } from "Utils/APITypeUtils";

export interface AddMVAnalyticalStoreComponentProps {
  explorer: Explorer;
  enableAnalyticalStore: boolean;
  setEnableAnalyticalStore: React.Dispatch<React.SetStateAction<boolean>>;
}
export const AddMVAnalyticalStoreComponent = (props: AddMVAnalyticalStoreComponentProps): JSX.Element => {
  const { explorer, enableAnalyticalStore, setEnableAnalyticalStore } = props;

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

      {!isSynapseLinkEnabled() && (
        <Stack className="panelGroupSpacing">
          <Text variant="small">
            Azure Synapse Link is required for creating an analytical store {getCollectionName().toLocaleLowerCase()}.
            Enable Synapse Link for this Cosmos DB account.{" "}
            <Link
              href="https://aka.ms/cosmosdb-synapselink"
              target="_blank"
              aria-label={Constants.ariaLabelForLearnMoreLink.AzureSynapseLink}
              className="capacitycalculator-link"
            >
              Learn more
            </Link>
          </Text>
          <DefaultButton
            text="Enable"
            onClick={() => explorer.openEnableSynapseLinkDialog()}
            style={{ height: 27, width: 80 }}
            styles={{ label: { fontSize: 12 } }}
          />
        </Stack>
      )}
    </Stack>
  );
};
