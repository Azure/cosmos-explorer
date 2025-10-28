import { DatabaseAccount, Subscription } from "Contracts/DataModels";
import React from "react";
import { ApiType } from "UserContext";
import Explorer from "../../Explorer";
import { CopyJobMigrationType, CopyJobStatusType } from "../Enums";

export interface ContainerCopyProps {
  container: Explorer;
}

export type CopyJobCommandBarBtnType = {
  key: string;
  iconSrc: string;
  label: string;
  ariaLabel: string;
  disabled?: boolean;
  onClick: () => void;
};

export type CopyJobTabForwardRefHandle = {
  validate: (state: CopyJobContextState) => boolean;
};

export type DropdownOptionType = {
  key: string;
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
};

export type DatabaseParams = [string | undefined, string | undefined, string | undefined, ApiType];
export type DataContainerParams = [
  string | undefined,
  string | undefined,
  string | undefined,
  string | undefined,
  ApiType,
];

export interface DatabaseContainerSectionProps {
  heading: string;
  databaseOptions: DropdownOptionType[];
  selectedDatabase: string;
  databaseDisabled?: boolean;
  databaseOnChange: (ev: React.FormEvent<HTMLDivElement>, option: DropdownOptionType) => void;
  containerOptions: DropdownOptionType[];
  selectedContainer: string;
  containerDisabled?: boolean;
  containerOnChange: (ev: React.FormEvent<HTMLDivElement>, option: DropdownOptionType) => void;
}

export interface CopyJobContextState {
  jobName: string;
  migrationType: CopyJobMigrationType;
  sourceReadAccessFromTarget?: boolean;
  // source details
  source: {
    subscription: Subscription;
    account: DatabaseAccount;
    databaseId: string;
    containerId: string;
  };
  // target details
  target: {
    subscriptionId: string;
    account: DatabaseAccount;
    databaseId: string;
    containerId: string;
  };
}

export interface CopyJobFlowType {
  currentScreen: string;
}

export interface CopyJobContextProviderType {
  flow: CopyJobFlowType;
  setFlow: React.Dispatch<React.SetStateAction<CopyJobFlowType>>;
  copyJobState: CopyJobContextState | null;
  setCopyJobState: React.Dispatch<React.SetStateAction<CopyJobContextState>>;
  resetCopyJobState: () => void;
}

export type CopyJobType = {
  ID: string;
  Mode: string;
  Name: string;
  Status: CopyJobStatusType;
  CompletionPercentage: number;
  Duration: string;
  LastUpdatedTime: string;
  timestamp: number;
  Error?: CopyJobErrorType;
};

export interface CopyJobErrorType {
  message: string;
  code: string;
}

export interface CopyJobError {
  message: string;
  navigateToStep?: number;
}

export type DataTransferJobType = {
  id: string;
  type: string;
  properties: {
    jobName: string;
    status: string;
    lastUpdatedUtcTime: string;
    processedCount: number;
    totalCount: number;
    mode: string;
    duration: string;
    source: {
      databaseName: string;
      collectionName: string;
      component: string;
    };
    destination: {
      databaseName: string;
      collectionName: string;
      component: string;
    };
    error: {
      message: string;
      code: string;
    };
  };
};
