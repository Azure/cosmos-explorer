import { shallow } from "enzyme";
import React from "react";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import { LegacyTreeComponent, LegacyTreeComponentProps, LegacyTreeNode } from "../Controls/TreeComponent/LegacyTreeComponent";
import Explorer from "../Explorer";
import Collection from "./Collection";
import { ResourceTreeAdapter } from "./ResourceTreeAdapter";

const schema: DataModels.ISchema = {
  id: "fakeSchemaId",
  accountName: "fakeAccountName",
  resource: "dbs/FakeDbName/colls/FakeCollectionName",
  fields: [
    {
      dataType: {
        code: 15,
        name: "String",
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data",
      },
      name: "_rid",
      path: "_rid",
      maxRepetitionLevel: 0,
      maxDefinitionLevel: 1,
    },
    {
      dataType: {
        code: 11,
        name: "Int64",
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data",
      },
      name: "_ts",
      path: "_ts",
      maxRepetitionLevel: 0,
      maxDefinitionLevel: 1,
    },
    {
      dataType: {
        code: 15,
        name: "String",
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data",
      },
      name: "id",
      path: "id",
      maxRepetitionLevel: 0,
      maxDefinitionLevel: 1,
    },
    {
      dataType: {
        code: 15,
        name: "String",
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data",
      },
      name: "pk",
      path: "pk",
      maxRepetitionLevel: 0,
      maxDefinitionLevel: 1,
    },
    {
      dataType: {
        code: 15,
        name: "String",
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data",
      },
      name: "other",
      path: "other",
      maxRepetitionLevel: 0,
      maxDefinitionLevel: 1,
    },
    {
      dataType: {
        code: 15,
        name: "String",
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data",
      },
      name: "name",
      path: "nested.name",
      maxRepetitionLevel: 0,
      maxDefinitionLevel: 1,
    },
    {
      dataType: {
        code: 11,
        name: "Int64",
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data",
      },
      name: "someNumber",
      path: "nested.someNumber",
      maxRepetitionLevel: 0,
      maxDefinitionLevel: 1,
    },
    {
      dataType: {
        code: 17,
        name: "Double",
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data",
      },
      name: "anotherNumber",
      path: "nested.anotherNumber",
      maxRepetitionLevel: 0,
      maxDefinitionLevel: 1,
    },
    {
      dataType: {
        code: 15,
        name: "String",
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data",
      },
      name: "name",
      path: "items.list.items.name",
      maxRepetitionLevel: 1,
      maxDefinitionLevel: 3,
    },
    {
      dataType: {
        code: 11,
        name: "Int64",
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data",
      },
      name: "someNumber",
      path: "items.list.items.someNumber",
      maxRepetitionLevel: 1,
      maxDefinitionLevel: 3,
    },
    {
      dataType: {
        code: 17,
        name: "Double",
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data",
      },
      name: "anotherNumber",
      path: "items.list.items.anotherNumber",
      maxRepetitionLevel: 1,
      maxDefinitionLevel: 3,
    },
    {
      dataType: {
        code: 15,
        name: "String",
      },
      hasNulls: true,
      isArray: false,
      schemaType: {
        code: 0,
        name: "Data",
      },
      name: "_etag",
      path: "_etag",
      maxRepetitionLevel: 0,
      maxDefinitionLevel: 1,
    },
  ],
};

const createMockCollection = (): ViewModels.Collection => {
  const mockCollection = {} as DataModels.Collection;
  mockCollection._rid = "fakeRid";
  mockCollection._self = "fakeSelf";
  mockCollection.id = "fakeId";
  mockCollection.analyticalStorageTtl = 0;
  mockCollection.schema = schema;

  const mockCollectionVM: ViewModels.Collection = new Collection(new Explorer(), "fakeDatabaseId", mockCollection);

  return mockCollectionVM;
};

describe("Resource tree for schema", () => {
  const mockContainer = new Explorer();
  const resourceTree = new ResourceTreeAdapter(mockContainer);

  it("should render", () => {
    const rootNode: LegacyTreeNode = resourceTree.buildSchemaNode(createMockCollection());
    const props: LegacyTreeComponentProps = {
      rootNode,
      className: "dataResourceTree",
    };
    const wrapper = shallow(<LegacyTreeComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
