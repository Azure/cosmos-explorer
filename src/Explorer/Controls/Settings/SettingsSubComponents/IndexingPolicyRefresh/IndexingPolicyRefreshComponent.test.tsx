import { shallow } from "enzyme";
import React from "react";
import { IndexingPolicyRefreshComponentProps, IndexingPolicyRefreshComponent } from "./IndexingPolicyRefreshComponent";

describe("IndexingPolicyRefreshComponent", () => {
  it("renders", () => {
    const props: IndexingPolicyRefreshComponentProps = {
      indexTransformationProgress: 90,
      refreshIndexTransformationProgress: () => new Promise(jest.fn())
    };

    const wrapper = shallow(<IndexingPolicyRefreshComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
