import { PrimaryButton } from "@fluentui/react";
import { shallow } from "enzyme";
import React from "react";
import { collection } from "../TestUtils";
import {
  MaterializedViewSourceComponent,
  MaterializedViewSourceComponentProps,
} from "./MaterializedViewSourceComponent";

describe("MaterializedViewSourceComponent", () => {
  const baseProps: MaterializedViewSourceComponentProps = {
    collection: {
      ...collection,
      materializedViews: jest.fn(() => collection.materializedViews()),
    },
  };

  it("renders without crashing", () => {
    const wrapper = shallow(<MaterializedViewSourceComponent {...baseProps} />);
    expect(wrapper.exists()).toBe(true);
  });

  it("renders the PrimaryButton", () => {
    const wrapper = shallow(<MaterializedViewSourceComponent {...baseProps} />);
    expect(wrapper.find(PrimaryButton).exists()).toBe(true);
  });

  it("updates when new materialized views are provided", () => {
    const wrapper = shallow(<MaterializedViewSourceComponent {...baseProps} />);

    // Simulating an update by modifying the observable directly
    collection.materializedViews([{ id: "view3", _rid: "rid3" }]);

    wrapper.setProps({ collection: { ...collection } });
    wrapper.update();

    expect(wrapper.find(PrimaryButton).exists()).toBe(true);
  });
});
