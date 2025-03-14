import { shallow } from "enzyme";
import React from "react";
import { collection } from "../TestUtils";
import { MaterializedViewComponent } from "./MaterializedViewComponent";
import { MaterializedViewSourceComponent } from "./MaterializedViewSourceComponent";
import { MaterializedViewTargetComponent } from "./MaterializedViewTargetComponent";

describe("MaterializedViewComponent", () => {
  let testCollection: typeof collection;

  beforeEach(() => {
    testCollection = { ...collection };
  });

  it("renders only the source component when materializedViewDefinition is missing", () => {
    testCollection.materializedViews([
      { id: "view1", _rid: "rid1" },
      { id: "view2", _rid: "rid2" },
    ]);
    testCollection.materializedViewDefinition(null);
    const wrapper = shallow(<MaterializedViewComponent collection={testCollection} />);
    expect(wrapper.find(MaterializedViewSourceComponent).exists()).toBe(true);
    expect(wrapper.find(MaterializedViewTargetComponent).exists()).toBe(false);
  });

  it("renders only the target component when materializedViews is missing", () => {
    testCollection.materializedViews(null);
    testCollection.materializedViewDefinition({
      definition: "SELECT * FROM c WHERE c.id = 1",
      sourceCollectionId: "source1",
      sourceCollectionRid: "rid123",
    });
    const wrapper = shallow(<MaterializedViewComponent collection={testCollection} />);
    expect(wrapper.find(MaterializedViewSourceComponent).exists()).toBe(false);
    expect(wrapper.find(MaterializedViewTargetComponent).exists()).toBe(true);
  });

  it("renders neither component when both are missing", () => {
    testCollection.materializedViews(null);
    testCollection.materializedViewDefinition(null);
    const wrapper = shallow(<MaterializedViewComponent collection={testCollection} />);
    expect(wrapper.find(MaterializedViewSourceComponent).exists()).toBe(false);
    expect(wrapper.find(MaterializedViewTargetComponent).exists()).toBe(false);
  });
});
