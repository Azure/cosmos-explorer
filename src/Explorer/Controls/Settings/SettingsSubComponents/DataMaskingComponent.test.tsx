import { MessageBar, MessageBarType } from "@fluentui/react";
import { mount } from "enzyme";
import React from "react";
import * as DataModels from "../../../../Contracts/DataModels";
import { EditorReact } from "../../../Controls/Editor/EditorReact";
import { DataMaskingComponent } from "./DataMaskingComponent";

// Mock EditorReact
jest.mock("../../../Controls/Editor/EditorReact", () => ({
  EditorReact: jest.fn().mockImplementation(() => ({
    editor: {
      setValue: jest.fn(),
      onDidChangeModelContent: jest.fn(),
      onDidFocusEditorWidget: jest.fn(),
      updateOptions: jest.fn(),
      focus: jest.fn(),
      getValue: jest.fn(),
      layout: jest.fn(),
    },
    render: (): JSX.Element => <div data-testid="mock-editor" />,
  })),
}));

jest.mock("../../../../Utils/CapabilityUtils", () => ({
  isCapabilityEnabled: jest.fn().mockReturnValue(true),
}));

describe("DataMaskingComponent", () => {
  const mockProps = {
    shouldDiscardDataMasking: false,
    resetShouldDiscardDataMasking: jest.fn(),
    dataMaskingContent: undefined as DataModels.DataMaskingPolicy,
    dataMaskingContentBaseline: undefined as DataModels.DataMaskingPolicy,
    onDataMaskingContentChange: jest.fn(),
    onDataMaskingDirtyChange: jest.fn(),
  };

  const samplePolicy: DataModels.DataMaskingPolicy = {
    includedPaths: [
      {
        path: "/test",
        strategy: "Default",
        startPosition: 0,
        length: -1,
      },
    ],
    excludedPaths: [],
    policyFormatVersion: 2,
    isPolicyEnabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const wrapper = mount(<DataMaskingComponent {...mockProps} />);
    expect(wrapper.exists()).toBeTruthy();
  });

  it("displays warning message when content is dirty", () => {
    const wrapper = mount(
      <DataMaskingComponent
        {...mockProps}
        dataMaskingContent={samplePolicy}
        dataMaskingContentBaseline={{ ...samplePolicy, isPolicyEnabled: true }}
      />,
    );

    // Initial content change should trigger dirty state
    const editorInstance = wrapper.find(EditorReact);
    expect(editorInstance.exists()).toBeTruthy();

    // Simulate content change
    editorInstance.prop("onContentChanged")(JSON.stringify(samplePolicy));
    wrapper.update();

    // Warning message should be visible
    const messageBar = wrapper.find(MessageBar);
    expect(messageBar.exists()).toBeTruthy();
    expect(messageBar.prop("messageBarType")).toBe(MessageBarType.warning);
  });

  it("updates content and dirty state on valid JSON input", () => {
    const wrapper = mount(<DataMaskingComponent {...mockProps} />);

    // Simulate valid JSON input
    const validJson = JSON.stringify(samplePolicy);
    wrapper.find(EditorReact).prop("onContentChanged")(validJson);

    expect(mockProps.onDataMaskingContentChange).toHaveBeenCalledWith(samplePolicy);
    expect(mockProps.onDataMaskingDirtyChange).toHaveBeenCalledWith(true);
  });

  it("doesn't update content on invalid JSON input", () => {
    const wrapper = mount(<DataMaskingComponent {...mockProps} />);

    // Simulate invalid JSON input
    const invalidJson = "{invalid:json}";
    wrapper.find(EditorReact).prop("onContentChanged")(invalidJson);

    expect(mockProps.onDataMaskingContentChange).not.toHaveBeenCalled();
    expect(mockProps.onDataMaskingDirtyChange).not.toHaveBeenCalled();
  });

  it("resets content when shouldDiscardDataMasking is true", () => {
    const baselinePolicy = { ...samplePolicy, isPolicyEnabled: true };
    mount(
      <DataMaskingComponent
        {...mockProps}
        dataMaskingContent={samplePolicy}
        dataMaskingContentBaseline={baselinePolicy}
        shouldDiscardDataMasking={true}
      />,
    );

    // Check that baseline content is set
    expect(mockProps.onDataMaskingContentChange).toHaveBeenCalledWith(baselinePolicy);
    expect(mockProps.onDataMaskingDirtyChange).toHaveBeenCalledWith(false);
    expect(mockProps.resetShouldDiscardDataMasking).toHaveBeenCalled();
  });

  it("recalculates dirty state when baseline changes", () => {
    const wrapper = mount(
      <DataMaskingComponent
        {...mockProps}
        dataMaskingContent={samplePolicy}
        dataMaskingContentBaseline={samplePolicy}
      />,
    );

    // Update baseline to trigger componentDidUpdate
    const newBaseline = { ...samplePolicy, isPolicyEnabled: true };
    wrapper.setProps({ dataMaskingContentBaseline: newBaseline });

    expect(mockProps.onDataMaskingDirtyChange).toHaveBeenCalledWith(true);
  });

  it("validates required fields in policy", () => {
    const wrapper = mount(<DataMaskingComponent {...mockProps} />);

    // Test with missing required fields
    const invalidPolicy: Record<string, unknown> = {
      includedPaths: "not an array",
      excludedPaths: [] as string[],
      policyFormatVersion: "not a number",
      isPolicyEnabled: "not a boolean",
    };

    wrapper.find(EditorReact).prop("onContentChanged")(JSON.stringify(invalidPolicy));

    expect(mockProps.onDataMaskingContentChange).not.toHaveBeenCalled();
    expect(mockProps.onDataMaskingDirtyChange).not.toHaveBeenCalled();
  });

  it("maintains dirty state after multiple content changes", () => {
    const wrapper = mount(
      <DataMaskingComponent
        {...mockProps}
        dataMaskingContent={samplePolicy}
        dataMaskingContentBaseline={samplePolicy}
      />,
    );

    // First change
    const modifiedPolicy1 = { ...samplePolicy, isPolicyEnabled: true };
    wrapper.find(EditorReact).prop("onContentChanged")(JSON.stringify(modifiedPolicy1));
    expect(mockProps.onDataMaskingDirtyChange).toHaveBeenCalledWith(true);

    // Second change back to baseline
    wrapper.find(EditorReact).prop("onContentChanged")(JSON.stringify(samplePolicy));
    expect(mockProps.onDataMaskingDirtyChange).toHaveBeenCalledWith(false);
  });
});
