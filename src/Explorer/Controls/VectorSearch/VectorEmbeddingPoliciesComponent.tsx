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
  getQuantizerTypeOptions,
} from "Explorer/Controls/VectorSearch/VectorSearchUtils";
import { Keys, t } from "Localization";
import React, { FunctionComponent, useState } from "react";

export interface IVectorEmbeddingPoliciesComponentProps {
  vectorEmbeddingsBaseline: VectorEmbedding[];
  vectorEmbeddings: VectorEmbedding[];
  onVectorEmbeddingChange: (
    vectorEmbeddings: VectorEmbedding[],
    vectorIndexingPolicies: VectorIndex[],
    validationPassed: boolean,
  ) => void;
  vectorIndexes?: VectorIndex[];
  discardChanges?: boolean;
  onChangesDiscarded?: () => void;
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
  quantizerType?: VectorIndex["quantizerType"];
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
  vectorEmbeddingsBaseline,
  vectorEmbeddings,
  vectorIndexes,
  onVectorEmbeddingChange,
  discardChanges,
  onChangesDiscarded,
  isGlobalSecondaryIndex,
}): JSX.Element => {
  const isExistingPolicy = (policy: VectorEmbeddingPolicyData): boolean => {
    if (!vectorEmbeddingsBaseline || vectorEmbeddingsBaseline.length === 0) {
      return false;
    }

    return vectorEmbeddingsBaseline.some(
      (baseline) =>
        baseline.path === policy.path &&
        baseline.dataType === policy.dataType &&
        baseline.dimensions === policy.dimensions &&
        baseline.distanceFunction === policy.distanceFunction,
    );
  };

  const onVectorEmbeddingPathError = (path: string, index?: number): string => {
    let error = "";
    if (!path) {
      error = t(Keys.controls.vectorEmbeddingPolicies.pathEmptyError);
    }
    if (
      index >= 0 &&
      vectorEmbeddingPolicyData?.find(
        (vectorEmbedding: VectorEmbeddingPolicyData, dataIndex: number) =>
          dataIndex !== index && vectorEmbedding.path === path,
      )
    ) {
      error = t(Keys.controls.vectorEmbeddingPolicies.pathDuplicateError);
    }
    return error;
  };

  const onVectorEmbeddingDimensionError = (dimension: number, indexType: VectorIndex["type"] | "none"): string => {
    let error = "";
    if (dimension <= 0 || dimension > 4096) {
      error = t(Keys.controls.vectorEmbeddingPolicies.dimensionRangeError);
    }
    if (indexType === "flat" && dimension > 505) {
      error = t(Keys.controls.vectorEmbeddingPolicies.dimensionFlatIndexError);
    }
    return error;
  };

  const onQuantizationByteSizeError = (size: number): string => {
    let error = "";
    if (size < 1 || size > 512) {
      error = t(Keys.controls.vectorEmbeddingPolicies.quantizationByteSizeRangeError);
    }
    return error;
  };

  const onIndexingSearchListSizeError = (size: number): string => {
    let error = "";
    if (size < 25 || size > 500) {
      error = t(Keys.controls.vectorEmbeddingPolicies.indexingSearchListSizeRangeError);
    }
    return error;
  };

  const initializeData = (vectorEmbeddings: VectorEmbedding[], vectorIndexes: VectorIndex[]) => {
    const mergedData: VectorEmbeddingPolicyData[] = [];
    vectorEmbeddings?.forEach((embedding) => {
      const matchingIndex = displayIndexes ? vectorIndexes.find((index) => index.path === embedding.path) : undefined;
      const matchingType = matchingIndex?.type;
      const supportsQuantizer = matchingType === "quantizedFlat" || matchingType === "diskANN";
      mergedData.push({
        ...embedding,
        indexType: matchingType || "none",
        indexingSearchListSize: matchingIndex?.indexingSearchListSize || undefined,
        quantizationByteSize: matchingIndex?.quantizationByteSize || undefined,
        quantizerType: supportsQuantizer ? matchingIndex?.quantizerType || "product" : undefined,
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
            ...((policy.indexType === "quantizedFlat" || policy.indexType === "diskANN") && policy.quantizerType
              ? { quantizerType: policy.quantizerType }
              : {}),
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
    if (vectorEmbedding.indexType === "quantizedFlat" || vectorEmbedding.indexType === "diskANN") {
      vectorEmbedding.quantizerType = vectorEmbedding.quantizerType || "product";
    } else {
      vectorEmbedding.quantizerType = undefined;
    }
    setVectorEmbeddingPolicyData(vectorEmbeddings);
  };

  const onQuantizerTypeChange = (index: number, option: IDropdownOption): void => {
    const vectorEmbeddings = [...vectorEmbeddingPolicyData];
    vectorEmbeddings[index].quantizerType = option.key as VectorIndex["quantizerType"];
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
    const containerName = isGlobalSecondaryIndex
      ? t(Keys.controls.vectorEmbeddingPolicies.quantizationByteSizeTooltipGlobalSecondaryIndexName)
      : t(Keys.controls.vectorEmbeddingPolicies.quantizationByteSizeTooltipContainerName);
    return t(Keys.controls.vectorEmbeddingPolicies.quantizationByteSizeTooltip, { containerName });
  };

  return (
    <Stack tokens={{ childrenGap: 4 }}>
      {vectorEmbeddingPolicyData &&
        vectorEmbeddingPolicyData.length > 0 &&
        vectorEmbeddingPolicyData.map((vectorEmbeddingPolicy: VectorEmbeddingPolicyData, index: number) => (
          <CollapsibleSectionComponent
            disabled={isExistingPolicy(vectorEmbeddingPolicy)}
            key={index}
            isExpandedByDefault={true}
            title={t(Keys.controls.vectorEmbeddingPolicies.vectorEmbeddingTitle, { index: index + 1 })}
            showDelete={true}
            onDelete={() => onDelete(index)}
            disableDelete={false}
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
                  <Label disabled={isExistingPolicy(vectorEmbeddingPolicy)} styles={labelStyles}>
                    {t(Keys.controls.vectorEmbeddingPolicies.path)}
                  </Label>
                  <TextField
                    disabled={isExistingPolicy(vectorEmbeddingPolicy)}
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
                  <Label disabled={isExistingPolicy(vectorEmbeddingPolicy)} styles={labelStyles}>
                    {t(Keys.controls.vectorEmbeddingPolicies.dataType)}
                  </Label>
                  <Dropdown
                    disabled={isExistingPolicy(vectorEmbeddingPolicy)}
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
                  <Label disabled={isExistingPolicy(vectorEmbeddingPolicy)} styles={labelStyles}>
                    {t(Keys.controls.vectorEmbeddingPolicies.distanceFunction)}
                  </Label>
                  <Dropdown
                    disabled={isExistingPolicy(vectorEmbeddingPolicy)}
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
                  <Label disabled={isExistingPolicy(vectorEmbeddingPolicy)} styles={labelStyles}>
                    {t(Keys.controls.vectorEmbeddingPolicies.dimensions)}
                  </Label>
                  <TextField
                    disabled={isExistingPolicy(vectorEmbeddingPolicy)}
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
                    <Label disabled={isExistingPolicy(vectorEmbeddingPolicy)} styles={labelStyles}>
                      {t(Keys.controls.vectorEmbeddingPolicies.indexType)}
                    </Label>
                    <Dropdown
                      disabled={isExistingPolicy(vectorEmbeddingPolicy)}
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
                          isExistingPolicy(vectorEmbeddingPolicy) ||
                          (vectorEmbeddingPolicy.indexType !== "quantizedFlat" &&
                            vectorEmbeddingPolicy.indexType !== "diskANN")
                        }
                        styles={labelStyles}
                      >
                        {t(Keys.controls.vectorEmbeddingPolicies.quantizationByteSize)}
                        <InfoTooltip>{getQuantizationByteSizeTooltipContent()}</InfoTooltip>
                      </Label>
                      <TextField
                        disabled={
                          isExistingPolicy(vectorEmbeddingPolicy) ||
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
                      <Label
                        disabled={
                          isExistingPolicy(vectorEmbeddingPolicy) ||
                          (vectorEmbeddingPolicy.indexType !== "quantizedFlat" &&
                            vectorEmbeddingPolicy.indexType !== "diskANN")
                        }
                        styles={labelStyles}
                      >
                        {t(Keys.controls.vectorEmbeddingPolicies.quantizerType)}
                        <InfoTooltip>{t(Keys.controls.vectorEmbeddingPolicies.quantizerTypeTooltip)}</InfoTooltip>
                      </Label>
                      <Dropdown
                        disabled={
                          isExistingPolicy(vectorEmbeddingPolicy) ||
                          (vectorEmbeddingPolicy.indexType !== "quantizedFlat" &&
                            vectorEmbeddingPolicy.indexType !== "diskANN")
                        }
                        id={`vector-policy-quantizerType-${index + 1}`}
                        styles={dropdownStyles}
                        options={getQuantizerTypeOptions()}
                        selectedKey={vectorEmbeddingPolicy.quantizerType ?? null}
                        onChange={(_event: React.FormEvent<HTMLDivElement>, option: IDropdownOption) =>
                          onQuantizerTypeChange(index, option)
                        }
                      />
                    </Stack>
                    <Stack style={{ marginLeft: "10px" }}>
                      <Label
                        disabled={
                          isExistingPolicy(vectorEmbeddingPolicy) || vectorEmbeddingPolicy.indexType !== "diskANN"
                        }
                        styles={labelStyles}
                      >
                        {t(Keys.controls.vectorEmbeddingPolicies.indexingSearchListSize)}
                      </Label>
                      <TextField
                        disabled={
                          isExistingPolicy(vectorEmbeddingPolicy) || vectorEmbeddingPolicy.indexType !== "diskANN"
                        }
                        id={`vector-policy-indexingSearchListSize-${index + 1}`}
                        styles={textFieldStyles}
                        value={String(vectorEmbeddingPolicy.indexingSearchListSize || "")}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                          onIndexingSearchListSizeChange(index, event)
                        }
                      />
                    </Stack>
                    <Stack style={{ marginLeft: "10px" }}>
                      <Label
                        disabled={
                          isExistingPolicy(vectorEmbeddingPolicy) || vectorEmbeddingPolicy.indexType !== "diskANN"
                        }
                        styles={labelStyles}
                      >
                        {t(Keys.controls.vectorEmbeddingPolicies.vectorIndexShardKey)}
                      </Label>
                      <TextField
                        disabled={
                          isExistingPolicy(vectorEmbeddingPolicy) || vectorEmbeddingPolicy.indexType !== "diskANN"
                        }
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
      <DefaultButton id={`add-vector-policy`} styles={{ root: { maxWidth: 170, fontSize: 12 } }} onClick={onAdd}>
        {t(Keys.controls.vectorEmbeddingPolicies.addVectorEmbedding)}
      </DefaultButton>
    </Stack>
  );
};
