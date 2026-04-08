import { render } from "@testing-library/react";
import { IQueryTabComponentProps, QueryTabComponent } from "Explorer/Tabs/QueryTab/QueryTabComponent";
import React from "react";

jest.mock("Explorer/Controls/Editor/EditorReact");

jest.mock("Shared/AppStatePersistenceUtility", () => ({
  loadState: jest.fn(),
  AppStateComponentNames: {},
  readSubComponentState: jest.fn(),
}));

describe("QueryTabComponent", () => {
  afterEach(() => jest.clearAllMocks());

  it("should render without crashing", () => {
    const propsMock: Readonly<IQueryTabComponentProps> = {
      collection: { databaseId: "testDb", id: () => "testContainer" },
      onTabAccessor: () => jest.fn(),
      isExecutionError: false,
      tabId: "mockTabId",
      tabsBaseInstance: {
        updateNavbarWithTabsButtons: () => jest.fn(),
      },
    } as unknown as IQueryTabComponentProps;

    const { container } = render(<QueryTabComponent {...propsMock} />);
    expect(container).toBeTruthy();
  });
});
