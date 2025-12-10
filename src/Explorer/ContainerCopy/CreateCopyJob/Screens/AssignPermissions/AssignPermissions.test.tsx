import "@testing-library/jest-dom";
import { render, RenderResult } from "@testing-library/react";
import React from "react";
import ContainerCopyMessages from "../../../ContainerCopyMessages";
import { CopyJobContext } from "../../../Context/CopyJobContext";
import { CopyJobMigrationType } from "../../../Enums/CopyJobEnums";
import { CopyJobContextProviderType, CopyJobContextState } from "../../../Types/CopyJobTypes";
import AssignPermissions from "./AssignPermissions";

jest.mock("../../Utils/useCopyJobPrerequisitesCache", () => ({
  useCopyJobPrerequisitesCache: () => ({
    validationCache: new Map<string, boolean>(),
    setValidationCache: jest.fn(),
  }),
}));

jest.mock("../../../CopyJobUtils", () => ({
  isIntraAccountCopy: jest.fn((sourceId: string, targetId: string) => sourceId === targetId),
}));

jest.mock("./hooks/usePermissionsSection", () => ({
  __esModule: true,
  default: jest.fn((): any[] => []),
}));

jest.mock("../../../../../Common/ShimmerTree/ShimmerTree", () => {
  const MockShimmerTree = (props: any) => {
    return (
      <div data-test="shimmer-tree" {...props}>
        Loading...
      </div>
    );
  };
  MockShimmerTree.displayName = "MockShimmerTree";
  return MockShimmerTree;
});

jest.mock("./AddManagedIdentity", () => {
  const MockAddManagedIdentity = () => {
    return <div data-test="add-managed-identity">Add Managed Identity Component</div>;
  };
  MockAddManagedIdentity.displayName = "MockAddManagedIdentity";
  return MockAddManagedIdentity;
});

jest.mock("./AddReadPermissionToDefaultIdentity", () => {
  const MockAddReadPermissionToDefaultIdentity = () => {
    return <div data-test="add-read-permission">Add Read Permission Component</div>;
  };
  MockAddReadPermissionToDefaultIdentity.displayName = "MockAddReadPermissionToDefaultIdentity";
  return MockAddReadPermissionToDefaultIdentity;
});

jest.mock("./DefaultManagedIdentity", () => {
  const MockDefaultManagedIdentity = () => {
    return <div data-test="default-managed-identity">Default Managed Identity Component</div>;
  };
  MockDefaultManagedIdentity.displayName = "MockDefaultManagedIdentity";
  return MockDefaultManagedIdentity;
});

jest.mock("./OnlineCopyEnabled", () => {
  const MockOnlineCopyEnabled = () => {
    return <div data-test="online-copy-enabled">Online Copy Enabled Component</div>;
  };
  MockOnlineCopyEnabled.displayName = "MockOnlineCopyEnabled";
  return MockOnlineCopyEnabled;
});

jest.mock("./PointInTimeRestore", () => {
  const MockPointInTimeRestore = () => {
    return <div data-test="point-in-time-restore">Point In Time Restore Component</div>;
  };
  MockPointInTimeRestore.displayName = "MockPointInTimeRestore";
  return MockPointInTimeRestore;
});

jest.mock("../../../../../../images/successfulPopup.svg", () => "checkmark-icon");
jest.mock("../../../../../../images/warning.svg", () => "warning-icon");

