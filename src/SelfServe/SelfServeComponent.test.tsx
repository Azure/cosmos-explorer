import { shallow } from "enzyme";
import React from "react";
import { SelfServeComponent, SelfServeComponentState } from "./SelfServeComponent";
import { NumberUiType, OnSaveResult, SelfServeDescriptor, SmartUiInput } from "./SelfServeTypes";

describe("SelfServeComponent", () => {
  const defaultValues = new Map<string, SmartUiInput>([
    ["throughput", { value: 450 }],
    ["analyticalStore", { value: false }],
    ["database", { value: "db2" }],
  ]);
  const updatedValues = new Map<string, SmartUiInput>([
    ["throughput", { value: 460 }],
    ["analyticalStore", { value: true }],
    ["database", { value: "db2" }],
  ]);

  const initializeMock = jest.fn(async () => new Map(defaultValues));
  const onSaveMock = jest.fn(async () => {
    return {
      operationStatusUrl: undefined,
    } as OnSaveResult;
  });
  const refreshResult = {
    isUpdateInProgress: false,
    updateInProgressMessageTKey: "refresh performed successfully",
  };

  const onRefreshMock = jest.fn(async () => {
    return { ...refreshResult };
  });
  const onRefreshIsUpdatingMock = jest.fn(async () => {
    return { ...refreshResult, isUpdateInProgress: true };
  });

  const exampleData: SelfServeDescriptor = {
    initialize: initializeMock,
    onSave: onSaveMock,
    onRefresh: onRefreshMock,
    inputNames: ["throughput", "analyticalStore", "database"],
    root: {
      id: "root",
      info: {
        messageTKey: "Start at $24/mo per database",
        link: {
          href: "https://aka.ms/azure-cosmos-db-pricing",
          textTKey: "More Details",
        },
      },
      children: [
        {
          id: "throughput",
          input: {
            labelTKey: "Throughput (input)",
            dataFieldName: "throughput",
            type: "number",
            min: 400,
            max: 500,
            step: 10,
            defaultValue: 400,
            uiType: NumberUiType.Spinner,
          },
        },
        {
          id: "containerId",
          input: {
            labelTKey: "Container id",
            dataFieldName: "containerId",
            type: "string",
          },
        },
        {
          id: "analyticalStore",
          input: {
            labelTKey: "Analytical Store",
            trueLabelTKey: "Enabled",
            falseLabelTKey: "Disabled",
            defaultValue: true,
            dataFieldName: "analyticalStore",
            type: "boolean",
          },
        },
        {
          id: "database",
          input: {
            labelTKey: "Database",
            dataFieldName: "database",
            type: "object",
            choices: [
              { labelTKey: "Database 1", key: "db1" },
              { labelTKey: "Database 2", key: "db2" },
              { labelTKey: "Database 3", key: "db3" },
            ],
            defaultKey: "db2",
          },
        },
      ],
    },
  };

  const isEqual = (source: Map<string, SmartUiInput>, target: Map<string, SmartUiInput>): void => {
    expect(target.size).toEqual(source.size);
    for (const key of source.keys()) {
      expect(target.get(key)).toEqual(source.get(key));
    }
  };

  it("should render and honor save, discard, refresh actions", async () => {
    const wrapper = shallow(
      <SelfServeComponent descriptor={exampleData} t={undefined} i18n={undefined} tReady={undefined} />,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper).toMatchSnapshot();

    // initialize() and onRefresh() should be called and defaults should be set when component is mounted
    expect(initializeMock).toHaveBeenCalledTimes(1);
    expect(onRefreshMock).toHaveBeenCalledTimes(1);
    let state = wrapper.state() as SelfServeComponentState;
    isEqual(state.currentValues, defaultValues);

    // when currentValues and baselineValues differ, save and discard should not be disabled
    wrapper.setState({ currentValues: updatedValues });
    wrapper.update();
    state = wrapper.state() as SelfServeComponentState;
    isEqual(state.currentValues, updatedValues);
    const selfServeComponent = wrapper.instance() as SelfServeComponent;
    expect(selfServeComponent.isSaveButtonDisabled()).toBeFalsy();
    expect(selfServeComponent.isDiscardButtonDisabled()).toBeFalsy();

    // when errors exist, save is disabled but discard is enabled
    wrapper.setState({ hasErrors: true });
    wrapper.update();
    state = wrapper.state() as SelfServeComponentState;
    expect(selfServeComponent.isSaveButtonDisabled()).toBeTruthy();
    expect(selfServeComponent.isDiscardButtonDisabled()).toBeFalsy();

    // discard resets currentValues to baselineValues
    selfServeComponent.discard();
    state = wrapper.state() as SelfServeComponentState;
    isEqual(state.currentValues, defaultValues);
    isEqual(state.currentValues, state.baselineValues);

    // resetBaselineValues sets baselineValues to currentValues
    wrapper.setState({ baselineValues: updatedValues });
    wrapper.update();
    state = wrapper.state() as SelfServeComponentState;
    isEqual(state.baselineValues, updatedValues);
    selfServeComponent.updateBaselineValues();
    state = wrapper.state() as SelfServeComponentState;
    isEqual(state.baselineValues, defaultValues);
    isEqual(state.currentValues, state.baselineValues);

    // clicking refresh calls onRefresh.
    selfServeComponent.onRefreshClicked();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onRefreshMock).toHaveBeenCalledTimes(2);

    selfServeComponent.onSaveButtonClick();
    expect(onSaveMock).toHaveBeenCalledTimes(1);
  });

  it("getResolvedValue", async () => {
    const wrapper = shallow(
      <SelfServeComponent descriptor={exampleData} t={undefined} i18n={undefined} tReady={undefined} />,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    const selfServeComponent = wrapper.instance() as SelfServeComponent;

    const numberResult = 1;
    const numberPromise = async (): Promise<number> => {
      return numberResult;
    };
    expect(await selfServeComponent.getResolvedValue(numberResult)).toEqual(numberResult);
    expect(await selfServeComponent.getResolvedValue(numberPromise)).toEqual(numberResult);

    const stringResult = "result";
    const stringPromise = async (): Promise<string> => {
      return stringResult;
    };
    expect(await selfServeComponent.getResolvedValue(stringResult)).toEqual(stringResult);
    expect(await selfServeComponent.getResolvedValue(stringPromise)).toEqual(stringResult);
  });

  it("message bar and spinner snapshots", async () => {
    const newDescriptor = { ...exampleData, onRefresh: onRefreshIsUpdatingMock };
    let wrapper = shallow(
      <SelfServeComponent descriptor={newDescriptor} t={undefined} i18n={undefined} tReady={undefined} />,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    let selfServeComponent = wrapper.instance() as SelfServeComponent;
    selfServeComponent.onSaveButtonClick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper).toMatchSnapshot();

    newDescriptor.onRefresh = onRefreshMock;
    wrapper = shallow(
      <SelfServeComponent descriptor={newDescriptor} t={undefined} i18n={undefined} tReady={undefined} />,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    selfServeComponent = wrapper.instance() as SelfServeComponent;
    selfServeComponent.onSaveButtonClick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(wrapper).toMatchSnapshot();

    wrapper.setState({ isInitializing: true });
    wrapper.update();
    expect(wrapper).toMatchSnapshot();

    wrapper.setState({ compileErrorMessage: "sample error message" });
    wrapper.update();
    expect(wrapper).toMatchSnapshot();
  });
});
