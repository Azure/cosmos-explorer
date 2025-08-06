import { shallow } from "enzyme";
import React from "react";
import { collection, container } from "../TestUtils";
import { GlobalSecondaryIndexComponent } from "./GlobalSecondaryIndexComponent";
import { GlobalSecondaryIndexSourceComponent } from "./GlobalSecondaryIndexSourceComponent";
import { GlobalSecondaryIndexTargetComponent } from "./GlobalSecondaryIndexTargetComponent";

describe("GlobalSecondaryIndexComponent", () => {
  let testCollection: typeof collection;
  let testExplorer: typeof container;

  beforeEach(() => {
    testCollection = { ...collection };
  });

  it("renders only the source component when materializedViewDefinition is missing", () => {
    testCollection.materializedViews([
      { id: "view1", _rid: "rid1" },
      { id: "view2", _rid: "rid2" },
    ]);
    testCollection.materializedViewDefinition(null);
    const wrapper = shallow(<GlobalSecondaryIndexComponent collection={testCollection} explorer={testExplorer} />);
    expect(wrapper.find(GlobalSecondaryIndexSourceComponent).exists()).toBe(true);
    expect(wrapper.find(GlobalSecondaryIndexTargetComponent).exists()).toBe(false);
  });

  it("renders only the target component when materializedViews is missing", () => {
    testCollection.materializedViews(null);
    testCollection.materializedViewDefinition({
      definition: "SELECT * FROM c WHERE c.id = 1",
      sourceCollectionId: "source1",
      sourceCollectionRid: "rid123",
    });
    const wrapper = shallow(<GlobalSecondaryIndexComponent collection={testCollection} explorer={testExplorer} />);
    expect(wrapper.find(GlobalSecondaryIndexSourceComponent).exists()).toBe(false);
    expect(wrapper.find(GlobalSecondaryIndexTargetComponent).exists()).toBe(true);
  });

  it("renders neither component when both are missing", () => {
    testCollection.materializedViews(null);
    testCollection.materializedViewDefinition(null);
    const wrapper = shallow(<GlobalSecondaryIndexComponent collection={testCollection} explorer={testExplorer} />);
    expect(wrapper.find(GlobalSecondaryIndexSourceComponent).exists()).toBe(false);
    expect(wrapper.find(GlobalSecondaryIndexTargetComponent).exists()).toBe(false);
  });
});
