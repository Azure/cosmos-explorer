import {
  DefaultButton,
  Dropdown,
  IDropdownOption,
  IStyleFunctionOrObject,
  ITextFieldStyleProps,
  ITextFieldStyles,
  Label,
  Stack,
  TextField,
} from "@fluentui/react";
import { InfoTooltip } from "Common/Tooltip/InfoTooltip";
import { VectorEmbedding, VectorIndex } from "Contracts/DataModels";
import { CollapsibleSectionComponent } from "Explorer/Controls/CollapsiblePanel/CollapsibleSectionComponent";
import {
  getDataTypeOptions,
  getDistanceFunctionOptions,
  getIndexTypeOptions,
} from "Explorer/Controls/VectorSearch/VectorSearchUtils";
import React, { FunctionComponent, useState } from "react";

export interface IVectorEmbeddingPoliciesComponentProps {
  vectorEmbeddings: VectorEmbedding[];
  onVectorEmbeddingChange: (
    vectorEmbeddings: VectorEmbedding[],
    vectorIndexingPolicies: VectorIndex[],
    validationPassed: boolean,
  ) => void;
  vectorIndexes?: VectorIndex[];
  discardChanges?: boolean;
  onChangesDiscarded?: () => void;
  disabled?: boolean;
  isGlobalSecondaryIndex?: boolean;
}

export interface VectorEmbeddingPolicyData {
  path: string;
  dataType: VectorEmbedding["dataType"];
  distanceFunction: VectorEmbedding["distanceFunction"];
  dimensions: number;
  indexType: VectorIndex["type"] | "none";
  pathError: string;
  dimensionsError: string;
  vectorIndexShardKey?: string[];
  indexingSearchListSize?: number;
  indexingSearchListSizeError?: string;
  quantizationByteSize?: number;
  quantizationByteSizeError?: string;
}

type VectorEmbeddingPolicyProperty = "dataType" | "distanceFunction" | "indexType";

const labelStyles = {
  root: {
    fontSize: 12,
    color: "var(--colorNeutralForeground1)",
  },
};

