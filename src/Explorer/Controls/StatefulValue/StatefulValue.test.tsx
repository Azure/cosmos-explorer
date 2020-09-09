import { StatefulValue } from "./StatefulValue";

describe("StatefulValue isDirty", () => {
  const testStatefulValue = (baseline: unknown, current: unknown) => {
    const value = new StatefulValue(baseline);
    expect(value.isDirty()).toEqual(false);
    value.current = current;
    expect(value.isDirty()).toEqual(true);
  };

  it("string", () => {
    testStatefulValue("baseline", "current");
  });

  it("number", () => {
    testStatefulValue(0, 1);
  });

  it("boolean", () => {
    testStatefulValue(true, false);
  });

  it("undefined object", () => {
    testStatefulValue(undefined, { key: "value" });
  });

  it("object", () => {
    testStatefulValue({ key: "baseline" }, { key: "current" });
  });
});
