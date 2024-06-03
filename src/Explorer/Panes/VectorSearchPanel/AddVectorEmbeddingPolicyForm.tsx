import {
  DefaultButton,
  Dropdown,
  IDropdownOption,
  IStyleFunctionOrObject,
  ITextFieldStyleProps,
  ITextFieldStyles,
  IconButton,
  Label,
  Stack,
  TextField,
} from "@fluentui/react";
import { VectorEmbedding, VectorIndex } from "Contracts/DataModels";
import { CollapsibleSectionComponent } from "Explorer/Controls/CollapsiblePanel/CollapsibleSectionComponent";
import { getDataTypeOptions, getDistanceFunctionOptions } from "Explorer/Panes/VectorSearchPanel/VectorSearchUtils";
import React, { FunctionComponent, useState } from "react";

export interface IAddVectorEmbeddingPolicyFormProps {
  vectorEmbedding: VectorEmbedding[];
  vectorIndex: VectorIndex[];
  onVectorEmbeddingChange: (vectorEmbeddings: VectorEmbedding[]) => void;
  onValidationChange: (isValid: boolean) => void;
}

const textFieldStyles: IStyleFunctionOrObject<ITextFieldStyleProps, ITextFieldStyles> = {
  fieldGroup: {
    height: 27,
  },
  field: {
    fontSize: 12,
    padding: "0 8px",
  },
};

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

