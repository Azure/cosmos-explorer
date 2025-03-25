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
//
// Use these with <input> elements
// eslint-disable-next-line no-useless-escape
export const ValidCosmosDbIdInputPattern: RegExp = /[^\/?#\\]*[^\/?# \\]/;
export const ValidCosmosDbIdDescription: string = "May not end with space nor contain characters '\\' '/' '#' '?'";

// For a standalone function regex, we need to wrap the previous reg expression,
// to test against the entire value. This is done implicitly by input elements.
const ValidCosmosDbIdRegex: RegExp = new RegExp(`^(?:${ValidCosmosDbIdInputPattern.source})$`);

export function IsValidCosmosDbResourceId(id: string): boolean {
  return id && ValidCosmosDbIdRegex.test(id);
}
