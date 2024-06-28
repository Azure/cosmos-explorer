import { fireEvent, render } from "@testing-library/react";
import { CollectionTabKind } from "Contracts/ViewModels";
import { CopilotProvider } from "Explorer/QueryCopilot/QueryCopilotContext";
import { QueryCopilotPromptbar } from "Explorer/QueryCopilot/QueryCopilotPromptbar";
import { IQueryTabComponentProps, QueryTabComponent, QueryTabCopilotComponent } from "Explorer/Tabs/QueryTab/QueryTabComponent";
import TabsBase from "Explorer/Tabs/TabsBase";
import { updateUserContext, userContext } from "UserContext";
import { mount } from "enzyme";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import { useTabs } from "hooks/useTabs";
import React from "react";

jest.mock("Explorer/Controls/Editor/EditorReact");

describe("QueryTabComponent", () => {
  const mockStore = useQueryCopilot.getState();
  beforeEach(() => {
    mockStore.showCopilotSidebar = false;
    mockStore.setShowCopilotSidebar = jest.fn();
  });
  afterEach(() => jest.clearAllMocks());

  it("should launch conversational Copilot when ALT+C is pressed and when copilot version is 3", () => {
    updateUserContext({
      features: {
        ...userContext.features,
        copilotVersion: "v3.0",
      },
    });
    const propsMock: Readonly<IQueryTabComponentProps> = {
      collection: { databaseId: "CopilotSampleDb" },
      onTabAccessor: () => jest.fn(),
      isExecutionError: false,
      tabId: "mockTabId",
      tabsBaseInstance: {
        updateNavbarWithTabsButtons: () => jest.fn(),
      },
    } as unknown as IQueryTabComponentProps;

    const { container } = render(<QueryTabComponent {...propsMock} />);

    const launchCopilotButton = container.querySelector("[data-test=\"QueryTab/ResultsPane/ExecuteCTA\"]");
    fireEvent.keyDown(launchCopilotButton, { key: "c", altKey: true });

    expect(mockStore.setShowCopilotSidebar).toHaveBeenCalledWith(true);
  });

  it("copilot should be enabled by default when tab is active", () => {
    useQueryCopilot.getState().setCopilotEnabled(true);
    useQueryCopilot.getState().setCopilotUserDBEnabled(true);
    const activeTab = new TabsBase({
      tabKind: CollectionTabKind.Query,
      title: "Query",
      tabPath: "",
    });
    activeTab.tabId = "mockTabId";
    useTabs.getState().activeTab = activeTab;
    const propsMock: Readonly<IQueryTabComponentProps> = {
      collection: { databaseId: "CopilotUserDb", id: () => "CopilotUserContainer" },
      onTabAccessor: () => jest.fn(),
      isExecutionError: false,
      tabId: "mockTabId",
      tabsBaseInstance: {
        updateNavbarWithTabsButtons: () => jest.fn(),
      },
    } as unknown as IQueryTabComponentProps;

    const container = mount(
      <CopilotProvider>
        <QueryTabCopilotComponent {...propsMock} />
      </CopilotProvider>,
    );
    expect(container.find(QueryCopilotPromptbar).exists()).toBe(true);
  });
});
