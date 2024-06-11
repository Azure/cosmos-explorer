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
import {
  getDataTypeOptions,
  getDistanceFunctionOptions,
  getIndexTypeOptions,
} from "Explorer/Panes/VectorSearchPanel/VectorSearchUtils";
import React, { FunctionComponent, useState } from "react";

export interface IAddVectorEmbeddingPolicyFormProps {
  vectorEmbedding: VectorEmbedding[];
  vectorIndex: VectorIndex[];
  onVectorEmbeddingChange: (
    vectorEmbeddings: VectorEmbedding[],
    vectorIndexingPolicies: VectorIndex[],
    validationPassed: boolean,
  ) => void;
}

export interface VectorEmbeddingPolicyData {
  path: string;
  dataType: VectorEmbedding["dataType"];
  distanceFunction: VectorEmbedding["distanceFunction"];
  dimensions: number;
  indexType: VectorIndex["type"] | "none";
  pathError: string;
  dimensionsError: string;
}

type VectorEmbeddingPolicyProperty = "dataType" | "distanceFunction" | "indexType";

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
}): JSX.Element => {
  const onVectorEmbeddingPathError = (path: string, index?: number): string => {
    let error = "";
    if (!path) {
      error = "Vector embedding path should not be empty";
    }
    if (
      index >= 0 &&
      vectorEmbeddingPolicyData?.find(
        (vectorEmbedding: VectorEmbeddingPolicyData, dataIndex: number) =>
          dataIndex !== index && vectorEmbedding.path === path,
      )
    ) {
      error = "Vector embedding path is already defined";
    }
    return error;
  };

  const onVectorEmbeddingDimensionError = (dimension: number, indexType: VectorIndex["type"] | "none"): string => {
    let error = "";
    if (dimension <= 0 || dimension > 4096) {
      error = "Vector embedding dimension must be greater than 0 and less than or equal 4096";
    }
    if (indexType === "flat" && dimension > 505) {
      error = "Maximum allowed dimension for flat index is 505";
    }
    return error;
  };

  const initializeData = (vectorEmbedding: VectorEmbedding[], vectorIndex: VectorIndex[]) => {
    const mergedData: VectorEmbeddingPolicyData[] = [];
    vectorEmbedding.forEach((embedding) => {
      const matchingIndex = vectorIndex.find((index) => index.path === embedding.path);
      mergedData.push({
        ...embedding,
        indexType: matchingIndex?.type || "none",
        pathError: onVectorEmbeddingPathError(embedding.path),
        dimensionsError: onVectorEmbeddingDimensionError(embedding.dimensions, matchingIndex?.type || "none"),
      });
    });
    return mergedData;
  };

  const [vectorEmbeddingPolicyData, setVectorEmbeddingPolicyData] = useState<VectorEmbeddingPolicyData[]>(
    initializeData(vectorEmbedding, vectorIndex),
  );

  React.useEffect(() => {
    propagateData();
  }, [vectorEmbeddingPolicyData]);

  const propagateData = () => {
    const vectorEmbeddings: VectorEmbedding[] = vectorEmbeddingPolicyData.map((policy: VectorEmbeddingPolicyData) => ({
      dataType: policy.dataType,
      dimensions: policy.dimensions,
      distanceFunction: policy.distanceFunction,
      path: policy.path,
    }));
    const vectorIndexingPolicies: VectorIndex[] = vectorEmbeddingPolicyData
      .filter((policy: VectorEmbeddingPolicyData) => policy.indexType !== "none")
      .map(
        (policy) =>
          ({
            path: policy.path,
            type: policy.indexType,
          }) as VectorIndex,
      );
    const validationPassed = vectorEmbeddingPolicyData.every(
      (policy: VectorEmbeddingPolicyData) => policy.pathError === "" && policy.dimensionsError === "",
    );
    onVectorEmbeddingChange(vectorEmbeddings, vectorIndexingPolicies, validationPassed);
  };

  const onVectorEmbeddingPathChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();
    const vectorEmbeddings = [...vectorEmbeddingPolicyData];
    if (!vectorEmbeddings[index]?.path && !value.startsWith("/")) {
      vectorEmbeddings[index].path = "/" + value;
    } else {
      vectorEmbeddings[index].path = value;
    }
    const error = onVectorEmbeddingPathError(value, index);
    vectorEmbeddings[index].pathError = error;
    setVectorEmbeddingPolicyData(vectorEmbeddings);
  };

  const onVectorEmbeddingDimensionsChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value.trim()) || 0;
    const vectorEmbeddings = [...vectorEmbeddingPolicyData];
    const vectorEmbedding = vectorEmbeddings[index];
    vectorEmbeddings[index].dimensions = value;
    const error = onVectorEmbeddingDimensionError(value, vectorEmbedding.indexType);
    vectorEmbeddings[index].dimensionsError = error;
    setVectorEmbeddingPolicyData(vectorEmbeddings);
  };

  const onVectorEmbeddingIndexTypeChange = (index: number, option: IDropdownOption): void => {
    const vectorEmbeddings = [...vectorEmbeddingPolicyData];
    const vectorEmbedding = vectorEmbeddings[index];
    vectorEmbeddings[index].indexType = option.key as never;
    const error = onVectorEmbeddingDimensionError(vectorEmbedding.dimensions, vectorEmbedding.indexType);
    vectorEmbeddings[index].dimensionsError = error;
    setVectorEmbeddingPolicyData(vectorEmbeddings);
  };

  const onVectorEmbeddingPolicyChange = (
    index: number,
    option: IDropdownOption,
    property: VectorEmbeddingPolicyProperty,
  ): void => {
    const vectorEmbeddings = [...vectorEmbeddingPolicyData];
    vectorEmbeddings[index][property] = option.key as never;
    setVectorEmbeddingPolicyData(vectorEmbeddings);
  };

  const onAdd = () => {
    setVectorEmbeddingPolicyData([
      ...vectorEmbeddingPolicyData,
      {
        path: "",
        dataType: "float32",
        distanceFunction: "euclidean",
        dimensions: 0,
        indexType: "none",
        pathError: onVectorEmbeddingPathError(""),
        dimensionsError: onVectorEmbeddingDimensionError(0, "none"),
      },
    ]);
  };

  const onDelete = (index: number) => {
    const vectorEmbeddings = vectorEmbeddingPolicyData.filter((_uniqueKey, j) => index !== j);
    setVectorEmbeddingPolicyData(vectorEmbeddings);
  };

  return (
    <Stack tokens={{ childrenGap: 4 }}>
      {vectorEmbeddingPolicyData.length > 0 &&
        vectorEmbeddingPolicyData.map((vectorEmbeddingPolicy: VectorEmbeddingPolicyData, index: number) => (
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
                    id={`vector-policy-path-${index + 1}`}
                    required={true}
                    placeholder="/vector1"
                    styles={textFieldStyles}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => onVectorEmbeddingPathChange(index, event)}
                    value={vectorEmbeddingPolicy.path || ""}
                    errorMessage={vectorEmbeddingPolicy.pathError}
                  />
                </Stack>
                <Stack>
                  <Label styles={{ root: { fontSize: 12 } }}>Data type</Label>
                  <Dropdown
                    required={true}
                    styles={dropdownStyles}
                    options={getDataTypeOptions()}
                    selectedKey={vectorEmbeddingPolicy.dataType}
                    onChange={(_event: React.FormEvent<HTMLDivElement>, option: IDropdownOption) =>
                      onVectorEmbeddingPolicyChange(index, option, "dataType")
                    }
                  ></Dropdown>
                </Stack>
                <Stack>
                  <Label styles={{ root: { fontSize: 12 } }}>Distance function</Label>
                  <Dropdown
                    required={true}
                    styles={dropdownStyles}
                    options={getDistanceFunctionOptions()}
                    selectedKey={vectorEmbeddingPolicy.distanceFunction}
                    onChange={(_event: React.FormEvent<HTMLDivElement>, option: IDropdownOption) =>
                      onVectorEmbeddingPolicyChange(index, option, "distanceFunction")
                    }
                  ></Dropdown>
                </Stack>
                <Stack>
                  <Label styles={{ root: { fontSize: 12 } }}>Dimensions</Label>
                  <TextField
                    id={`vector-policy-dimension-${index + 1}`}
                    required={true}
                    styles={textFieldStyles}
                    value={String(vectorEmbeddingPolicy.dimensions || 0)}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      onVectorEmbeddingDimensionsChange(index, event)
                    }
                    errorMessage={vectorEmbeddingPolicy.dimensionsError}
                  />
                </Stack>
                <Stack>
                  <Label styles={{ root: { fontSize: 12 } }}>Index type</Label>
                  <Dropdown
                    required={true}
                    styles={dropdownStyles}
                    options={getIndexTypeOptions()}
                    selectedKey={vectorEmbeddingPolicy.indexType}
                    onChange={(_event: React.FormEvent<HTMLDivElement>, option: IDropdownOption) =>
                      onVectorEmbeddingIndexTypeChange(index, option)
                    }
                  ></Dropdown>
                </Stack>
              </Stack>
              <IconButton
                id={`delete-vector-policy-${index + 1}`}
                iconProps={{ iconName: "Delete" }}
                style={{ height: 27, margin: "auto" }}
                onClick={() => onDelete(index)}
              />
            </Stack>
          </CollapsibleSectionComponent>
        ))}
      <DefaultButton id={`add-vector-policy`} styles={{ root: { maxWidth: 170, fontSize: 12 } }} onClick={onAdd}>
        Add vector embedding
      </DefaultButton>
    </Stack>
  );
};
