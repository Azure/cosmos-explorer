import * as DataModels from "Contracts/DataModels";
import { shallow } from "enzyme";
import React from "react";
import { ComputedPropertiesComponent, ComputedPropertiesComponentProps } from "./ComputedPropertiesComponent";

describe("ComputedPropertiesComponent", () => {
  const initialComputedPropertiesContent: DataModels.ComputedProperties = [
    {
      name: "prop1",
      query: "query1",
    },
  ];
  const baseProps: ComputedPropertiesComponentProps = {
    computedPropertiesContent: initialComputedPropertiesContent,
    computedPropertiesContentBaseline: initialComputedPropertiesContent,
    logComputedPropertiesSuccessMessage: () => {
      return;
    },
    onComputedPropertiesContentChange: () => {
      return;
    },
    onComputedPropertiesDirtyChange: () => {
      return;
    },
    resetShouldDiscardComputedProperties: () => {
      return;
    },
    shouldDiscardComputedProperties: false,
  };

  it("renders", () => {
    const wrapper = shallow(<ComputedPropertiesComponent {...baseProps} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("computed properties are reset", () => {
    const wrapper = shallow(<ComputedPropertiesComponent {...baseProps} />);

    const computedPropertiesComponentInstance = wrapper.instance() as ComputedPropertiesComponent;
    const resetComputedPropertiesEditorMockFn = jest.fn();
    computedPropertiesComponentInstance.resetComputedPropertiesEditor = resetComputedPropertiesEditorMockFn;

    wrapper.setProps({ shouldDiscardComputedProperties: true });
    wrapper.update();
    expect(resetComputedPropertiesEditorMockFn.mock.calls.length).toEqual(1);
  });

  it("dirty is set", () => {
    let computedPropertiesComponent = new ComputedPropertiesComponent(baseProps);
    expect(computedPropertiesComponent.IsComponentDirty()).toEqual(false);

    const newProps = { ...baseProps, computedPropertiesContent: undefined as DataModels.ComputedProperties };
    computedPropertiesComponent = new ComputedPropertiesComponent(newProps);
    expect(computedPropertiesComponent.IsComponentDirty()).toEqual(true);
  });
});
