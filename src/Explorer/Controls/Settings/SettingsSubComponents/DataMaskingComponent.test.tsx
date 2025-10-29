import { MessageBar, MessageBarType } from "@fluentui/react";
import { mount } from "enzyme";
import React from "react";
import * as DataModels from "../../../../Contracts/DataModels";
import { DataMaskingComponent } from "./DataMaskingComponent";

const mockGetValue = jest.fn();
const mockSetValue = jest.fn();
const mockOnDidChangeContent = jest.fn();
const mockGetModel = jest.fn(() => ({
  getValue: mockGetValue,
  setValue: mockSetValue,
  onDidChangeContent: mockOnDidChangeContent,
}));

const mockEditor = {
  getModel: mockGetModel,
  dispose: jest.fn(),
};

jest.mock("../../../LazyMonaco", () => ({
  loadMonaco: jest.fn(() =>
    Promise.resolve({
      editor: {
        create: jest.fn(() => mockEditor),
      },
    }),
  ),
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
    validationErrors: [] as string[],
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
    isPolicyEnabled: false,
  };

  let changeContentCallback: () => void;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetValue.mockReturnValue(JSON.stringify(samplePolicy));
    mockOnDidChangeContent.mockImplementation((callback) => {
      changeContentCallback = callback;
    });
  });

  it("renders without crashing", async () => {
    const wrapper = mount(<DataMaskingComponent {...mockProps} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    wrapper.update();
    expect(wrapper.exists()).toBeTruthy();
  });

  it("displays warning message when content is dirty", async () => {
    const wrapper = mount(
      <DataMaskingComponent
        {...mockProps}
        dataMaskingContent={samplePolicy}
        dataMaskingContentBaseline={{ ...samplePolicy, isPolicyEnabled: true }}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    wrapper.update();

    // Verify editor div is rendered
    const editorDiv = wrapper.find(".settingsV2Editor");
    expect(editorDiv.exists()).toBeTruthy();

    // Warning message should be visible when content is dirty
    const messageBar = wrapper.find(MessageBar);
    expect(messageBar.exists()).toBeTruthy();
    expect(messageBar.prop("messageBarType")).toBe(MessageBarType.warning);
  });

  it("updates content and dirty state on valid JSON input", async () => {
    const wrapper = mount(<DataMaskingComponent {...mockProps} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    wrapper.update();

    // Simulate valid JSON input by setting mock return value and triggering callback
    const validJson = JSON.stringify(samplePolicy);
    mockGetValue.mockReturnValue(validJson);
    changeContentCallback();

    expect(mockProps.onDataMaskingContentChange).toHaveBeenCalledWith(samplePolicy);
    expect(mockProps.onDataMaskingDirtyChange).toHaveBeenCalledWith(true);
  });

  it("doesn't update content on invalid JSON input", async () => {
    const wrapper = mount(<DataMaskingComponent {...mockProps} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    wrapper.update();

    // Simulate invalid JSON input
    const invalidJson = "{invalid:json}";
    mockGetValue.mockReturnValue(invalidJson);
    changeContentCallback();

    expect(mockProps.onDataMaskingContentChange).not.toHaveBeenCalled();
  });

  it("resets content when shouldDiscardDataMasking is true", async () => {
    const baselinePolicy = { ...samplePolicy, isPolicyEnabled: true };

    const wrapper = mount(
      <DataMaskingComponent
        {...mockProps}
        dataMaskingContent={samplePolicy}
        dataMaskingContentBaseline={baselinePolicy}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    wrapper.update();

    // Now update props to trigger shouldDiscardDataMasking
    wrapper.setProps({ shouldDiscardDataMasking: true });
    await new Promise((resolve) => setTimeout(resolve, 0));
    wrapper.update();

    // Check that reset was triggered
    expect(mockProps.resetShouldDiscardDataMasking).toHaveBeenCalled();
    expect(mockSetValue).toHaveBeenCalledWith(JSON.stringify(samplePolicy, undefined, 4));
  });

  it("recalculates dirty state when baseline changes", async () => {
    const wrapper = mount(
      <DataMaskingComponent
        {...mockProps}
        dataMaskingContent={samplePolicy}
        dataMaskingContentBaseline={samplePolicy}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    wrapper.update();

    // Update baseline to trigger componentDidUpdate
    const newBaseline = { ...samplePolicy, isPolicyEnabled: true };
    wrapper.setProps({ dataMaskingContentBaseline: newBaseline });

    expect(mockProps.onDataMaskingDirtyChange).toHaveBeenCalledWith(true);
  });

  it("validates required fields in policy", async () => {
    const wrapper = mount(<DataMaskingComponent {...mockProps} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    wrapper.update();

    // Test with missing required fields
    const invalidPolicy: Record<string, unknown> = {
      includedPaths: "not an array",
      excludedPaths: [] as string[],
      policyFormatVersion: "not a number",
      isPolicyEnabled: "not a boolean",
    };

    mockGetValue.mockReturnValue(JSON.stringify(invalidPolicy));
    changeContentCallback();

    // Parent callback should be called even with invalid data (parent will validate)
    expect(mockProps.onDataMaskingContentChange).toHaveBeenCalledWith(invalidPolicy);
  });

  it("maintains dirty state after multiple content changes", async () => {
    const wrapper = mount(
      <DataMaskingComponent
        {...mockProps}
        dataMaskingContent={samplePolicy}
        dataMaskingContentBaseline={samplePolicy}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    wrapper.update();

    // First change
    const modifiedPolicy1 = { ...samplePolicy, isPolicyEnabled: true };
    mockGetValue.mockReturnValue(JSON.stringify(modifiedPolicy1));
    changeContentCallback();
    expect(mockProps.onDataMaskingDirtyChange).toHaveBeenCalledWith(true);

    // Second change back to baseline
    mockGetValue.mockReturnValue(JSON.stringify(samplePolicy));
    changeContentCallback();
    expect(mockProps.onDataMaskingDirtyChange).toHaveBeenCalledWith(false);
  });
});
