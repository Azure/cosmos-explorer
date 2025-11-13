import React from "react";
import { CopyJobContextState } from "../../Types/CopyJobTypes";
import AssignPermissions from "../Screens/AssignPermissions/AssignPermissions";
import PreviewCopyJob from "../Screens/PreviewCopyJob/PreviewCopyJob";
import SelectAccount from "../Screens/SelectAccount/SelectAccount";
import SelectSourceAndTargetContainers from "../Screens/SelectSourceAndTargetContainers/SelectSourceAndTargetContainers";

const SCREEN_KEYS = {
  SelectAccount: "SelectAccount",
  SelectSourceAndTargetContainers: "SelectSourceAndTargetContainers",
  PreviewCopyJob: "PreviewCopyJob",
  AssignPermissions: "AssignPermissions",
};

type Validation = {
  validate: (state: CopyJobContextState | Map<string, boolean>) => boolean;
  message: string;
};

type Screen = {
  key: string;
  component: React.ReactElement;
  validations: Validation[];
};

function useCreateCopyJobScreensList() {
  return React.useMemo<Screen[]>(
    () => [
      {
        key: SCREEN_KEYS.SelectAccount,
        component: <SelectAccount />,
        validations: [
          {
            validate: (state: CopyJobContextState) => !!state?.source?.subscription && !!state?.source?.account,
            message: "Please select a subscription and account to proceed",
          },
        ],
      },
      {
        key: SCREEN_KEYS.SelectSourceAndTargetContainers,
        component: <SelectSourceAndTargetContainers />,
        validations: [
          {
            validate: (state: CopyJobContextState) =>
              !!state?.source?.databaseId &&
              !!state?.source?.containerId &&
              !!state?.target?.databaseId &&
              !!state?.target?.containerId,
            message: "Please select source and target containers to proceed",
          },
        ],
      },
      {
        key: SCREEN_KEYS.PreviewCopyJob,
        component: <PreviewCopyJob />,
        validations: [
          {
            validate: (state: CopyJobContextState) =>
              !!(typeof state?.jobName === "string" && state?.jobName && /^[a-zA-Z0-9-.]+$/.test(state?.jobName)),
            message: "Please enter a job name to proceed",
          },
        ],
      },
      {
        key: SCREEN_KEYS.AssignPermissions,
        component: <AssignPermissions />,
        validations: [
          {
            validate: (cache: Map<string, boolean>) => {
              const cacheValuesIterator = Array.from(cache.values());
              if (cacheValuesIterator.length === 0) {
                return false;
              }

              const allValid = cacheValuesIterator.every((isValid: boolean) => isValid);
              return allValid;
            },
            message: "Please ensure all previous steps are valid to proceed",
          },
        ],
      },
    ],
    [],
  );
}

export { SCREEN_KEYS, useCreateCopyJobScreensList };
