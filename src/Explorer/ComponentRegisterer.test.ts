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

  it("should register collapsible-panel component", () => {
    expect(ko.components.isRegistered("collapsible-panel")).toBe(true);
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

  it("should register settings-tab component", () => {
    expect(ko.components.isRegistered("settings-tab")).toBe(true);
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

  it("should register spark-master-tab component", () => {
    expect(ko.components.isRegistered("spark-master-tab")).toBe(true);
  });

  it("should register mongo-shell-tab component", () => {
    expect(ko.components.isRegistered("mongo-shell-tab")).toBe(true);
  });

  it("should registeradd-collection-pane component", () => {
    expect(ko.components.isRegistered("add-collection-pane")).toBe(true);
  });

  it("should register delete-collection-confirmation-pane component", () => {
    expect(ko.components.isRegistered("delete-collection-confirmation-pane")).toBe(true);
  });

  it("should register delete-database-confirmation-pane component", () => {
    expect(ko.components.isRegistered("delete-database-confirmation-pane")).toBe(true);
  });

  it("should register save-query-pane component", () => {
    expect(ko.components.isRegistered("save-query-pane")).toBe(true);
  });

  it("should register browse-queries-pane component", () => {
    expect(ko.components.isRegistered("browse-queries-pane")).toBe(true);
  });

  it("should register graph-new-vertex-pane component", () => {
    expect(ko.components.isRegistered("graph-new-vertex-pane")).toBe(true);
  });

  it("should register graph-styling-pane component", () => {
    expect(ko.components.isRegistered("graph-styling-pane")).toBe(true);
  });

  it("should register upload-file-pane component", () => {
    expect(ko.components.isRegistered("upload-file-pane")).toBe(true);
  });

  it("should register string-input-pane component", () => {
    expect(ko.components.isRegistered("string-input-pane")).toBe(true);
  });

  it("should register setup-notebooks-pane component", () => {
    expect(ko.components.isRegistered("setup-notebooks-pane")).toBe(true);
  });

  it("should register setup-spark-cluster-pane component", () => {
    expect(ko.components.isRegistered("setup-spark-cluster-pane")).toBe(true);
  });

  it("should register manage-spark-cluster-pane component", () => {
    expect(ko.components.isRegistered("manage-spark-cluster-pane")).toBe(true);
  });

  it("should register dynamic-list component", () => {
    expect(ko.components.isRegistered("dynamic-list")).toBe(true);
  });

  it("should register throughput-input component", () => {
    expect(ko.components.isRegistered("throughput-input")).toBe(true);
  });

  it("should register library-manage-pane component", () => {
    expect(ko.components.isRegistered("library-manage-pane")).toBe(true);
  });

  it("should register cluster-library-pane component", () => {
    expect(ko.components.isRegistered("cluster-library-pane")).toBe(true);
  });
});
