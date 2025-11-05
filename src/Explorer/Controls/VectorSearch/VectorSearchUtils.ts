import { IDropdownOption } from "@fluentui/react";

const dataTypes = ["float32", "float16", "uint8", "int8"];
const distanceFunctions = ["euclidean", "cosine", "dotproduct"];
const indexTypes = ["none", "flat", "diskANN", "quantizedFlat"];

export const getDataTypeOptions = (): IDropdownOption[] => createDropdownOptionsFromLiterals(dataTypes);
export const getDistanceFunctionOptions = (): IDropdownOption[] => createDropdownOptionsFromLiterals(distanceFunctions);
export const getIndexTypeOptions = (): IDropdownOption[] => createDropdownOptionsFromLiterals(indexTypes);

function createDropdownOptionsFromLiterals<T extends string>(literals: T[]): IDropdownOption[] {
  return literals.map((value) => ({
    key: value,
    text: value,
  }));
}
