import { fireEvent, render } from "@testing-library/react";
import QueryTabComponent, { IQueryTabComponentProps } from "Explorer/Tabs/QueryTab/QueryTabComponent";
import { useQueryCopilot } from "hooks/useQueryCopilot";
import React from "react";

jest.mock("Explorer/Controls/Editor/EditorReact");

describe("QueryTabComponent", () => {
  const mockStore = useQueryCopilot.getState();
  beforeEach(() => {
    mockStore.showCopilotSidebar = false;
    mockStore.setShowCopilotSidebar = jest.fn();
  });
  beforeEach(() => jest.clearAllMocks());

  it("should launch Copilot when ALT+C is pressed", () => {
    let mock: Readonly<IQueryTabComponentProps> = ({
      collection: { databaseId: "CopilotSampleDb" },
      onTabAccessor: () => {},
      isExecutionError: false,
      tabId: "mockTabId",
      tabsBaseInstance: {
        updateNavbarWithTabsButtons: () => {},
      },
    } as unknown) as IQueryTabComponentProps;

    const { container } = render(<QueryTabComponent {...mock} />);

    const launchCopilotButton = container.querySelector(".queryEditorWatermarkText");
    fireEvent.keyDown(launchCopilotButton, { key: "c", altKey: true });

    expect(mockStore.setShowCopilotSidebar).toHaveBeenCalledWith(true);
  });
});
