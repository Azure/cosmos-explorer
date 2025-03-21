import { PrimaryButton } from "@fluentui/react";
import { shallow } from "enzyme";
import React from "react";
import { collection, container } from "../TestUtils";
import { GlobalSecondaryIndexSourceComponent } from "./GlobalSecondaryIndexSourceComponent";

describe("GlobalSecondaryIndexSourceComponent", () => {
  let testCollection: typeof collection;
  let testExplorer: typeof container;

  beforeEach(() => {
    testCollection = { ...collection };
  });

  it("renders without crashing", () => {
    const wrapper = shallow(
      <GlobalSecondaryIndexSourceComponent collection={testCollection} explorer={testExplorer} />,
    );
    expect(wrapper.exists()).toBe(true);
  });

  it("renders the PrimaryButton", () => {
    const wrapper = shallow(
      <GlobalSecondaryIndexSourceComponent collection={testCollection} explorer={testExplorer} />,
    );
    expect(wrapper.find(PrimaryButton).exists()).toBe(true);
  });

  it("updates when new global secondary indexes are provided", () => {
    const wrapper = shallow(
      <GlobalSecondaryIndexSourceComponent collection={testCollection} explorer={testExplorer} />,
    );

    // Simulating an update by modifying the observable directly
    testCollection.materializedViews([{ id: "view3", _rid: "rid3" }]);

    wrapper.setProps({ collection: testCollection });
    wrapper.update();

    expect(wrapper.find(PrimaryButton).exists()).toBe(true);
  });
});
