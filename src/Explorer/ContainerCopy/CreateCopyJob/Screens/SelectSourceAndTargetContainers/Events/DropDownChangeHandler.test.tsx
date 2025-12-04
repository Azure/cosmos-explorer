import { fireEvent, render } from "@testing-library/react";
import React from "react";
import { CopyJobMigrationType } from "../../../../Enums/CopyJobEnums";
import { CopyJobContextState, DropdownOptionType } from "../../../../Types/CopyJobTypes";
import { dropDownChangeHandler } from "./DropDownChangeHandler";

// Mock initial state for testing
const createMockInitialState = (): CopyJobContextState => ({
  jobName: "test-job",
  migrationType: CopyJobMigrationType.Offline,
  sourceReadAccessFromTarget: false,
  source: {
    subscription: {
      subscriptionId: "source-sub-id",
      displayName: "Source Subscription",
      state: "Enabled",
      subscriptionPolicies: {
        locationPlacementId: "test",
        quotaId: "test",
        spendingLimit: "Off",
      },
      authorizationSource: "test",
    },
    account: {
      id: "source-account-id",
      name: "source-account",
      location: "East US",
      type: "Microsoft.DocumentDB/databaseAccounts",
      kind: "DocumentDB",
      properties: {
        documentEndpoint: "https://source.documents.azure.com:443/",
        cassandraEndpoint: undefined,
        gremlinEndpoint: undefined,
        tableEndpoint: undefined,
        writeLocations: [],
        readLocations: [],
        enableMultipleWriteLocations: false,
        isVirtualNetworkFilterEnabled: false,
        enableFreeTier: false,
        enableAnalyticalStorage: false,
        backupPolicy: undefined,
        disableLocalAuth: false,
        capacity: undefined,
        enablePriorityBasedExecution: false,
        publicNetworkAccess: "Enabled",
        enableMaterializedViews: false,
      },
      systemData: undefined,
    },
    databaseId: "source-db",
    containerId: "source-container",
  },
  target: {
    subscriptionId: "target-sub-id",
    account: {
      id: "target-account-id",
      name: "target-account",
      location: "West US",
      type: "Microsoft.DocumentDB/databaseAccounts",
      kind: "DocumentDB",
      properties: {
        documentEndpoint: "https://target.documents.azure.com:443/",
        cassandraEndpoint: undefined,
        gremlinEndpoint: undefined,
        tableEndpoint: undefined,
        writeLocations: [],
        readLocations: [],
        enableMultipleWriteLocations: false,
        isVirtualNetworkFilterEnabled: false,
        enableFreeTier: false,
        enableAnalyticalStorage: false,
        backupPolicy: undefined,
        disableLocalAuth: false,
        capacity: undefined,
        enablePriorityBasedExecution: false,
        publicNetworkAccess: "Enabled",
        enableMaterializedViews: false,
      },
      systemData: undefined,
    },
    databaseId: "target-db",
    containerId: "target-container",
  },
});

// Test component to test the handler function
interface TestComponentProps {
  initialState: CopyJobContextState;
  onStateChange: (state: CopyJobContextState) => void;
}

const TestComponent: React.FC<TestComponentProps> = ({ initialState, onStateChange }) => {
  const [state, setState] = React.useState<CopyJobContextState>(initialState);
  const handler = dropDownChangeHandler(setState);

  React.useEffect(() => {
    onStateChange(state);
  }, [state, onStateChange]);

  return (
    <div>
      <button
        data-testid="source-database-btn"
        onClick={() =>
          handler("sourceDatabase")({} as React.FormEvent, { key: "new-source-db", text: "New Source DB", data: {} })
        }
      >
        Source Database
      </button>
      <button
        data-testid="source-container-btn"
        onClick={() =>
          handler("sourceContainer")({} as React.FormEvent, {
            key: "new-source-container",
            text: "New Source Container",
            data: {},
          })
        }
      >
        Source Container
      </button>
      <button
        data-testid="target-database-btn"
        onClick={() =>
          handler("targetDatabase")({} as React.FormEvent, { key: "new-target-db", text: "New Target DB", data: {} })
        }
      >
        Target Database
      </button>
      <button
        data-testid="target-container-btn"
        onClick={() =>
          handler("targetContainer")({} as React.FormEvent, {
            key: "new-target-container",
            text: "New Target Container",
            data: {},
          })
        }
      >
        Target Container
      </button>
    </div>
  );
};

