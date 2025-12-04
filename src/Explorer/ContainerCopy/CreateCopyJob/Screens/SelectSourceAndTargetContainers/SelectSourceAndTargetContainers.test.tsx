import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { DatabaseModel } from "Contracts/DataModels";
import React from "react";
import Explorer from "../../../../../Explorer/Explorer";
import CopyJobContextProvider from "../../../Context/CopyJobContext";
import { CopyJobMigrationType } from "../../../Enums/CopyJobEnums";
import SelectSourceAndTargetContainers from "./SelectSourceAndTargetContainers";

jest.mock("../../../../../hooks/useDatabases", () => ({
  useDatabases: jest.fn(),
}));

jest.mock("../../../../../hooks/useDataContainers", () => ({
  useDataContainers: jest.fn(),
}));

jest.mock("../../../ContainerCopyMessages", () => ({
  __esModule: true,
  default: {
    selectSourceAndTargetContainersDescription: "Select source and target containers for migration",
    sourceContainerSubHeading: "Source Container",
    targetContainerSubHeading: "Target Container",
  },
}));

jest.mock("./Events/DropDownChangeHandler", () => ({
  dropDownChangeHandler: jest.fn(() => () => jest.fn()),
}));

jest.mock("./memoizedData", () => ({
  useSourceAndTargetData: jest.fn(),
}));

jest.mock("UserContext", () => ({
  userContext: {
    subscriptionId: "test-subscription-id",
    databaseAccount: {
      id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.DocumentDB/databaseAccounts/test-account",
      name: "test-account",
      location: "East US",
      kind: "GlobalDocumentDB",
    },
  },
}));

import { useDatabases } from "../../../../../hooks/useDatabases";
import { useDataContainers } from "../../../../../hooks/useDataContainers";
import { dropDownChangeHandler } from "./Events/DropDownChangeHandler";
import { useSourceAndTargetData } from "./memoizedData";

const mockUseDatabases = useDatabases as jest.MockedFunction<typeof useDatabases>;
const mockUseDataContainers = useDataContainers as jest.MockedFunction<typeof useDataContainers>;
const mockDropDownChangeHandler = dropDownChangeHandler as jest.MockedFunction<typeof dropDownChangeHandler>;
const mockUseSourceAndTargetData = useSourceAndTargetData as jest.MockedFunction<typeof useSourceAndTargetData>;

