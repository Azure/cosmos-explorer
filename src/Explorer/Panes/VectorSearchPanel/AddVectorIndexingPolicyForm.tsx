import { DefaultButton, Dropdown, IDropdownOption, IconButton, Label, Stack } from "@fluentui/react";
import { VectorEmbedding, VectorIndex } from "Contracts/DataModels";
import { CollapsibleSectionComponent } from "Explorer/Controls/CollapsiblePanel/CollapsibleSectionComponent";
import { getIndexTypeOptions } from "Explorer/Panes/VectorSearchPanel/VectorSearchUtils";
import React, { FunctionComponent, useState } from "react";

export interface IAddVectorIndexingPolicyFormProps {
  vectorEmbedding: VectorEmbedding[];
  vectorIndex: VectorIndex[];
  onVectorIndexingChange: (vectorIndex: VectorIndex[]) => void;
  onValidationChange: (isValid: boolean) => void;
}

const dropdownStyles = {
  title: {
    height: 27,
    lineHeight: "24px",
    fontSize: 12,
  },
  dropdown: {
    height: 27,
    lineHeight: "24px",
  },
  dropdownItem: {
    fontSize: 12,
  },
};

export const AddVectorIndexingPolicyForm: FunctionComponent<IAddVectorIndexingPolicyFormProps> = ({
  vectorEmbedding,
  vectorIndex,
  onVectorIndexingChange,
  onValidationChange,
}): JSX.Element => {
  const [vectorIndexingPolicy, setVectorIndexingPolicy] = useState<VectorIndex[]>(vectorIndex);
  const [vectorIndexPathError, setVectorIndexPathError] = useState<string[]>([]);

  React.useEffect(() => {
    onVectorIndexingChange(vectorIndexingPolicy);
    runValidation();
  }, [vectorIndexingPolicy]);

  React.useEffect(() => {
    runValidation();
  }, [vectorEmbedding]);

  React.useEffect(() => {
    const allValidated = vectorIndexPathError.every((error: string) => error === "");
    onValidationChange(allValidated);
  }, [vectorIndexPathError]);

  const onVectorIndexPathChange = (index: number, option: IDropdownOption) => {
    const vectorIndexes = [...vectorIndexingPolicy];
    vectorIndexes[index].path = option.key as never;
    setVectorIndexingPolicy(vectorIndexes);
  };

  const runValidation = () => {
    const errors = [...vectorIndexPathError];
    vectorIndexingPolicy.forEach((vectorIndex: VectorIndex, index: number) => {
      let error = "";
      if (
        !vectorIndex.path ||
        !vectorEmbedding.some((vectorEmbedding: VectorEmbedding) => vectorEmbedding.path === vectorIndex.path)
      ) {
        error = "Vector indexing path should match vector embedding's path";
      }
      errors[index] = error;
    });
    setVectorIndexPathError(errors);
  };

  const onVectorIndexTypeChange = (index: number, option: IDropdownOption) => {
    const vectorIndexes = [...vectorIndexingPolicy];
    vectorIndexes[index].type = option.key as never;
    setVectorIndexingPolicy(vectorIndexes);
  };

  const getVectorIndexPathDropdownOptions = (): IDropdownOption<string>[] => {
    return vectorEmbedding
      .filter((vectorEmbedding: VectorEmbedding) => !!vectorEmbedding.path)
      .map((vectorEmbedding: VectorEmbedding) => {
        return {
          key: vectorEmbedding.path,
          text: vectorEmbedding.path,
        };
      });
  };

  const addVectorIndexDisabled = (): boolean => {
    return vectorIndexingPolicy.length >= vectorEmbedding.length;
  };

  const onAdd = () => {
    setVectorIndexingPolicy([...vectorIndexingPolicy, { path: "", type: "quantizedFlat" }]);
  };

  const onDelete = (index: number) => {
    const vectorIndexes = vectorIndexingPolicy.filter((_uniqueKey, j) => index !== j);
    const vectorIndexPathErrors = vectorIndexPathError.filter((_uniqueKey, j) => index !== j);
    setVectorIndexingPolicy(vectorIndexes);
    setVectorIndexPathError(vectorIndexPathErrors);
  };

  return (
    <Stack tokens={{ childrenGap: 4 }}>
      {vectorIndexingPolicy.length > 0 &&
        vectorIndexingPolicy.map((_vectorIndex: VectorIndex, index: number) => (
          <CollapsibleSectionComponent key={index} isExpandedByDefault={true} title={`Vector index ${index + 1}`}>
            <Stack horizontal tokens={{ childrenGap: 4 }}>
              <Stack
                styles={{
                  root: {
                    margin: "0 0 6px 20px !important",
                    paddingLeft: 20,
                    width: "80%",
                    borderLeft: "1px solid",
                  },
                }}
              >
                <Stack>
                  <Label styles={{ root: { fontSize: 12 } }}>Path</Label>
                  <Dropdown
                    required={true}
                    styles={dropdownStyles}
                    options={getVectorIndexPathDropdownOptions()}
                    selectedKey={vectorIndexingPolicy[index].path}
                    onChange={(_event: React.FormEvent<HTMLDivElement>, option: IDropdownOption) =>
                      onVectorIndexPathChange(index, option)
                    }
                    errorMessage={vectorIndexPathError[index]}
                  ></Dropdown>
                </Stack>
                <Stack>
                  <Label styles={{ root: { fontSize: 12 } }}>Type</Label>
                  <Dropdown
                    required={true}
                    styles={dropdownStyles}
                    options={getIndexTypeOptions()}
                    selectedKey={vectorIndexingPolicy[index].type}
                    onChange={(_event: React.FormEvent<HTMLDivElement>, option: IDropdownOption) =>
                      onVectorIndexTypeChange(index, option)
                    }
                  ></Dropdown>
                </Stack>
              </Stack>
              <IconButton
                iconProps={{ iconName: "Delete" }}
                style={{ height: 27, margin: "auto" }}
                onClick={() => onDelete(index)}
              />
            </Stack>
          </CollapsibleSectionComponent>
        ))}
      <DefaultButton
        disabled={addVectorIndexDisabled()}
        styles={{ root: { maxWidth: 170, fontSize: 12 } }}
        onClick={onAdd}
      >
        Add vector index
      </DefaultButton>
    </Stack>
  );
};
