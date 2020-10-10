import { getQuotedCqlIdentifier } from "./CqlUtilities";

describe("getQuotedCqlIdentifier", () => {
  it("null id", () => {
    const result = getQuotedCqlIdentifier(null);
    expect(result).toBe(null);
  });

  it("undefined id", () => {
    const result = getQuotedCqlIdentifier(undefined);
    expect(result).toBe(undefined);
  });

  it("id with no quotes", () => {
    const result = getQuotedCqlIdentifier("foo");
    expect(result).toBe('"foo"');
  });

  it("id with quotes", () => {
    const result = getQuotedCqlIdentifier('"foo"');
    expect(result).toBe('"""foo"""');
  });
});
