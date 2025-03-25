//
// Common methods and constants for validation
//

//
// Validation of id for Cosmos DB resources:
// - Database
// - Container
// - Stored Procedure
// - User Defined Function (UDF)
// - Trigger

// eslint-disable-next-line no-useless-escape
export const ValidCosmosDbResourceIdRegex: RegExp = /[^\/?#\\]*[^\/?# \\]/;
export const ValidCosmosDbResourceIdDescription: string =
  "May not end with space nor contain characters '' '/' '#' '?'";

export function IsValidCosmosDbResourceId(id: string): boolean {
  return id && ValidCosmosDbResourceIdRegex.test(id);
}
