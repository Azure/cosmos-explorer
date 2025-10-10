import { Stack } from "@fluentui/react";
import React from "react";
import { useDatabases } from "../../../../../hooks/useDatabases";
import { useDataContainers } from "../../../../../hooks/useDataContainers";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import { DatabaseContainerSection } from "./components/DatabaseContainerSection";
import { dropDownChangeHandler } from "./Events/DropDownChangeHandler";
import { useMemoizedSourceAndTargetData } from "./memoizedData";

interface SelectSourceAndTargetContainersProps { }

const SelectSourceAndTargetContainers = (_props: SelectSourceAndTargetContainersProps) => {
    const { armToken, copyJobState, setCopyJobState } = useCopyJobContext();
    const {
        source,
        target,
        sourceDbParams,
        sourceContainerParams,
        targetDbParams,
        targetContainerParams
    } = useMemoizedSourceAndTargetData(copyJobState, armToken);

    // Custom hooks
    const sourceDatabases = useDatabases(...sourceDbParams) || [];
    const sourceContainers = useDataContainers(...sourceContainerParams) || [];
    const targetDatabases = useDatabases(...targetDbParams) || [];
    const targetContainers = useDataContainers(...targetContainerParams) || [];

    // Memoize option objects for dropdowns
    const sourceDatabaseOptions = React.useMemo(
        () => sourceDatabases.map((db: any) => ({ key: db.name, text: db.name, data: db })),
        [sourceDatabases]
    );
    const sourceContainerOptions = React.useMemo(
        () => sourceContainers.map((c: any) => ({ key: c.name, text: c.name, data: c })),
        [sourceContainers]
    );
    const targetDatabaseOptions = React.useMemo(
        () => targetDatabases.map((db: any) => ({ key: db.name, text: db.name, data: db })),
        [targetDatabases]
    );
    const targetContainerOptions = React.useMemo(
        () => targetContainers.map((c: any) => ({ key: c.name, text: c.name, data: c })),
        [targetContainers]
    );

    const onDropdownChange = React.useCallback(dropDownChangeHandler(setCopyJobState), [setCopyJobState]);

    return (
        <Stack className="selectSourceAndTargetContainers" tokens={{ childrenGap: 25 }}>
            <span>{ContainerCopyMessages.selectSourceAndTargetContainersDescription}</span>
            <DatabaseContainerSection
                heading={ContainerCopyMessages.sourceContainerSubHeading}
                databaseOptions={sourceDatabaseOptions}
                selectedDatabase={source?.databaseId}
                databaseDisabled={false}
                databaseOnChange={onDropdownChange("sourceDatabase")}
                containerOptions={sourceContainerOptions}
                selectedContainer={source?.containerId}
                containerDisabled={!source?.databaseId}
                containerOnChange={onDropdownChange("sourceContainer")}
            />
            <DatabaseContainerSection
                heading={ContainerCopyMessages.targetContainerSubHeading}
                databaseOptions={targetDatabaseOptions}
                selectedDatabase={target?.databaseId}
                databaseDisabled={false}
                databaseOnChange={onDropdownChange("targetDatabase")}
                containerOptions={targetContainerOptions}
                selectedContainer={target?.containerId}
                containerDisabled={!target?.databaseId}
                containerOnChange={onDropdownChange("targetContainer")}
            />
        </Stack>
    );
};


export default SelectSourceAndTargetContainers;