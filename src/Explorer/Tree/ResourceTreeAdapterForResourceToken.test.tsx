import { shallow } from "enzyme";
import React from "react";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { TreeComponent, TreeComponentProps, TreeNode } from "../Controls/TreeComponent/TreeComponent";
import Explorer from "../Explorer";
import { useDatabases } from "../useDatabases";
import ResourceTokenCollection from "./ResourceTokenCollection";
import { ResourceTreeAdapterForResourceToken } from "./ResourceTreeAdapterForResourceToken";

describe("Resource tree for resource token", () => {
  const mockContainer = {} as Explorer;
  const resourceTree = new ResourceTreeAdapterForResourceToken(mockContainer);
  const mockCollection = {
    _rid: "fakeRid",
    _self: "fakeSelf",
    id: "fakeId",
  } as DataModels.Collection;
  const mockResourceTokenCollection: ViewModels.CollectionBase = new ResourceTokenCollection(
    mockContainer,
    "fakeDatabaseId",
    mockCollection
  );
  useDatabases.setState({ resourceTokenCollection: mockResourceTokenCollection });

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
