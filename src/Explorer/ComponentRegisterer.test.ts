jest.mock("monaco-editor");

import * as ko from "knockout";
import "./ComponentRegisterer";

describe("Component Registerer", () => {
  it("should register input-typeahead component", () => {
    expect(ko.components.isRegistered("input-typeahead")).toBe(true);
  });

  it("should register error-display component", () => {
    expect(ko.components.isRegistered("error-display")).toBe(true);
  });

  it("should register json-editor component", () => {
    expect(ko.components.isRegistered("json-editor")).toBe(true);
  });

  it("should registeradd-collection-pane component", () => {
    expect(ko.components.isRegistered("add-collection-pane")).toBe(true);
  });

  it("should register dynamic-list component", () => {
    expect(ko.components.isRegistered("dynamic-list")).toBe(true);
  });
});
