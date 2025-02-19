import {
  DirectionalHint,
  Dropdown,
  DropdownMenuItemType,
  Icon,
  IDropdownOption,
  Link,
  Separator,
  Stack,
  Text,
  TooltipHost,
} from "@fluentui/react";
import { Collection, Database } from "Contracts/ViewModels";
import Explorer from "Explorer/Explorer";
import { getPartitionKey } from "Explorer/Panes/AddCollectionPanel/AddCollectionPanelUtility";
import { AddMVPartitionKeyComponent } from "Explorer/Panes/AddMaterializedViewPanel/AddMVPartitionKeyComponent";
import { AddMVThroughputComponent } from "Explorer/Panes/AddMaterializedViewPanel/AddMVThroughputComponent";
import { AddMVUniqueKeysComponent } from "Explorer/Panes/AddMaterializedViewPanel/AddMVUniqueKeysComponent";
import { useDatabases } from "Explorer/useDatabases";
import React, { useEffect, useState } from "react";

export interface AddMaterializedViewPanelProps {
  explorer: Explorer;
  sourceContainer?: Collection;
}
export const AddMaterializedViewPanel = (props: AddMaterializedViewPanelProps): JSX.Element => {
  const { explorer, sourceContainer } = props;

  const [sourceContainerOptions, setSourceContainerOptions] = useState<IDropdownOption[]>();
  const [selectedSourceContainer, setSelectedSourceContainer] = useState<Collection>();
  const [materializedViewId, setMaterializedViewId] = useState<string>();
  const [materializedViewDefinition, setMaterializedViewDefinition] = useState<string>();
  const [partitionKey, setPartitionKey] = useState<string>(getPartitionKey());
  const [subPartitionKeys, setSubPartitionKeys] = useState<string[]>([]);
  const [useHashV1, setUseHashV1] = useState<boolean>();
  const [enableDedicatedThroughput, setEnabledDedicatedThroughput] = useState<boolean>();
  const [isThroughputCapExceeded, setIsThroughputCapExceeded] = useState<boolean>();
  const [uniqueKeys, setUniqueKeys] = useState<string[]>([]);

  useEffect(() => {
    const sourceContainerOptions: IDropdownOption[] = [];
    useDatabases.getState().databases.forEach((database: Database) => {
      sourceContainerOptions.push({
        key: database.rid,
        text: database.id(),
        itemType: DropdownMenuItemType.Header,
      });

      database.collections().forEach((collection: Collection) => {
        const isMaterializedView: boolean = !!collection.materializedViewDefinition();
        sourceContainerOptions.push({
          key: collection.rid,
          text: collection.id(),
          disabled: isMaterializedView,
          ...(isMaterializedView && {
            title: "This is a materialized view.",
          }),
          data: collection,
        });
      });
    });

    setSourceContainerOptions(sourceContainerOptions);
  }, []);

  let materializedViewThroughput: number;
  let isMaterializedViewAutoscale: boolean;
  let isCostAcknowledged: boolean;

  const materializedViewThroughputOnChange = (materializedViewThroughputValue: number): void => {
    materializedViewThroughput = materializedViewThroughputValue;
  };

  const isMaterializedViewAutoscaleOnChange = (isMaterializedViewAutoscaleValue: boolean): void => {
    isMaterializedViewAutoscale = isMaterializedViewAutoscaleValue;
  };

  const isCostAknowledgedOnChange = (isCostAcknowledgedValue: boolean): void => {
    isCostAcknowledged = isCostAcknowledgedValue;
  };

  return (
    <form className="panelFormWrapper" id="panelMaterializedView">
      <div className="panelMainContent">
        <Stack>
          <Stack horizontal>
            <span className="mandatoryStar">*&nbsp;</span>
            <Text className="panelTextBold" variant="small">
              Source container id
            </Text>
          </Stack>
          <Dropdown
            placeholder="Choose existing container"
            options={sourceContainerOptions}
            defaultSelectedKey={sourceContainer?.rid}
            styles={{ title: { height: 27, lineHeight: 27 }, dropdownItem: { fontSize: 12 } }}
            style={{ width: 300, fontSize: 12 }}
            onChange={(_, options: IDropdownOption) => setSelectedSourceContainer(options.data as Collection)}
          />
          <Separator className="panelSeparator" />
          <Stack horizontal>
            <span className="mandatoryStar">*&nbsp;</span>
            <Text className="panelTextBold" variant="small">
              View container id
            </Text>
          </Stack>
          <input
            id="materializedViewId"
            type="text"
            aria-required
            required
            autoComplete="off"
            pattern="[^/?#\\]*[^/?# \\]"
            title="May not end with space nor contain characters '\' '/' '#' '?'"
            placeholder={`e.g., viewByEmailId`}
            size={40}
            className="panelTextField"
            value={materializedViewId}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setMaterializedViewId(event.target.value)}
          />
          <Stack horizontal>
            <span className="mandatoryStar">*&nbsp;</span>
            <Text className="panelTextBold" variant="small">
              Materialized View Definition
            </Text>
            <TooltipHost
              directionalHint={DirectionalHint.bottomLeftEdge}
              content={
                <Link
                  href="https://learn.microsoft.com/en-us/azure/cosmos-db/nosql/materialized-views#defining-materialized-views"
                  target="blank"
                >
                  Learn more about defining materialized views.
                </Link>
              }
            >
              <Icon role="button" iconName="Info" className="panelInfoIcon" tabIndex={0} />
            </TooltipHost>
          </Stack>
          <input
            id="materializedViewDefinition"
            type="text"
            aria-required
            required
            autoComplete="off"
            placeholder={"SELECT c.email, c.accountId FROM c"}
            size={40}
            className="panelTextField"
            value={materializedViewDefinition}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setMaterializedViewDefinition(event.target.value)}
          />
          <AddMVPartitionKeyComponent
            {...{ partitionKey, setPartitionKey, subPartitionKeys, setSubPartitionKeys, useHashV1, setUseHashV1 }}
          />
          <AddMVThroughputComponent
            {...{
              selectedSourceContainer,
              enableDedicatedThroughput,
              setEnabledDedicatedThroughput,
              materializedViewThroughputOnChange,
              isMaterializedViewAutoscaleOnChange,
              setIsThroughputCapExceeded,
              isCostAknowledgedOnChange,
            }}
          />
          <AddMVUniqueKeysComponent {...{ uniqueKeys, setUniqueKeys }} />
        </Stack>
      </div>
    </form>
  );
};
