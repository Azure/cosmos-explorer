import { useTabs } from "hooks/useTabs";
import * as ko from "knockout";
import * as ViewModels from "../../../Contracts/ViewModels";
import { DocumentsTabV2 } from "./DocumentsTabV2";

jest.mock("hooks/useTabs", () => ({
  useTabs: {
    getState: jest.fn(),
  },
}));

jest.mock("UserContext", () => ({
  userContext: { apiType: "SQL" },
}));

jest.mock("Explorer/Menus/CommandBar/CommandBarComponentAdapter", () => ({
  useCommandBar: { getState: jest.fn(() => ({ setContextButtons: jest.fn() })) },
}));

jest.mock("Explorer/Controls/Editor/EditorReact", () => ({
  EditorReact: () => null,
}));

const mockCollection = {
  id: ko.observable<string>("testContainer"),
  databaseId: "testDb",
  partitionKey: { paths: ["/pk"], kind: "Hash", version: 2 },
  selectedSubnodeKind: jest.fn(),
  container: {},
} as unknown as ViewModels.Collection;

const buildTab = () =>
  new DocumentsTabV2({
    partitionKey: mockCollection.partitionKey,
    documentIds: ko.observableArray([]),
    tabKind: ViewModels.CollectionTabKind.Documents,
    title: "Items",
    collection: mockCollection,
    node: mockCollection,
    tabPath: "testDb>testContainer>Documents",
  });

describe("DocumentsTabV2.duplicateTab", () => {
  let activateNewTab: jest.Mock;

  beforeEach(() => {
    activateNewTab = jest.fn();
    (useTabs.getState as jest.Mock).mockReturnValue({ activateNewTab });
  });

  afterEach(() => jest.clearAllMocks());

  it("calls activateNewTab with a new DocumentsTabV2 instance", () => {
    const tab = buildTab();
    tab.duplicateTab();

    expect(activateNewTab).toHaveBeenCalledTimes(1);
    const newTab = activateNewTab.mock.calls[0][0];
    expect(newTab).toBeInstanceOf(DocumentsTabV2);
  });

  it("creates a duplicate with the same collection", () => {
    const tab = buildTab();
    tab.duplicateTab();

    const newTab = activateNewTab.mock.calls[0][0] as DocumentsTabV2;
    expect(newTab.collection).toBe(mockCollection);
  });

  it("creates a duplicate with the same partitionKey", () => {
    const tab = buildTab();
    tab.duplicateTab();

    const newTab = activateNewTab.mock.calls[0][0] as DocumentsTabV2;
    expect(newTab.partitionKey).toEqual(mockCollection.partitionKey);
  });

  it("creates a distinct tab instance", () => {
    const tab = buildTab();
    tab.duplicateTab();

    const newTab = activateNewTab.mock.calls[0][0];
    expect(newTab).not.toBe(tab);
  });

  it("preserves the raw title (not the display title) to avoid double-prefixing", () => {
    const tab = buildTab();
    tab.duplicateTab();

    const newTab = activateNewTab.mock.calls[0][0] as DocumentsTabV2;
    // The original tabTitle() is "testC…Items" (collection "testContainer" is > 8 chars so it's truncated).
    // If duplicateTab() incorrectly used tabTitle() as the new title, the duplicate's tabTitle()
    // would double-prefix to "testC…testC…Items". Using the raw title "Items" keeps it "testC…Items".
    expect(newTab.tabTitle()).toBe("testC\u2026Items");
  });
});
