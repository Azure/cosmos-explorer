import { IDropdownOption } from "@fluentui/react";

const dataTypes = ["float32", "uint8", "int8", "float16"];
const distanceFunctions = ["euclidean", "cosine", "dotproduct"];
const indexTypes = ["none", "flat", "diskANN", "quantizedFlat"];

export const getDataTypeOptions = (): IDropdownOption[] => createDropdownOptionsFromLiterals(dataTypes);
export const getDistanceFunctionOptions = (): IDropdownOption[] => createDropdownOptionsFromLiterals(distanceFunctions);
export const getIndexTypeOptions = (): IDropdownOption[] => createDropdownOptionsFromLiterals(indexTypes);
export const getQuantizerTypeOptions = (): IDropdownOption[] => [
  { key: "product", text: "Product" },
  { key: "spherical", text: "Spherical (Preview)" },
];

function createDropdownOptionsFromLiterals<T extends string>(literals: T[]): IDropdownOption[] {
  return literals.map((value) => ({
    key: value,
    text: value,
  }));
}
