import QueryError, { QueryErrorLocation, QueryErrorSeverity } from "Common/QueryError";

describe("QueryError.tryParse", () => {
  const testErrorLocationResolver = ({ start, end }: { start: number; end: number }) =>
    new QueryErrorLocation(
      { offset: start, lineNumber: start, column: start },
      { offset: end, lineNumber: end, column: end },
    );

  it("handles a string error", () => {
    const error = "error";
    const result = QueryError.tryParse(error, testErrorLocationResolver);
    expect(result).toEqual([new QueryError("error", QueryErrorSeverity.Error)]);
  });

  it("handles an error object", () => {
    const error = {
      message: "error",
      severity: "Warning",
      location: { start: 0, end: 1 },
      code: "code",
    };
    const result = QueryError.tryParse(error, testErrorLocationResolver);
    expect(result).toEqual([
      new QueryError(
        "error",
        QueryErrorSeverity.Warning,
        "code",
        new QueryErrorLocation({ offset: 0, lineNumber: 0, column: 0 }, { offset: 1, lineNumber: 1, column: 1 }),
      ),
    ]);
  });

  it("handles a JSON message without syntax errors", () => {
    const innerError = {
      code: "BadRequest",
      message: "Your query is bad, and you should feel bad",
    };
    const message = JSON.stringify(innerError);
    const outerError = {
      code: "BadRequest",
      message,
    };

    const result = QueryError.tryParse(outerError, testErrorLocationResolver);
    expect(result).toEqual([new QueryError("Your query is bad, and you should feel bad", QueryErrorSeverity.Error)]);
  });

  // Imitate the value coming from the backend, which has the syntax errors serialized as JSON in the message.
  it("handles single-nested error", () => {
    const errors = [
      {
        message: "error1",
        severity: "Warning",
        location: { start: 0, end: 1 },
        code: "code1",
      },
      {
        message: "error2",
        severity: "Error",
        location: { start: 2, end: 3 },
        code: "code2",
      },
    ];
    const innerError = {
      code: "BadRequest",
      message: "Your query is bad, and you should feel bad",
      errors,
    };
    const message = JSON.stringify(innerError);
    const outerError = {
      code: "BadRequest",
      message,
    };

    const result = QueryError.tryParse(outerError, testErrorLocationResolver);
    expect(result).toEqual([
      new QueryError(
        "error1",
        QueryErrorSeverity.Warning,
        "code1",
        new QueryErrorLocation({ offset: 0, lineNumber: 0, column: 0 }, { offset: 1, lineNumber: 1, column: 1 }),
      ),
      new QueryError(
        "error2",
        QueryErrorSeverity.Error,
        "code2",
        new QueryErrorLocation({ offset: 2, lineNumber: 2, column: 2 }, { offset: 3, lineNumber: 3, column: 3 }),
      ),
    ]);
  });
});
