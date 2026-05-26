import { useTabs } from "hooks/useTabs";
import * as ko from "knockout";
import * as ViewModels from "../../../Contracts/ViewModels";
import { IQueryTabProps, NewQueryTab } from "./QueryTab";

jest.mock("hooks/useTabs", () => ({
  useTabs: {
    getState: jest.fn(),
  },
}));

jest.mock("Explorer/Menus/CommandBar/CommandBarComponentAdapter", () => ({
  useCommandBar: { getState: jest.fn(() => ({ setContextButtons: jest.fn() })) },
}));

jest.mock("Shared/AppStatePersistenceUtility", () => ({
  loadState: jest.fn(),
  AppStateComponentNames: {},
  readSubComponentState: jest.fn(),
}));

jest.mock("Common/MessageHandler", () => ({
  sendMessage: jest.fn(),
}));

const mockCollection = {
  id: ko.observable<string>("testContainer"),
  databaseId: "testDb",
  partitionKey: { paths: ["/pk"], kind: "Hash", version: 2 },
  selectedSubnodeKind: jest.fn(),
  container: {},
} as unknown as ViewModels.Collection;

const mockProps = { container: {} as IQueryTabProps["container"] };

const buildTab = (queryText = "SELECT * FROM c") =>
  new NewQueryTab(
    {
      tabKind: ViewModels.CollectionTabKind.Query,
      title: "Query 1",
      tabPath: "",
      collection: mockCollection,
      node: mockCollection,
      queryText,
      partitionKey: mockCollection.partitionKey,
    },
    mockProps,
  );

describe("NewQueryTab.duplicateTab", () => {
  let activateNewTab: jest.Mock;
  let getTabs: jest.Mock;

  beforeEach(() => {
    activateNewTab = jest.fn();
    getTabs = jest.fn().mockReturnValue([]);
    (useTabs.getState as jest.Mock).mockReturnValue({ activateNewTab, getTabs });
  });

  afterEach(() => jest.clearAllMocks());

  it("calls activateNewTab with a new NewQueryTab instance", () => {
    const tab = buildTab();
    tab.duplicateTab();

    expect(activateNewTab).toHaveBeenCalledTimes(1);
    const newTab = activateNewTab.mock.calls[0][0];
    expect(newTab).toBeInstanceOf(NewQueryTab);
  });

  it("preserves the current query text in the duplicate", () => {
    const queryText = "SELECT * FROM c WHERE c.id = '123'";
    const tab = buildTab(queryText);
    tab.duplicateTab();

    const newTab = activateNewTab.mock.calls[0][0] as NewQueryTab;
    expect(newTab.iQueryTabComponentProps.queryText).toBe(queryText);
  });

  it("creates a duplicate with the same collection", () => {
    const tab = buildTab();
    tab.duplicateTab();

    const newTab = activateNewTab.mock.calls[0][0] as NewQueryTab;
    expect(newTab.collection).toBe(mockCollection);
  });

  it("creates a distinct tab instance", () => {
    const tab = buildTab();
    tab.duplicateTab();

    const newTab = activateNewTab.mock.calls[0][0];
    expect(newTab).not.toBe(tab);
  });

  it("assigns an auto-incremented title based on existing query tabs", () => {
    getTabs.mockReturnValue([{}, {}]); // 2 existing tabs → new title = "Query 3"
    const tab = buildTab();
    tab.duplicateTab();

    const newTab = activateNewTab.mock.calls[0][0] as NewQueryTab;
    expect(newTab.tabTitle()).toContain("Query 3");
  });
});
