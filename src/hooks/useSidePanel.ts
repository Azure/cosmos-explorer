import { useState } from "react";

export interface SidePanelHooks {
  isPanelOpen: boolean;
  panelContent: JSX.Element;
  headerText: string;
  openSidePanel: (headerText: string, panelContent: JSX.Element) => void;
  closeSidePanel: () => void;
}

export const useSidePanel = (): SidePanelHooks => {
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [panelContent, setPanelContent] = useState<JSX.Element>();
  const [headerText, setHeaderText] = useState<string>();

  const openSidePanel = (headerText: string, panelContent: JSX.Element): void => {
    setHeaderText(headerText);
    setPanelContent(panelContent);
    setIsPanelOpen(true);
  };

  const closeSidePanel = (): void => {
    setHeaderText("");
    setPanelContent(undefined);
    setIsPanelOpen(false);
  };

  return { isPanelOpen, panelContent, headerText, openSidePanel, closeSidePanel };
};
