import { FeedResponse, ItemDefinition, Resource } from "@azure/cosmos";
import { TableRowId } from "@fluentui/react-components";
import { Platform, updateConfigContext } from "ConfigContext";
import { EditorReactProps } from "Explorer/Controls/Editor/EditorReact";
import { useCommandBar } from "Explorer/Menus/CommandBar/CommandBarComponentAdapter";
import {
  ButtonsDependencies,
  DocumentsTabComponent,
  IDocumentsTabComponentProps,
  NEW_DOCUMENT_BUTTON_ID,
  buildQuery,
  getDeleteExistingDocumentButtonState,
  getDiscardExistingDocumentChangesButtonState,
  getDiscardNewDocumentChangesButtonState,
  getSaveExistingDocumentButtonState,
  getSaveNewDocumentButtonState,
  getTabsButtons,
  showPartitionKey,
} from "Explorer/Tabs/DocumentsTabV2/DocumentsTabV2";
import { ReactWrapper, ShallowWrapper, mount, shallow } from "enzyme";
import * as ko from "knockout";
import React from "react";
import { act } from "react-dom/test-utils";
import { DatabaseAccount } from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import { updateUserContext } from "../../../UserContext";
import Explorer from "../../Explorer";

jest.requireActual("Explorer/Controls/Editor/EditorReact");

jest.mock("Common/dataAccess/queryDocuments", () => ({
  queryDocuments: jest.fn(() => ({
    // Omit headers, because we can't mock a private field and we don't need to test it
    fetchNext: (): Promise<Omit<FeedResponse<ItemDefinition & Resource>, "headers">> =>
      Promise.resolve({
        resources: [{ id: "id", _rid: "rid", _self: "self", _etag: "etag", _ts: 123 }],
        hasMoreResults: false,
        diagnostics: undefined,

        continuation: undefined,
        continuationToken: undefined,
        queryMetrics: "queryMetrics",
        requestCharge: 1,
        activityId: "activityId",
        indexMetrics: "indexMetrics",
      }),
  })),
}));

jest.mock("Common/dataAccess/readDocument", () => ({
  readDocument: jest.fn(() =>
    Promise.resolve({
      container: undefined,
      id: "id",
      url: "url",
    }),
  ),
}));

jest.mock("Explorer/Controls/Editor/EditorReact", () => ({
  EditorReact: (props: EditorReactProps) => <>{props.content}</>,
}));

