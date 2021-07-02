import { shallow } from "enzyme";
import * as ko from "knockout";
import React from "react";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { TreeComponent, TreeComponentProps, TreeNode } from "../Controls/TreeComponent/TreeComponent";
import Explorer from "../Explorer";
import ResourceTokenCollection from "./ResourceTokenCollection";
import { ResourceTreeAdapterForResourceToken } from "./ResourceTreeAdapterForResourceToken";

const createMockContainer = (): Explorer => {
  let mockContainer = {} as Explorer;
  mockContainer.resourceTokenCollection = createMockCollection(mockContainer);

  return mockContainer;
};

const createMockCollection = (container: Explorer): ko.Observable<ViewModels.CollectionBase> => {
  let mockCollection = {} as DataModels.Collection;
  mockCollection._rid = "fakeRid";
  mockCollection._self = "fakeSelf";
  mockCollection.id = "fakeId";

  const mockResourceTokenCollection: ViewModels.CollectionBase = new ResourceTokenCollection(
    container,
    "fakeDatabaseId",
    mockCollection
  );
  return ko.observable<ViewModels.CollectionBase>(mockResourceTokenCollection);
};

describe("Resource tree for resource token", () => {
  const mockContainer: Explorer = createMockContainer();
  const resourceTree = new ResourceTreeAdapterForResourceToken(mockContainer);

  it("should render", () => {
    const rootNode: TreeNode = resourceTree.buildCollectionNode();
    const props: TreeComponentProps = {
      rootNode,
      className: "dataResourceTree",
    };
    const wrapper = shallow(<TreeComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
