import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { CapabilityNames } from "../../../../../../Common/Constants";
import * as RbacUtils from "../../../../../../Utils/arm/RbacUtils";
import {
  BackupPolicyType,
  CopyJobMigrationType,
  DefaultIdentityType,
  IdentityType,
} from "../../../../Enums/CopyJobEnums";
import { CopyJobContextState } from "../../../../Types/CopyJobTypes";
import * as CopyJobPrerequisitesCacheModule from "../../../Utils/useCopyJobPrerequisitesCache";
import usePermissionSections, {
  checkTargetHasReaderRoleOnSource,
  PermissionGroupConfig,
  SECTION_IDS,
} from "./usePermissionsSection";

// Mock dependencies
jest.mock("../../../../../../Utils/arm/RbacUtils");
jest.mock("../../../Utils/useCopyJobPrerequisitesCache");
jest.mock("../../../../CopyJobUtils", () => ({
  getAccountDetailsFromResourceId: jest.fn((resourceId: string) => ({
    subscriptionId: "sub-123",
    resourceGroup: "rg-test",
    accountName: "account-test",
  })),
  getContainerIdentifiers: jest.fn((container: any) => ({
    accountId: container?.account?.id || "default-account-id",
  })),
  isIntraAccountCopy: jest.fn((sourceId: string, targetId: string) => sourceId === targetId),
}));

jest.mock("../AddManagedIdentity", () => {
  return function MockAddManagedIdentity() {
    return <div data-testid="add-managed-identity">AddManagedIdentity</div>;
  };
});

jest.mock("../AddReadPermissionToDefaultIdentity", () => {
  return function MockAddReadPermissionToDefaultIdentity() {
    return <div data-testid="add-read-permission">AddReadPermissionToDefaultIdentity</div>;
  };
});

jest.mock("../DefaultManagedIdentity", () => {
  return function MockDefaultManagedIdentity() {
    return <div data-testid="default-managed-identity">DefaultManagedIdentity</div>;
  };
});

jest.mock("../OnlineCopyEnabled", () => {
  return function MockOnlineCopyEnabled() {
    return <div data-testid="online-copy-enabled">OnlineCopyEnabled</div>;
  };
});

jest.mock("../PointInTimeRestore", () => {
  return function MockPointInTimeRestore() {
    return <div data-testid="point-in-time-restore">PointInTimeRestore</div>;
  };
});

const mockedRbacUtils = RbacUtils as jest.Mocked<typeof RbacUtils>;
const mockedCopyJobPrerequisitesCache = CopyJobPrerequisitesCacheModule as jest.Mocked<
  typeof CopyJobPrerequisitesCacheModule
>;

