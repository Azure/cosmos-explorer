import { shallow } from "enzyme";
import React from "react";
import { IndexingPolicyComponent, IndexingPolicyComponentProps } from "./IndexingPolicyComponent";
import { StatefulValue } from "../../StatefulValue/StatefulValue";
import * as DataModels from "../../../../Contracts/DataModels";

describe("IndexingPolicyComponent", () => {
  const props: IndexingPolicyComponentProps = {
    shouldDiscardIndexingPolicy: false,
    resetShouldDiscardIndexingPolicy: () => {
      return;
    },
    indexingPolicyContent: new StatefulValue<DataModels.IndexingPolicy>({
      automatic: false,
      indexingMode: "",
      includedPaths: [],
      excludedPaths: []
    }),
    setIndexingPolicyElementFocussed: () => {
      return;
    },
    setIndexingPolicyContent: () => {
      return;
    },
    setIndexingPolicyValidity: () => {
      return;
    },
    logIndexingPolicySuccessMessage: () => {
      return;
    }
  };

  it("renders", () => {
    const wrapper = shallow(<IndexingPolicyComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("indexing policy is reset", () => {
    const wrapper = shallow(<IndexingPolicyComponent {...props} />);
    expect(wrapper).toMatchSnapshot();

    const indexingPolicyComponentInstance = wrapper.instance() as IndexingPolicyComponent;
    const resetIndexingPolicyEditorMockFn = jest.fn();
    indexingPolicyComponentInstance.resetIndexingPolicyEditor = resetIndexingPolicyEditorMockFn;

    wrapper.setProps({ shouldDiscardIndexingPolicy: true });
    wrapper.update();
    expect(resetIndexingPolicyEditorMockFn.mock.calls.length).toEqual(1);
  });
});
