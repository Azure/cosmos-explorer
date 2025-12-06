import "@testing-library/jest-dom";
import { fireEvent, render } from "@testing-library/react";
import React from "react";
import { noop } from "underscore";
import { DatabaseAccount, Subscription } from "../../../../../../Contracts/DataModels";
import { CopyJobMigrationType } from "../../../../Enums/CopyJobEnums";
import { CopyJobContextState } from "../../../../Types/CopyJobTypes";
import { useDropdownOptions, useEventHandlers } from "./selectAccountUtils";

jest.mock("../../../Utils/useCopyJobPrerequisitesCache", () => ({
  useCopyJobPrerequisitesCache: jest.fn(() => ({
    setValidationCache: jest.fn(),
  })),
}));

const mockSubscriptions: Subscription[] = [
  {
    subscriptionId: "sub-1",
    displayName: "Test Subscription 1",
    state: "Enabled",
    subscriptionPolicies: {
      locationPlacementId: "test",
      quotaId: "test",
      spendingLimit: "Off",
    },
  },
  {
    subscriptionId: "sub-2",
    displayName: "Test Subscription 2",
    state: "Enabled",
    subscriptionPolicies: {
      locationPlacementId: "test",
      quotaId: "test",
      spendingLimit: "Off",
    },
  },
];

const mockAccounts: DatabaseAccount[] = [
  {
    id: "account-1",
    name: "Test Account 1",
    location: "East US",
    type: "Microsoft.DocumentDB/databaseAccounts",
    kind: "GlobalDocumentDB",
    properties: {
      documentEndpoint: "https://test1.documents.azure.com:443/",
      gremlinEndpoint: "https://test1.gremlin.cosmosdb.azure.com:443/",
      tableEndpoint: "https://test1.table.cosmosdb.azure.com:443/",
      cassandraEndpoint: "https://test1.cassandra.cosmosdb.azure.com:443/",
      capabilities: [],
      writeLocations: [],
      readLocations: [],
      locations: [],
      ipRules: [],
      enableMultipleWriteLocations: false,
      isVirtualNetworkFilterEnabled: false,
      enableFreeTier: false,
      enableAnalyticalStorage: false,
      publicNetworkAccess: "Enabled",
      defaultIdentity: "",
      disableLocalAuth: false,
    },
  },
  {
    id: "account-2",
    name: "Test Account 2",
    location: "West US",
    type: "Microsoft.DocumentDB/databaseAccounts",
    kind: "GlobalDocumentDB",
    properties: {
      documentEndpoint: "https://test2.documents.azure.com:443/",
      gremlinEndpoint: "https://test2.gremlin.cosmosdb.azure.com:443/",
      tableEndpoint: "https://test2.table.cosmosdb.azure.com:443/",
      cassandraEndpoint: "https://test2.cassandra.cosmosdb.azure.com:443/",
      capabilities: [],
      writeLocations: [],
      readLocations: [],
      locations: [],
      enableMultipleWriteLocations: false,
      isVirtualNetworkFilterEnabled: false,
      enableFreeTier: false,
      enableAnalyticalStorage: false,
      publicNetworkAccess: "Enabled",
      defaultIdentity: "",
      disableLocalAuth: false,
    },
  },
];

const DropdownOptionsTestComponent: React.FC<{
  subscriptions: Subscription[];
  accounts: DatabaseAccount[];
  onResult?: (result: { subscriptionOptions: any[]; accountOptions: any[] }) => void;
}> = ({ subscriptions, accounts, onResult }) => {
  const result = useDropdownOptions(subscriptions, accounts);

  React.useEffect(() => {
    if (onResult) {
      onResult(result);
    }
  }, [result, onResult]);

  return (
    <div>
      <div data-testid="subscription-options-count">{result.subscriptionOptions.length}</div>
      <div data-testid="account-options-count">{result.accountOptions.length}</div>
    </div>
  );
};

const EventHandlersTestComponent: React.FC<{
  setCopyJobState: jest.Mock;
  onResult?: (result: any) => void;
}> = ({ setCopyJobState, onResult }) => {
  const result = useEventHandlers(setCopyJobState);

  React.useEffect(() => {
    if (onResult) {
      onResult(result);
    }
  }, [result, onResult]);

  return (
    <div>
      <button
        data-testid="select-subscription-button"
        onClick={() => result.handleSelectSourceAccount("subscription", mockSubscriptions[0] as any)}
      >
        Select Subscription
      </button>
      <button
        data-testid="select-account-button"
        onClick={() => result.handleSelectSourceAccount("account", mockAccounts[0] as any)}
      >
        Select Account
      </button>
      <button data-testid="migration-type-button" onClick={(e) => result.handleMigrationTypeChange(e, true)}>
        Change Migration Type
      </button>
    </div>
  );
};