export const AddVectorEmbeddingPolicyForm: FunctionComponent<IAddVectorEmbeddingPolicyFormProps> = ({
  vectorEmbedding,
  vectorIndex,
  onVectorEmbeddingChange,
  onValidationChange,
}): JSX.Element => {
  const [vectorEmbeddingPolicy, setVectorEmbeddingPolicy] = useState<VectorEmbedding[]>(vectorEmbedding);
  const [vectorEmbeddingPathError, setvectorEmbeddingPathError] = useState<string[]>(
    vectorEmbedding.map(() => {
      return "";
    }),
  );
  const [vectorEmbeddingDimensionError, setVectorEmbeddingDimensionError] = useState<string[]>(
    vectorEmbedding.map(() => {
      return "";
    }),
  );

  React.useEffect(() => {
    onVectorEmbeddingChange(vectorEmbeddingPolicy);
    runValidation();
  }, [vectorEmbeddingPolicy]);

  React.useEffect(() => {
    const allValidated =
      vectorEmbeddingPathError.every((error: string) => error === "") &&
      vectorEmbeddingDimensionError.every((error: string) => error === "");
    onValidationChange(allValidated);
  }, [vectorEmbeddingPathError, vectorEmbeddingDimensionError]);

  React.useEffect(() => {
    runValidation();
  }, [vectorIndex]);

  const runValidation = () => {
    const pathErrors = [...vectorEmbeddingPathError];
    const dimensionErrors = [...vectorEmbeddingDimensionError];
    vectorEmbeddingPolicy.forEach((vectorEmbedding: VectorEmbedding, index: number) => {
      const pathError = onVectorEmbeddingPathError(vectorEmbedding.path);
      const dimensionError = onVectorEmbeddingDimensionError(vectorEmbedding.dimensions, index);
      pathErrors[index] = pathError;
      dimensionErrors[index] = dimensionError;
    });
    setvectorEmbeddingPathError(pathErrors);
    setVectorEmbeddingDimensionError(dimensionErrors);
  };

  const onVectorEmbeddingPathChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();
    const vectorEmbeddings = [...vectorEmbeddingPolicy];
    const pathErrors = [...vectorEmbeddingPathError];
    if (!vectorEmbeddings[index]?.path && !value.startsWith("/")) {
      vectorEmbeddings[index].path = "/" + value;
    } else {
      vectorEmbeddings[index].path = value;
    }
    const error = onVectorEmbeddingPathError(value);
    pathErrors[index] = error;
    setVectorEmbeddingPolicy(vectorEmbeddings);
  };

  const onVectorEmbeddingPathError = (path: string): string => {
    let error = "";
    if (!path) {
      error = "Vector embedding path should not be empty";
    }
    return error;
  };

  const onVectorEmbeddingDimensionsChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value.trim()) || 0;
    const vectorEmbeddings = [...vectorEmbeddingPolicy];
    const dimensionErrors = [...vectorEmbeddingDimensionError];
    vectorEmbeddings[index].dimensions = value;
    const error = onVectorEmbeddingDimensionError(value, index);
    dimensionErrors[index] = error;
    setVectorEmbeddingPolicy(vectorEmbeddings);
  };

  const onVectorEmbeddingDimensionError = (dimension: number, index?: number): string => {
    let error = "";
    if (dimension <= 0 || dimension > 4096) {
      error = "Vector embedding dimension must be greater than 0 and less than or equal 4096";
    }
    if (index !== null) {
      const matchingIndex = vectorIndex.find(
        (vectorIndex: VectorIndex) => vectorIndex.path === vectorEmbeddingPolicy[index].path,
      );
      if (matchingIndex && matchingIndex.type === "flat" && dimension > 505) {
        error = "Maximum allowed dimension for flat index is 505";
      }
    }

    return error;
  };

  const onVectorEmbeddingDataTypeChange = (index: number, option: IDropdownOption): void => {
    const vectorEmbeddings = [...vectorEmbeddingPolicy];
    vectorEmbeddings[index].dataType = option.key as never;
    setVectorEmbeddingPolicy(vectorEmbeddings);
  };

  const onVectorEmbeddingDistanceFunctionChange = (index: number, option: IDropdownOption): void => {
    const vectorEmbeddings = [...vectorEmbeddingPolicy];
    vectorEmbeddings[index].distanceFunction = option.key as never;
    setVectorEmbeddingPolicy(vectorEmbeddings);
  };

  const onAdd = () => {
    setVectorEmbeddingPolicy([
      ...vectorEmbeddingPolicy,
      { path: "", dataType: "float32", distanceFunction: "euclidean", dimensions: 0 },
    ]);
  };

  const onDelete = (index: number) => {
    const vectorEmbeddings = vectorEmbeddingPolicy.filter((_uniqueKey, j) => index !== j);
    const pathErrors = vectorEmbeddingPathError.filter((_uniqueKey, j) => index !== j);
    const dimensionErrors = vectorEmbeddingDimensionError.filter((_uniqueKey, j) => index !== j);
    setVectorEmbeddingPolicy(vectorEmbeddings);
    setvectorEmbeddingPathError(pathErrors);
    setVectorEmbeddingDimensionError(dimensionErrors);
  };

  return (
    <Stack tokens={{ childrenGap: 4 }}>
      {vectorEmbeddingPolicy.length > 0 &&
        vectorEmbeddingPolicy.map((vectorEmbedding: VectorEmbedding, index: number) => (
          <CollapsibleSectionComponent key={index} isExpandedByDefault={true} title={`Vector embedding ${index + 1}`}>
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
                  <TextField
                    required={true}
                    placeholder="/vector1"
                    styles={textFieldStyles}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => onVectorEmbeddingPathChange(index, event)}
                    value={vectorEmbedding.path || ""}
                    errorMessage={vectorEmbeddingPathError[index]}
                    // validateOnFocusOut={true}
                  />
                </Stack>
                <Stack>
                  <Label styles={{ root: { fontSize: 12 } }}>Data type</Label>
                  <Dropdown
                    required={true}
                    styles={dropdownStyles}
                    options={getDataTypeOptions()}
                    selectedKey={vectorEmbeddingPolicy[index].dataType}
                    onChange={(_event: React.FormEvent<HTMLDivElement>, option: IDropdownOption) =>
                      onVectorEmbeddingDataTypeChange(index, option)
                    }
                  ></Dropdown>
                </Stack>
                <Stack>
                  <Label styles={{ root: { fontSize: 12 } }}>Distance function</Label>
                  <Dropdown
                    required={true}
                    styles={dropdownStyles}
                    options={getDistanceFunctionOptions()}
                    selectedKey={vectorEmbeddingPolicy[index].distanceFunction}
                    onChange={(_event: React.FormEvent<HTMLDivElement>, option: IDropdownOption) =>
                      onVectorEmbeddingDistanceFunctionChange(index, option)
                    }
                  ></Dropdown>
                </Stack>
                <Stack>
                  <Label styles={{ root: { fontSize: 12 } }}>Dimensions</Label>
                  <TextField
                    required={true}
                    styles={textFieldStyles}
                    value={String(vectorEmbedding.dimensions || 0)}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      onVectorEmbeddingDimensionsChange(index, event)
                    }
                    errorMessage={vectorEmbeddingDimensionError[index]}
                  />
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
      <DefaultButton styles={{ root: { maxWidth: 170, fontSize: 12 } }} onClick={onAdd}>
        Add vector embedding
      </DefaultButton>
    </Stack>
  );
};
