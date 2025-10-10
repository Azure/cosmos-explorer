import React from "react";
import { CopyJobContextState } from "../../Types";
import PreviewCopyJob from "../Screens/PreviewCopyJob";
import SelectAccount from "../Screens/SelectAccount";
import SelectSourceAndTargetContainers from "../Screens/SelectSourceAndTargetContainers";

const SCREEN_KEYS = {
    SelectAccount: "SelectAccount",
    SelectSourceAndTargetContainers: "SelectSourceAndTargetContainers",
    PreviewCopyJob: "PreviewCopyJob",
};

type Validation = {
    validate: (state: CopyJobContextState) => boolean;
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
                        validate: (state) => !!state?.source?.subscription && !!state?.source?.account,
                        message: "Please select a subscription and account to proceed",
                    },
                ],
            },
            {
                key: SCREEN_KEYS.SelectSourceAndTargetContainers,
                component: <SelectSourceAndTargetContainers />,
                validations: [
                    {
                        validate: (state) => (
                            !!state?.source?.databaseId && !!state?.source?.containerId && !!state?.target?.databaseId && !!state?.target?.containerId
                        ),
                        message: "Please select source and target containers to proceed",
                    },
                ],
            },
            {
                key: SCREEN_KEYS.PreviewCopyJob,
                component: <PreviewCopyJob />,
                validations: [],
            },
        ],
        []
    );
}

export { SCREEN_KEYS, useCreateCopyJobScreensList };

