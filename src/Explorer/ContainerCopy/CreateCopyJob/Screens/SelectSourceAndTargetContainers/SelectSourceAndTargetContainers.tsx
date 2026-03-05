import { Stack } from "@fluentui/react";
import { DatabaseModel } from "Contracts/DataModels";
import React from "react";
import { useDatabases } from "../../../../../hooks/useDatabases";
import { useDataContainers } from "../../../../../hooks/useDataContainers";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import { DatabaseContainerSection } from "./components/DatabaseContainerSection";
import { dropDownChangeHandler } from "./Events/DropDownChangeHandler";
import { useSourceAndTargetData } from "./memoizedData";

type SelectSourceAndTargetContainers = {
  showAddCollectionPanel?: () => void;
};

const SelectSourceAndTargetContainers = ({ showAddCollectionPanel }: SelectSourceAndTargetContainers) => {
  const { copyJobState, setCopyJobState } = useCopyJobContext();
  const { source, target, sourceDbParams, sourceContainerParams, targetDbParams, targetContainerParams } =
    useSourceAndTargetData(copyJobState);

  if (!source) {
    return null;
  }

  const sourceDatabases = useDatabases(...sourceDbParams);
  const sourceContainers = useDataContainers(...sourceContainerParams);
  const targetDatabases = useDatabases(...targetDbParams);
  const targetContainers = useDataContainers(...targetContainerParams);

  const sourceDatabaseOptions = React.useMemo(
    () => sourceDatabases?.map((db: DatabaseModel) => ({ key: db.name, text: db.name, data: db })) || [],
    [sourceDatabases],
  );
  const sourceContainerOptions = React.useMemo(
    () => sourceContainers?.map((c: DatabaseModel) => ({ key: c.name, text: c.name, data: c })) || [],
    [sourceContainers],
  );
  const targetDatabaseOptions = React.useMemo(
    () => targetDatabases?.map((db: DatabaseModel) => ({ key: db.name, text: db.name, data: db })) || [],
    [targetDatabases],
  );
  const targetContainerOptions = React.useMemo(
    () => targetContainers?.map((c: DatabaseModel) => ({ key: c.name, text: c.name, data: c })) || [],
    [targetContainers],
  );

  const onDropdownChange = dropDownChangeHandler(setCopyJobState);

  return (
    <Stack
      data-test="Panel:SelectSourceAndTargetContainers"
      className="selectSourceAndTargetContainers"
      tokens={{ childrenGap: 25 }}
    >
      <span className="themeText">{ContainerCopyMessages.selectSourceAndTargetContainersDescription}</span>
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
        sectionType="source"
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
        handleOnDemandCreateContainer={showAddCollectionPanel}
        sectionType="target"
      />
    </Stack>
  );
};

export default SelectSourceAndTargetContainers;
