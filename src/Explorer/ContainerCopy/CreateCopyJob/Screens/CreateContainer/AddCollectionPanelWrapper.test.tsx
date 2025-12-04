import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { CopyJobMigrationType } from "Explorer/ContainerCopy/Enums/CopyJobEnums";
import { CopyJobContextProviderType } from "Explorer/ContainerCopy/Types/CopyJobTypes";
import Explorer from "Explorer/Explorer";
import { useSidePanel } from "hooks/useSidePanel";
import React from "react";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import AddCollectionPanelWrapper from "./AddCollectionPanelWrapper";

// Mock the hooks
jest.mock("hooks/useSidePanel");
jest.mock("../../../Context/CopyJobContext");

// Mock the AddCollectionPanel component
jest.mock("../../../../Panes/AddCollectionPanel/AddCollectionPanel", () => ({
  AddCollectionPanel: ({
    explorer,
    isCopyJobFlow,
    onSubmitSuccess,
  }: {
    explorer?: Explorer;
    isCopyJobFlow: boolean;
    onSubmitSuccess: (data: { databaseId: string; collectionId: string }) => void;
  }) => (
    <div data-testid="add-collection-panel">
      <div data-testid="explorer-prop">{explorer ? "explorer-present" : "no-explorer"}</div>
      <div data-testid="copy-job-flow">{isCopyJobFlow ? "true" : "false"}</div>
      <button
        data-testid="submit-button"
        onClick={() => onSubmitSuccess({ databaseId: "test-db", collectionId: "test-collection" })}
      >
        Submit
      </button>
    </div>
  ),
}));

// Mock produce from immer
jest.mock("immer", () => ({
  produce: jest.fn((updater) => (state: any) => {
    const draft = { ...state };
    updater(draft);
    return draft;
  }),
}));

const mockUseSidePanel = useSidePanel as jest.MockedFunction<typeof useSidePanel>;
const mockUseCopyJobContext = useCopyJobContext as jest.MockedFunction<typeof useCopyJobContext>;

