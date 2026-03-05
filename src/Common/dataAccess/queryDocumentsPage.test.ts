import { redactSyntaxErrorMessage } from "./queryDocumentsPage";

/* Typical error to redact looks like this (the message property contains a JSON string with nested structure):
{
  "message": "{\"code\":\"BadRequest\",\"message\":\"{\\\"errors\\\":[{\\\"severity\\\":\\\"Error\\\",\\\"location\\\":{\\\"start\\\":0,\\\"end\\\":5},\\\"code\\\":\\\"SC1001\\\",\\\"message\\\":\\\"Syntax error, incorrect syntax near 'Crazy'.\\\"}]}\\r\\nActivityId: d5424e10-51bd-46f7-9aec-7b40bed36f17, Windows/10.0.20348 cosmos-netstandard-sdk/3.18.0\"}"
}
*/

// Helper to create the nested error structure that matches what the SDK returns
const createNestedError = (
  errors: Array<{ severity?: string; location?: { start: number; end: number }; code: string; message: string }>,
  activityId: string = "test-activity-id",
): { message: string } => {
  const innerErrorsJson = JSON.stringify({ errors });
  const innerMessage = `${innerErrorsJson}\r\n${activityId}`;
  const outerJson = JSON.stringify({ code: "BadRequest", message: innerMessage });
  return { message: outerJson };
};

// Helper to parse the redacted result
const parseRedactedResult = (result: { message: string }) => {
  const outerParsed = JSON.parse(result.message);
  const [innerErrorsJson, activityIdPart] = outerParsed.message.split("\r\n");
  const innerErrors = JSON.parse(innerErrorsJson);
  return { outerParsed, innerErrors, activityIdPart };
};

describe("redactSyntaxErrorMessage", () => {
  it("should redact SC1001 error message", () => {
    const error = createNestedError(
      [
        {
          severity: "Error",
          location: { start: 0, end: 5 },
          code: "SC1001",
          message: "Syntax error, incorrect syntax near 'Crazy'.",
        },
      ],
      "ActivityId: d5424e10-51bd-46f7-9aec-7b40bed36f17",
    );

    const result = redactSyntaxErrorMessage(error) as { message: string };
    const { outerParsed, innerErrors, activityIdPart } = parseRedactedResult(result);

    expect(outerParsed.code).toBe("BadRequest");
    expect(innerErrors.errors[0].message).toBe("__REDACTED__");
    expect(activityIdPart).toContain("ActivityId: d5424e10-51bd-46f7-9aec-7b40bed36f17");
  });

  it("should redact SC2001 error message", () => {
    const error = createNestedError(
      [
        {
          severity: "Error",
          location: { start: 0, end: 10 },
          code: "SC2001",
          message: "Some sensitive syntax error message.",
        },
      ],
      "ActivityId: abc123",
    );

    const result = redactSyntaxErrorMessage(error) as { message: string };
    const { outerParsed, innerErrors, activityIdPart } = parseRedactedResult(result);

    expect(outerParsed.code).toBe("BadRequest");
    expect(innerErrors.errors[0].message).toBe("__REDACTED__");
    expect(activityIdPart).toContain("ActivityId: abc123");
  });

  it("should redact multiple errors with SC1001 and SC2001 codes", () => {
    const error = createNestedError(
      [
        { severity: "Error", code: "SC1001", message: "First error" },
        { severity: "Error", code: "SC2001", message: "Second error" },
      ],
      "ActivityId: xyz",
    );

    const result = redactSyntaxErrorMessage(error) as { message: string };
    const { innerErrors } = parseRedactedResult(result);

    expect(innerErrors.errors[0].message).toBe("__REDACTED__");
    expect(innerErrors.errors[1].message).toBe("__REDACTED__");
  });

  it("should not redact errors with other codes", () => {
    const error = createNestedError(
      [{ severity: "Error", code: "SC9999", message: "This should not be redacted." }],
      "ActivityId: test123",
    );

    const result = redactSyntaxErrorMessage(error);

    expect(result).toBe(error); // Should return original error unchanged
  });

  it("should not modify non-BadRequest errors", () => {
    const innerMessage = JSON.stringify({ errors: [{ code: "SC1001", message: "Should not be redacted" }] });
    const error = {
      message: JSON.stringify({ code: "NotFound", message: innerMessage }),
    };

    const result = redactSyntaxErrorMessage(error);

    expect(result).toBe(error);
  });

  it("should handle errors without message property", () => {
    const error = { code: "BadRequest" };

    const result = redactSyntaxErrorMessage(error);

    expect(result).toBe(error);
  });

  it("should handle non-object errors", () => {
    const stringError = "Simple string error";
    const nullError: null = null;
    const undefinedError: undefined = undefined;

    expect(redactSyntaxErrorMessage(stringError)).toBe(stringError);
    expect(redactSyntaxErrorMessage(nullError)).toBe(nullError);
    expect(redactSyntaxErrorMessage(undefinedError)).toBe(undefinedError);
  });

  it("should handle malformed JSON in message", () => {
    const error = {
      message: "not valid json",
    };

    const result = redactSyntaxErrorMessage(error);

    expect(result).toBe(error);
  });

  it("should handle message without ActivityId suffix", () => {
    const innerErrorsJson = JSON.stringify({
      errors: [{ severity: "Error", code: "SC1001", message: "Syntax error near something." }],
    });
    const error = {
      message: JSON.stringify({ code: "BadRequest", message: innerErrorsJson + "\r\n" }),
    };

    const result = redactSyntaxErrorMessage(error) as { message: string };
    const { innerErrors } = parseRedactedResult(result);

    expect(innerErrors.errors[0].message).toBe("__REDACTED__");
  });

  it("should preserve other error properties", () => {
    const baseError = createNestedError([{ code: "SC1001", message: "Error" }], "ActivityId: test");
    const error = {
      ...baseError,
      statusCode: 400,
      additionalInfo: "extra data",
    };

    const result = redactSyntaxErrorMessage(error) as {
      message: string;
      statusCode: number;
      additionalInfo: string;
    };

    expect(result.statusCode).toBe(400);
    expect(result.additionalInfo).toBe("extra data");

    const { innerErrors } = parseRedactedResult(result);
    expect(innerErrors.errors[0].message).toBe("__REDACTED__");
  });
});
