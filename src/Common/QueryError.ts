import { getErrorMessage } from "Common/ErrorHandlingUtils";

export enum QueryErrorSeverity {
  Error = "Error",
  Warning = "Warning",
}

export interface QueryErrorLocation {
  start: number,
  end: number,
}

// Maps severities to numbers for sorting.
const severityMap: Record<QueryErrorSeverity, number> = {
  "Error": 1,
  "Warning": 0,
}

export function compareSeverity(left: QueryErrorSeverity, right: QueryErrorSeverity): number {
  return severityMap[left] - severityMap[right]
}

export default class QueryError {
  constructor(
    public message: string,
    public severity: QueryErrorSeverity,
    public code?: string,
    public location?: QueryErrorLocation) { }

  /** Attempts to parse a query error from a string or object.
   * 
   * @param error The error to parse.
   * @returns An array of query errors if the error could be parsed, or null otherwise.
   */
  static tryParse(error: unknown): QueryError[] {
    const errors = QueryError.tryParseObject(error);
    if (errors !== null) {
      return errors;
    }

    const errorMessage = getErrorMessage(error as string | Error);

    // Map some well known messages to richer errors
    const knownError = knownErrors[errorMessage];
    if (knownError) {
      return [knownError];
    } else {
      return [new QueryError(errorMessage, QueryErrorSeverity.Error)];
    }
  }

  static read(error: unknown): QueryError | null {
    if (typeof error !== "object" || error === null) {
      return null;
    }

    const message = "message" in error && typeof error.message === "string" ? error.message : undefined;
    if (!message) {
      return null; // Invalid error (no message).
    }

    const severity = "severity" in error && typeof error.severity === "string" ? error.severity as QueryErrorSeverity : undefined;
    const location = "location" in error && typeof error.location === "object" ? error.location as QueryErrorLocation : undefined;
    const code = "code" in error && typeof error.code === "string" ? error.code : undefined;
    return new QueryError(message, severity, code, location);
  }

  private static tryParseObject(error: unknown): QueryError[] | null {
    if (typeof error === "object" && "message" in error) {
      error = error.message;
    }

    if (typeof error !== "string") {
      return null;
    }

    // Assign to a new variable because of a TypeScript flow typing quirk, see below.
    let message = error;
    if (message.startsWith("Message: ")) {
      // Reassigning this to 'error' restores the original type of 'error', which is 'unknown'.
      // So we use a separate variable to avoid this.
      message = message.substring("Message: ".length);
    }

    const lines = message.split("\n");
    message = lines[0].trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(message);
    } catch (e) {
      // Not a query error.
      return null;
    }

    if (typeof parsed === "object" && "errors" in parsed &&
      Array.isArray(parsed.errors)) {
      return parsed.errors.map(QueryError.read).filter(e => e !== null);
    }
    return null;
  }
}

const knownErrors: Record<string, QueryError> = {
  "User aborted query.": new QueryError("User aborted query.", QueryErrorSeverity.Warning),
}