import { DefaultButton, DirectionalHint, Icon, IconButton, Link, Stack, Text, TooltipHost } from "@fluentui/react";
import * as Constants from "Common/Constants";
import {
  getPartitionKeyName,
  getPartitionKeyPlaceHolder,
  getPartitionKeyTooltipText,
} from "Explorer/Panes/AddCollectionPanel/AddCollectionPanelUtility";
import React from "react";

export interface PartitionKeyComponentProps {
  partitionKey?: string;
  setPartitionKey: React.Dispatch<React.SetStateAction<string>>;
  subPartitionKeys: string[];
  setSubPartitionKeys: React.Dispatch<React.SetStateAction<string[]>>;
  useHashV1: boolean;
}

export const PartitionKeyComponent = (props: PartitionKeyComponentProps): JSX.Element => {
  const { partitionKey, setPartitionKey, subPartitionKeys, setSubPartitionKeys, useHashV1 } = props;

  const partitionKeyValueOnChange = (value: string): void => {
    if (!partitionKey && !value.startsWith("/")) {
      setPartitionKey("/" + value);
    } else {
      setPartitionKey(value);
    }
  };

  const subPartitionKeysValueOnChange = (value: string, index: number): void => {
    const updatedSubPartitionKeys: string[] = [...subPartitionKeys];
    if (!updatedSubPartitionKeys[index] && !value.startsWith("/")) {
      updatedSubPartitionKeys[index] = "/" + value.trim();
    } else {
      updatedSubPartitionKeys[index] = value.trim();
    }
    setSubPartitionKeys(updatedSubPartitionKeys);
  };

  return (
    <Stack>
      <Stack horizontal>
        <span className="mandatoryStar">*&nbsp;</span>
        <Text className="panelTextBold" variant="small">
          Partition key
        </Text>
        <TooltipHost directionalHint={DirectionalHint.bottomLeftEdge} content={getPartitionKeyTooltipText()}>
          <Icon iconName="Info" className="panelInfoIcon" tabIndex={0} />
        </TooltipHost>
      </Stack>

      <input
        type="text"
        id="addGlobalSecondaryIndex-partitionKeyValue"
        aria-required
        required
        size={40}
        className="panelTextField"
        placeholder={getPartitionKeyPlaceHolder()}
        aria-label={getPartitionKeyName()}
        pattern=".*"
        value={partitionKey}
        style={{ marginBottom: 8 }}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          partitionKeyValueOnChange(event.target.value);
        }}
      />
      {subPartitionKeys.map((subPartitionKey: string, subPartitionKeyIndex: number) => {
        return (
          <Stack style={{ marginBottom: 8 }} key={`uniqueKey${subPartitionKeyIndex}`} horizontal>
            <div
              style={{
                width: "20px",
                border: "solid",
                borderWidth: "0px 0px 1px 1px",
                marginRight: "5px",
              }}
            ></div>
            <input
              type="text"
              id="addGlobalSecondaryIndex-partitionKeyValue"
              key={`addGlobalSecondaryIndex-partitionKeyValue_${subPartitionKeyIndex}`}
              aria-required
              required
              size={40}
              tabIndex={subPartitionKeyIndex > 0 ? 1 : 0}
              className="panelTextField"
              autoComplete="off"
              placeholder={getPartitionKeyPlaceHolder(subPartitionKeyIndex)}
              aria-label={getPartitionKeyName()}
              pattern={".*"}
              title={""}
              value={subPartitionKey}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                subPartitionKeysValueOnChange(event.target.value, subPartitionKeyIndex);
              }}
            />
            <IconButton
              iconProps={{ iconName: "Delete" }}
              style={{ height: 27 }}
              onClick={() => {
                const updatedSubPartitionKeys = subPartitionKeys.filter(
                  (_, subPartitionKeyIndexToRemove) => subPartitionKeyIndex !== subPartitionKeyIndexToRemove,
                );
                setSubPartitionKeys(updatedSubPartitionKeys);
              }}
            />
          </Stack>
        );
      })}
      <Stack className="panelGroupSpacing">
        <DefaultButton
          styles={{ root: { padding: 0, width: 200, height: 30 }, label: { fontSize: 12 } }}
          hidden={useHashV1}
          disabled={subPartitionKeys.length >= Constants.BackendDefaults.maxNumMultiHashPartition}
          onClick={() => setSubPartitionKeys([...subPartitionKeys, ""])}
        >
          Add hierarchical partition key
        </DefaultButton>
        {subPartitionKeys.length > 0 && (
          <Text variant="small" style={{ color: "var(--colorNeutralForeground1)" }}>
            <Icon iconName="InfoSolid" className="removeIcon" tabIndex={0} /> This feature allows you to partition your
            data with up to three levels of keys for better data distribution. Requires .NET V3, Java V4 SDK, or preview
            JavaScript V3 SDK.{" "}
            <Link href="https://aka.ms/cosmos-hierarchical-partitioning" target="_blank">
              Learn more
            </Link>
          </Text>
        )}
      </Stack>
    </Stack>
  );
};
