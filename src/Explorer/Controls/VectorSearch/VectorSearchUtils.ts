import { IDropdownOption } from "@fluentui/react";
import { VectorIndex } from "Contracts/DataModels";
import { Keys, t } from "Localization";

const dataTypes = ["float32", "uint8", "int8", "float16"];
const distanceFunctions = ["euclidean", "cosine", "dotproduct"];
const indexTypes = ["none", "flat", "diskANN", "quantizedFlat"];

export const getDataTypeOptions = (): IDropdownOption[] => createDropdownOptionsFromLiterals(dataTypes);
export const getDistanceFunctionOptions = (): IDropdownOption[] => createDropdownOptionsFromLiterals(distanceFunctions);
export const getIndexTypeOptions = (): IDropdownOption[] => createDropdownOptionsFromLiterals(indexTypes);
export const getQuantizerTypeOptions = (): IDropdownOption[] => [
  { key: "product", text: t(Keys.controls.vectorEmbeddingPolicies.quantizerTypeProduct) },
  {
    key: "spherical",
    text: `${t(Keys.controls.vectorEmbeddingPolicies.quantizerTypeSpherical)} (${t(Keys.common.preview)})`,
  },
];

export const supportsQuantization = (indexType: VectorIndex["type"] | "none" | undefined): boolean =>
  indexType === "quantizedFlat" || indexType === "diskANN";

function createDropdownOptionsFromLiterals<T extends string>(literals: T[]): IDropdownOption[] {
  return literals.map((value) => ({
    key: value,
    text: value,
  }));
}
