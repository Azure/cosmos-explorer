import { FeedResponse, ItemDefinition, Resource } from "@azure/cosmos";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as MongoProxyClient from "Common/MongoProxyClient";
import { deleteDocuments } from "Common/dataAccess/deleteDocument";
import { queryDocuments } from "Common/dataAccess/queryDocuments";
import { readDocument } from "Common/dataAccess/readDocument";
import { updateDocument } from "Common/dataAccess/updateDocument";
import { Platform, updateConfigContext } from "ConfigContext";
import { CosmosDbArtifactType } from "Contracts/FabricMessagesContract";
import { useDialog } from "Explorer/Controls/Dialog";
import { EditorReact, EditorReactProps } from "Explorer/Controls/Editor/EditorReact";
import { ProgressModalDialog } from "Explorer/Controls/ProgressModalDialog";
import { useCommandBar } from "Explorer/Menus/CommandBar/CommandBarComponentAdapter";
import {
  ButtonsDependencies,
  DELETE_BUTTON_ID,
  DISCARD_BUTTON_ID,
  DocumentsTabComponent,
  IDocumentsTabComponentProps,
  NEW_DOCUMENT_BUTTON_ID,
  SAVE_BUTTON_ID,
  UPDATE_BUTTON_ID,
  UPLOAD_BUTTON_ID,
  addStringsNoDuplicate,
  buildQuery,
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
import { DatabaseAccount, DocumentId } from "../../../Contracts/DataModels";
import * as ViewModels from "../../../Contracts/ViewModels";
import { updateUserContext } from "../../../UserContext";
import Explorer from "../../Explorer";

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
        correlatedActivityId: undefined,
      }),
  })),
}));

const PROPERTY_VALUE = "__SOME_PROPERTY_VALUE__";
jest.mock("Common/dataAccess/readDocument", () => ({
  readDocument: jest.fn(() =>
    Promise.resolve({
      container: undefined,
      id: "id",
      property: PROPERTY_VALUE,
    }),
  ),
}));

jest.mock("Common/dataAccess/updateDocument", () => ({
  updateDocument: jest.fn(),
}));

jest.mock("Explorer/Controls/Editor/EditorReact", () => ({
  EditorReact: jest.fn((props: EditorReactProps) => <>{props.content}</>),
}));

const mockDialogState = {
  showOkCancelModalDialog: jest.fn((title: string, subText: string, okLabel: string, onOk: () => void) => onOk()),
  showOkModalDialog: () => {},
};

jest.mock("Explorer/Controls/Dialog", () => ({
  useDialog: {
    getState: jest.fn(() => mockDialogState),
  },
}));

jest.mock("Common/dataAccess/deleteDocument", () => ({
  deleteDocuments: jest.fn((collection: ViewModels.CollectionBase, documentIds: DocumentId[]) =>
    Promise.resolve(documentIds),
  ),
}));

jest.mock("Explorer/Controls/ProgressModalDialog", () => ({
  ProgressModalDialog: jest.fn(() => <></>),
}));

async function waitForComponentToPaint<P = unknown>(wrapper: ReactWrapper<P> | ShallowWrapper<P>, amount = 0) {
  let newWrapper;
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, amount));
    newWrapper = wrapper.update();
  });
  return newWrapper;
}

