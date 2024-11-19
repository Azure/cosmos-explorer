import { monaco } from "Explorer/LazyMonaco";
import { getRUThreshold, ruThresholdEnabled } from "Shared/StorageUtility";

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
  selection?: monaco.Selection,
): (location: { start: number; end: number }) => QueryErrorLocation {
  return ({ start, end }) => {
    // Start and end are absolute offsets (character index) in the document.
    // But we need line numbers and columns for the monaco editor.
    // To get those, we use the editor's model to convert the offsets to positions.
    const model = editor.getModel();
    if (!model) {
      return new QueryErrorLocation(new ErrorPosition(start), new ErrorPosition(end));
    }

    // If the error was found in a selection, adjust the start and end positions to be relative to the document.
    if (selection) {
      // Get the character index of the start of the selection.
      const selectionStartOffset = model.getOffsetAt(selection.getStartPosition());

      // Adjust the start and end positions to be relative to the document.
      start = selectionStartOffset + start;
      end = selectionStartOffset + end;

      // Now, when we resolve the positions, they will be relative to the document and appear in the correct location.
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

export interface ErrorEnrichment {
  title?: string;
  message: string;
  learnMoreUrl?: string;
}

const REPLACEMENT_MESSAGES: Record<string, (original: string) => string> = {
  OPERATION_RU_LIMIT_EXCEEDED: (original) => {
    if (ruThresholdEnabled()) {
      const threshold = getRUThreshold();
      return `Query exceeded the Request Unit (RU) limit of ${threshold} RUs. You can change this limit in Data Explorer settings.`;
    }
    return original;
  },
};

const HELP_LINKS: Record<string, string> = {
  OPERATION_RU_LIMIT_EXCEEDED:
    "https://learn.microsoft.com/en-us/azure/cosmos-db/data-explorer#configure-request-unit-threshold",
};

export default class QueryError {
  message: string;
  helpLink?: string;

  constructor(
    message: string,
    public severity: QueryErrorSeverity,
    public code?: string,
    public location?: QueryErrorLocation,
    helpLink?: string,
  ) {
    // Automatically replace the message with a more Data Explorer-specific message if we have for this error code.
    this.message = REPLACEMENT_MESSAGES[code] ? REPLACEMENT_MESSAGES[code](message) : message;

    // Automatically set the help link if we have one for this error code.
    this.helpLink = helpLink ?? HELP_LINKS[code];
  }

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

    const errorMessage = error as string;

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
      "severity" in error && typeof error.severity === "string"
        ? (error.severity as QueryErrorSeverity)
        : QueryErrorSeverity.Error;
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
    let message: string | undefined;
    if (typeof error === "object" && "message" in error && typeof error.message === "string") {
      message = error.message;
    } else {
      // Unsupported error format.
      return null;
    }

    // Some newer backends produce a message that contains a doubly-nested JSON payload.
    // In this case, the message we get is a fully-complete JSON object we can parse.
    // So let's try that first
    if (message.startsWith("{") && message.endsWith("}")) {
      let outer: unknown = undefined;
      try {
        outer = JSON.parse(message);
        if (typeof outer === "object" && "message" in outer && typeof outer.message === "string") {
          message = outer.message;
        }
      } catch (e) {
        // Just continue if the parsing fails. We'll use the fallback logic below.
      }
    }

    const lines = message.split("\n");
    message = lines[0].trim();

    if (message.startsWith("Message: ")) {
      message = message.substring("Message: ".length);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(message);
    } catch (e) {
      // The message doesn't contain a nested error.
      return [QueryError.read(error, locationResolver)];
    }

    if (typeof parsed === "object") {
      if ("errors" in parsed && Array.isArray(parsed.errors)) {
        return parsed.errors.map((e) => QueryError.read(e, locationResolver)).filter((e) => e !== null);
      }
      return [QueryError.read(parsed, locationResolver)];
    }
    return null;
  }
}

const knownErrors: Record<string, QueryError> = {
  "User aborted query.": new QueryError("User aborted query.", QueryErrorSeverity.Warning),
};
