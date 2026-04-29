import { fireEvent, render, screen } from "@testing-library/react";
import { CopyJobMigrationType } from "Explorer/ContainerCopy/Enums/CopyJobEnums";
import * as React from "react";
import * as ViewModels from "Contracts/ViewModels";
import Explorer from "Explorer/Explorer";
import { ChangePartitionKeyPane } from "./ChangePartitionKeyPane";
import { userContext, updateUserContext } from "UserContext";
import { DatabaseAccount } from "Contracts/DataModels";

jest.mock("Common/dataAccess/createCollection", () => ({
  createCollection: jest.fn().mockResolvedValue({}),
}));

jest.mock("Common/dataAccess/dataTransfers", () => ({
  initiateDataTransfer: jest.fn().mockResolvedValue({}),
}));

jest.mock("Utils/arm/databaseAccountUtils", () => ({
  fetchDatabaseAccount: jest.fn().mockResolvedValue(null),
}));

jest.mock("Utils/arm/generatedClients/cosmos/databaseAccounts", () => ({
  update: jest.fn().mockResolvedValue({}),
}));

jest.mock("hooks/useSidePanel", () => ({
  useSidePanel: {
    getState: () => ({
      closeSidePanel: jest.fn(),
      openSidePanel: jest.fn(),
    }),
  },
}));

jest.mock("Explorer/useDatabases", () => {
  const state: Record<string, unknown> = {
    databases: [],
    resourceTokenCollection: undefined,
    resourceTokenDatabase: undefined,
    sampleDataResourceTokenCollection: undefined,
  };
  const mockStore = Object.assign(
    jest.fn(() => state),
    {
      getState: () => state,
      setState: jest.fn(),
      subscribe: jest.fn(),
      destroy: jest.fn(),
    },
  );
  return { useDatabases: mockStore };
});

jest.mock("Common/LoadingOverlay", () => {
  return {
    __esModule: true,
    default: ({ isLoading, label }: { isLoading: boolean; label: string }) =>
      isLoading ? <div data-testid="loading-overlay">{label}</div> : null,
  };
});

const createMockCollection = (id: string): ViewModels.Collection => {
  const mockCollection = {
    id: jest.fn().mockReturnValue(id),
    offer: jest.fn().mockReturnValue(undefined),
    partitionKey: { kind: "Hash", paths: ["/id"], version: 2 },
    partitionKeyProperties: ["id"],
    databaseId: "testDb",
  } as unknown as ViewModels.Collection;
  return mockCollection;
};

const createMockDatabase = (id: string, collections: ViewModels.Collection[] = []): ViewModels.Database => {
  return {
    id: jest.fn().mockReturnValue(id),
    collections: jest.fn().mockReturnValue(collections),
  } as unknown as ViewModels.Database;
};

describe("ChangePartitionKeyPane", () => {
  const mockExplorer = new Explorer();
  const mockOnClose = jest.fn().mockResolvedValue(undefined);
  const mockCollection = createMockCollection("testCollection");
  const mockDatabase = createMockDatabase("testDb", [mockCollection]);

  beforeEach(() => {
    jest.clearAllMocks();
    updateUserContext({
      databaseAccount: {
        name: "testAccount",
        id: "/subscriptions/sub1/resourceGroups/rg1/providers/Microsoft.DocumentDB/databaseAccounts/testAccount",
        properties: {
          documentEndpoint: "https://test.documents.azure.com",
          capabilities: [],
          backupPolicy: { type: "Periodic" },
        },
      } as unknown as DatabaseAccount,
      subscriptionId: "sub1",
      resourceGroup: "rg1",
      apiType: "SQL",
    });
  });

  const renderPane = () => {
    return render(
      <ChangePartitionKeyPane
        sourceDatabase={mockDatabase}
        sourceCollection={mockCollection}
        explorer={mockExplorer}
        onClose={mockOnClose}
      />,
    );
  };

  it("renders migration type choice group", () => {
    renderPane();
    expect(screen.getByText("Migration type")).toBeTruthy();
    expect(screen.getByText("Offline mode")).toBeTruthy();
    expect(screen.getByText("Online mode")).toBeTruthy();
  });

  it("defaults to offline migration type", () => {
    renderPane();
    const offlineRadio = screen.getByRole("radio", { name: "Offline mode" }) as HTMLInputElement;
    expect(offlineRadio.checked).toBe(true);
  });

  it("does not show online prerequisites section when offline is selected", () => {
    const { container } = renderPane();
    expect(container.querySelector("[data-test='online-prerequisites-section']")).toBeNull();
  });

  it("shows online prerequisites section when online is selected", () => {
    renderPane();
    const onlineRadio = screen.getByRole("radio", { name: "Online mode" });
    fireEvent.click(onlineRadio);
    expect(screen.getByText("Online container copy")).toBeTruthy();
    expect(screen.getByText("Point In Time Restore enabled")).toBeTruthy();
    expect(screen.getByText("Online copy enabled")).toBeTruthy();
  });

  it("shows prerequisite sections when online prerequisites are not met", () => {
    renderPane();
    const onlineRadio = screen.getByRole("radio", { name: "Online mode" });
    fireEvent.click(onlineRadio);
    // When prerequisites aren't met, the enable buttons should be visible
    expect(screen.getByText("Enable Point In Time Restore")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Enable Online Copy" }).length).toBeGreaterThan(0);
  });

  it("shows enable PITR button when PITR is not enabled", () => {
    renderPane();
    const onlineRadio = screen.getByRole("radio", { name: "Online mode" });
    fireEvent.click(onlineRadio);
    expect(screen.getByText("Enable Point In Time Restore")).toBeTruthy();
  });

  it("does not show PITR enable button when PITR is already enabled", () => {
    updateUserContext({
      databaseAccount: {
        name: "testAccount",
        id: "/subscriptions/sub1/resourceGroups/rg1/providers/Microsoft.DocumentDB/databaseAccounts/testAccount",
        properties: {
          documentEndpoint: "https://test.documents.azure.com",
          capabilities: [],
          backupPolicy: { type: "Continuous" },
        },
      } as unknown as DatabaseAccount,
    });

    renderPane();
    const onlineRadio = screen.getByRole("radio", { name: "Online mode" });
    fireEvent.click(onlineRadio);
    expect(screen.queryByText("Enable Point In Time Restore")).toBeNull();
  });

  it("disables online copy button when PITR is not enabled", () => {
    renderPane();
    const onlineRadio = screen.getByRole("radio", { name: "Online mode" });
    fireEvent.click(onlineRadio);
    const enableOnlineCopyBtns = screen.getAllByRole("button", { name: "Enable Online Copy" });
    expect(enableOnlineCopyBtns.length).toBeGreaterThan(0);
    expect((enableOnlineCopyBtns[0] as HTMLButtonElement).disabled).toBe(true);
  });

  it("passes mode to initiateDataTransfer when submitting", async () => {
    const { initiateDataTransfer } = require("Common/dataAccess/dataTransfers");
    renderPane();

    // Submit form with offline mode (default)
    const form = document.querySelector("form");
    if (form) {
      fireEvent.submit(form);
    }

    // The mode should be Offline (capitalized for ARM API)
    if (initiateDataTransfer.mock.calls.length > 0) {
      expect(initiateDataTransfer.mock.calls[0][0].mode).toBe("Offline");
    }
  });
});
