import { ActionButton, IconButton, Stack } from "@fluentui/react";
import { UniqueKeysHeader } from "Explorer/Panes/AddCollectionPanel/AddCollectionPanelUtility";
import React from "react";
import { userContext } from "UserContext";

export interface AddMVUniqueKeysComponentProps {
  uniqueKeys: string[];
  setUniqueKeys: React.Dispatch<React.SetStateAction<string[]>>;
}

export const AddMVUniqueKeysComponent = (props: AddMVUniqueKeysComponentProps): JSX.Element => {
  const { uniqueKeys, setUniqueKeys } = props;

  const updateUniqueKeysOnChange = (value: string, uniqueKeyToReplaceIndex: number): void => {
    const updatedUniqueKeys = uniqueKeys.map((uniqueKey: string, uniqueKeyIndex: number) => {
      if (uniqueKeyToReplaceIndex === uniqueKeyIndex) {
        return value;
      }
      return uniqueKey;
    });
    setUniqueKeys(updatedUniqueKeys);
  };

  const deleteUniqueKeyOnClick = (uniqueKeyToDeleteIndex: number): void => {
    const updatedUniqueKeys = uniqueKeys.filter((_, uniqueKeyIndex) => uniqueKeyToDeleteIndex !== uniqueKeyIndex);
    setUniqueKeys(updatedUniqueKeys);
  };

  const addUniqueKeyOnClick = (): void => {
    setUniqueKeys([...uniqueKeys, ""]);
  };

  return (
    <Stack>
      {UniqueKeysHeader()}

      {uniqueKeys.map((uniqueKey: string, uniqueKeyIndex: number): JSX.Element => {
        return (
          <Stack style={{ marginBottom: 8 }} key={`uniqueKey-${uniqueKeyIndex}`} horizontal>
            <input
              type="text"
              autoComplete="off"
              placeholder={
                userContext.apiType === "Mongo"
                  ? "Comma separated paths e.g. firstName,address.zipCode"
                  : "Comma separated paths e.g. /firstName,/address/zipCode"
              }
              className="panelTextField"
              autoFocus
              value={uniqueKey}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                updateUniqueKeysOnChange(event.target.value, uniqueKeyIndex);
              }}
            />

            <IconButton
              iconProps={{ iconName: "Delete" }}
              style={{ height: 27 }}
              onClick={() => {
                deleteUniqueKeyOnClick(uniqueKeyIndex);
              }}
            />
          </Stack>
        );
      })}

      <ActionButton
        iconProps={{ iconName: "Add" }}
        styles={{ root: { padding: 0 }, label: { fontSize: 12 } }}
        onClick={() => {
          addUniqueKeyOnClick();
        }}
      >
        Add unique key
      </ActionButton>
    </Stack>
  );
};