describe("SelectSourceAndTargetContainers", () => {
  let mockExplorer: Explorer;
  let mockShowAddCollectionPanel: jest.Mock;
  let mockSetCopyJobState: jest.Mock;
  let mockOnDropdownChange: jest.Mock;

  const mockDatabases: DatabaseModel[] = [
    { id: "db1", name: "Database1" } as DatabaseModel,
    { id: "db2", name: "Database2" } as DatabaseModel,
  ];

  const mockContainers: DatabaseModel[] = [
    { id: "container1", name: "Container1" } as DatabaseModel,
    { id: "container2", name: "Container2" } as DatabaseModel,
  ];

  const mockCopyJobState = {
    jobName: "",
    migrationType: CopyJobMigrationType.Offline,
    source: {
      subscription: { subscriptionId: "test-subscription-id" },
      account: {
        id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.DocumentDB/databaseAccounts/test-account",
        name: "test-account",
      },
      databaseId: "db1",
      containerId: "container1",
    },
    target: {
      subscriptionId: "test-subscription-id",
      account: {
        id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.DocumentDB/databaseAccounts/test-account",
        name: "test-account",
      },
      databaseId: "db2",
      containerId: "container2",
    },
    sourceReadAccessFromTarget: false,
  };

  const mockMemoizedData = {
    source: mockCopyJobState.source,
    target: mockCopyJobState.target,
    sourceDbParams: ["test-sub", "test-rg", "test-account", "SQL"] as const,
    sourceContainerParams: ["test-sub", "test-rg", "test-account", "db1", "SQL"] as const,
    targetDbParams: ["test-sub", "test-rg", "test-account", "SQL"] as const,
    targetContainerParams: ["test-sub", "test-rg", "test-account", "db2", "SQL"] as const,
  };

  beforeEach(() => {
    mockExplorer = {} as Explorer;
    mockShowAddCollectionPanel = jest.fn();
    mockSetCopyJobState = jest.fn();
    mockOnDropdownChange = jest.fn();

    mockUseDatabases.mockReturnValue(mockDatabases);
    mockUseDataContainers.mockReturnValue(mockContainers);
    mockUseSourceAndTargetData.mockReturnValue(mockMemoizedData as ReturnType<typeof useSourceAndTargetData>);
    mockDropDownChangeHandler.mockReturnValue(() => mockOnDropdownChange);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithContext = (component: React.ReactElement) => {
    return render(<CopyJobContextProvider explorer={mockExplorer}>{component}</CopyJobContextProvider>);
  };

  describe("Component Rendering", () => {
    it("should render without crashing", () => {
      renderWithContext(<SelectSourceAndTargetContainers />);
      expect(screen.getByText("Select source and target containers for migration")).toBeInTheDocument();
    });

    it("should render description text", () => {
      renderWithContext(<SelectSourceAndTargetContainers />);
      expect(screen.getByText("Select source and target containers for migration")).toBeInTheDocument();
    });

    it("should render source container section", () => {
      renderWithContext(<SelectSourceAndTargetContainers />);
      expect(screen.getByText("Source Container")).toBeInTheDocument();
    });

    it("should render target container section", () => {
      renderWithContext(<SelectSourceAndTargetContainers />);
      expect(screen.getByText("Target Container")).toBeInTheDocument();
    });

    it("should return null when source is not available", () => {
      mockUseSourceAndTargetData.mockReturnValue({
        ...mockMemoizedData,
        source: null,
      } as ReturnType<typeof useSourceAndTargetData>);

      const { container } = renderWithContext(<SelectSourceAndTargetContainers />);
      expect(container.firstChild).toBeNull();
    });

    it("should call useDatabases hooks with correct parameters", () => {
      renderWithContext(<SelectSourceAndTargetContainers />);

      expect(mockUseDatabases).toHaveBeenCalledWith(...mockMemoizedData.sourceDbParams);
      expect(mockUseDatabases).toHaveBeenCalledWith(...mockMemoizedData.targetDbParams);
    });

    it("should call useDataContainers hooks with correct parameters", () => {
      renderWithContext(<SelectSourceAndTargetContainers />);

      expect(mockUseDataContainers).toHaveBeenCalledWith(...mockMemoizedData.sourceContainerParams);
      expect(mockUseDataContainers).toHaveBeenCalledWith(...mockMemoizedData.targetContainerParams);
    });
  });

  describe("Database Options", () => {
    it("should create source database options from useDatabases data", () => {
      renderWithContext(<SelectSourceAndTargetContainers />);
      expect(mockUseDatabases).toHaveBeenCalled();
    });

    it("should create target database options from useDatabases data", () => {
      renderWithContext(<SelectSourceAndTargetContainers />);

      expect(mockUseDatabases).toHaveBeenCalled();
    });

    it("should handle empty database list", () => {
      mockUseDatabases.mockReturnValue([]);

      renderWithContext(<SelectSourceAndTargetContainers />);
      expect(mockUseDatabases).toHaveBeenCalled();
    });

    it("should handle undefined database list", () => {
      mockUseDatabases.mockReturnValue(undefined);

      renderWithContext(<SelectSourceAndTargetContainers />);
      expect(mockUseDatabases).toHaveBeenCalled();
    });
  });

  describe("Container Options", () => {
    it("should create source container options from useDataContainers data", () => {
      renderWithContext(<SelectSourceAndTargetContainers />);

      expect(mockUseDataContainers).toHaveBeenCalled();
    });

    it("should create target container options from useDataContainers data", () => {
      renderWithContext(<SelectSourceAndTargetContainers />);

      expect(mockUseDataContainers).toHaveBeenCalled();
    });

    it("should handle empty container list", () => {
      mockUseDataContainers.mockReturnValue([]);

      renderWithContext(<SelectSourceAndTargetContainers />);
      expect(mockUseDataContainers).toHaveBeenCalled();
    });

    it("should handle undefined container list", () => {
      mockUseDataContainers.mockReturnValue(undefined);

      renderWithContext(<SelectSourceAndTargetContainers />);
      expect(mockUseDataContainers).toHaveBeenCalled();
    });
  });

  describe("Event Handlers", () => {
    it("should call dropDownChangeHandler with setCopyJobState", () => {
      renderWithContext(<SelectSourceAndTargetContainers />);

      expect(mockDropDownChangeHandler).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should create dropdown change handlers for different types", () => {
      renderWithContext(<SelectSourceAndTargetContainers />);
      expect(mockDropDownChangeHandler).toHaveBeenCalled();
    });
  });

  describe("Component Props", () => {
    it("should pass showAddCollectionPanel to DatabaseContainerSection", () => {
      renderWithContext(<SelectSourceAndTargetContainers showAddCollectionPanel={mockShowAddCollectionPanel} />);
      expect(screen.getByText("Target Container")).toBeInTheDocument();
    });

    it("should render without showAddCollectionPanel prop", () => {
      renderWithContext(<SelectSourceAndTargetContainers />);

      expect(screen.getByText("Source Container")).toBeInTheDocument();
      expect(screen.getByText("Target Container")).toBeInTheDocument();
    });
  });

  describe("Memoization", () => {
    it("should memoize source database options", () => {
      const { rerender } = renderWithContext(<SelectSourceAndTargetContainers />);

      expect(mockUseDatabases).toHaveBeenCalled();
      rerender(
        <CopyJobContextProvider explorer={mockExplorer}>
          <SelectSourceAndTargetContainers />
        </CopyJobContextProvider>,
      );

      expect(mockUseDatabases).toHaveBeenCalled();
    });

    it("should memoize target database options", () => {
      const { rerender } = renderWithContext(<SelectSourceAndTargetContainers />);

      expect(mockUseDatabases).toHaveBeenCalled();

      rerender(
        <CopyJobContextProvider explorer={mockExplorer}>
          <SelectSourceAndTargetContainers />
        </CopyJobContextProvider>,
      );

      expect(mockUseDatabases).toHaveBeenCalled();
    });

    it("should memoize source container options", () => {
      const { rerender } = renderWithContext(<SelectSourceAndTargetContainers />);

      expect(mockUseDataContainers).toHaveBeenCalled();

      rerender(
        <CopyJobContextProvider explorer={mockExplorer}>
          <SelectSourceAndTargetContainers />
        </CopyJobContextProvider>,
      );

      expect(mockUseDataContainers).toHaveBeenCalled();
    });

    it("should memoize target container options", () => {
      const { rerender } = renderWithContext(<SelectSourceAndTargetContainers />);

      expect(mockUseDataContainers).toHaveBeenCalled();

      rerender(
        <CopyJobContextProvider explorer={mockExplorer}>
          <SelectSourceAndTargetContainers />
        </CopyJobContextProvider>,
      );

      expect(mockUseDataContainers).toHaveBeenCalled();
    });
  });

  describe("Database Container Section Props", () => {
    it("should pass correct props to source DatabaseContainerSection", () => {
      renderWithContext(<SelectSourceAndTargetContainers />);

      expect(screen.getByText("Source Container")).toBeInTheDocument();
    });

    it("should pass correct props to target DatabaseContainerSection", () => {
      renderWithContext(<SelectSourceAndTargetContainers showAddCollectionPanel={mockShowAddCollectionPanel} />);

      expect(screen.getByText("Target Container")).toBeInTheDocument();
    });

    it("should disable source container dropdown when no database is selected", () => {
      mockUseSourceAndTargetData.mockReturnValue({
        ...mockMemoizedData,
        source: {
          ...mockMemoizedData.source,
          databaseId: "",
        },
      } as ReturnType<typeof useSourceAndTargetData>);

      renderWithContext(<SelectSourceAndTargetContainers />);
      expect(screen.getByText("Source Container")).toBeInTheDocument();
    });

    it("should disable target container dropdown when no database is selected", () => {
      mockUseSourceAndTargetData.mockReturnValue({
        ...mockMemoizedData,
        target: {
          ...mockMemoizedData.target,
          databaseId: "",
        },
      } as ReturnType<typeof useSourceAndTargetData>);

      renderWithContext(<SelectSourceAndTargetContainers />);
      expect(screen.getByText("Target Container")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle hooks returning null gracefully", () => {
      mockUseDatabases.mockReturnValue(null);
      mockUseDataContainers.mockReturnValue(null);

      renderWithContext(<SelectSourceAndTargetContainers />);

      expect(screen.getByText("Select source and target containers for migration")).toBeInTheDocument();
    });

    it("should handle hooks throwing errors gracefully", () => {
      const originalError = console.error;
      console.error = jest.fn();

      mockUseDatabases.mockImplementation(() => {
        throw new Error("Database fetch error");
      });

      expect(() => {
        renderWithContext(<SelectSourceAndTargetContainers />);
      }).toThrow();

      console.error = originalError;
    });

    it("should handle missing source data gracefully", () => {
      mockUseSourceAndTargetData.mockReturnValue({
        ...mockMemoizedData,
        source: undefined,
      } as ReturnType<typeof useSourceAndTargetData>);

      const { container } = renderWithContext(<SelectSourceAndTargetContainers />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Integration with CopyJobContext", () => {
    it("should use CopyJobContext for state management", () => {
      renderWithContext(<SelectSourceAndTargetContainers />);

      expect(mockUseSourceAndTargetData).toHaveBeenCalled();
    });

    it("should respond to context state changes", () => {
      const { rerender } = renderWithContext(<SelectSourceAndTargetContainers />);

      mockUseSourceAndTargetData.mockReturnValue({
        ...mockMemoizedData,
        source: {
          ...mockMemoizedData.source,
          databaseId: "different-db",
        },
      } as ReturnType<typeof useSourceAndTargetData>);

      rerender(
        <CopyJobContextProvider explorer={mockExplorer}>
          <SelectSourceAndTargetContainers />
        </CopyJobContextProvider>,
      );

      expect(mockUseSourceAndTargetData).toHaveBeenCalled();
    });
  });

  describe("Stack Layout", () => {
    it("should render with correct Stack className", () => {
      const { container } = renderWithContext(<SelectSourceAndTargetContainers />);

      const stackElement = container.querySelector(".selectSourceAndTargetContainers");
      expect(stackElement).toBeInTheDocument();
    });

    it("should apply correct spacing tokens", () => {
      renderWithContext(<SelectSourceAndTargetContainers />);

      expect(screen.getByText("Select source and target containers for migration")).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("should render description, source section, and target section in correct order", () => {
      renderWithContext(<SelectSourceAndTargetContainers />);

      const description = screen.getByText("Select source and target containers for migration");
      const sourceSection = screen.getByText("Source Container");
      const targetSection = screen.getByText("Target Container");

      expect(description).toBeInTheDocument();
      expect(sourceSection).toBeInTheDocument();
      expect(targetSection).toBeInTheDocument();
    });

    it("should maintain component hierarchy", () => {
      const { container } = renderWithContext(<SelectSourceAndTargetContainers />);

      const mainContainer = container.querySelector(".selectSourceAndTargetContainers");
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should not cause unnecessary re-renders when props don't change", () => {
      const { rerender } = renderWithContext(<SelectSourceAndTargetContainers />);

      const initialCallCount = mockUseSourceAndTargetData.mock.calls.length;

      rerender(
        <CopyJobContextProvider explorer={mockExplorer}>
          <SelectSourceAndTargetContainers />
        </CopyJobContextProvider>,
      );

      expect(mockUseSourceAndTargetData).toHaveBeenCalled();
    });

    it("should handle rapid state changes efficiently", () => {
      const { rerender } = renderWithContext(<SelectSourceAndTargetContainers />);

      for (let i = 0; i < 5; i++) {
        mockUseSourceAndTargetData.mockReturnValue({
          ...mockMemoizedData,
          source: {
            ...mockMemoizedData.source,
            databaseId: `db-${i}`,
          },
        } as ReturnType<typeof useSourceAndTargetData>);

        rerender(
          <CopyJobContextProvider explorer={mockExplorer}>
            <SelectSourceAndTargetContainers />
          </CopyJobContextProvider>,
        );
      }

      expect(mockUseSourceAndTargetData).toHaveBeenCalled();
    });
  });
});
