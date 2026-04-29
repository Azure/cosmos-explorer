import { render, screen } from "@testing-library/react";
import {
  PartitionKeyComponent,
  PartitionKeyComponentProps,
} from "Explorer/Controls/Settings/SettingsSubComponents/PartitionKeyComponent";
import React from "react";
import { updateUserContext } from "UserContext";
import { DatabaseAccount } from "Contracts/DataModels";
import { DataTransferJobGetResults } from "Utils/arm/generatedClients/dataTransferService/types";

jest.mock("Common/dataAccess/dataTransfers", () => ({
  cancelDataTransferJob: jest.fn().mockResolvedValue(undefined),
  pauseDataTransferJob: jest.fn().mockResolvedValue(undefined),
  resumeDataTransferJob: jest.fn().mockResolvedValue(undefined),
  completeDataTransferJob: jest.fn().mockResolvedValue(undefined),
  pollDataTransferJob: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("hooks/useDataTransferJobs", () => ({
  useDataTransferJobs: () => ({ dataTransferJobs: [] }),
  refreshDataTransferJobs: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("hooks/useSidePanel", () => ({
  useSidePanel: {
    getState: () => ({
      openSidePanel: jest.fn(),
    }),
  },
}));

jest.mock("ConfigContext", () => ({
  configContext: { platform: "Portal" },
  Platform: { Emulator: "Emulator", Portal: "Portal" },
}));

jest.mock("Explorer/Explorer", () => {
  return jest.fn().mockImplementation(() => ({
    refreshAllDatabases: jest.fn(),
    refreshExplorer: jest.fn(),
  }));
});

const mockOfflineJob = {
  properties: {
    jobName: "Portal_test_123",
    source: { component: "CosmosDBSql" as const, databaseName: "testDb", containerName: "testCol" },
    destination: { component: "CosmosDBSql" as const, databaseName: "testDb", containerName: "newCol" },
    status: "InProgress",
    processedCount: 50,
    totalCount: 100,
    mode: "Offline" as const,
  },
} as DataTransferJobGetResults;

const mockOnlineJob = {
  properties: {
    jobName: "Portal_test_456",
    source: { component: "CosmosDBSql" as const, databaseName: "testDb", containerName: "testCol" },
    destination: { component: "CosmosDBSql" as const, databaseName: "testDb", containerName: "newCol" },
    status: "InProgress",
    processedCount: 50,
    totalCount: 100,
    mode: "Online" as const,
  },
} as DataTransferJobGetResults;

describe("PartitionKeyComponent", () => {
  const setupTest = () => {
    const Explorer = require("Explorer/Explorer");
    const explorer = new Explorer();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockDatabase = {} as any as import("../../../../Contracts/ViewModels").Database;
    const mockCollection = {
      id: jest.fn().mockReturnValue("testCol"),
      databaseId: "testDb",
      partitionKey: { kind: "Hash", paths: ["/id"], version: 2 },
      partitionKeyProperties: ["id"],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any as import("../../../../Contracts/ViewModels").Collection;

    const props: PartitionKeyComponentProps = {
      database: mockDatabase,
      collection: mockCollection,
      explorer,
    };

    return { explorer, props };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    updateUserContext({
      databaseAccount: {
        name: "testAccount",
        id: "/subscriptions/sub1/resourceGroups/rg1/providers/Microsoft.DocumentDB/databaseAccounts/testAccount",
        properties: {
          documentEndpoint: "https://test.documents.azure.com",
        },
      } as unknown as DatabaseAccount,
      subscriptionId: "sub1",
      resourceGroup: "rg1",
    });
  });

  it("renders partition key value", () => {
    const { props } = setupTest();
    render(<PartitionKeyComponent {...props} />);
    expect(screen.getByText("/id")).toBeTruthy();
  });

  it("renders read-only component without change button", () => {
    const { props } = setupTest();
    const { container } = render(<PartitionKeyComponent {...props} isReadOnly={true} />);
    expect(container.querySelector("[data-test='change-partition-key-button']")).toBeNull();
  });

  it("shows cancel button for offline job in progress", () => {
    jest.spyOn(require("hooks/useDataTransferJobs"), "useDataTransferJobs").mockReturnValue({
      dataTransferJobs: [mockOfflineJob],
    });

    const { props } = setupTest();
    const { container } = render(<PartitionKeyComponent {...props} />);
    // For offline jobs, the online action menu should not be present
    expect(container.querySelector("[data-test='online-job-action-menu']")).toBeNull();
  });

  it("shows ellipsis action menu for online job in progress", () => {
    jest.spyOn(require("hooks/useDataTransferJobs"), "useDataTransferJobs").mockReturnValue({
      dataTransferJobs: [mockOnlineJob],
    });

    const { props } = setupTest();
    const { container } = render(<PartitionKeyComponent {...props} />);
    expect(container.querySelector("[data-test='online-job-action-menu']")).toBeTruthy();
  });
});
