import { Text } from "@fluentui/react";
import { Collection } from "Contracts/ViewModels";
import { shallow } from "enzyme";
import React from "react";
import { collection } from "../TestUtils";
import { GlobalSecondaryIndexTargetComponent } from "./GlobalSecondaryIndexTargetComponent";

describe("GlobalSecondaryIndexTargetComponent", () => {
  let testCollection: Collection;

  beforeEach(() => {
    testCollection = {
      ...collection,
      materializedViewDefinition: collection.materializedViewDefinition,
    };
  });

  it("renders without crashing", () => {
    const wrapper = shallow(<GlobalSecondaryIndexTargetComponent collection={testCollection} />);
    expect(wrapper.exists()).toBe(true);
  });

  it("displays the source container ID", () => {
    const wrapper = shallow(<GlobalSecondaryIndexTargetComponent collection={testCollection} />);
    expect(wrapper.find(Text).at(2).dive().text()).toBe("source1");
  });

  it("displays the global secondary index definition", () => {
    const wrapper = shallow(<GlobalSecondaryIndexTargetComponent collection={testCollection} />);
    expect(wrapper.find(Text).at(4).dive().text()).toBe("SELECT * FROM c WHERE c.id = 1");
  });
});
