import {
  DocumentsTabComponent,
  IDocumentsTabComponentProps,
  buildQuery,
  showPartitionKey,
} from "Explorer/Tabs/DocumentsTabV2/DocumentsTabV2";
import { ShallowWrapper, shallow } from "enzyme";
import * as ko from "knockout";
import React from "react";
import { DatabaseAccount } from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import { updateUserContext } from "../../../UserContext";
import Explorer from "../../Explorer";

describe("Documents tab", () => {
  describe("buildQuery", () => {
    it("should generate the right select query for SQL API", () => {
      expect(buildQuery(false, "")).toContain("select");
    });
  });

  describe("showPartitionKey", () => {
    const explorer = new Explorer();
    const mongoExplorer = new Explorer();
    updateUserContext({
      databaseAccount: {
        properties: {
          capabilities: [{ name: "EnableGremlin" }],
        },
      } as DatabaseAccount,
    });

    const collectionWithoutPartitionKey: ViewModels.Collection = {
      id: ko.observable<string>("foo"),
      databaseId: "foo",
      container: explorer,
    } as ViewModels.Collection;

    const collectionWithSystemPartitionKey: ViewModels.Collection = {
      id: ko.observable<string>("foo"),
      databaseId: "foo",
      partitionKey: {
        paths: ["/foo"],
        kind: "Hash",
        version: 2,
        systemKey: true,
      },
      container: explorer,
    } as ViewModels.Collection;

    const collectionWithNonSystemPartitionKey: ViewModels.Collection = {
      id: ko.observable<string>("foo"),
      databaseId: "foo",
      partitionKey: {
        paths: ["/foo"],
        kind: "Hash",
        version: 2,
        systemKey: false,
      },
      container: explorer,
    } as ViewModels.Collection;

    const mongoCollectionWithSystemPartitionKey: ViewModels.Collection = {
      id: ko.observable<string>("foo"),
      databaseId: "foo",
      partitionKey: {
        paths: ["/foo"],
        kind: "Hash",
        version: 2,
        systemKey: true,
      },
      container: mongoExplorer,
    } as ViewModels.Collection;

    it("should be false for null or undefined collection", () => {
      expect(showPartitionKey(undefined, false)).toBe(false);
      expect(showPartitionKey(null, false)).toBe(false);
      expect(showPartitionKey(undefined, true)).toBe(false);
      expect(showPartitionKey(null, true)).toBe(false);
    });

    it("should be false for null or undefined partitionKey", () => {
      expect(showPartitionKey(collectionWithoutPartitionKey, false)).toBe(false);
    });

    it("should be true for non-Mongo accounts with system partitionKey", () => {
      expect(showPartitionKey(collectionWithSystemPartitionKey, false)).toBe(true);
    });

    it("should be false for Mongo accounts with system partitionKey", () => {
      expect(showPartitionKey(mongoCollectionWithSystemPartitionKey, true)).toBe(false);
    });

    it("should be true for non-system partitionKey", () => {
      expect(showPartitionKey(collectionWithNonSystemPartitionKey, false)).toBe(true);
    });
  });

  describe("when rendered", () => {
    const createMockProps = (): IDocumentsTabComponentProps => ({
      isPreferredApiMongoDB: false,
      documentIds: [],
      collection: undefined,
      partitionKey: undefined,
      onLoadStartKey: 0,
      tabTitle: "",
      onExecutionErrorChange: (isExecutionError: boolean): void => {
        isExecutionError;
      },
      onIsExecutingChange: (isExecuting: boolean): void => {
        isExecuting;
      },
      isTabActive: false,
    });

    let wrapper: ShallowWrapper;

    beforeEach(() => {
      const props: IDocumentsTabComponentProps = createMockProps();
      wrapper = shallow(<DocumentsTabComponent {...props} />);
    });

    afterEach(() => {
      wrapper.unmount();
    });

    it("should render the Edit Filter button", () => {
      expect(wrapper.findWhere((node) => node.text() === "Edit Filter").exists()).toBeTruthy();
    });

    it("clicking on Edit filter should render the Apply Filter button", () => {
      wrapper
        .findWhere((node) => node.text() === "Edit Filter")
        .at(0)
        .simulate("click");
      expect(wrapper.findWhere((node) => node.text() === "Apply Filter").exists()).toBeTruthy();
    });

    it("clicking on Edit filter should render input for filter", () => {
      wrapper
        .findWhere((node) => node.text() === "Edit Filter")
        .at(0)
        .simulate("click");
      expect(wrapper.find("#filterInput").exists()).toBeTruthy();
    });
  });
});
