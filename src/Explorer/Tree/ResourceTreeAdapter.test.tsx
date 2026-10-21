import "@testing-library/jest-dom";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AuthType } from "AuthType";
import { DatabaseSortOrder, useDatabases } from "Explorer/useDatabases";
import { updateUserContext, userContext } from "UserContext";
import { shallow } from "enzyme";
import React from "react";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import {
  LegacyTreeComponent,
  LegacyTreeComponentProps,
  LegacyTreeNode,
} from "../Controls/TreeComponent/LegacyTreeComponent";
import Explorer from "../Explorer";
import Collection from "./Collection";
import Database from "./Database";
import { ResourceTree } from "./ResourceTree";
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

  describe("ResourceTree database sorting", () => {
    const explorer = new Explorer();
    const initialDatabasesState = useDatabases.getState();
    const initialAuthType = userContext.authType;

    beforeEach(() => {
      updateUserContext({ authType: AuthType.AAD });
      const databases = ["Charlie", "alpha", "Bravo"].map(
        (id) => new Database(explorer, { id, _rid: id, _self: id, _ts: 0, _etag: "etag" }),
      );
      useDatabases.setState({ databases, sortOrder: "az", searchText: "", pinnedDatabaseIds: new Set() });
    });

    afterEach(() => {
      cleanup();
      useDatabases.setState(initialDatabasesState);
      updateUserContext({ authType: initialAuthType });
      localStorage.clear();
    });

    const displayedDatabaseNames = () =>
      within(screen.getByRole("tree", { name: "CosmosDB resources" }))
        .getAllByRole("treeitem")
        .map((item) => item.textContent)
        .filter((label) => label !== "Home");

    it.each<{ order: DatabaseSortOrder; nextOrder: DatabaseSortOrder; action: string; nextAction: string }>([
      {
        order: "az",
        nextOrder: "za",
        action: "Sort databases in descending order",
        nextAction: "Sort databases in ascending order",
      },
      {
        order: "za",
        nextOrder: "az",
        action: "Sort databases in ascending order",
        nextAction: "Sort databases in descending order",
      },
    ])("names the next sorting action when the current order is $order", ({ order, nextOrder, action, nextAction }) => {
      useDatabases.setState({ sortOrder: order });
      render(<ResourceTree explorer={explorer} />);

      const button = screen.getByRole("button", { name: action });
      expect(button).toHaveAttribute("title", action);
      expect(displayedDatabaseNames()).toEqual(
        order === "az" ? ["alpha", "Bravo", "Charlie"] : ["Charlie", "Bravo", "alpha"],
      );

      fireEvent.click(button);

      expect(useDatabases.getState().sortOrder).toBe(nextOrder);
      expect(screen.getByRole("button", { name: nextAction })).toBe(button);
      expect(button).toHaveAttribute("title", nextAction);
      expect(displayedDatabaseNames()).toEqual(
        nextOrder === "az" ? ["alpha", "Bravo", "Charlie"] : ["Charlie", "Bravo", "alpha"],
      );
      expect(useDatabases.getState().databases.map((database) => database.id())).toEqual(["Charlie", "alpha", "Bravo"]);
    });

    it("keeps pinned databases first while reversing the unpinned database order", () => {
      useDatabases.setState({ pinnedDatabaseIds: new Set(["Bravo"]) });
      render(<ResourceTree explorer={explorer} />);

      expect(displayedDatabaseNames()).toEqual(["Bravo", "alpha", "Charlie"]);
      fireEvent.click(screen.getByRole("button", { name: "Sort databases in descending order" }));
      expect(displayedDatabaseNames()).toEqual(["Bravo", "Charlie", "alpha"]);
      fireEvent.click(screen.getByRole("button", { name: "Sort databases in ascending order" }));
      expect(displayedDatabaseNames()).toEqual(["Bravo", "alpha", "Charlie"]);
    });

    it("reverses filtered database results and keeps the chosen order when the filter is cleared", () => {
      render(<ResourceTree explorer={explorer} />);
      const search = screen.getByPlaceholderText("Search databases only");
      fireEvent.change(search, { target: { value: "r" } });

      expect(displayedDatabaseNames()).toEqual(["Bravo", "Charlie"]);
      fireEvent.click(screen.getByRole("button", { name: "Sort databases in descending order" }));
      expect(displayedDatabaseNames()).toEqual(["Charlie", "Bravo"]);
      fireEvent.change(search, { target: { value: "" } });
      expect(displayedDatabaseNames()).toEqual(["Charlie", "Bravo", "alpha"]);
    });

    it("hides sorting when no databases are loaded", () => {
      useDatabases.setState({ databases: [] });
      render(<ResourceTree explorer={explorer} />);

      expect(screen.queryByRole("button", { name: /Sort databases/ })).not.toBeInTheDocument();
    });

    it("hides sorting for one database without hiding database search", () => {
      useDatabases.setState({ databases: useDatabases.getState().databases.slice(0, 1) });
      render(<ResourceTree explorer={explorer} />);

      expect(screen.queryByRole("button", { name: /Sort databases/ })).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText("Search databases only")).toBeInTheDocument();
    });

    it("shows sorting for exactly two databases", () => {
      useDatabases.setState({ databases: useDatabases.getState().databases.slice(0, 2) });
      render(<ResourceTree explorer={explorer} />);

      expect(screen.getByRole("button", { name: "Sort databases in descending order" })).toBeInTheDocument();
    });

    it("hides sorting for resource token authentication", () => {
      updateUserContext({ authType: AuthType.ResourceToken });
      render(<ResourceTree explorer={explorer} />);

      expect(screen.queryByRole("button", { name: /Sort databases/ })).not.toBeInTheDocument();
    });
  });
});
