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
    const message = `Message: ${JSON.stringify(innerError)}\r\nActivity ID: 42`;
    const outerError = {
      code: "BadRequest",
      message,
    };

    const result = QueryError.tryParse(outerError, testErrorLocationResolver);
    expect(result).toEqual([
      new QueryError("Your query is bad, and you should feel bad", QueryErrorSeverity.Error, "BadRequest"),
    ]);
  });

  // Imitate the value coming from the backend, which has the syntax errors serialized as JSON in the message, along with a prefix and activity id.
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
    const message = `Message: ${JSON.stringify(innerError)}\r\nActivity ID: 42`;
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

  // Imitate another value we've gotten from the backend, which has a doubly-nested JSON payload.
  it("handles double-nested error", () => {
    const outerError = {
      code: "BadRequest",
      message:
        '{"code":"BadRequest","message":"{\\"errors\\":[{\\"severity\\":\\"Error\\",\\"location\\":{\\"start\\":7,\\"end\\":18},\\"code\\":\\"SC2005\\",\\"message\\":\\"\'nonexistent\' is not a recognized built-in function name.\\"}]}\\r\\nActivityId: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa, Windows/10.0.20348 cosmos-netstandard-sdk/3.18.0"}',
    };

    const result = QueryError.tryParse(outerError, testErrorLocationResolver);
    expect(result).toEqual([
      new QueryError(
        "'nonexistent' is not a recognized built-in function name.",
        QueryErrorSeverity.Error,
        "SC2005",
        new QueryErrorLocation({ offset: 7, lineNumber: 7, column: 7 }, { offset: 18, lineNumber: 18, column: 18 }),
      ),
    ]);
  });
});
