import { useState } from "react";
import Explorer from "../Explorer/Explorer";

export interface ExplorerStateProperties {
  commandBarProperties: {

  }
}

export const useExplorerState = (container: Explorer): ExplorerStateProperties => {
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);


  return {};
};
