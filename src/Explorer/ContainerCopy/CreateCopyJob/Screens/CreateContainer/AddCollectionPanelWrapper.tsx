import { Stack, Text } from "@fluentui/react";
import Explorer from "Explorer/Explorer";
import { useSidePanel } from "hooks/useSidePanel";
import { produce } from "immer";
import { Keys, t } from "Localization";
import React, { useCallback, useEffect } from "react";
import { AddCollectionPanel } from "../../../../Panes/AddCollectionPanel/AddCollectionPanel";
import { useCopyJobContext } from "../../../Context/CopyJobContext";

type AddCollectionPanelWrapperProps = {
  explorer?: Explorer;
  goBack?: () => void;
};

const AddCollectionPanelWrapper: React.FunctionComponent<AddCollectionPanelWrapperProps> = ({ explorer, goBack }) => {
  const { setCopyJobState } = useCopyJobContext();

  useEffect(() => {
    const sidePanelStore = useSidePanel.getState();
    if (sidePanelStore.headerText !== t(Keys.containerCopy.selectContainers.createContainerHeading)) {
      sidePanelStore.setHeaderText(t(Keys.containerCopy.selectContainers.createContainerHeading));
    }
    return () => {
      sidePanelStore.setHeaderText(t(Keys.containerCopy.createCopyJob.panelTitle));
    };
  }, []);

  const handleAddCollectionSuccess = useCallback(
    (collectionData: { databaseId: string; collectionId: string }) => {
      setCopyJobState(
        produce((state) => {
          state.target.databaseId = collectionData.databaseId;
          state.target.containerId = collectionData.collectionId;
        }),
      );
      goBack?.();
    },
    [goBack],
  );

  return (
    <Stack className="addCollectionPanelWrapper">
      <Stack.Item className="addCollectionPanelHeader">
        <Text className="themeText">{t(Keys.containerCopy.selectContainers.createNewContainerSubHeading)}</Text>
      </Stack.Item>
      <Stack.Item className="addCollectionPanelBody">
        <AddCollectionPanel explorer={explorer} isCopyJobFlow={true} onSubmitSuccess={handleAddCollectionSuccess} />
      </Stack.Item>
    </Stack>
  );
};

export default AddCollectionPanelWrapper;
