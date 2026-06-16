import { IDropdownOption } from "@fluentui/react";
import { VectorEmbeddingSource, VectorIndex } from "Contracts/DataModels";
import { Keys, t } from "Localization";

const dataTypes = ["float32", "uint8", "int8", "float16"];
const distanceFunctions = ["euclidean", "cosine", "dotproduct"];
const indexTypes = ["none", "flat", "diskANN", "quantizedFlat"];
const authTypes: VectorEmbeddingSource["authType"][] = ["Entra"];

export const getDataTypeOptions = (): IDropdownOption[] => createDropdownOptionsFromLiterals(dataTypes);
export const getDistanceFunctionOptions = (): IDropdownOption[] => createDropdownOptionsFromLiterals(distanceFunctions);
export const getIndexTypeOptions = (): IDropdownOption[] => createDropdownOptionsFromLiterals(indexTypes);
export const getAuthTypeOptions = (): IDropdownOption[] => createDropdownOptionsFromLiterals(authTypes);
export const getQuantizerTypeOptions = (): IDropdownOption[] => [
  { key: "product", text: "Product" },
  { key: "spherical", text: `Spherical (${t(Keys.common.preview)})` },
];

export const supportsQuantization = (indexType: VectorIndex["type"] | "none" | undefined): boolean =>
  indexType === "quantizedFlat" || indexType === "diskANN";

// Parses a comma-separated path list, trims whitespace, drops blanks, and
// prefixes a leading "/" on each entry if it isn't there already.
export const parseSourcePaths = (raw: string): string[] => {
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => (p.startsWith("/") ? p : `/${p}`));
};

export const isValidHttpsUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
};

function createDropdownOptionsFromLiterals<T extends string>(literals: T[]): IDropdownOption[] {
  return literals.map((value) => ({
    key: value,
    text: value,
  }));
}