describe("dropDownChangeHandler", () => {
  let mockSetCopyJobState: jest.Mock;
  let capturedState: CopyJobContextState;
  let initialState: CopyJobContextState;

  beforeEach(() => {
    mockSetCopyJobState = jest.fn();
    initialState = createMockInitialState();
    capturedState = initialState;
  });

  const renderTestComponent = () => {
    return render(
      <TestComponent
        initialState={initialState}
        onStateChange={(state) => {
          capturedState = state;
        }}
      />,
    );
  };

  describe("sourceDatabase dropdown change", () => {
    it("should update source database and reset source container", () => {
      const { getByTestId } = renderTestComponent();

      fireEvent.click(getByTestId("source-database-btn"));

      expect(capturedState.source.databaseId).toBe("new-source-db");
      expect(capturedState.source.containerId).toBeUndefined();
      // Ensure other properties remain unchanged
      expect(capturedState.source.subscription).toEqual(initialState.source.subscription);
      expect(capturedState.source.account).toEqual(initialState.source.account);
      expect(capturedState.target).toEqual(initialState.target);
    });

    it("should maintain other state properties when updating source database", () => {
      const { getByTestId } = renderTestComponent();

      fireEvent.click(getByTestId("source-database-btn"));

      expect(capturedState.jobName).toBe(initialState.jobName);
      expect(capturedState.migrationType).toBe(initialState.migrationType);
      expect(capturedState.sourceReadAccessFromTarget).toBe(initialState.sourceReadAccessFromTarget);
    });
  });

  describe("sourceContainer dropdown change", () => {
    it("should update source container only", () => {
      const { getByTestId } = renderTestComponent();

      fireEvent.click(getByTestId("source-container-btn"));

      expect(capturedState.source.containerId).toBe("new-source-container");
      expect(capturedState.source.databaseId).toBe(initialState.source.databaseId);
      expect(capturedState.source.subscription).toEqual(initialState.source.subscription);
      expect(capturedState.source.account).toEqual(initialState.source.account);
      expect(capturedState.target).toEqual(initialState.target);
    });

    it("should not affect database selection when updating container", () => {
      const { getByTestId } = renderTestComponent();

      fireEvent.click(getByTestId("source-container-btn"));

      expect(capturedState.source.databaseId).toBe("source-db");
    });
  });

  describe("targetDatabase dropdown change", () => {
    it("should update target database and reset target container", () => {
      const { getByTestId } = renderTestComponent();

      fireEvent.click(getByTestId("target-database-btn"));

      expect(capturedState.target.databaseId).toBe("new-target-db");
      expect(capturedState.target.containerId).toBeUndefined();
      // Ensure other properties remain unchanged
      expect(capturedState.target.subscriptionId).toBe(initialState.target.subscriptionId);
      expect(capturedState.target.account).toEqual(initialState.target.account);
      expect(capturedState.source).toEqual(initialState.source);
    });

    it("should maintain other state properties when updating target database", () => {
      const { getByTestId } = renderTestComponent();

      fireEvent.click(getByTestId("target-database-btn"));

      expect(capturedState.jobName).toBe(initialState.jobName);
      expect(capturedState.migrationType).toBe(initialState.migrationType);
      expect(capturedState.sourceReadAccessFromTarget).toBe(initialState.sourceReadAccessFromTarget);
    });
  });

  describe("targetContainer dropdown change", () => {
    it("should update target container only", () => {
      const { getByTestId } = renderTestComponent();

      fireEvent.click(getByTestId("target-container-btn"));

      expect(capturedState.target.containerId).toBe("new-target-container");
      expect(capturedState.target.databaseId).toBe(initialState.target.databaseId);
      expect(capturedState.target.subscriptionId).toBe(initialState.target.subscriptionId);
      expect(capturedState.target.account).toEqual(initialState.target.account);
      expect(capturedState.source).toEqual(initialState.source);
    });

    it("should not affect database selection when updating container", () => {
      const { getByTestId } = renderTestComponent();

      fireEvent.click(getByTestId("target-container-btn"));

      expect(capturedState.target.databaseId).toBe("target-db");
    });
  });

  describe("edge cases and error scenarios", () => {
    it("should handle empty string keys", () => {
      const { getByTestId } = renderTestComponent();

      const handler = dropDownChangeHandler((updater) => {
        const newState = typeof updater === "function" ? updater(capturedState) : updater;
        capturedState = newState;
        return capturedState;
      });

      const mockEvent = {} as React.FormEvent;
      const mockOption: DropdownOptionType = { key: "", text: "Empty Option", data: {} };

      handler("sourceDatabase")(mockEvent, mockOption);

      expect(capturedState.source.databaseId).toBe("");
      expect(capturedState.source.containerId).toBeUndefined();
    });

    it("should handle special characters in keys", () => {
      const { getByTestId } = renderTestComponent();

      const handler = dropDownChangeHandler((updater) => {
        const newState = typeof updater === "function" ? updater(capturedState) : updater;
        capturedState = newState;
        return capturedState;
      });

      const mockEvent = {} as React.FormEvent;
      const mockOption: DropdownOptionType = {
        key: "test-db-with-special-chars-@#$%",
        text: "Special DB",
        data: {},
      };

      handler("sourceDatabase")(mockEvent, mockOption);

      expect(capturedState.source.databaseId).toBe("test-db-with-special-chars-@#$%");
      expect(capturedState.source.containerId).toBeUndefined();
    });

    it("should handle numeric keys", () => {
      const { getByTestId } = renderTestComponent();

      const handler = dropDownChangeHandler((updater) => {
        const newState = typeof updater === "function" ? updater(capturedState) : updater;
        capturedState = newState;
        return capturedState;
      });

      const mockEvent = {} as React.FormEvent;
      const mockOption: DropdownOptionType = { key: "12345", text: "Numeric Option", data: {} };

      handler("targetContainer")(mockEvent, mockOption);

      expect(capturedState.target.containerId).toBe("12345");
    });

    it.skip("should handle invalid dropdown type gracefully", () => {
      const handler = dropDownChangeHandler((updater) => {
        const newState = typeof updater === "function" ? updater(capturedState) : updater;
        capturedState = newState;
        return capturedState;
      });

      const mockEvent = {} as React.FormEvent;
      const mockOption: DropdownOptionType = { key: "test-value", text: "Test Option", data: {} };

      const invalidHandler = handler as any;
      invalidHandler("invalidType")(mockEvent, mockOption);

      expect(capturedState).toEqual(initialState);
    });
  });
});
