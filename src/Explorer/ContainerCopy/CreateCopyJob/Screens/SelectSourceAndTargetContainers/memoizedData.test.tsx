import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
import { DatabaseAccount, Subscription } from "../../../../../Contracts/DataModels";
import { CopyJobMigrationType } from "../../../Enums/CopyJobEnums";
import { CopyJobContextState } from "../../../Types/CopyJobTypes";
import { useSourceAndTargetData } from "./memoizedData";

jest.mock("../../../CopyJobUtils", () => ({
  getAccountDetailsFromResourceId: jest.fn(),
}));

import { getAccountDetailsFromResourceId } from "../../../CopyJobUtils";

const mockGetAccountDetailsFromResourceId = getAccountDetailsFromResourceId as jest.MockedFunction<
  typeof getAccountDetailsFromResourceId
>;

interface TestComponentProps {
  copyJobState: CopyJobContextState | null;
  onResult?: (result: any) => void;
}

const TestComponent: React.FC<TestComponentProps> = ({ copyJobState, onResult }) => {
  const result = useSourceAndTargetData(copyJobState);

  React.useEffect(() => {
    onResult?.(result);
  }, [result, onResult]);

  return <div data-testid="test-component">Test Component</div>;
};

describe("useSourceAndTargetData", () => {
  const mockSubscription: Subscription = {
    subscriptionId: "test-subscription-id",
    displayName: "Test Subscription",
    state: "Enabled",
    subscriptionPolicies: null,
    authorizationSource: "RoleBased",
  };

  const mockSourceAccount: DatabaseAccount = {
    id: "/subscriptions/source-sub-id/resourceGroups/source-rg/providers/Microsoft.DocumentDB/databaseAccounts/source-account",
    name: "source-account",
    location: "East US",
    type: "Microsoft.DocumentDB/databaseAccounts",
    kind: "GlobalDocumentDB",
    properties: {
      documentEndpoint: "https://source-account.documents.azure.com:443/",
      capabilities: [],
      locations: [],
    },
  };

  const mockTargetAccount: DatabaseAccount = {
    id: "/subscriptions/target-sub-id/resourceGroups/target-rg/providers/Microsoft.DocumentDB/databaseAccounts/target-account",
    name: "target-account",
    location: "West US",
    type: "Microsoft.DocumentDB/databaseAccounts",
    kind: "GlobalDocumentDB",
    properties: {
      documentEndpoint: "https://target-account.documents.azure.com:443/",
      capabilities: [],
      locations: [],
    },
  };

  const mockCopyJobState: CopyJobContextState = {
    jobName: "test-job",
    migrationType: CopyJobMigrationType.Offline,
    sourceReadAccessFromTarget: false,
    source: {
      subscription: mockSubscription,
      account: mockSourceAccount,
      databaseId: "source-db",
      containerId: "source-container",
    },
    target: {
      subscriptionId: "target-subscription-id",
      account: mockTargetAccount,
      databaseId: "target-db",
      containerId: "target-container",
    },
  };

  beforeEach(() => {
    mockGetAccountDetailsFromResourceId.mockImplementation((accountId) => {
      if (accountId === mockSourceAccount.id) {
        return {
          subscriptionId: "source-sub-id",
          resourceGroup: "source-rg",
          accountName: "source-account",
        };
      } else if (accountId === mockTargetAccount.id) {
        return {
          subscriptionId: "target-sub-id",
          resourceGroup: "target-rg",
          accountName: "target-account",
        };
      }
      return null;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Hook Execution", () => {
    it("should return correct data structure when copyJobState is provided", () => {
      let hookResult: any = null;
      const onResult = jest.fn((result) => {
        hookResult = result;
      });

      render(<TestComponent copyJobState={mockCopyJobState} onResult={onResult} />);

      expect(onResult).toHaveBeenCalled();
      expect(hookResult).toBeDefined();
      expect(hookResult).toHaveProperty("source");
      expect(hookResult).toHaveProperty("target");
      expect(hookResult).toHaveProperty("sourceDbParams");
      expect(hookResult).toHaveProperty("sourceContainerParams");
      expect(hookResult).toHaveProperty("targetDbParams");
      expect(hookResult).toHaveProperty("targetContainerParams");
    });

    it("should call getAccountDetailsFromResourceId with correct parameters", () => {
      render(<TestComponent copyJobState={mockCopyJobState} />);

      expect(mockGetAccountDetailsFromResourceId).toHaveBeenCalledWith(mockSourceAccount.id);
      expect(mockGetAccountDetailsFromResourceId).toHaveBeenCalledWith(mockTargetAccount.id);
      expect(mockGetAccountDetailsFromResourceId).toHaveBeenCalledTimes(2);
    });

    it("should return source and target objects from copyJobState", () => {
      let hookResult: any = null;
      const onResult = jest.fn((result) => {
        hookResult = result;
      });

      render(<TestComponent copyJobState={mockCopyJobState} onResult={onResult} />);

      expect(hookResult.source).toEqual(mockCopyJobState.source);
      expect(hookResult.target).toEqual(mockCopyJobState.target);
    });

    it("should construct sourceDbParams array correctly", () => {
      let hookResult: any = null;
      const onResult = jest.fn((result) => {
        hookResult = result;
      });

      render(<TestComponent copyJobState={mockCopyJobState} onResult={onResult} />);

      expect(hookResult.sourceDbParams).toEqual(["source-sub-id", "source-rg", "source-account", "SQL"]);
    });

    it("should construct sourceContainerParams array correctly", () => {
      let hookResult: any = null;
      const onResult = jest.fn((result) => {
        hookResult = result;
      });

      render(<TestComponent copyJobState={mockCopyJobState} onResult={onResult} />);

      expect(hookResult.sourceContainerParams).toEqual([
        "source-sub-id",
        "source-rg",
        "source-account",
        "source-db",
        "SQL",
      ]);
    });

    it("should construct targetDbParams array correctly", () => {
      let hookResult: any = null;
      const onResult = jest.fn((result) => {
        hookResult = result;
      });

      render(<TestComponent copyJobState={mockCopyJobState} onResult={onResult} />);

      expect(hookResult.targetDbParams).toEqual(["target-sub-id", "target-rg", "target-account", "SQL"]);
    });

    it("should construct targetContainerParams array correctly", () => {
      let hookResult: any = null;
      const onResult = jest.fn((result) => {
        hookResult = result;
      });

      render(<TestComponent copyJobState={mockCopyJobState} onResult={onResult} />);

      expect(hookResult.targetContainerParams).toEqual([
        "target-sub-id",
        "target-rg",
        "target-account",
        "target-db",
        "SQL",
      ]);
    });
  });

  describe("Memoization and Performance", () => {
    it("should work with React strict mode (double invocation)", () => {
      let hookResult: any = null;
      const onResult = jest.fn((result) => {
        hookResult = result;
      });

      const { rerender } = render(<TestComponent copyJobState={mockCopyJobState} onResult={onResult} />);
      const firstResult = { ...hookResult };

      rerender(<TestComponent copyJobState={mockCopyJobState} onResult={onResult} />);
      const secondResult = { ...hookResult };

      expect(firstResult).toEqual(secondResult);
    });

    it("should handle component re-renders gracefully", () => {
      let renderCount = 0;
      const onResult = jest.fn(() => {
        renderCount++;
      });

      const { rerender } = render(<TestComponent copyJobState={mockCopyJobState} onResult={onResult} />);

      for (let i = 0; i < 5; i++) {
        rerender(<TestComponent copyJobState={mockCopyJobState} onResult={onResult} />);
      }

      expect(renderCount).toBeGreaterThan(0);
      expect(mockGetAccountDetailsFromResourceId).toHaveBeenCalled();
    });

    it("should recalculate when copyJobState changes", () => {
      let hookResult: any = null;
      const onResult = jest.fn((result) => {
        hookResult = result;
      });

      const { rerender } = render(<TestComponent copyJobState={mockCopyJobState} onResult={onResult} />);
      const firstResult = { ...hookResult };

      const updatedState = {
        ...mockCopyJobState,
        source: {
          ...mockCopyJobState.source,
          databaseId: "updated-source-db",
        },
      };

      rerender(<TestComponent copyJobState={updatedState} onResult={onResult} />);
      const secondResult = { ...hookResult };

      expect(firstResult.sourceContainerParams[3]).toBe("source-db");
      expect(secondResult.sourceContainerParams[3]).toBe("updated-source-db");
    });
  });

  describe("Complex State Scenarios", () => {
    it("should handle state with only source defined", () => {
      const sourceOnlyState = {
        ...mockCopyJobState,
        target: undefined as any,
      };

      let hookResult: any = null;
      const onResult = jest.fn((result) => {
        hookResult = result;
      });

      render(<TestComponent copyJobState={sourceOnlyState} onResult={onResult} />);

      expect(hookResult.source).toBeDefined();
      expect(hookResult.target).toBeUndefined();
      expect(hookResult.sourceDbParams).toEqual(["source-sub-id", "source-rg", "source-account", "SQL"]);
      expect(hookResult.targetDbParams).toEqual([undefined, undefined, undefined, "SQL"]);
    });

    it("should handle state with only target defined", () => {
      const targetOnlyState = {
        ...mockCopyJobState,
        source: undefined as any,
      };

      let hookResult: any = null;
      const onResult = jest.fn((result) => {
        hookResult = result;
      });

      render(<TestComponent copyJobState={targetOnlyState} onResult={onResult} />);

      expect(hookResult.source).toBeUndefined();
      expect(hookResult.target).toBeDefined();
      expect(hookResult.sourceDbParams).toEqual([undefined, undefined, undefined, "SQL"]);
      expect(hookResult.targetDbParams).toEqual(["target-sub-id", "target-rg", "target-account", "SQL"]);
    });

    it("should handle state with missing database IDs", () => {
      const stateWithoutDbIds = {
        ...mockCopyJobState,
        source: {
          ...mockCopyJobState.source,
          databaseId: undefined as any,
        },
        target: {
          ...mockCopyJobState.target,
          databaseId: undefined as any,
        },
      };

      let hookResult: any = null;
      const onResult = jest.fn((result) => {
        hookResult = result;
      });

      render(<TestComponent copyJobState={stateWithoutDbIds} onResult={onResult} />);

      expect(hookResult.sourceContainerParams[3]).toBeUndefined();
      expect(hookResult.targetContainerParams[3]).toBeUndefined();
    });

    it("should handle state with missing accounts", () => {
      const stateWithoutAccounts = {
        ...mockCopyJobState,
        source: {
          ...mockCopyJobState.source,
          account: undefined as any,
        },
        target: {
          ...mockCopyJobState.target,
          account: undefined as any,
        },
      };

      let hookResult: any = null;
      const onResult = jest.fn((result) => {
        hookResult = result;
      });

      render(<TestComponent copyJobState={stateWithoutAccounts} onResult={onResult} />);

      expect(mockGetAccountDetailsFromResourceId).toHaveBeenCalledWith(undefined);
      expect(hookResult.sourceDbParams).toEqual([undefined, undefined, undefined, "SQL"]);
      expect(hookResult.targetDbParams).toEqual([undefined, undefined, undefined, "SQL"]);
    });
  });

  describe("Hook Return Value Structure", () => {
    it("should return an object with exactly 6 properties", () => {
      let hookResult: any = null;
      const onResult = jest.fn((result) => {
        hookResult = result;
      });

      render(<TestComponent copyJobState={mockCopyJobState} onResult={onResult} />);

      const keys = Object.keys(hookResult);
      expect(keys).toHaveLength(6);
      expect(keys).toContain("source");
      expect(keys).toContain("target");
      expect(keys).toContain("sourceDbParams");
      expect(keys).toContain("sourceContainerParams");
      expect(keys).toContain("targetDbParams");
      expect(keys).toContain("targetContainerParams");
    });

    it("should not return undefined properties when state is valid", () => {
      let hookResult: any = null;
      const onResult = jest.fn((result) => {
        hookResult = result;
      });

      render(<TestComponent copyJobState={mockCopyJobState} onResult={onResult} />);

      expect(hookResult.source).toBeDefined();
      expect(hookResult.target).toBeDefined();
      expect(hookResult.sourceDbParams).toBeDefined();
      expect(hookResult.sourceContainerParams).toBeDefined();
      expect(hookResult.targetDbParams).toBeDefined();
      expect(hookResult.targetContainerParams).toBeDefined();
    });
  });
});