interface TestWrapperProps {
  state: CopyJobContextState;
  onResult?: (result: PermissionGroupConfig[]) => void;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ state, onResult }) => {
  const result = usePermissionSections(state);

  React.useEffect(() => {
    if (onResult) {
      onResult(result);
    }
  }, [result, onResult]);

  return (
    <div data-testid="test-wrapper">
      <div data-testid="groups-count">{result.length}</div>
      {result.map((group) => (
        <div key={group.id} data-testid={`group-${group.id}`}>
          <h3>{group.title}</h3>
          <p>{group.description}</p>
          {group.sections.map((section) => (
            <div key={section.id} data-testid={`section-${section.id}`}>
              <span data-testid={`section-${section.id}-completed`}>
                {section.completed?.toString() || "undefined"}
              </span>
              <span data-testid={`section-${section.id}-disabled`}>{section.disabled.toString()}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

describe("usePermissionsSection", () => {
  let mockValidationCache: Map<string, boolean>;
  let mockSetValidationCache: jest.Mock;

  const createMockState = (overrides: Partial<CopyJobContextState> = {}): CopyJobContextState => ({
    jobName: "test-job",
    migrationType: CopyJobMigrationType.Offline,
    source: {
      account: {
        id: "source-account-id",
        name: "source-account",
        properties: {
          backupPolicy: {
            type: BackupPolicyType.Periodic,
          },
          capabilities: [],
        },
        location: "",
        type: "",
        kind: "",
      },
      subscription: undefined,
      databaseId: "",
      containerId: "",
    },
    target: {
      account: {
        id: "target-account-id",
        name: "target-account",
        identity: {
          type: IdentityType.None,
          principalId: "principal-123",
        },
        properties: {
          defaultIdentity: DefaultIdentityType.FirstPartyIdentity,
        },
        location: "",
        type: "",
        kind: "",
      },
      subscriptionId: "",
      databaseId: "",
      containerId: "",
    },
    ...overrides,
  });

  beforeEach(() => {
    mockValidationCache = new Map();
    mockSetValidationCache = jest.fn();

    mockedCopyJobPrerequisitesCache.useCopyJobPrerequisitesCache.mockReturnValue({
      validationCache: mockValidationCache,
      setValidationCache: mockSetValidationCache,
    });

    mockedRbacUtils.fetchRoleAssignments.mockResolvedValue([]);
    mockedRbacUtils.fetchRoleDefinitions.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Cross-account copy scenarios", () => {
    it("should return cross-account configuration for different accounts", async () => {
      const state = createMockState();
      let capturedResult: PermissionGroupConfig[] = [];

      render(<TestWrapper state={state} onResult={(result) => (capturedResult = result)} />);

      await waitFor(() => {
        expect(screen.getByTestId("groups-count")).toHaveTextContent("1");
      });

      expect(capturedResult).toHaveLength(1);
      expect(capturedResult[0].id).toBe("crossAccountConfigs");
      expect(capturedResult[0].sections).toHaveLength(3);
      expect(capturedResult[0].sections.map((s) => s.id)).toEqual([
        SECTION_IDS.addManagedIdentity,
        SECTION_IDS.defaultManagedIdentity,
        SECTION_IDS.readPermissionAssigned,
      ]);
    });

    it("should not return cross-account configuration for same account (intra-account copy)", async () => {
      const state = createMockState({
        source: {
          account: {
            id: "same-account-id",
            name: "same-account",
            properties: undefined,
            location: "",
            type: "",
            kind: "",
          },
          subscription: undefined,
          databaseId: "",
          containerId: "",
        },
        target: {
          account: {
            id: "same-account-id",
            name: "same-account",
            identity: { type: IdentityType.None, principalId: "principal-123" },
            properties: { defaultIdentity: DefaultIdentityType.FirstPartyIdentity },
            location: "",
            type: "",
            kind: "",
          },
          subscriptionId: "",
          databaseId: "",
          containerId: "",
        },
      });

      let capturedResult: PermissionGroupConfig[] = [];

      render(<TestWrapper state={state} onResult={(result) => (capturedResult = result)} />);

      await waitFor(() => {
        expect(screen.getByTestId("groups-count")).toHaveTextContent("0");
      });

      expect(capturedResult).toHaveLength(0);
    });
  });

  describe("Online copy scenarios", () => {
    it("should return online configuration for online migration", async () => {
      const state = createMockState({
        migrationType: CopyJobMigrationType.Online,
      });

      let capturedResult: PermissionGroupConfig[] = [];

      render(<TestWrapper state={state} onResult={(result) => (capturedResult = result)} />);

      await waitFor(() => {
        expect(screen.getByTestId("groups-count")).toHaveTextContent("2");
      });

      const onlineGroup = capturedResult.find((g) => g.id === "onlineConfigs");
      expect(onlineGroup).toBeDefined();
      expect(onlineGroup?.sections).toHaveLength(2);
      expect(onlineGroup?.sections.map((s) => s.id)).toEqual([
        SECTION_IDS.pointInTimeRestore,
        SECTION_IDS.onlineCopyEnabled,
      ]);
    });

    it("should not return online configuration for offline migration", async () => {
      const state = createMockState({
        migrationType: CopyJobMigrationType.Offline,
      });

      let capturedResult: PermissionGroupConfig[] = [];

      render(<TestWrapper state={state} onResult={(result) => (capturedResult = result)} />);

      await waitFor(() => {
        expect(screen.getByTestId("groups-count")).toHaveTextContent("1");
      });

      const onlineGroup = capturedResult.find((g) => g.id === "onlineConfigs");
      expect(onlineGroup).toBeUndefined();
    });
  });

  describe("Section validation", () => {
    it("should validate addManagedIdentity section correctly", async () => {
      const stateWithSystemAssigned = createMockState({
        target: {
          account: {
            id: "target-account-id",
            name: "target-account",
            identity: {
              type: IdentityType.SystemAssigned,
              principalId: "principal-123",
            },
            properties: {
              defaultIdentity: DefaultIdentityType.FirstPartyIdentity,
            },
            location: "",
            type: "",
            kind: "",
          },
          subscriptionId: "",
          databaseId: "",
          containerId: "",
        },
      });

      let capturedResult: PermissionGroupConfig[] = [];

      render(<TestWrapper state={stateWithSystemAssigned} onResult={(result) => (capturedResult = result)} />);

      await waitFor(() => {
        expect(screen.getByTestId(`section-${SECTION_IDS.addManagedIdentity}-completed`)).toHaveTextContent("true");
      });

      const crossAccountGroup = capturedResult.find((g) => g.id === "crossAccountConfigs");
      const addManagedIdentitySection = crossAccountGroup?.sections.find(
        (s) => s.id === SECTION_IDS.addManagedIdentity,
      );
      expect(addManagedIdentitySection?.completed).toBe(true);
    });

    it("should validate defaultManagedIdentity section correctly", async () => {
      const stateWithSystemAssignedIdentity = createMockState({
        target: {
          account: {
            id: "target-account-id",
            name: "target-account",
            identity: {
              type: IdentityType.SystemAssigned,
              principalId: "principal-123",
            },
            properties: {
              defaultIdentity: DefaultIdentityType.SystemAssignedIdentity,
            },
            location: "",
            type: "",
            kind: "",
          },
          subscriptionId: "",
          databaseId: "",
          containerId: "",
        },
      });

      let capturedResult: PermissionGroupConfig[] = [];

      render(<TestWrapper state={stateWithSystemAssignedIdentity} onResult={(result) => (capturedResult = result)} />);

      await waitFor(() => {
        expect(screen.getByTestId(`section-${SECTION_IDS.defaultManagedIdentity}-completed`)).toHaveTextContent("true");
      });

      const crossAccountGroup = capturedResult.find((g) => g.id === "crossAccountConfigs");
      const defaultManagedIdentitySection = crossAccountGroup?.sections.find(
        (s) => s.id === SECTION_IDS.defaultManagedIdentity,
      );
      expect(defaultManagedIdentitySection?.completed).toBe(true);
    });

    it("should validate readPermissionAssigned section with reader role", async () => {
      const mockRoleDefinitions: RbacUtils.RoleDefinitionType[] = [
        {
          id: "role-1",
          name: "Custom Role",
          permissions: [
            {
              dataActions: [
                "Microsoft.DocumentDB/databaseAccounts/readMetadata",
                "Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/items/read",
              ],
            },
          ],
          assignableScopes: [],
          resourceGroup: "",
          roleName: "",
          type: "",
          typePropertiesType: "",
        },
      ];

      mockedRbacUtils.fetchRoleAssignments.mockResolvedValue([{ roleDefinitionId: "role-def-1" }] as any);
      mockedRbacUtils.fetchRoleDefinitions.mockResolvedValue(mockRoleDefinitions);

      const state = createMockState({
        target: {
          account: {
            id: "target-account-id",
            name: "target-account",
            identity: {
              type: IdentityType.SystemAssigned,
              principalId: "principal-123",
            },
            properties: {
              defaultIdentity: DefaultIdentityType.SystemAssignedIdentity,
            },
            location: "",
            type: "",
            kind: "",
          },
          subscriptionId: "",
          databaseId: "",
          containerId: "",
        },
      });

      let capturedResult: PermissionGroupConfig[] = [];

      render(<TestWrapper state={state} onResult={(result) => (capturedResult = result)} />);

      await waitFor(() => {
        expect(screen.getByTestId(`section-${SECTION_IDS.readPermissionAssigned}-completed`)).toHaveTextContent("true");
      });

      expect(mockedRbacUtils.fetchRoleAssignments).toHaveBeenCalledWith(
        "sub-123",
        "rg-test",
        "account-test",
        "principal-123",
      );
    });

    it("should validate pointInTimeRestore section for continuous backup", async () => {
      const state = createMockState({
        migrationType: CopyJobMigrationType.Online,
        source: {
          account: {
            id: "source-account-id",
            name: "source-account",
            properties: {
              backupPolicy: {
                type: BackupPolicyType.Continuous,
              },
              capabilities: [],
            },
            location: "",
            type: "",
            kind: "",
          },
          subscription: undefined,
          databaseId: "",
          containerId: "",
        },
      });

      let capturedResult: PermissionGroupConfig[] = [];

      render(<TestWrapper state={state} onResult={(result) => (capturedResult = result)} />);

      await waitFor(() => {
        expect(screen.getByTestId(`section-${SECTION_IDS.pointInTimeRestore}-completed`)).toHaveTextContent("true");
      });

      const onlineGroup = capturedResult.find((g) => g.id === "onlineConfigs");
      const pointInTimeSection = onlineGroup?.sections.find((s) => s.id === SECTION_IDS.pointInTimeRestore);
      expect(pointInTimeSection?.completed).toBe(true);
    });

    it("should validate onlineCopyEnabled section with proper capability", async () => {
      const state = createMockState({
        migrationType: CopyJobMigrationType.Online,
        source: {
          account: {
            id: "source-account-id",
            name: "source-account",
            properties: {
              backupPolicy: {
                type: BackupPolicyType.Continuous,
              },
              capabilities: [
                {
                  name: CapabilityNames.EnableOnlineCopyFeature,
                  description: "",
                },
              ],
            },
            location: "",
            type: "",
            kind: "",
          },
          subscription: undefined,
          databaseId: "",
          containerId: "",
        },
      });

      let capturedResult: PermissionGroupConfig[] = [];

      render(<TestWrapper state={state} onResult={(result) => (capturedResult = result)} />);
      await waitFor(() => {
        expect(screen.getByTestId(`section-${SECTION_IDS.onlineCopyEnabled}-completed`)).toHaveTextContent("true");
      });

      const onlineGroup = capturedResult.find((g) => g.id === "onlineConfigs");
      const onlineCopySection = onlineGroup?.sections.find((s) => s.id === SECTION_IDS.onlineCopyEnabled);
      expect(onlineCopySection?.completed).toBe(true);
    });
  });

  describe("Validation caching", () => {
    it("should use cached validation results", async () => {
      mockValidationCache.set(SECTION_IDS.addManagedIdentity, true);
      mockValidationCache.set(SECTION_IDS.defaultManagedIdentity, true);

      const state = createMockState();

      let capturedResult: PermissionGroupConfig[] = [];

      render(<TestWrapper state={state} onResult={(result) => (capturedResult = result)} />);

      await waitFor(() => {
        expect(screen.getByTestId(`section-${SECTION_IDS.addManagedIdentity}-completed`)).toHaveTextContent("true");
      });

      expect(screen.getByTestId(`section-${SECTION_IDS.defaultManagedIdentity}-completed`)).toHaveTextContent("true");
    });

    it("should clear online job validation cache when migration type changes to offline", async () => {
      mockValidationCache.set(SECTION_IDS.pointInTimeRestore, true);
      mockValidationCache.set(SECTION_IDS.onlineCopyEnabled, true);

      const state = createMockState({
        migrationType: CopyJobMigrationType.Offline,
      });

      render(<TestWrapper state={state} />);

      await waitFor(() => {
        expect(screen.getByTestId("groups-count")).toHaveTextContent("1");
      });

      // The cache should be updated to remove online-specific sections
      expect(mockSetValidationCache).toHaveBeenCalled();
    });
  });

  describe("Sequential validation within groups", () => {
    it("should stop validation at first failure within a group", async () => {
      const state = createMockState({
        target: {
          account: {
            id: "target-account-id",
            name: "target-account",
            identity: {
              type: IdentityType.None, // This will fail the first validation
              principalId: "principal-123",
            },
            properties: {
              defaultIdentity: DefaultIdentityType.FirstPartyIdentity,
            },
            location: "",
            type: "",
            kind: "",
          },
          subscriptionId: "",
          databaseId: "",
          containerId: "",
        },
      });

      let capturedResult: PermissionGroupConfig[] = [];

      render(<TestWrapper state={state} onResult={(result) => (capturedResult = result)} />);

      await waitFor(() => {
        expect(screen.getByTestId(`section-${SECTION_IDS.addManagedIdentity}-completed`)).toHaveTextContent("false");
      });

      const crossAccountGroup = capturedResult.find((g) => g.id === "crossAccountConfigs");
      expect(crossAccountGroup?.sections[0].completed).toBe(false); // addManagedIdentity
      expect(crossAccountGroup?.sections[1].completed).toBe(false); // defaultManagedIdentity (marked as incomplete)
      expect(crossAccountGroup?.sections[2].completed).toBe(false); // readPermissionAssigned (marked as incomplete)
    });
  });
});

describe("checkTargetHasReaderRoleOnSource", () => {
  it("should return true for built-in Reader role", () => {
    const roleDefinitions: RbacUtils.RoleDefinitionType[] = [
      {
        id: "role-1",
        name: "00000000-0000-0000-0000-000000000001",
        permissions: [],
        assignableScopes: [],
        resourceGroup: "",
        roleName: "",
        type: "",
        typePropertiesType: "",
      },
    ];

    const result = checkTargetHasReaderRoleOnSource(roleDefinitions);
    expect(result).toBe(true);
  });

  it("should return true for custom role with required data actions", () => {
    const roleDefinitions: RbacUtils.RoleDefinitionType[] = [
      {
        id: "role-1",
        name: "Custom Reader Role",
        permissions: [
          {
            dataActions: [
              "Microsoft.DocumentDB/databaseAccounts/readMetadata",
              "Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/items/read",
            ],
          },
        ],
        assignableScopes: [],
        resourceGroup: "",
        roleName: "",
        type: "",
        typePropertiesType: "",
      },
    ];

    const result = checkTargetHasReaderRoleOnSource(roleDefinitions);
    expect(result).toBe(true);
  });

  it("should return false for role without required permissions", () => {
    const roleDefinitions: RbacUtils.RoleDefinitionType[] = [
      {
        id: "role-1",
        name: "Insufficient Role",
        permissions: [
          {
            dataActions: ["Microsoft.DocumentDB/databaseAccounts/readMetadata"], // Missing the second required action
          },
        ],
        assignableScopes: [],
        resourceGroup: "",
        roleName: "",
        type: "",
        typePropertiesType: "",
      },
    ];

    const result = checkTargetHasReaderRoleOnSource(roleDefinitions);
    expect(result).toBe(false);
  });

  it("should return false for empty role definitions", () => {
    const result = checkTargetHasReaderRoleOnSource([]);
    expect(result).toBe(false);
  });

  it("should return false for role definitions without permissions", () => {
    const roleDefinitions: RbacUtils.RoleDefinitionType[] = [
      {
        id: "role-1",
        name: "No Permissions Role",
        permissions: [],
        assignableScopes: [],
        resourceGroup: "",
        roleName: "",
        type: "",
        typePropertiesType: "",
      },
    ];

    const result = checkTargetHasReaderRoleOnSource(roleDefinitions);
    expect(result).toBe(false);
  });

  it("should handle multiple roles and return true if any has sufficient permissions", () => {
    const roleDefinitions: RbacUtils.RoleDefinitionType[] = [
      {
        id: "role-1",
        name: "Insufficient Role",
        permissions: [
          {
            dataActions: ["Microsoft.DocumentDB/databaseAccounts/readMetadata"],
          },
        ],
        assignableScopes: [],
        resourceGroup: "",
        roleName: "",
        type: "",
        typePropertiesType: "",
      },
      {
        id: "role-2",
        name: "00000000-0000-0000-0000-000000000001", // Built-in Reader role ID
        permissions: [],
        assignableScopes: [],
        resourceGroup: "",
        roleName: "",
        type: "",
        typePropertiesType: "",
      },
    ];

    const result = checkTargetHasReaderRoleOnSource(roleDefinitions);
    expect(result).toBe(true);
  });
});
