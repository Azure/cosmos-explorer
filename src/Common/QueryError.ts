import { getErrorMessage } from "Common/ErrorHandlingUtils";
import { monaco } from "Explorer/LazyMonaco";

export enum QueryErrorSeverity {
  Error = "Error",
  Warning = "Warning",
}

export class QueryErrorLocation {
  constructor(
    public start: ErrorPosition,
    public end: ErrorPosition,
  ) {}
}

export class ErrorPosition {
  constructor(
    public offset: number,
    public lineNumber?: number,
    public column?: number,
  ) {}
}

// Maps severities to numbers for sorting.
const severityMap: Record<QueryErrorSeverity, number> = {
  Error: 1,
  Warning: 0,
};

export function compareSeverity(left: QueryErrorSeverity, right: QueryErrorSeverity): number {
  return severityMap[left] - severityMap[right];
}

export function createMonacoErrorLocationResolver(
  editor: monaco.editor.IStandaloneCodeEditor,
): (location: { start: number; end: number }) => QueryErrorLocation {
  return ({ start, end }) => {
    const model = editor.getModel();
    if (!model) {
      return new QueryErrorLocation(new ErrorPosition(start), new ErrorPosition(end));
    }

    const startPos = model.getPositionAt(start);
    const endPos = model.getPositionAt(end);
    return new QueryErrorLocation(
      new ErrorPosition(start, startPos.lineNumber, startPos.column),
      new ErrorPosition(end, endPos.lineNumber, endPos.column),
    );
  };
}

export const createMonacoMarkersForQueryErrors = (errors: QueryError[]) => {
  if (!errors) {
    return [];
  }

  return errors
    .map((error): monaco.editor.IMarkerData => {
      // Validate that we have what we need to make a marker
      if (
        error.location === undefined ||
        error.location.start === undefined ||
        error.location.end === undefined ||
        error.location.start.lineNumber === undefined ||
        error.location.end.lineNumber === undefined ||
        error.location.start.column === undefined ||
        error.location.end.column === undefined
      ) {
        return null;
      }

      return {
        message: error.message,
        severity: error.getMonacoSeverity(),
        startLineNumber: error.location.start.lineNumber,
        startColumn: error.location.start.column,
        endLineNumber: error.location.end.lineNumber,
        endColumn: error.location.end.column,
      };
    })
    .filter((marker) => !!marker);
};

export default class QueryError {
  constructor(
    public message: string,
    public severity: QueryErrorSeverity,
    public code?: string,
    public location?: QueryErrorLocation,
  ) {}

  getMonacoSeverity(): monaco.MarkerSeverity {
    // It's very difficult to use the monaco.MarkerSeverity enum from here, so we'll just use the numbers directly.
    // See: https://microsoft.github.io/monaco-editor/typedoc/enums/MarkerSeverity.html
    switch (this.severity) {
      case QueryErrorSeverity.Error:
        return 8;
      case QueryErrorSeverity.Warning:
        return 4;
      default:
        return 2; // Info
    }
  }

  /** Attempts to parse a query error from a string or object.
   *
   * @param error The error to parse.
   * @returns An array of query errors if the error could be parsed, or null otherwise.
   */
  static tryParse(
    error: unknown,
    locationResolver?: (location: { start: number; end: number }) => QueryErrorLocation,
  ): QueryError[] {
    locationResolver =
      locationResolver ||
      (({ start, end }) => new QueryErrorLocation(new ErrorPosition(start), new ErrorPosition(end)));
    const errors = QueryError.tryParseObject(error, locationResolver);
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

  static read(
    error: unknown,
    locationResolver: (location: { start: number; end: number }) => QueryErrorLocation,
  ): QueryError | null {
    if (typeof error !== "object" || error === null) {
      return null;
    }

    const message = "message" in error && typeof error.message === "string" ? error.message : undefined;
    if (!message) {
      return null; // Invalid error (no message).
    }

    const severity =
      "severity" in error && typeof error.severity === "string" ? (error.severity as QueryErrorSeverity) : undefined;
    const location =
      "location" in error && typeof error.location === "object"
        ? locationResolver(error.location as { start: number; end: number })
        : undefined;
    const code = "code" in error && typeof error.code === "string" ? error.code : undefined;
    return new QueryError(message, severity, code, location);
  }

  private static tryParseObject(
    error: unknown,
    locationResolver: (location: { start: number; end: number }) => QueryErrorLocation,
  ): QueryError[] | null {
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

    if (typeof parsed === "object" && "errors" in parsed && Array.isArray(parsed.errors)) {
      return parsed.errors.map((e) => QueryError.read(e, locationResolver)).filter((e) => e !== null);
    }
    return null;
  }
}

const knownErrors: Record<string, QueryError> = {
  "User aborted query.": new QueryError("User aborted query.", QueryErrorSeverity.Warning),
};
