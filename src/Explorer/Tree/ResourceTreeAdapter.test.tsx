import * as ko from "knockout";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import React from "react";
import { ResourceTreeAdapter } from "./ResourceTreeAdapter";
import { shallow } from "enzyme";
import { TreeComponent, TreeNode, TreeComponentProps } from "../Controls/TreeComponent/TreeComponent";
import Explorer from "../Explorer";
import Collection from "./Collection";

const schema: DataModels.ISchema = {
  id: "fakeSchemaId",
  accountName: "fakeAccountName",
  resource: "dbs/FakeDbName/colls/FakeCollectionName",
  fields: [
    {
      dataType: {
        code: 15,
        name: "String"
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data"
      },
      name: "_rid",
      path: "_rid",
      maxRepetitionLevel: 0,
      maxDefinitionLevel: 1
    },
    {
      dataType: {
        code: 11,
        name: "Int64"
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data"
      },
      name: "_ts",
      path: "_ts",
      maxRepetitionLevel: 0,
      maxDefinitionLevel: 1
    },
    {
      dataType: {
        code: 15,
        name: "String"
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data"
      },
      name: "id",
      path: "id",
      maxRepetitionLevel: 0,
      maxDefinitionLevel: 1
    },
    {
      dataType: {
        code: 15,
        name: "String"
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data"
      },
      name: "pk",
      path: "pk",
      maxRepetitionLevel: 0,
      maxDefinitionLevel: 1
    },
    {
      dataType: {
        code: 15,
        name: "String"
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data"
      },
      name: "other",
      path: "other",
      maxRepetitionLevel: 0,
      maxDefinitionLevel: 1
    },
    {
      dataType: {
        code: 15,
        name: "String"
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data"
      },
      name: "name",
      path: "nested.name",
      maxRepetitionLevel: 0,
      maxDefinitionLevel: 1
    },
    {
      dataType: {
        code: 11,
        name: "Int64"
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data"
      },
      name: "someNumber",
      path: "nested.someNumber",
      maxRepetitionLevel: 0,
      maxDefinitionLevel: 1
    },
    {
      dataType: {
        code: 17,
        name: "Double"
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data"
      },
      name: "anotherNumber",
      path: "nested.anotherNumber",
      maxRepetitionLevel: 0,
      maxDefinitionLevel: 1
    },
    {
      dataType: {
        code: 15,
        name: "String"
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data"
      },
      name: "name",
      path: "items.list.items.name",
      maxRepetitionLevel: 1,
      maxDefinitionLevel: 3
    },
    {
      dataType: {
        code: 11,
        name: "Int64"
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data"
      },
      name: "someNumber",
      path: "items.list.items.someNumber",
      maxRepetitionLevel: 1,
      maxDefinitionLevel: 3
    },
    {
      dataType: {
        code: 17,
        name: "Double"
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data"
      },
      name: "anotherNumber",
      path: "items.list.items.anotherNumber",
      maxRepetitionLevel: 1,
      maxDefinitionLevel: 3
    },
    {
      dataType: {
        code: 15,
        name: "String"
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data"
      },
      name: "_etag",
      path: "_etag",
      maxRepetitionLevel: 0,
      maxDefinitionLevel: 1
    }
  ]
};

const createMockContainer = (): Explorer => {
  const mockContainer = new Explorer();
  mockContainer.selectedNode = ko.observable<ViewModels.TreeNode>();
  mockContainer.onUpdateTabsButtons = () => {
    return;
  };

  return mockContainer;
};

const createMockCollection = (): ViewModels.Collection => {
  const mockCollection = {} as DataModels.Collection;
  mockCollection._rid = "fakeRid";
  mockCollection._self = "fakeSelf";
  mockCollection.id = "fakeId";
  mockCollection.analyticalStorageTtl = 0;
  mockCollection.schema = schema;

  const mockCollectionVM: ViewModels.Collection = new Collection(
    createMockContainer(),
    "fakeDatabaseId",
    mockCollection
  );

  return mockCollectionVM;
};

describe("Resource tree for schema", () => {
  const mockContainer: Explorer = createMockContainer();
  const resourceTree = new ResourceTreeAdapter(mockContainer);

  it("should render", () => {
    const rootNode: TreeNode = resourceTree.buildSchemaNode(createMockCollection());
    const props: TreeComponentProps = {
      rootNode,
      className: "dataResourceTree"
    };
    const wrapper = shallow(<TreeComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