describe("Documents tab (noSql API)", () => {
  describe("buildQuery", () => {
    it("should generate the right select query for SQL API", () => {
      expect(
        buildQuery(false, "", ["pk"], {
          paths: ["pk"],
          kind: "Hash",
          version: 2,
        }),
      ).toContain("select");
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
        state: ViewModels.DocumentExplorerState.existingDocumentNoEdits,
        enabled: false,
        visible: false,
      });
      testCases.add({
        state: ViewModels.DocumentExplorerState.existingDocumentDirtyValid,
        enabled: false,
        visible: false,
      });
      testCases.add({
        state: ViewModels.DocumentExplorerState.existingDocumentDirtyInvalid,
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
        state: ViewModels.DocumentExplorerState.existingDocumentNoEdits,
        enabled: false,
        visible: false,
      });
      testCases.add({
        state: ViewModels.DocumentExplorerState.existingDocumentDirtyValid,
        enabled: false,
        visible: false,
      });
      testCases.add({
        state: ViewModels.DocumentExplorerState.existingDocumentDirtyInvalid,
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
        state: ViewModels.DocumentExplorerState.existingDocumentNoEdits,
        enabled: false,
        visible: true,
      });
      testCases.add({
        state: ViewModels.DocumentExplorerState.existingDocumentDirtyValid,
        enabled: true,
        visible: true,
      });
      testCases.add({
        state: ViewModels.DocumentExplorerState.existingDocumentDirtyInvalid,
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
        state: ViewModels.DocumentExplorerState.existingDocumentNoEdits,
        enabled: false,
        visible: true,
      });
      testCases.add({
        state: ViewModels.DocumentExplorerState.existingDocumentDirtyValid,
        enabled: true,
        visible: true,
      });
      testCases.add({
        state: ViewModels.DocumentExplorerState.existingDocumentDirtyInvalid,
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
      testCases.add({ state: ViewModels.DocumentExplorerState.existingDocumentNoEdits, enabled: true, visible: true });
      testCases.add({
        state: ViewModels.DocumentExplorerState.existingDocumentDirtyValid,
        enabled: true,
        visible: true,
      });
      testCases.add({
        state: ViewModels.DocumentExplorerState.existingDocumentDirtyInvalid,
        enabled: true,
        visible: true,
      });
    });
  });

  it("Do not get tabs button for Fabric readonly", () => {
    updateConfigContext({ platform: Platform.Fabric });
    updateUserContext({
      fabricContext: {
        databaseName: "database",
        artifactInfo: {
          connectionId: "test",
          resourceTokenInfo: undefined,
        },
        artifactType: CosmosDbArtifactType.MIRRORED_KEY,
        isReadOnly: true,
        isVisible: true,
        fabricClientRpcVersion: "rpcVersion",
      },
    });

    const buttons = getTabsButtons({} as ButtonsDependencies);
    expect(buttons.length).toBe(0);
  });

  describe("when rendered", () => {
    const createMockProps = (): IDocumentsTabComponentProps => ({
      isPreferredApiMongoDB: false,
      documentIds: [],
      collection: {
        id: ko.observable<string>("collectionId"),
        databaseId: "databaseId",
      } as ViewModels.CollectionBase,
      partitionKey: { kind: "Hash", paths: ["/foo"], version: 2 },
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

    beforeEach(async () => {
      const props: IDocumentsTabComponentProps = createMockProps();
      wrapper = shallow(<DocumentsTabComponent {...props} />);
    });

    afterEach(() => {
      wrapper.unmount();
    });

    it("should render the page", () => {
      expect(wrapper).toMatchSnapshot();
    });
  });

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

  describe("Pending document reads", () => {
    beforeEach(() => {
      updateConfigContext({ platform: Platform.Hosted });
      jest.mocked(readDocument).mockClear();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it.each([
      { api: "SQL", isPreferredApiMongoDB: false, content: '{"id":"id","property":"edited-content"}' },
      { api: "SQL", isPreferredApiMongoDB: false, content: '{"id":"id","property":' },
      { api: "Mongo", isPreferredApiMongoDB: true, content: '{"id":"id","property":"edited-content"}' },
      { api: "Mongo", isPreferredApiMongoDB: true, content: '{"id":"id","property":' },
      { api: "SQL", isPreferredApiMongoDB: false, content: undefined },
      { api: "Mongo", isPreferredApiMongoDB: true, content: undefined },
    ])("$api handles a content notification during a reread: $content", async ({ isPreferredApiMongoDB, content }) => {
      let completeRead: (document: { id: string; property: string }) => void;
      const pendingRead = new Promise<{ id: string; property: string }>((resolve) => {
        completeRead = resolve;
      });
      const readDocumentMock = (
        isPreferredApiMongoDB ? jest.spyOn(MongoProxyClient, "readDocument") : readDocument
      ) as jest.Mock<Promise<unknown>>;
      readDocumentMock.mockResolvedValueOnce({ id: "id", property: "initial-content" });
      readDocumentMock.mockReturnValueOnce(pendingRead);
      if (isPreferredApiMongoDB) {
        const mongoDocument = { id: "id", _id: "id", _rid: "rid", _self: "self", _etag: "etag", _ts: 123 };
        jest.spyOn(MongoProxyClient, "queryDocuments").mockResolvedValue({
          documents: [mongoDocument],
          continuationToken: undefined,
          headers: new Headers(),
        });
      }

      render(<DocumentsTabComponent {...createMockProps()} isPreferredApiMongoDB={isPreferredApiMongoDB} />);
      await screen.findByText(/initial-content/);
      fireEvent.click(screen.getByRole("cell", { name: "id", exact: true }));
      await waitFor(() => expect(readDocumentMock).toHaveBeenCalledTimes(2));
      act(() => {
        const editorProps = jest.mocked(EditorReact).mock.lastCall[0];
        editorProps.onContentChanged(content ?? editorProps.content);
      });

      await act(async () => {
        completeRead({ id: "id", property: "reread-content" });
        await pendingRead;
      });

      const expectedRereadContent = expect.stringContaining("reread-content");
      expect(jest.mocked(EditorReact).mock.lastCall[0].content).toEqual(content ?? expectedRereadContent);
      expect(useCommandBar.getState().contextButtons.find((button) => button.id === DISCARD_BUTTON_ID)).toMatchObject({
        disabled: content === undefined,
      });
      expect(useCommandBar.getState().contextButtons.find((button) => button.id === SAVE_BUTTON_ID)).toBeUndefined();
    });

    it("keeps a completed update when an earlier reread completes", async () => {
      let completeRead: (document: { id: string; property: string }) => void;
      const pendingRead = new Promise<{ id: string; property: string }>((resolve) => {
        completeRead = resolve;
      });
      const readDocumentMock = readDocument as jest.Mock<Promise<unknown>>;
      readDocumentMock.mockResolvedValueOnce({ id: "id", property: "initial-content" });
      readDocumentMock.mockReturnValueOnce(pendingRead);
      const updateDocumentMock = updateDocument as jest.Mock<Promise<unknown>>;
      updateDocumentMock.mockClear();
      updateDocumentMock.mockResolvedValueOnce({ id: "id", _rid: "rid", property: "saved-content" });

      render(<DocumentsTabComponent {...createMockProps()} />);
      await screen.findByText(/initial-content/);
      fireEvent.click(screen.getByRole("cell", { name: "id", exact: true }));
      await waitFor(() => expect(readDocumentMock).toHaveBeenCalledTimes(2));
      act(() => {
        jest.mocked(EditorReact).mock.lastCall[0].onContentChanged('{"id":"id","property":"saved-content"}');
      });
      await act(async () => {
        await useCommandBar
          .getState()
          .contextButtons.find((button) => button.id === UPDATE_BUTTON_ID)
          .onCommandClick(undefined);
      });

      expect(updateDocumentMock).toHaveBeenCalledTimes(1);
      expect(jest.mocked(EditorReact).mock.lastCall[0].content).toContain("saved-content");
      await act(async () => {
        completeRead({ id: "id", property: "stale-content" });
        await pendingRead;
      });

      expect(jest.mocked(EditorReact).mock.lastCall[0].content).toContain("saved-content");
      expect(useCommandBar.getState().contextButtons.find((button) => button.id === DISCARD_BUTTON_ID)).toMatchObject({
        disabled: true,
      });
    });

    it("keeps the editor cleared when a draft is discarded", async () => {
      render(<DocumentsTabComponent {...createMockProps()} />);
      await screen.findByText(new RegExp(PROPERTY_VALUE));

      act(() => {
        useCommandBar
          .getState()
          .contextButtons.find((button) => button.id === NEW_DOCUMENT_BUTTON_ID)
          .onCommandClick(undefined);
      });
      act(() => {
        useCommandBar
          .getState()
          .contextButtons.find((button) => button.id === DISCARD_BUTTON_ID)
          .onCommandClick(undefined);
      });

      expect(screen.queryByText(/replace_with_new_document_id/)).toBeNull();
      expect(useCommandBar.getState().contextButtons.find((button) => button.id === UPDATE_BUTTON_ID)).toBeUndefined();
      expect(useCommandBar.getState().contextButtons.find((button) => button.id === SAVE_BUTTON_ID)).toBeUndefined();
    });

    it.each([
      { api: "SQL", isPreferredApiMongoDB: false, action: "deselection" },
      { api: "SQL", isPreferredApiMongoDB: false, action: "an empty filter result" },
      { api: "Mongo", isPreferredApiMongoDB: true, action: "deselection" },
      { api: "Mongo", isPreferredApiMongoDB: true, action: "an empty filter result" },
    ])("$api keeps the editor cleared after $action", async ({ isPreferredApiMongoDB, action }) => {
      let completeRead: (document: { id: string; property: string }) => void;
      const pendingRead = new Promise<{ id: string; property: string }>((resolve) => {
        completeRead = resolve;
      });
      const readDocumentMock = (
        isPreferredApiMongoDB ? jest.spyOn(MongoProxyClient, "readDocument") : readDocument
      ) as jest.Mock<Promise<unknown>>;
      readDocumentMock.mockReturnValueOnce(pendingRead);
      if (isPreferredApiMongoDB) {
        const mongoDocument = { id: "id", _id: "id", _rid: "rid", _self: "self", _etag: "etag", _ts: 123 };
        jest.spyOn(MongoProxyClient, "queryDocuments").mockResolvedValue({
          documents: [mongoDocument],
          continuationToken: undefined,
          headers: new Headers(),
        });
      }

      render(<DocumentsTabComponent {...createMockProps()} isPreferredApiMongoDB={isPreferredApiMongoDB} />);
      await waitFor(() => expect(readDocumentMock).toHaveBeenCalledTimes(1));

      if (action === "deselection") {
        fireEvent.click(screen.getByRole("checkbox", { name: "Select row", exact: true }));
      } else {
        if (isPreferredApiMongoDB) {
          jest.mocked(MongoProxyClient.queryDocuments).mockResolvedValueOnce({
            documents: [],
            continuationToken: undefined,
            headers: new Headers(),
          });
        } else {
          const queryDocumentsMock = queryDocuments as jest.Mock<unknown>;
          queryDocumentsMock.mockReturnValueOnce({
            fetchNext: () => Promise.resolve({ resources: [], hasMoreResults: false }),
          });
        }
        fireEvent.click(screen.getByRole("button", { name: "Apply Filter", exact: true }));
      }

      await waitFor(() =>
        expect(screen.queryAllByRole("cell", { name: "id", exact: true })).toHaveLength(
          action === "deselection" ? 1 : 0,
        ),
      );
      expect(useCommandBar.getState().contextButtons.find((button) => button.id === UPDATE_BUTTON_ID)).toBeUndefined();
      await act(async () => {
        completeRead({ id: "id", property: PROPERTY_VALUE });
        await pendingRead;
      });

      expect(readDocumentMock).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(new RegExp(PROPERTY_VALUE))).toBeNull();
      expect(useCommandBar.getState().contextButtons.find((button) => button.id === UPDATE_BUTTON_ID)).toBeUndefined();
      expect(useCommandBar.getState().contextButtons.find((button) => button.id === SAVE_BUTTON_ID)).toBeUndefined();
    });

    it.each([
      { api: "SQL", isPreferredApiMongoDB: false, editDraft: false },
      { api: "SQL", isPreferredApiMongoDB: false, editDraft: true },
      { api: "Mongo", isPreferredApiMongoDB: true, editDraft: false },
      { api: "Mongo", isPreferredApiMongoDB: true, editDraft: true },
    ])(
      "$api keeps a new draft when an earlier document read completes (edited: $editDraft)",
      async ({ isPreferredApiMongoDB, editDraft }) => {
        let completeRead: (document: { id: string; property: string }) => void;
        const pendingRead = new Promise<{ id: string; property: string }>((resolve) => {
          completeRead = resolve;
        });
        const readDocumentMock = (
          isPreferredApiMongoDB ? jest.spyOn(MongoProxyClient, "readDocument") : readDocument
        ) as jest.Mock<Promise<unknown>>;
        readDocumentMock.mockReturnValueOnce(pendingRead);
        if (isPreferredApiMongoDB) {
          const mongoDocument = { id: "id", _id: "id", _rid: "rid", _self: "self", _etag: "etag", _ts: 123 };
          jest.spyOn(MongoProxyClient, "queryDocuments").mockResolvedValue({
            documents: [mongoDocument],
            continuationToken: undefined,
            headers: new Headers(),
          });
        }

        render(<DocumentsTabComponent {...createMockProps()} isPreferredApiMongoDB={isPreferredApiMongoDB} />);
        await waitFor(() => expect(readDocumentMock).toHaveBeenCalledTimes(1));

        act(() => {
          useCommandBar
            .getState()
            .contextButtons.find((button) => button.id === NEW_DOCUMENT_BUTTON_ID)
            .onCommandClick(undefined);
        });
        expect(screen.getByText(/replace_with_new_document_id/)).toBeDefined();
        if (editDraft) {
          act(() => {
            jest.mocked(EditorReact).mock.lastCall[0].onContentChanged('{"id":"edited-draft"}');
          });
        }

        await act(async () => {
          completeRead({ id: "id", property: PROPERTY_VALUE });
          await pendingRead;
        });

        expect(screen.getByText(editDraft ? /edited-draft/ : /replace_with_new_document_id/)).toBeDefined();
        expect(useCommandBar.getState().contextButtons.find((button) => button.id === SAVE_BUTTON_ID)).toBeDefined();
        expect(
          useCommandBar.getState().contextButtons.find((button) => button.id === UPDATE_BUTTON_ID),
        ).toBeUndefined();
      },
    );

    it("keeps the newer read when document reads complete out of order", async () => {
      let completeRead: (document: { id: string; property: string }) => void;
      const pendingRead = new Promise<{ id: string; property: string }>((resolve) => {
        completeRead = resolve;
      });
      const readDocumentMock = readDocument as jest.Mock<Promise<unknown>>;
      readDocumentMock.mockReturnValueOnce(pendingRead);
      readDocumentMock.mockResolvedValueOnce({ id: "id", property: "newer-content" });

      render(<DocumentsTabComponent {...createMockProps()} />);
      await waitFor(() => expect(readDocumentMock).toHaveBeenCalledTimes(1));
      fireEvent.click(screen.getByRole("cell", { name: "id", exact: true }));
      await waitFor(() => expect(readDocumentMock).toHaveBeenCalledTimes(2));
      await screen.findByText(/newer-content/);

      await act(async () => {
        completeRead({ id: "id", property: "older-content" });
        await pendingRead;
      });

      expect(screen.getByText(/newer-content/)).toBeDefined();
      expect(screen.queryByText(/older-content/)).toBeNull();
      expect(useCommandBar.getState().contextButtons.find((button) => button.id === UPDATE_BUTTON_ID)).toBeDefined();
      expect(useCommandBar.getState().contextButtons.find((button) => button.id === SAVE_BUTTON_ID)).toBeUndefined();
    });
  });

  describe("Command bar buttons", () => {
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

    it("renders by default the first document", async () => {
      expect(wrapper.findWhere((node) => node.text().includes(PROPERTY_VALUE)).exists()).toBeTruthy();
    });

    it("default buttons", async () => {
      expect(useCommandBar.getState().contextButtons.find((button) => button.id === UPDATE_BUTTON_ID)).toBeDefined();
      expect(useCommandBar.getState().contextButtons.find((button) => button.id === DISCARD_BUTTON_ID)).toBeDefined();
      expect(useCommandBar.getState().contextButtons.find((button) => button.id === DELETE_BUTTON_ID)).toBeDefined();
      expect(useCommandBar.getState().contextButtons.find((button) => button.id === UPLOAD_BUTTON_ID)).toBeDefined();
    });

    it("clicking on New Document should show editor with new document", () => {
      act(() => {
        useCommandBar
          .getState()
          .contextButtons.find((button) => button.id === NEW_DOCUMENT_BUTTON_ID)
          .onCommandClick(undefined);
      });
      expect(wrapper.findWhere((node) => node.text().includes("replace_with_new_document_id")).exists()).toBeTruthy();
    });

    it("clicking on New Document should show Save and Discard buttons", () => {
      act(() => {
        useCommandBar
          .getState()
          .contextButtons.find((button) => button.id === NEW_DOCUMENT_BUTTON_ID)
          .onCommandClick(undefined);
      });

      expect(useCommandBar.getState().contextButtons.find((button) => button.id === SAVE_BUTTON_ID)).toBeDefined();
      expect(useCommandBar.getState().contextButtons.find((button) => button.id === DISCARD_BUTTON_ID)).toBeDefined();
    });

    it("clicking Delete Document asks for confirmation", async () => {
      act(async () => {
        await useCommandBar
          .getState()
          .contextButtons.find((button) => button.id === DELETE_BUTTON_ID)
          .onCommandClick(undefined);
      });

      expect(useDialog.getState().showOkCancelModalDialog).toHaveBeenCalled();
    });

    it("clicking Delete Document for NoSql shows progress dialog", () => {
      act(() => {
        useCommandBar
          .getState()
          .contextButtons.find((button) => button.id === DELETE_BUTTON_ID)
          .onCommandClick(undefined);
      });

      expect(ProgressModalDialog).toHaveBeenCalled();
    });

    it("clicking Delete Document eventually calls delete client api", () => {
      const mockDeleteDocuments = deleteDocuments as jest.Mock;
      mockDeleteDocuments.mockClear();

      act(() => {
        useCommandBar
          .getState()
          .contextButtons.find((button) => button.id === DELETE_BUTTON_ID)
          .onCommandClick(undefined);
      });

      // The implementation uses setTimeout, so wait for it to finish
      waitFor(() => expect(mockDeleteDocuments).toHaveBeenCalled());
    });
  });
});

describe("Documents tab", () => {
  it("should add strings to array without duplicate", () => {
    const array1 = ["a", "b", "c"];
    const array2 = ["b", "c", "d"];

    const array3 = addStringsNoDuplicate(array1, array2);
    expect(array3).toEqual(["a", "b", "c", "d"]);
  });
});
