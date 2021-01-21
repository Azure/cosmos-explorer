import * as ko from "knockout";
import * as MostRecentActivity from "../MostRecentActivity/MostRecentActivity";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import React from "react";
import ResourceTokenCollection from "./ResourceTokenCollection";
import { ResourceTreeAdapterForResourceToken } from "./ResourceTreeAdapterForResourceToken";
import { shallow } from "enzyme";
import { TreeComponent, TreeNode, TreeComponentProps } from "../Controls/TreeComponent/TreeComponent";
import Explorer from "../Explorer";

const createMockContainer = (): Explorer => {
  let mockContainer = {} as Explorer;
  mockContainer.resourceTokenCollection = createMockCollection(mockContainer);
  mockContainer.selectedNode = ko.observable<ViewModels.TreeNode>();
  mockContainer.mostRecentActivity = new MostRecentActivity.MostRecentActivity(mockContainer);
  mockContainer.onUpdateTabsButtons = () => {};

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
      className: "dataResourceTree"
    };
    const wrapper = shallow(<TreeComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
