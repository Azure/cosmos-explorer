import { Text } from "@fluentui/react";
import { shallow } from "enzyme";
import React from "react";
import { collection } from "../TestUtils";
import { MaterializedViewTargetComponent } from "./MaterializedViewTargetComponent";

describe("MaterializedViewTargetComponent", () => {
  let testCollection: any;

  beforeEach(() => {
    testCollection = {
      ...collection,
      materializedViewDefinition: collection.materializedViewDefinition,
    };
  });

  it("renders without crashing", () => {
    const wrapper = shallow(<MaterializedViewTargetComponent collection={testCollection} />);
    expect(wrapper.exists()).toBe(true);
  });

  it("displays the source container ID", () => {
    const wrapper = shallow(<MaterializedViewTargetComponent collection={testCollection} />);
    expect(wrapper.find(Text).at(2).dive().text()).toBe("source1");
  });

  it("displays the materialized view definition", () => {
    const wrapper = shallow(<MaterializedViewTargetComponent collection={testCollection} />);
    expect(wrapper.find(Text).at(4).dive().text()).toBe("SELECT * FROM c WHERE c.id = 1");
  });
});
