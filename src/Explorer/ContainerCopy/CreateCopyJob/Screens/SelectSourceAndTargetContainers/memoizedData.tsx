import React from "react";
import { CopyJobContextState, DatabaseParams, DataContainerParams } from "../../../Types";

export function useMemoizedSourceAndTargetData(copyJobState: CopyJobContextState, armToken: string) {
    const { source, target } = copyJobState ?? {};
    const selectedSourceAccount = source?.account;
    const selectedTargetAccount = target?.account;

    const sourceDbParams = React.useMemo(
        () =>
            [
                armToken,
                source?.subscription?.subscriptionId,
                selectedSourceAccount?.resourceGroup,
                selectedSourceAccount?.name,
                'SQL',
            ] as DatabaseParams,
        [armToken, source?.subscription?.subscriptionId, selectedSourceAccount]
    );

    const sourceContainerParams = React.useMemo(
        () =>
            [
                armToken,
                source?.subscription?.subscriptionId,
                selectedSourceAccount?.resourceGroup,
                selectedSourceAccount?.name,
                source?.databaseId,
                'SQL',
            ] as DataContainerParams,
        [armToken, source?.subscription?.subscriptionId, selectedSourceAccount, source?.databaseId]
    );

    const targetDbParams = React.useMemo(
        () => [
            armToken,
            target?.subscriptionId,
            selectedTargetAccount?.resourceGroup,
            selectedTargetAccount?.name,
            'SQL',
        ] as DatabaseParams,
        [armToken, target?.subscriptionId, selectedTargetAccount]
    );

    const targetContainerParams = React.useMemo(
        () => [
            armToken,
            target?.subscriptionId,
            selectedTargetAccount?.resourceGroup,
            selectedTargetAccount?.name,
            target?.databaseId,
            'SQL',
        ] as DataContainerParams,
        [armToken, target?.subscriptionId, selectedTargetAccount, target?.databaseId]
    );

    return { source, target, sourceDbParams, sourceContainerParams, targetDbParams, targetContainerParams };
}
