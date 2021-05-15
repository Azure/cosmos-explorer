jest.mock("monaco-editor");

import * as ko from "knockout";
import "./ComponentRegisterer";

describe("Component Registerer", () => {
  it("should register json-editor component", () => {
    expect(ko.components.isRegistered("json-editor")).toBe(true);
  });

  it("should register dynamic-list component", () => {
    expect(ko.components.isRegistered("dynamic-list")).toBe(true);
  });
});