describe("selectAccountUtils", () => {
  describe("useDropdownOptions", () => {
    it("should return empty arrays when subscriptions and accounts are undefined", () => {
      let capturedResult: any;

      render(
        <DropdownOptionsTestComponent
          subscriptions={undefined as any}
          accounts={undefined as any}
          onResult={(result) => {
            capturedResult = result;
          }}
        />,
      );

      expect(capturedResult).toEqual({
        subscriptionOptions: [],
        accountOptions: [],
      });
    });

    it("should return empty arrays when subscriptions and accounts are empty arrays", () => {
      let capturedResult: any;

      render(
        <DropdownOptionsTestComponent
          subscriptions={[]}
          accounts={[]}
          onResult={(result) => {
            capturedResult = result;
          }}
        />,
      );

      expect(capturedResult).toEqual({
        subscriptionOptions: [],
        accountOptions: [],
      });
    });

    it("should transform subscriptions into dropdown options correctly", () => {
      let capturedResult: any;

      render(
        <DropdownOptionsTestComponent
          subscriptions={mockSubscriptions}
          accounts={[]}
          onResult={(result) => {
            capturedResult = result;
          }}
        />,
      );

      expect(capturedResult.subscriptionOptions).toHaveLength(2);
      expect(capturedResult.subscriptionOptions[0]).toEqual({
        key: "sub-1",
        text: "Test Subscription 1",
        data: mockSubscriptions[0],
      });
      expect(capturedResult.subscriptionOptions[1]).toEqual({
        key: "sub-2",
        text: "Test Subscription 2",
        data: mockSubscriptions[1],
      });
    });

    it("should transform accounts into dropdown options correctly", () => {
      let capturedResult: any;

      render(
        <DropdownOptionsTestComponent
          subscriptions={[]}
          accounts={mockAccounts}
          onResult={(result) => {
            capturedResult = result;
          }}
        />,
      );

      expect(capturedResult.accountOptions).toHaveLength(2);
      expect(capturedResult.accountOptions[0]).toEqual({
        key: "account-1",
        text: "Test Account 1",
        data: mockAccounts[0],
      });
      expect(capturedResult.accountOptions[1]).toEqual({
        key: "account-2",
        text: "Test Account 2",
        data: mockAccounts[1],
      });
    });

    it("should handle both subscriptions and accounts correctly", () => {
      let capturedResult: any;

      render(
        <DropdownOptionsTestComponent
          subscriptions={mockSubscriptions}
          accounts={mockAccounts}
          onResult={(result) => {
            capturedResult = result;
          }}
        />,
      );

      expect(capturedResult.subscriptionOptions).toHaveLength(2);
      expect(capturedResult.accountOptions).toHaveLength(2);
    });
  });

  describe("useEventHandlers", () => {
    let mockSetCopyJobState: jest.Mock;
    let mockSetValidationCache: jest.Mock;

    beforeEach(async () => {
      mockSetCopyJobState = jest.fn();
      mockSetValidationCache = jest.fn();

      const { useCopyJobPrerequisitesCache } = await import("../../../Utils/useCopyJobPrerequisitesCache");
      (useCopyJobPrerequisitesCache as unknown as jest.Mock).mockReturnValue({
        setValidationCache: mockSetValidationCache,
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should handle subscription selection correctly", () => {
      const { getByTestId } = render(
        <EventHandlersTestComponent setCopyJobState={mockSetCopyJobState} onResult={noop} />,
      );

      fireEvent.click(getByTestId("select-subscription-button"));

      expect(mockSetCopyJobState).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSetValidationCache).toHaveBeenCalledWith(new Map<string, boolean>());

      const stateUpdater = mockSetCopyJobState.mock.calls[0][0];
      const mockPrevState: CopyJobContextState = {
        source: {
          subscription: null,
          account: { id: "existing-account" } as any,
        },
        migrationType: CopyJobMigrationType.Online,
      } as any;

      const newState = stateUpdater(mockPrevState);
      expect(newState).toEqual({
        source: {
          subscription: mockSubscriptions[0],
          account: null,
        },
        migrationType: CopyJobMigrationType.Online,
      });
    });

    it("should handle account selection correctly", () => {
      const { getByTestId } = render(
        <EventHandlersTestComponent setCopyJobState={mockSetCopyJobState} onResult={noop} />,
      );

      fireEvent.click(getByTestId("select-account-button"));

      expect(mockSetCopyJobState).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSetValidationCache).toHaveBeenCalledWith(new Map<string, boolean>());

      const stateUpdater = mockSetCopyJobState.mock.calls[0][0];
      const mockPrevState: CopyJobContextState = {
        source: {
          subscription: { subscriptionId: "existing-sub" } as any,
          account: null,
        },
        migrationType: CopyJobMigrationType.Online,
      } as any;

      const newState = stateUpdater(mockPrevState);
      expect(newState).toEqual({
        source: {
          subscription: { subscriptionId: "existing-sub" },
          account: mockAccounts[0],
        },
        migrationType: CopyJobMigrationType.Online,
      });
    });

    it("should handle subscription selection with undefined data", () => {
      let capturedHandlers: any;

      render(
        <EventHandlersTestComponent
          setCopyJobState={mockSetCopyJobState}
          onResult={(result) => {
            capturedHandlers = result;
          }}
        />,
      );

      capturedHandlers.handleSelectSourceAccount("subscription", undefined);

      expect(mockSetCopyJobState).toHaveBeenCalledWith(expect.any(Function));

      const stateUpdater = mockSetCopyJobState.mock.calls[0][0];
      const mockPrevState: CopyJobContextState = {
        source: {
          subscription: { subscriptionId: "existing-sub" } as any,
          account: { id: "existing-account" } as any,
        },
        migrationType: CopyJobMigrationType.Online,
      } as any;

      const newState = stateUpdater(mockPrevState);
      expect(newState).toEqual({
        source: {
          subscription: null,
          account: null,
        },
        migrationType: CopyJobMigrationType.Online,
      });
    });

    it("should handle account selection with undefined data", () => {
      let capturedHandlers: any;

      render(
        <EventHandlersTestComponent
          setCopyJobState={mockSetCopyJobState}
          onResult={(result) => {
            capturedHandlers = result;
          }}
        />,
      );

      capturedHandlers.handleSelectSourceAccount("account", undefined);

      expect(mockSetCopyJobState).toHaveBeenCalledWith(expect.any(Function));

      const stateUpdater = mockSetCopyJobState.mock.calls[0][0];
      const mockPrevState: CopyJobContextState = {
        source: {
          subscription: { subscriptionId: "existing-sub" } as any,
          account: { id: "existing-account" } as any,
        },
        migrationType: CopyJobMigrationType.Online,
      } as any;

      const newState = stateUpdater(mockPrevState);
      expect(newState).toEqual({
        source: {
          subscription: { subscriptionId: "existing-sub" },
          account: null,
        },
        migrationType: CopyJobMigrationType.Online,
      });
    });

    it("should handle migration type change to offline", () => {
      const { getByTestId } = render(<EventHandlersTestComponent setCopyJobState={mockSetCopyJobState} />);

      fireEvent.click(getByTestId("migration-type-button"));

      expect(mockSetCopyJobState).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSetValidationCache).toHaveBeenCalledWith(new Map<string, boolean>());

      const stateUpdater = mockSetCopyJobState.mock.calls[0][0];
      const mockPrevState: CopyJobContextState = {
        source: {
          subscription: null,
          account: null,
        },
        migrationType: CopyJobMigrationType.Online,
      } as any;

      const newState = stateUpdater(mockPrevState);
      expect(newState).toEqual({
        source: {
          subscription: null,
          account: null,
        },
        migrationType: CopyJobMigrationType.Offline,
      });
    });

    it("should handle migration type change to online when checked is false", () => {
      let capturedHandlers: any;

      render(
        <EventHandlersTestComponent
          setCopyJobState={mockSetCopyJobState}
          onResult={(result) => {
            capturedHandlers = result;
          }}
        />,
      );

      capturedHandlers.handleMigrationTypeChange(undefined, false);

      expect(mockSetCopyJobState).toHaveBeenCalledWith(expect.any(Function));

      const stateUpdater = mockSetCopyJobState.mock.calls[0][0];
      const mockPrevState: CopyJobContextState = {
        source: {
          subscription: null,
          account: null,
        },
        migrationType: CopyJobMigrationType.Offline,
      } as any;

      const newState = stateUpdater(mockPrevState);
      expect(newState).toEqual({
        source: {
          subscription: null,
          account: null,
        },
        migrationType: CopyJobMigrationType.Online,
      });
    });

    it("should preserve other state properties when updating", () => {
      let capturedHandlers: any;

      render(
        <EventHandlersTestComponent
          setCopyJobState={mockSetCopyJobState}
          onResult={(result) => {
            capturedHandlers = result;
          }}
        />,
      );

      capturedHandlers.handleSelectSourceAccount("subscription", mockSubscriptions[0] as Subscription);

      const stateUpdater = mockSetCopyJobState.mock.calls[0][0];
      const mockPrevState = {
        jobName: "Test Job",
        source: {
          subscription: null,
          account: null,
          databaseId: "test-database-id",
          containerId: "test-container-id",
        },
        migrationType: CopyJobMigrationType.Online,
        target: {
          account: { id: "dest-account" } as DatabaseAccount,
          databaseId: "test-database-id",
          containerId: "test-container-id",
          subscriptionId: "dest-sub-id",
        },
      } as CopyJobContextState;

      const newState = stateUpdater(mockPrevState);
      expect(newState.target).toEqual(mockPrevState.target);
    });

    it("should return the same state for unknown selection type", () => {
      let capturedHandlers: any;

      render(
        <EventHandlersTestComponent
          setCopyJobState={mockSetCopyJobState}
          onResult={(result) => {
            capturedHandlers = result;
          }}
        />,
      );

      capturedHandlers.handleSelectSourceAccount("unknown" as any, mockSubscriptions[0] as any);

      const stateUpdater = mockSetCopyJobState.mock.calls[0][0];
      const mockPrevState: CopyJobContextState = {
        source: {
          subscription: { subscriptionId: "existing-sub" } as any,
          account: { id: "existing-account" } as any,
        },
        migrationType: CopyJobMigrationType.Online,
      } as any;

      const newState = stateUpdater(mockPrevState);
      expect(newState).toEqual(mockPrevState);
    });
  });
});