const textFieldStyles: IStyleFunctionOrObject<ITextFieldStyleProps, ITextFieldStyles> = {
  fieldGroup: {
    height: 27,
  },
  field: {
    fontSize: 12,
    padding: "0 8px",
    backgroundColor: "var(--colorNeutralBackground1)",
    color: "var(--colorNeutralForeground1)",
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

export const VectorEmbeddingPoliciesComponent: FunctionComponent<IVectorEmbeddingPoliciesComponentProps> = ({
  vectorEmbeddings,
  vectorIndexes,
  onVectorEmbeddingChange,
  discardChanges,
  onChangesDiscarded,
  disabled,
  isGlobalSecondaryIndex,
}): JSX.Element => {
  const onVectorEmbeddingPathError = (path: string, index?: number): string => {
    let error = "";
    if (!path) {
      error = "Path should not be empty";
    }
    if (
      index >= 0 &&
      vectorEmbeddingPolicyData?.find(
        (vectorEmbedding: VectorEmbeddingPolicyData, dataIndex: number) =>
          dataIndex !== index && vectorEmbedding.path === path,
      )
    ) {
      error = "Path is already defined";
    }
    return error;
  };

  const onVectorEmbeddingDimensionError = (dimension: number, indexType: VectorIndex["type"] | "none"): string => {
    let error = "";
    if (dimension <= 0 || dimension > 4096) {
      error = "Dimension must be greater than 0 and less than or equal 4096";
    }
    if (indexType === "flat" && dimension > 505) {
      error = "Maximum allowed dimension for flat index is 505";
    }
    return error;
  };

  const onQuantizationByteSizeError = (size: number): string => {
    let error = "";
    if (size < 1 || size > 512) {
      error = "Quantization byte size must be greater than 0 and less than or equal to 512";
    }
    return error;
  };

  const onIndexingSearchListSizeError = (size: number): string => {
    let error = "";
    if (size < 25 || size > 500) {
      error = "Indexing search list size must be greater than or equal to 25 and less than or equal to 500";
    }
    return error;
  };

  const initializeData = (vectorEmbeddings: VectorEmbedding[], vectorIndexes: VectorIndex[]) => {
    const mergedData: VectorEmbeddingPolicyData[] = [];
    vectorEmbeddings.forEach((embedding) => {
      const matchingIndex = displayIndexes ? vectorIndexes.find((index) => index.path === embedding.path) : undefined;
      mergedData.push({
        ...embedding,
        indexType: matchingIndex?.type || "none",
        indexingSearchListSize: matchingIndex?.indexingSearchListSize || undefined,
        quantizationByteSize: matchingIndex?.quantizationByteSize || undefined,
        vectorIndexShardKey: matchingIndex?.vectorIndexShardKey || undefined,
        pathError: onVectorEmbeddingPathError(embedding.path),
        dimensionsError: onVectorEmbeddingDimensionError(embedding.dimensions, matchingIndex?.type || "none"),
      });
    });
    return mergedData;
  };

  const [displayIndexes] = useState<boolean>(!!vectorIndexes);
  const [vectorEmbeddingPolicyData, setVectorEmbeddingPolicyData] = useState<VectorEmbeddingPolicyData[]>(
    initializeData(vectorEmbeddings, vectorIndexes),
  );

  React.useEffect(() => {
    propagateData();
  }, [vectorEmbeddingPolicyData]);

  React.useEffect(() => {
    if (discardChanges) {
      setVectorEmbeddingPolicyData(initializeData(vectorEmbeddings, vectorIndexes));
      onChangesDiscarded();
    }
  }, [discardChanges]);

  const propagateData = () => {
    const vectorEmbeddings: VectorEmbedding[] = vectorEmbeddingPolicyData.map((policy: VectorEmbeddingPolicyData) => ({
      path: policy.path,
      dataType: policy.dataType,
      dimensions: policy.dimensions,
      distanceFunction: policy.distanceFunction,
    }));
    const vectorIndexes: VectorIndex[] = vectorEmbeddingPolicyData
      .filter((policy: VectorEmbeddingPolicyData) => policy.indexType !== "none")
      .map(
        (policy) =>
          ({
            path: policy.path,
            type: policy.indexType,
            indexingSearchListSize: policy.indexingSearchListSize,
            quantizationByteSize: policy.quantizationByteSize,
            vectorIndexShardKey: policy.vectorIndexShardKey,
          }) as VectorIndex,
      );
    const validationPassed = vectorEmbeddingPolicyData.every(
      (policy: VectorEmbeddingPolicyData) => policy.pathError === "" && policy.dimensionsError === "",
    );
    onVectorEmbeddingChange(vectorEmbeddings, vectorIndexes, validationPassed);
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
    if (vectorEmbedding.indexType === "diskANN") {
      vectorEmbedding.indexingSearchListSize = 100;
    } else {
      vectorEmbedding.indexingSearchListSize = undefined;
    }
    setVectorEmbeddingPolicyData(vectorEmbeddings);
  };

  const onQuantizationByteSizeChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value.trim()) || 0;
    const vectorEmbeddings = [...vectorEmbeddingPolicyData];
    vectorEmbeddings[index].quantizationByteSize = value;
    vectorEmbeddings[index].quantizationByteSizeError = onQuantizationByteSizeError(value);
    setVectorEmbeddingPolicyData(vectorEmbeddings);
  };

  const onIndexingSearchListSizeChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value.trim()) || 0;
    const vectorEmbeddings = [...vectorEmbeddingPolicyData];
    vectorEmbeddings[index].indexingSearchListSize = value;
    vectorEmbeddings[index].indexingSearchListSizeError = onIndexingSearchListSizeError(value);
    setVectorEmbeddingPolicyData(vectorEmbeddings);
  };

  const onShardKeyChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim();
    const vectorEmbeddings = [...vectorEmbeddingPolicyData];
    if (!vectorEmbeddings[index]?.vectorIndexShardKey?.[0] && !value.startsWith("/")) {
      vectorEmbeddings[index].vectorIndexShardKey = ["/" + value];
    } else {
      vectorEmbeddings[index].vectorIndexShardKey = [value];
    }
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

  const getQuantizationByteSizeTooltipContent = (): string => {
    const containerName: string = isGlobalSecondaryIndex ? "global secondary index" : "container";
    return `This is dynamically set by the ${containerName} if left blank, or it can be set to a fixed number`;
  };

  return (
    <Stack tokens={{ childrenGap: 4 }}>
      {vectorEmbeddingPolicyData &&
        vectorEmbeddingPolicyData.length > 0 &&
        vectorEmbeddingPolicyData.map((vectorEmbeddingPolicy: VectorEmbeddingPolicyData, index: number) => (
          <CollapsibleSectionComponent
            disabled={disabled}
            key={index}
            isExpandedByDefault={true}
            title={`Vector embedding ${index + 1}`}
            showDelete={true}
            onDelete={() => onDelete(index)}
          >
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
                  <Label disabled={disabled} styles={labelStyles}>
                    Path
                  </Label>
                  <TextField
                    disabled={disabled}
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
                  <Label disabled={disabled} styles={labelStyles}>
                    Data type
                  </Label>
                  <Dropdown
                    disabled={disabled}
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
                  <Label disabled={disabled} styles={labelStyles}>
                    Distance function
                  </Label>
                  <Dropdown
                    disabled={disabled}
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
                  <Label disabled={disabled} styles={labelStyles}>
                    Dimensions
                  </Label>
                  <TextField
                    disabled={disabled}
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
                {displayIndexes && (
                  <Stack>
                    <Label disabled={disabled} styles={labelStyles}>
                      Index type
                    </Label>
                    <Dropdown
                      disabled={disabled}
                      required={true}
                      styles={dropdownStyles}
                      options={getIndexTypeOptions()}
                      selectedKey={vectorEmbeddingPolicy.indexType}
                      onChange={(_event: React.FormEvent<HTMLDivElement>, option: IDropdownOption) =>
                        onVectorEmbeddingIndexTypeChange(index, option)
                      }
                    ></Dropdown>
                    <Stack style={{ marginLeft: "10px" }}>
                      <Label
                        disabled={
                          disabled ||
                          (vectorEmbeddingPolicy.indexType !== "quantizedFlat" &&
                            vectorEmbeddingPolicy.indexType !== "diskANN")
                        }
                        styles={labelStyles}
                      >
                        Quantization byte size
                        <InfoTooltip>{getQuantizationByteSizeTooltipContent()}</InfoTooltip>
                      </Label>
                      <TextField
                        disabled={
                          disabled ||
                          (vectorEmbeddingPolicy.indexType !== "quantizedFlat" &&
                            vectorEmbeddingPolicy.indexType !== "diskANN")
                        }
                        id={`vector-policy-quantizationByteSize-${index + 1}`}
                        styles={textFieldStyles}
                        value={String(vectorEmbeddingPolicy.quantizationByteSize || "")}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          onQuantizationByteSizeChange(index, event)
                        }
                      />
                    </Stack>
                    <Stack style={{ marginLeft: "10px" }}>
                      <Label disabled={disabled || vectorEmbeddingPolicy.indexType !== "diskANN"} styles={labelStyles}>
                        Indexing search list size
                      </Label>
                      <TextField
                        disabled={disabled || vectorEmbeddingPolicy.indexType !== "diskANN"}
                        id={`vector-policy-indexingSearchListSize-${index + 1}`}
                        styles={textFieldStyles}
                        value={String(vectorEmbeddingPolicy.indexingSearchListSize || "")}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          onIndexingSearchListSizeChange(index, event)
                        }
                      />
                    </Stack>
                    <Stack style={{ marginLeft: "10px" }}>
                      <Label disabled={disabled || vectorEmbeddingPolicy.indexType !== "diskANN"} styles={labelStyles}>
                        Vector index shard key
                      </Label>
                      <TextField
                        disabled={disabled || vectorEmbeddingPolicy.indexType !== "diskANN"}
                        id={`vector-policy-vectorIndexShardKey-${index + 1}`}
                        styles={textFieldStyles}
                        value={String(vectorEmbeddingPolicy.vectorIndexShardKey?.[0] ?? "")}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onShardKeyChange(index, event)}
                      />
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </Stack>
          </CollapsibleSectionComponent>
        ))}
      <DefaultButton
        disabled={disabled}
        id={`add-vector-policy`}
        styles={{ root: { maxWidth: 170, fontSize: 12 } }}
        onClick={onAdd}
      >
        Add vector embedding
      </DefaultButton>
    </Stack>
  );
};
