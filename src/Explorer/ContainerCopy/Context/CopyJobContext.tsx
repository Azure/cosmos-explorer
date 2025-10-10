import React from "react";
import { userContext } from "UserContext";
import { useAADAuth } from "../../../hooks/useAADAuth";
import { useConfig } from "../../../hooks/useConfig";
import { CopyJobContextProviderType, CopyJobContextState, CopyJobFlowType } from "../Types";

export const CopyJobContext = React.createContext<CopyJobContextProviderType>(null);
export const useCopyJobContext = (): CopyJobContextProviderType => {
    const context = React.useContext(CopyJobContext);
    if (!context) {
        throw new Error("useCopyJobContext must be used within a CopyJobContextProvider");
    }
    return context;
}

interface CopyJobContextProviderProps {
    children: React.ReactNode;
}

const getInitialCopyJobState = (): CopyJobContextState => {
    return {
        jobName: "",
        migrationType: "offline",
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
    }
}

const CopyJobContextProvider: React.FC<CopyJobContextProviderProps> = (props) => {
    const config = useConfig();
    const { isLoggedIn, armToken } = useAADAuth(config);
    const [copyJobState, setCopyJobState] = React.useState<CopyJobContextState>(getInitialCopyJobState());
    const [flow, setFlow] = React.useState<CopyJobFlowType | null>(null);

    if (!isLoggedIn || !armToken) {
        // Add a shimmer or loader here
        return null;
    }

    const resetCopyJobState = () => {
        setCopyJobState(getInitialCopyJobState());
    }

    return (
        <CopyJobContext.Provider value={{ armToken, copyJobState, setCopyJobState, flow, setFlow, resetCopyJobState }}>
            {props.children}
        </CopyJobContext.Provider>
    );
}

export default CopyJobContextProvider;