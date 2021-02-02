import * as React from "react";
import Explorer from "../Explorer";
import { DeleteCollectionConfirmationPaneComponent } from "./DeleteCollectionConfirmationPaneComponent";

export interface PanelParams {
  headerText: string;
  isOpen: boolean;
  panelContent: JSX.Element;
  onPanelClose: () => void;
}

export interface PanelManagerParams {
  setPanelParams: (panelParams: PanelParams) => void;
  setIsNotificationConsoleExpanded: (isExpanded: boolean) => void;
}

export class PanelManager {
  private setPanelParams: (panelParams: PanelParams) => void;
  private setIsNotificationConsoleExpanded: (isExpanded: boolean) => void;

  constructor(params: PanelManagerParams) {
    this.setPanelParams = params.setPanelParams;
    this.setIsNotificationConsoleExpanded = params.setIsNotificationConsoleExpanded;
  }

  public openDeleteCollectionConfirmationPane(explorer: Explorer): void {
    this.setPanelParams({
      headerText: "Delete Collection",
      panelContent: (
        <DeleteCollectionConfirmationPaneComponent
          explorer={explorer}
          closePanel={() => this.resetContentAndClosePanel()}
          openNotificationConsole={() => this.setIsNotificationConsoleExpanded(true)}
        />
      ),
      onPanelClose: () => this.resetContentAndClosePanel(),
      isOpen: true,
    });
  }

  public resetContentAndClosePanel(): void {
    this.setPanelParams({
      headerText: "",
      isOpen: false,
      panelContent: undefined,
      onPanelClose: undefined,
    });
  }
}