describe("AssignPermissions Component", () => {
  const mockExplorer = {} as any;

  const createMockCopyJobState = (overrides: Partial<CopyJobContextState> = {}): CopyJobContextState => ({
    jobName: "test-job",
    migrationType: CopyJobMigrationType.Offline,
    source: {
      subscription: { subscriptionId: "source-sub" } as any,
      account: { id: "source-account", name: "Source Account" } as any,
      databaseId: "source-db",
      containerId: "source-container",
    },
    target: {
      subscriptionId: "target-sub",
      account: { id: "target-account", name: "Target Account" } as any,
      databaseId: "target-db",
      containerId: "target-container",
    },
    sourceReadAccessFromTarget: false,
    ...overrides,
  });

  const createMockContextValue = (copyJobState: CopyJobContextState): CopyJobContextProviderType => ({
    contextError: null,
    setContextError: jest.fn(),
    copyJobState,
    setCopyJobState: jest.fn(),
    flow: null,
    setFlow: jest.fn(),
    resetCopyJobState: jest.fn(),
    explorer: mockExplorer,
  });

  const renderWithContext = (copyJobState: CopyJobContextState): RenderResult => {
    const contextValue = createMockContextValue(copyJobState);
    return render(
      <CopyJobContext.Provider value={contextValue}>
        <AssignPermissions />
      </CopyJobContext.Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing with offline migration", () => {
      const copyJobState = createMockCopyJobState();
      const { container } = renderWithContext(copyJobState);

      expect(container.firstChild).toBeTruthy();
      expect(container).toMatchSnapshot();
    });

    it("should render without crashing with online migration", () => {
      const copyJobState = createMockCopyJobState({
        migrationType: CopyJobMigrationType.Online,
      });
      const { container } = renderWithContext(copyJobState);

      expect(container.firstChild).toBeTruthy();
      expect(container).toMatchSnapshot();
    });

    it("should display shimmer tree when no permission groups are available", () => {
      const copyJobState = createMockCopyJobState();
      const { getByTestId } = renderWithContext(copyJobState);

      expect(getByTestId("shimmer-tree")).toBeInTheDocument();
    });

    it("should display cross account description for different accounts", () => {
      const copyJobState = createMockCopyJobState();
      const { getByText } = renderWithContext(copyJobState);

      expect(getByText(ContainerCopyMessages.assignPermissions.crossAccountDescription)).toBeInTheDocument();
    });

    it("should display intra account description for same accounts with online migration", async () => {
      const { isIntraAccountCopy } = await import("../../../CopyJobUtils");
      (isIntraAccountCopy as jest.Mock).mockReturnValue(true);

      const copyJobState = createMockCopyJobState({
        migrationType: CopyJobMigrationType.Online,
        source: {
          subscription: { subscriptionId: "same-sub" } as any,
          account: { id: "same-account", name: "Same Account" } as any,
          databaseId: "source-db",
          containerId: "source-container",
        },
        target: {
          subscriptionId: "same-sub",
          account: { id: "same-account", name: "Same Account" } as any,
          databaseId: "target-db",
          containerId: "target-container",
        },
      });

      const { getByText } = renderWithContext(copyJobState);
      expect(
        getByText(ContainerCopyMessages.assignPermissions.intraAccountOnlineDescription("Same Account")),
      ).toBeInTheDocument();
    });
  });

  describe("Permission Groups", () => {
    it("should render permission groups when available", async () => {
      const mockUsePermissionSections = (await import("./hooks/usePermissionsSection")).default as jest.Mock;
      mockUsePermissionSections.mockReturnValue([
        {
          id: "crossAccountConfigs",
          title: "Cross Account Configuration",
          description: "Configure permissions for cross-account copy",
          sections: [
            {
              id: "addManagedIdentity",
              title: "Add Managed Identity",
              Component: () => <div data-test="add-managed-identity">Add Managed Identity Component</div>,
              disabled: false,
              completed: true,
            },
            {
              id: "readPermissionAssigned",
              title: "Read Permission Assigned",
              Component: () => <div data-test="add-read-permission">Add Read Permission Component</div>,
              disabled: false,
              completed: false,
            },
          ],
        },
      ]);

      const copyJobState = createMockCopyJobState();
      const { container } = renderWithContext(copyJobState);

      expect(container).toMatchSnapshot();
    });

    it("should render online migration specific groups", async () => {
      const mockUsePermissionSections = (await import("./hooks/usePermissionsSection")).default as jest.Mock;
      mockUsePermissionSections.mockReturnValue([
        {
          id: "onlineConfigs",
          title: "Online Configuration",
          description: "Configure settings for online migration",
          sections: [
            {
              id: "pointInTimeRestore",
              title: "Point In Time Restore",
              Component: () => <div data-test="point-in-time-restore">Point In Time Restore Component</div>,
              disabled: false,
              completed: true,
            },
            {
              id: "onlineCopyEnabled",
              title: "Online Copy Enabled",
              Component: () => <div data-test="online-copy-enabled">Online Copy Enabled Component</div>,
              disabled: false,
              completed: false,
            },
          ],
        },
      ]);

      const copyJobState = createMockCopyJobState({
        migrationType: CopyJobMigrationType.Online,
      });
      const { container } = renderWithContext(copyJobState);

      expect(container).toMatchSnapshot();
    });

    it("should render multiple permission groups", async () => {
      const mockUsePermissionSections = (await import("./hooks/usePermissionsSection")).default as jest.Mock;
      mockUsePermissionSections.mockReturnValue([
        {
          id: "crossAccountConfigs",
          title: "Cross Account Configuration",
          description: "Configure permissions for cross-account copy",
          sections: [
            {
              id: "addManagedIdentity",
              title: "Add Managed Identity",
              Component: () => <div data-test="add-managed-identity">Add Managed Identity Component</div>,
              disabled: false,
              completed: true,
            },
          ],
        },
        {
          id: "onlineConfigs",
          title: "Online Configuration",
          description: "Configure settings for online migration",
          sections: [
            {
              id: "onlineCopyEnabled",
              title: "Online Copy Enabled",
              Component: () => <div data-test="online-copy-enabled">Online Copy Enabled Component</div>,
              disabled: false,
              completed: false,
            },
          ],
        },
      ]);

      const copyJobState = createMockCopyJobState({
        migrationType: CopyJobMigrationType.Online,
      });
      const { container, getByText } = renderWithContext(copyJobState);

      expect(getByText("Cross Account Configuration")).toBeInTheDocument();
      expect(getByText("Online Configuration")).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });
  });

  describe("Accordion Behavior", () => {
    it("should render accordion sections with proper status icons", async () => {
      const mockUsePermissionSections = (await import("./hooks/usePermissionsSection")).default as jest.Mock;
      mockUsePermissionSections.mockReturnValue([
        {
          id: "testGroup",
          title: "Test Group",
          description: "Test Description",
          sections: [
            {
              id: "completedSection",
              title: "Completed Section",
              Component: () => <div>Completed Component</div>,
              disabled: false,
              completed: true,
            },
            {
              id: "incompleteSection",
              title: "Incomplete Section",
              Component: () => <div>Incomplete Component</div>,
              disabled: false,
              completed: false,
            },
            {
              id: "disabledSection",
              title: "Disabled Section",
              Component: () => <div>Disabled Component</div>,
              disabled: true,
              completed: false,
            },
          ],
        },
      ]);

      const copyJobState = createMockCopyJobState();
      const { container, getByText, getAllByRole } = renderWithContext(copyJobState);

      expect(getByText("Completed Section")).toBeInTheDocument();
      expect(getByText("Incomplete Section")).toBeInTheDocument();
      expect(getByText("Disabled Section")).toBeInTheDocument();

      const images = getAllByRole("img");
      expect(images.length).toBeGreaterThan(0);

      expect(container).toMatchSnapshot();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing account names", () => {
      const copyJobState = createMockCopyJobState({
        source: {
          subscription: { subscriptionId: "source-sub" } as any,
          account: { id: "source-account" } as any,
          databaseId: "source-db",
          containerId: "source-container",
        },
      });

      const { container } = renderWithContext(copyJobState);
      expect(container).toMatchSnapshot();
    });

    it("should calculate correct indent levels for offline migration", () => {
      const copyJobState = createMockCopyJobState({
        migrationType: CopyJobMigrationType.Offline,
      });

      const { container } = renderWithContext(copyJobState);
      expect(container).toMatchSnapshot();
    });

    it("should calculate correct indent levels for online migration", () => {
      const copyJobState = createMockCopyJobState({
        migrationType: CopyJobMigrationType.Online,
      });

      const { container } = renderWithContext(copyJobState);
      expect(container).toMatchSnapshot();
    });
  });
});
