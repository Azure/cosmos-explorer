import Explorer from "Explorer/Explorer";
import React from "react";
import { userContext } from "UserContext";
import { CopyJobMigrationType } from "../Enums/CopyJobEnums";
import { CopyJobContextProviderType, CopyJobContextState, CopyJobFlowType } from "../Types/CopyJobTypes";

export const CopyJobContext = React.createContext<CopyJobContextProviderType>(null);
export const useCopyJobContext = (): CopyJobContextProviderType => {
  const context = React.useContext(CopyJobContext);
  if (!context) {
    throw new Error("useCopyJobContext must be used within a CopyJobContextProvider");
  }
  return context;
};

interface CopyJobContextProviderProps {
  children: React.ReactNode;
  explorer: Explorer;
}

const getInitialCopyJobState = (): CopyJobContextState => {
  return {
    jobName: "",
    migrationType: CopyJobMigrationType.Offline,
    source: {
      subscription: null,
      account: null,
      databaseId: "",
      containerId: "",
    },
    target: {
      subscriptionId: userContext.subscriptionId || "",
      account: userContext.databaseAccount || null,
      databaseId: "",
      containerId: "",
    },
    sourceReadAccessFromTarget: false,
  };
};

const CopyJobContextProvider: React.FC<CopyJobContextProviderProps> = (props) => {
  const [copyJobState, setCopyJobState] = React.useState<CopyJobContextState>(getInitialCopyJobState());
  const [flow, setFlow] = React.useState<CopyJobFlowType | null>(null);
  const [contextError, setContextError] = React.useState<string | null>(null);

  const resetCopyJobState = () => {
    setCopyJobState(getInitialCopyJobState());
  };

  const contextValue: CopyJobContextProviderType = {
    contextError,
    setContextError,
    copyJobState,
    setCopyJobState,
    flow,
    setFlow,
    resetCopyJobState,
    explorer: props.explorer
  };

  return <CopyJobContext.Provider value={contextValue}>{props.children}</CopyJobContext.Provider>;
};

export default CopyJobContextProvider;
