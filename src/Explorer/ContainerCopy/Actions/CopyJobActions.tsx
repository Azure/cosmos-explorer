import React from "react";
import { useSidePanel } from "../../../hooks/useSidePanel";
import ContainerCopyMessages from "../ContainerCopyMessages";
import CreateCopyJobScreensProvider from "../CreateCopyJob/Screens/CreateCopyJobScreensProvider";
import { CopyJobContextState } from "../Types";

export const openCreateCopyJobPanel = () => {
    const sidePanelState = useSidePanel.getState()
    sidePanelState.setPanelHasConsole(false);
    sidePanelState.openSidePanel(
        ContainerCopyMessages.createCopyJobPanelTitle,
        <CreateCopyJobScreensProvider />,
        "600px"
    );
}

export const submitCreateCopyJob = (state: CopyJobContextState) => {
    console.log("Submitting create copy job with state:", state);
};