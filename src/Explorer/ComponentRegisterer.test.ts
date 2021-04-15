jest.mock("monaco-editor");

import * as ko from "knockout";
import "./ComponentRegisterer";

describe("Component Registerer", () => {
  it("should register input-typeahead component", () => {
    expect(ko.components.isRegistered("input-typeahead")).toBe(true);
  });

  it("should register new-vertex-form component", () => {
    expect(ko.components.isRegistered("new-vertex-form")).toBe(true);
  });

  it("should register error-display component", () => {
    expect(ko.components.isRegistered("error-display")).toBe(true);
  });

  it("should register graph-style component", () => {
    expect(ko.components.isRegistered("graph-style")).toBe(true);
  });

  it("should register json-editor component", () => {
    expect(ko.components.isRegistered("json-editor")).toBe(true);
  });

  it("should register documents-tab component", () => {
    expect(ko.components.isRegistered("documents-tab")).toBe(true);
  });

  it("should register stored-procedure-tab component", () => {
    expect(ko.components.isRegistered("stored-procedure-tab")).toBe(true);
  });

  it("should register trigger-tab component", () => {
    expect(ko.components.isRegistered("trigger-tab")).toBe(true);
  });

  it("should register user-defined-function-tab component", () => {
    expect(ko.components.isRegistered("user-defined-function-tab")).toBe(true);
  });

  it("should register settings-tab-v2 component", () => {
    expect(ko.components.isRegistered("database-settings-tab-v2")).toBe(true);
    expect(ko.components.isRegistered("collection-settings-tab-v2")).toBe(true);
  });

  it("should register query-tab component", () => {
    expect(ko.components.isRegistered("query-tab")).toBe(true);
  });

  it("should register tables-query-tab component", () => {
    expect(ko.components.isRegistered("tables-query-tab")).toBe(true);
  });

  it("should register graph-tab component", () => {
    expect(ko.components.isRegistered("graph-tab")).toBe(true);
  });

  it("should register notebookv2-tab component", () => {
    expect(ko.components.isRegistered("notebookv2-tab")).toBe(true);
  });

  it("should register terminal-tab component", () => {
    expect(ko.components.isRegistered("terminal-tab")).toBe(true);
  });

  it("should register mongo-shell-tab component", () => {
    expect(ko.components.isRegistered("mongo-shell-tab")).toBe(true);
  });

  it("should registeradd-collection-pane component", () => {
    expect(ko.components.isRegistered("add-collection-pane")).toBe(true);
  });

  it("should register graph-new-vertex-pane component", () => {
    expect(ko.components.isRegistered("graph-new-vertex-pane")).toBe(true);
  });

  it("should register graph-styling-pane component", () => {
    expect(ko.components.isRegistered("graph-styling-pane")).toBe(true);
  });


  it("should register setup-notebooks-pane component", () => {
    expect(ko.components.isRegistered("setup-notebooks-pane")).toBe(true);
  });

  it("should register dynamic-list component", () => {
    expect(ko.components.isRegistered("dynamic-list")).toBe(true);
  });
});