describe("AddCollectionPanelWrapper", () => {
  const mockSetCopyJobState = jest.fn();
  const mockGoBack = jest.fn();
  const mockSetHeaderText = jest.fn();
  const mockExplorer = {} as Explorer;

  const mockSidePanelState = {
    isOpen: false,
    panelWidth: "440px",
    hasConsole: true,
    headerText: "",
    setHeaderText: mockSetHeaderText,
    openSidePanel: jest.fn(),
    closeSidePanel: jest.fn(),
    setPanelHasConsole: jest.fn(),
  };

  const mockCopyJobContextValue = {
    contextError: null,
    setContextError: jest.fn(),
    copyJobState: {
      jobName: "",
      migrationType: CopyJobMigrationType.Offline,
      source: {
        subscription: { subscriptionId: "" },
        account: null,
        databaseId: "",
        containerId: "",
      },
      target: {
        subscriptionId: "",
        account: null,
        databaseId: "",
        containerId: "",
      },
      sourceReadAccessFromTarget: false,
    },
    setCopyJobState: mockSetCopyJobState,
    flow: null,
    setFlow: jest.fn(),
    resetCopyJobState: jest.fn(),
    explorer: mockExplorer,
  } as unknown as CopyJobContextProviderType;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useSidePanel with getState method
    mockUseSidePanel.mockReturnValue(mockSidePanelState);
    mockUseSidePanel.getState = jest.fn().mockReturnValue(mockSidePanelState);

    // Mock useCopyJobContext
    mockUseCopyJobContext.mockReturnValue(mockCopyJobContextValue);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render correctly with all required elements", () => {
      const { container } = render(<AddCollectionPanelWrapper />);

      expect(container.querySelector(".addCollectionPanelWrapper")).toBeInTheDocument();
      expect(container.querySelector(".addCollectionPanelHeader")).toBeInTheDocument();
      expect(container.querySelector(".addCollectionPanelBody")).toBeInTheDocument();
      expect(screen.getByText(ContainerCopyMessages.createNewContainerSubHeading)).toBeInTheDocument();
      expect(screen.getByTestId("add-collection-panel")).toBeInTheDocument();
    });

    it("should match snapshot", () => {
      const { container } = render(<AddCollectionPanelWrapper />);
      expect(container).toMatchSnapshot();
    });

    it("should match snapshot with explorer prop", () => {
      const { container } = render(<AddCollectionPanelWrapper explorer={mockExplorer} />);
      expect(container).toMatchSnapshot();
    });

    it("should match snapshot with goBack prop", () => {
      const { container } = render(<AddCollectionPanelWrapper goBack={mockGoBack} />);
      expect(container).toMatchSnapshot();
    });

    it("should match snapshot with both props", () => {
      const { container } = render(<AddCollectionPanelWrapper explorer={mockExplorer} goBack={mockGoBack} />);
      expect(container).toMatchSnapshot();
    });
  });

  describe("Side Panel Header Management", () => {
    it("should set header text to create container heading on mount", () => {
      render(<AddCollectionPanelWrapper />);

      expect(mockSetHeaderText).toHaveBeenCalledWith(ContainerCopyMessages.createContainerHeading);
    });

    it("should reset header text to create copy job panel title on unmount", () => {
      const { unmount } = render(<AddCollectionPanelWrapper />);

      unmount();

      expect(mockSetHeaderText).toHaveBeenCalledWith(ContainerCopyMessages.createCopyJobPanelTitle);
    });

    it("should not change header text if already set correctly", () => {
      const modifiedSidePanelState = {
        ...mockSidePanelState,
        headerText: ContainerCopyMessages.createContainerHeading,
      };

      mockUseSidePanel.getState = jest.fn().mockReturnValue(modifiedSidePanelState);

      render(<AddCollectionPanelWrapper />);

      expect(mockSetHeaderText).not.toHaveBeenCalled();
    });
  });

  describe("AddCollectionPanel Integration", () => {
    it("should pass explorer prop to AddCollectionPanel", () => {
      render(<AddCollectionPanelWrapper explorer={mockExplorer} />);

      expect(screen.getByTestId("explorer-prop")).toHaveTextContent("explorer-present");
    });

    it("should pass undefined explorer to AddCollectionPanel when not provided", () => {
      render(<AddCollectionPanelWrapper />);

      expect(screen.getByTestId("explorer-prop")).toHaveTextContent("no-explorer");
    });

    it("should pass isCopyJobFlow as true to AddCollectionPanel", () => {
      render(<AddCollectionPanelWrapper />);

      expect(screen.getByTestId("copy-job-flow")).toHaveTextContent("true");
    });
  });

  describe("Collection Success Handler", () => {
    it("should update copy job state when handleAddCollectionSuccess is called", async () => {
      render(<AddCollectionPanelWrapper goBack={mockGoBack} />);

      const submitButton = screen.getByTestId("submit-button");
      submitButton.click();

      await waitFor(() => {
        expect(mockSetCopyJobState).toHaveBeenCalledTimes(1);
      });

      const stateUpdater = mockSetCopyJobState.mock.calls[0][0];
      const mockState = {
        target: { databaseId: "", containerId: "" },
      };

      const updatedState = stateUpdater(mockState);
      expect(updatedState.target.databaseId).toBe("test-db");
      expect(updatedState.target.containerId).toBe("test-collection");
    });

    it("should call goBack when handleAddCollectionSuccess is called and goBack is provided", async () => {
      render(<AddCollectionPanelWrapper goBack={mockGoBack} />);

      const submitButton = screen.getByTestId("submit-button");
      submitButton.click();

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalledTimes(1);
      });
    });

    it("should not call goBack when handleAddCollectionSuccess is called and goBack is not provided", async () => {
      render(<AddCollectionPanelWrapper />);

      const submitButton = screen.getByTestId("submit-button");
      submitButton.click();

      await waitFor(() => {
        expect(mockSetCopyJobState).toHaveBeenCalledTimes(1);
      });

      expect(mockGoBack).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle missing setCopyJobState gracefully", () => {
      const mockCopyJobContextValueWithoutSetState = {
        ...mockCopyJobContextValue,
        setCopyJobState: undefined as any,
      };

      mockUseCopyJobContext.mockReturnValue(mockCopyJobContextValueWithoutSetState);

      expect(() => render(<AddCollectionPanelWrapper />)).not.toThrow();
    });
  });

  describe("Component Lifecycle", () => {
    it("should properly cleanup on unmount", () => {
      const { unmount } = render(<AddCollectionPanelWrapper />);

      // Verify initial setup
      expect(mockSetHeaderText).toHaveBeenCalledWith(ContainerCopyMessages.createContainerHeading);

      // Clear previous calls
      mockSetHeaderText.mockClear();

      // Unmount component
      unmount();

      // Verify cleanup
      expect(mockSetHeaderText).toHaveBeenCalledWith(ContainerCopyMessages.createCopyJobPanelTitle);
    });

    it("should re-render correctly when props change", () => {
      const { rerender } = render(<AddCollectionPanelWrapper />);

      expect(screen.getByTestId("explorer-prop")).toHaveTextContent("no-explorer");

      rerender(<AddCollectionPanelWrapper explorer={mockExplorer} />);

      expect(screen.getByTestId("explorer-prop")).toHaveTextContent("explorer-present");
    });
  });
});
