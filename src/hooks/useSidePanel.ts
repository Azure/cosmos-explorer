import { useState } from "react";

export interface SidePanelHooks {
  isPanelOpen: boolean;
  panelContent: JSX.Element;
  headerText: string;
  openSidePanel: (headerText: string, panelContent: JSX.Element, onClose?: () => void) => void;
  closeSidePanel: () => void;
}

export const useSidePanel = (): SidePanelHooks => {
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [panelContent, setPanelContent] = useState<JSX.Element>();
  const [headerText, setHeaderText] = useState<string>();
  const [onCloseCallback, setOnCloseCallback] = useState<{ callback: () => void }>();

  const openSidePanel = (headerText: string, panelContent: JSX.Element, onClose?: () => void): void => {
    setHeaderText(headerText);
    setPanelContent(panelContent);
    setIsPanelOpen(true);
    !!onClose && setOnCloseCallback({ callback: onClose });
  };

  const closeSidePanel = (): void => {
    setHeaderText("");
    setPanelContent(undefined);
    setIsPanelOpen(false);
    if (onCloseCallback) {
      onCloseCallback.callback();
      setOnCloseCallback(undefined);
    }
  };

  return { isPanelOpen, panelContent, headerText, openSidePanel, closeSidePanel };
};
