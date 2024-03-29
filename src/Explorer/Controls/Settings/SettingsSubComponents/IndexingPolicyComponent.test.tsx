import { shallow } from "enzyme";
import React from "react";
import * as DataModels from "../../../../Contracts/DataModels";
import { IndexingPolicyComponent, IndexingPolicyComponentProps } from "./IndexingPolicyComponent";

describe("IndexingPolicyComponent", () => {
  const initialIndexingPolicyContent: DataModels.IndexingPolicy = {
    automatic: false,
    indexingMode: "consistent",
    includedPaths: [],
    excludedPaths: [],
  };
  const baseProps: IndexingPolicyComponentProps = {
    shouldDiscardIndexingPolicy: false,
    resetShouldDiscardIndexingPolicy: () => {
      return;
    },
    indexingPolicyContent: initialIndexingPolicyContent,
    indexingPolicyContentBaseline: initialIndexingPolicyContent,
    onIndexingPolicyContentChange: () => {
      return;
    },
    logIndexingPolicySuccessMessage: () => {
      return;
    },
    onIndexingPolicyDirtyChange: () => {
      return;
    },
    indexTransformationProgress: undefined,
    refreshIndexTransformationProgress: () => new Promise(jest.fn()),
  };

  it("renders", () => {
    const wrapper = shallow(<IndexingPolicyComponent {...baseProps} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("indexing policy is reset", () => {
    const wrapper = shallow(<IndexingPolicyComponent {...baseProps} />);

    const indexingPolicyComponentInstance = wrapper.instance() as IndexingPolicyComponent;
    const resetIndexingPolicyEditorMockFn = jest.fn();
    indexingPolicyComponentInstance.resetIndexingPolicyEditor = resetIndexingPolicyEditorMockFn;

    wrapper.setProps({ shouldDiscardIndexingPolicy: true });
    wrapper.update();
    expect(resetIndexingPolicyEditorMockFn.mock.calls.length).toEqual(1);
  });

  it("conflict resolution policy dirty is set", () => {
    let indexingPolicyComponent = new IndexingPolicyComponent(baseProps);
    expect(indexingPolicyComponent.IsComponentDirty()).toEqual(false);

    const newProps = { ...baseProps, indexingPolicyContent: undefined as DataModels.IndexingPolicy };
    indexingPolicyComponent = new IndexingPolicyComponent(newProps);
    expect(indexingPolicyComponent.IsComponentDirty()).toEqual(true);
  });
});
