import { deleteDocuments } from "Common/MongoProxyClient";
import { Platform, updateConfigContext } from "ConfigContext";
import { EditorReactProps } from "Explorer/Controls/Editor/EditorReact";
import { useCommandBar } from "Explorer/Menus/CommandBar/CommandBarComponentAdapter";
import {
  DELETE_BUTTON_ID,
  DISCARD_BUTTON_ID,
  DocumentsTabComponent,
  IDocumentsTabComponentProps,
  NEW_DOCUMENT_BUTTON_ID,
  SAVE_BUTTON_ID,
  UPDATE_BUTTON_ID,
  buildQuery,
} from "Explorer/Tabs/DocumentsTabV2/DocumentsTabV2";
import { ReactWrapper, ShallowWrapper, mount } from "enzyme";
import * as ko from "knockout";
import React from "react";
import { act } from "react-dom/test-utils";
import * as ViewModels from "../../../Contracts/ViewModels";
import Explorer from "../../Explorer";

jest.mock("rx-jupyter", () => ({
  sessions: {
    create: jest.fn(),
  },
  contents: {
    JupyterContentProvider: jest.fn().mockImplementation(() => ({})),
  },
}));

jest.requireActual("Explorer/Controls/Editor/EditorReact");

const PROPERTY_VALUE = "__SOME_PROPERTY_VALUE__";

jest.mock("Common/MongoProxyClient", () => ({
  queryDocuments: jest.fn(() =>
    Promise.resolve({
      continuationToken: "",
      documents: [
        {
          _rid: "_rid",
          _self: "_self",
          _etag: "etag",
          _ts: 1234,
          id: "id",
        },
      ],
      headers: {},
    }),
  ),
  readDocument: jest.fn(() =>
    Promise.resolve({
      _rid: "_rid1",
      _self: "_self1",
      _etag: "etag1",
      property: PROPERTY_VALUE,
      _ts: 5678,
      id: "id1",
    }),
  ),
  deleteDocuments: jest.fn(() => Promise.resolve({ deleteCount: 0, isAcknowledged: true })),
  ThrottlingError: Error,
  useMongoProxyEndpoint: jest.fn(() => true),
}));

jest.mock("Explorer/Controls/Editor/EditorReact", () => ({
  EditorReact: (props: EditorReactProps) => <>{props.content}</>,
}));

jest.mock("Explorer/Controls/Dialog", () => ({
  useDialog: {
    getState: jest.fn(() => ({
      showOkCancelModalDialog: (title: string, subText: string, okLabel: string, onOk: () => void) => onOk(),
      showOkModalDialog: () => {},
    })),
  },
}));

// Added as recent change to @azure/core-util would cause randomUUID() to throw an error during jest tests.
// TODO: when not using beta version of @azure/cosmos sdk try removing this
jest.mock("@azure/core-util", () => ({
  ...jest.requireActual("@azure/core-util"),
  randomUUID: jest.fn(),
}));

async function waitForComponentToPaint<P = unknown>(wrapper: ReactWrapper<P> | ShallowWrapper<P>, amount = 0) {
  let newWrapper;
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, amount));
    newWrapper = wrapper.update();
  });
  return newWrapper;
}

describe("Documents tab (Mongo API)", () => {
  describe("buildQuery", () => {
    it("should generate the right select query for SQL API", () => {
      expect(buildQuery(true, "")).toContain("{}");
    });
  });

  describe("Command bar buttons", () => {
    const createMockProps = (): IDocumentsTabComponentProps => ({
      isPreferredApiMongoDB: true,
      documentIds: [],
      collection: {
        id: ko.observable<string>("foo"),
        container: new Explorer(),
        partitionKey: {
          kind: "Hash",
          paths: ["/pkey"],
          version: 2,
        },
        partitionKeyProperties: ["pkey"],
        partitionKeyPropertyHeaders: ["/pkey"],
        databaseId: "databaseId",
        self: "self",
        rawDataModel: undefined,
        selectedSubnodeKind: undefined,
        children: undefined,
        isCollectionExpanded: undefined,
        onDocumentDBDocumentsClick: (): void => {
          throw new Error("Function not implemented.");
        },
        onNewQueryClick: (): void => {
          throw new Error("Function not implemented.");
        },
        expandCollection: (): void => {
          throw new Error("Function not implemented.");
        },
        collapseCollection: (): void => {
          throw new Error("Function not implemented.");
        },
        getDatabase: (): ViewModels.Database => {
          throw new Error("Function not implemented.");
        },
        nodeKind: "nodeKind",
        rid: "rid",
      },
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

      // Wait for all pending promises
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Wait for any async operations to complete
      wrapper = await waitForComponentToPaint(wrapper, 100);
    }, 10000);

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

    it("clicking Delete Document eventually calls delete client api", () => {
      const mockDeleteDocuments = deleteDocuments as jest.Mock;
      mockDeleteDocuments.mockClear();

      act(() => {
        useCommandBar
          .getState()
          .contextButtons.find((button) => button.id === DELETE_BUTTON_ID)
          .onCommandClick(undefined);
      });

      expect(mockDeleteDocuments).toHaveBeenCalled();
    });
  });
});