async function waitForComponentToPaint<P = unknown>(wrapper: ReactWrapper<P>, amount = 0) {
  let newWrapper;
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, amount));
    newWrapper = wrapper.update();
  });
  return newWrapper;
}

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

  describe("when getting command bar button state", () => {
    describe("should set Save New Document state", () => {
      const testCases = new Set<{ state: ViewModels.DocumentExplorerState; enabled: boolean; visible: boolean }>();
      testCases.add({ state: ViewModels.DocumentExplorerState.noDocumentSelected, enabled: false, visible: false });
      testCases.add({ state: ViewModels.DocumentExplorerState.newDocumentValid, enabled: true, visible: true });
      testCases.add({ state: ViewModels.DocumentExplorerState.newDocumentInvalid, enabled: false, visible: true });
      testCases.add({
        state: ViewModels.DocumentExplorerState.exisitingDocumentNoEdits,
        enabled: false,
        visible: false,
      });
      testCases.add({
        state: ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid,
        enabled: false,
        visible: false,
      });
      testCases.add({
        state: ViewModels.DocumentExplorerState.exisitingDocumentDirtyInvalid,
        enabled: false,
        visible: false,
      });

      testCases.forEach((testCase) => {
        const state = getSaveNewDocumentButtonState(testCase.state);
        it(`enable for ${testCase.state}`, () => {
          expect(state.enabled).toBe(testCase.enabled);
        });
        it(`visible for ${testCase.state}`, () => {
          expect(state.visible).toBe(testCase.visible);
        });
      });
    });

    describe("should set Discard New Document state", () => {
      const testCases = new Set<{ state: ViewModels.DocumentExplorerState; enabled: boolean; visible: boolean }>();
      testCases.add({ state: ViewModels.DocumentExplorerState.noDocumentSelected, enabled: false, visible: false });
      testCases.add({ state: ViewModels.DocumentExplorerState.newDocumentValid, enabled: true, visible: true });
      testCases.add({ state: ViewModels.DocumentExplorerState.newDocumentInvalid, enabled: true, visible: true });
      testCases.add({
        state: ViewModels.DocumentExplorerState.exisitingDocumentNoEdits,
        enabled: false,
        visible: false,
      });
      testCases.add({
        state: ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid,
        enabled: false,
        visible: false,
      });
      testCases.add({
        state: ViewModels.DocumentExplorerState.exisitingDocumentDirtyInvalid,
        enabled: false,
        visible: false,
      });

      testCases.forEach((testCase) => {
        const state = getDiscardNewDocumentChangesButtonState(testCase.state);
        it(`enable for ${testCase.state}`, () => {
          expect(state.enabled).toBe(testCase.enabled);
        });
        it(`visible for ${testCase.state}`, () => {
          expect(state.visible).toBe(testCase.visible);
        });
      });
    });

    describe("should set Save Existing Document state", () => {
      const testCases = new Set<{ state: ViewModels.DocumentExplorerState; enabled: boolean; visible: boolean }>();
      testCases.add({ state: ViewModels.DocumentExplorerState.noDocumentSelected, enabled: false, visible: false });
      testCases.add({ state: ViewModels.DocumentExplorerState.newDocumentValid, enabled: false, visible: false });
      testCases.add({ state: ViewModels.DocumentExplorerState.newDocumentInvalid, enabled: false, visible: false });
      testCases.add({
        state: ViewModels.DocumentExplorerState.exisitingDocumentNoEdits,
        enabled: false,
        visible: true,
      });
      testCases.add({
        state: ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid,
        enabled: true,
        visible: true,
      });
      testCases.add({
        state: ViewModels.DocumentExplorerState.exisitingDocumentDirtyInvalid,
        enabled: false,
        visible: true,
      });

      testCases.forEach((testCase) => {
        const state = getSaveExistingDocumentButtonState(testCase.state);
        it(`enable for ${testCase.state}`, () => {
          expect(state.enabled).toBe(testCase.enabled);
        });
        it(`visible for ${testCase.state}`, () => {
          expect(state.visible).toBe(testCase.visible);
        });
      });
    });

    describe("should set Discard Existing Document state", () => {
      const testCases = new Set<{ state: ViewModels.DocumentExplorerState; enabled: boolean; visible: boolean }>();
      testCases.add({ state: ViewModels.DocumentExplorerState.noDocumentSelected, enabled: false, visible: false });
      testCases.add({ state: ViewModels.DocumentExplorerState.newDocumentValid, enabled: false, visible: false });
      testCases.add({ state: ViewModels.DocumentExplorerState.newDocumentInvalid, enabled: false, visible: false });
      testCases.add({
        state: ViewModels.DocumentExplorerState.exisitingDocumentNoEdits,
        enabled: false,
        visible: true,
      });
      testCases.add({
        state: ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid,
        enabled: true,
        visible: true,
      });
      testCases.add({
        state: ViewModels.DocumentExplorerState.exisitingDocumentDirtyInvalid,
        enabled: true,
        visible: true,
      });

      testCases.forEach((testCase) => {
        const state = getDiscardExistingDocumentChangesButtonState(testCase.state);
        it(`enable for ${testCase.state}`, () => {
          expect(state.enabled).toBe(testCase.enabled);
        });
        it(`visible for ${testCase.state}`, () => {
          expect(state.visible).toBe(testCase.visible);
        });
      });
    });

    describe("should set Delete Existing Document state", () => {
      const testCases = new Set<{ state: ViewModels.DocumentExplorerState; enabled: boolean; visible: boolean }>();
      testCases.add({ state: ViewModels.DocumentExplorerState.noDocumentSelected, enabled: false, visible: false });
      testCases.add({ state: ViewModels.DocumentExplorerState.newDocumentValid, enabled: false, visible: false });
      testCases.add({ state: ViewModels.DocumentExplorerState.newDocumentInvalid, enabled: false, visible: false });
      testCases.add({ state: ViewModels.DocumentExplorerState.exisitingDocumentNoEdits, enabled: true, visible: true });
      testCases.add({
        state: ViewModels.DocumentExplorerState.exisitingDocumentDirtyValid,
        enabled: true,
        visible: true,
      });
      testCases.add({
        state: ViewModels.DocumentExplorerState.exisitingDocumentDirtyInvalid,
        enabled: true,
        visible: true,
      });

      testCases.forEach((testCase) => {
        const state = getDeleteExistingDocumentButtonState(testCase.state, new Set<TableRowId>());
        it(`enable for ${testCase.state} (no selected rows)`, () => {
          expect(state.enabled).toBe(testCase.enabled);
        });
        it(`visible for ${testCase.state} (no selected rows)`, () => {
          expect(state.visible).toBe(false);
        });

        // state = getDeleteExistingDocumentButtonState(testCase.state, new Set<TableRowId>([2, 1]));
        // it(`enable for ${testCase.state} (2 selected rows)`, () => {
        //   expect(state.enabled).toBe(testCase.enabled);
        // });
        // it(`visible for ${testCase.state} (2 selected rows)`, () => {
        //   expect(state.visible).toBe(testCase.visible);
        // });
      });
    });
  });

  it("Do not get tabs button for Fabric readonly", () => {
    updateConfigContext({ platform: Platform.Fabric });
    updateUserContext({
      fabricContext: {
        connectionId: "test",
        databaseConnectionInfo: undefined,
        isReadOnly: true,
        isVisible: true,
      },
    });

    const buttons = getTabsButtons({} as ButtonsDependencies);
    expect(buttons.length).toBe(0);
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
      isTabActive: true,
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

  describe("Command bar buttons", () => {
    const createMockProps = (): IDocumentsTabComponentProps => ({
      isPreferredApiMongoDB: false,
      documentIds: [],
      collection: {
        id: ko.observable<string>("foo"),
        container: new Explorer(),
        partitionKey: {
          kind: "MultiHash",
          paths: ["/pkey1", "/pkey2", "/pkey3"],
          version: 2,
        },
        partitionKeyProperties: ["pkey1", "pkey2", "pkey3"],
        partitionKeyPropertyHeaders: ["/pkey1", "/pkey2", "/pkey3"],
      } as ViewModels.CollectionBase,
      partitionKey: undefined,
      onLoadStartKey: 0,
      tabTitle: "",
      onExecutionErrorChange: (isExecutionError: boolean): void => {
        isExecutionError;
      },
      onIsExecutingChange: (isExecuting: boolean): void => {
        isExecuting;
      },
      isTabActive: true,
    });

    let wrapper: ReactWrapper;

    beforeEach(async () => {
      updateConfigContext({ platform: Platform.Hosted });

      const props: IDocumentsTabComponentProps = createMockProps();

      wrapper = mount(<DocumentsTabComponent {...props} />);
      wrapper = await waitForComponentToPaint(wrapper);
    });

    afterEach(() => {
      wrapper.unmount();
    });

    it("clicking on New Document should show editor with new document", async () => {
      useCommandBar
        .getState()
        .contextButtons.find((button) => button.id === NEW_DOCUMENT_BUTTON_ID)
        .onCommandClick(undefined);
      wrapper = await waitForComponentToPaint(wrapper);
      expect(wrapper.findWhere((node) => node.text().includes("replace_with_new_document_id")).exists()).toBeTruthy();
    });
  });
});
