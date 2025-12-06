import "@testing-library/jest-dom";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { Subscription } from "Contracts/DataModels";
import React from "react";
import { CopyJobContext } from "../../../Context/CopyJobContext";
import { CopyJobMigrationType } from "../../../Enums/CopyJobEnums";
import { CopyJobContextProviderType, CopyJobContextState } from "../../../Types/CopyJobTypes";
import PreviewCopyJob from "./PreviewCopyJob";

jest.mock("./Utils/PreviewCopyJobUtils", () => ({
  getPreviewCopyJobDetailsListColumns: () => [
    {
      key: "sourcedbname",
      name: "Source Database",
      fieldName: "sourceDatabaseName",
      minWidth: 130,
      maxWidth: 140,
    },
    {
      key: "sourcecolname",
      name: "Source Container",
      fieldName: "sourceContainerName",
      minWidth: 130,
      maxWidth: 140,
    },
    {
      key: "targetdbname",
      name: "Destination Database",
      fieldName: "targetDatabaseName",
      minWidth: 130,
      maxWidth: 140,
    },
    {
      key: "targetcolname",
      name: "Destination Container",
      fieldName: "targetContainerName",
      minWidth: 130,
      maxWidth: 140,
    },
  ],
}));

jest.mock("../../../CopyJobUtils", () => ({
  getDefaultJobName: jest.fn((selectedDatabaseAndContainers) => {
    if (selectedDatabaseAndContainers.length === 1) {
      const { sourceDatabaseName, sourceContainerName, targetDatabaseName, targetContainerName } =
        selectedDatabaseAndContainers[0];
      return `${sourceDatabaseName}.${sourceContainerName}_${targetDatabaseName}.${targetContainerName}_123456789`;
    }
    return "";
  }),
}));

describe("PreviewCopyJob", () => {
  const mockSetCopyJobState = jest.fn();
  const mockSetContextError = jest.fn();
  const mockSetFlow = jest.fn();
  const mockResetCopyJobState = jest.fn();

  const mockSubscription: Subscription = {
    subscriptionId: "test-subscription-id",
    displayName: "Test Subscription",
    state: "Enabled",
    subscriptionPolicies: {
      locationPlacementId: "test",
      quotaId: "test",
    },
    authorizationSource: "test",
  };

  const mockDatabaseAccount = {
    id: "/subscriptions/test-subscription-id/resourceGroups/test-rg/providers/Microsoft.DocumentDB/databaseAccounts/test-account",
    name: "test-account",
    location: "East US",
    type: "Microsoft.DocumentDB/databaseAccounts",
    kind: "GlobalDocumentDB",
    properties: {
      documentEndpoint: "https://test-account.documents.azure.com:443/",
      gremlinEndpoint: "https://test-account.gremlin.cosmosdb.azure.com:443/",
      tableEndpoint: "https://test-account.table.cosmosdb.azure.com:443/",
      cassandraEndpoint: "https://test-account.cassandra.cosmosdb.azure.com:443/",
    },
  };

  const createMockContext = (overrides: Partial<CopyJobContextState> = {}): CopyJobContextProviderType => {
    const defaultState: CopyJobContextState = {
      jobName: "",
      migrationType: CopyJobMigrationType.Offline,
      source: {
        subscription: mockSubscription,
        account: mockDatabaseAccount,
        databaseId: "source-database",
        containerId: "source-container",
      },
      target: {
        subscriptionId: "test-subscription-id",
        account: mockDatabaseAccount,
        databaseId: "target-database",
        containerId: "target-container",
      },
      sourceReadAccessFromTarget: false,
      ...overrides,
    };

    return {
      contextError: null,
      setContextError: mockSetContextError,
      copyJobState: defaultState,
      setCopyJobState: mockSetCopyJobState,
      flow: null,
      setFlow: mockSetFlow,
      resetCopyJobState: mockResetCopyJobState,
      explorer: {} as any,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render with default state and empty job name", () => {
    const mockContext = createMockContext();
    const { container } = render(
      <CopyJobContext.Provider value={mockContext}>
        <PreviewCopyJob />
      </CopyJobContext.Provider>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("should render with pre-filled job name", () => {
    const mockContext = createMockContext({
      jobName: "custom-job-name-123",
    });

    const { container } = render(
      <CopyJobContext.Provider value={mockContext}>
        <PreviewCopyJob />
      </CopyJobContext.Provider>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("should render with missing source subscription information", () => {
    const mockContext = createMockContext({
      source: {
        subscription: undefined,
        account: mockDatabaseAccount,
        databaseId: "source-database",
        containerId: "source-container",
      },
    });

    const { container } = render(
      <CopyJobContext.Provider value={mockContext}>
        <PreviewCopyJob />
      </CopyJobContext.Provider>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("should render with missing source account information", () => {
    const mockContext = createMockContext({
      source: {
        subscription: mockSubscription,
        account: null,
        databaseId: "source-database",
        containerId: "source-container",
      },
    });

    const { container } = render(
      <CopyJobContext.Provider value={mockContext}>
        <PreviewCopyJob />
      </CopyJobContext.Provider>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("should render with undefined database and container names", () => {
    const mockContext = createMockContext({
      source: {
        subscription: mockSubscription,
        account: mockDatabaseAccount,
        databaseId: "",
        containerId: "",
      },
      target: {
        subscriptionId: "test-subscription-id",
        account: mockDatabaseAccount,
        databaseId: "",
        containerId: "",
      },
    });

    const { container } = render(
      <CopyJobContext.Provider value={mockContext}>
        <PreviewCopyJob />
      </CopyJobContext.Provider>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("should render with long subscription and account names", () => {
    const longNameSubscription: Subscription = {
      ...mockSubscription,
      displayName: "This is a very long subscription name that might cause display issues if not handled properly",
    };

    const longNameAccount = {
      ...mockDatabaseAccount,
      name: "this-is-a-very-long-database-account-name-that-might-cause-display-issues",
    };

    const mockContext = createMockContext({
      source: {
        subscription: longNameSubscription,
        account: longNameAccount,
        databaseId: "long-database-name-for-testing-purposes",
        containerId: "long-container-name-for-testing-purposes",
      },
    });

    const { container } = render(
      <CopyJobContext.Provider value={mockContext}>
        <PreviewCopyJob />
      </CopyJobContext.Provider>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("should render with online migration type", () => {
    const mockContext = createMockContext({
      migrationType: CopyJobMigrationType.Online,
      jobName: "online-migration-job",
    });

    const { container } = render(
      <CopyJobContext.Provider value={mockContext}>
        <PreviewCopyJob />
      </CopyJobContext.Provider>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("should handle special characters in database and container names", () => {
    const mockContext = createMockContext({
      source: {
        subscription: mockSubscription,
        account: mockDatabaseAccount,
        databaseId: "test-db_with@special#chars",
        containerId: "test-container_with@special#chars",
      },
      target: {
        subscriptionId: "test-subscription-id",
        account: mockDatabaseAccount,
        databaseId: "target-db_with@special#chars",
        containerId: "target-container_with@special#chars",
      },
      jobName: "job-with@special#chars_123",
    });

    const { container } = render(
      <CopyJobContext.Provider value={mockContext}>
        <PreviewCopyJob />
      </CopyJobContext.Provider>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("should render component with cross-subscription setup", () => {
    const targetAccount = {
      ...mockDatabaseAccount,
      id: "/subscriptions/target-subscription-id/resourceGroups/target-rg/providers/Microsoft.DocumentDB/databaseAccounts/target-account",
      name: "target-account",
    };

    const mockContext = createMockContext({
      target: {
        subscriptionId: "target-subscription-id",
        account: targetAccount,
        databaseId: "target-database",
        containerId: "target-container",
      },
      sourceReadAccessFromTarget: true,
    });

    const { container } = render(
      <CopyJobContext.Provider value={mockContext}>
        <PreviewCopyJob />
      </CopyJobContext.Provider>,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it("should call setCopyJobState with default job name on mount", async () => {
    const mockContext = createMockContext();

    render(
      <CopyJobContext.Provider value={mockContext}>
        <PreviewCopyJob />
      </CopyJobContext.Provider>,
    );

    await waitFor(() => {
      expect(mockSetCopyJobState).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  it("should update job name when text field is changed", async () => {
    const mockContext = createMockContext({
      jobName: "initial-job-name",
    });

    const { getByDisplayValue } = render(
      <CopyJobContext.Provider value={mockContext}>
        <PreviewCopyJob />
      </CopyJobContext.Provider>,
    );

    const jobNameInput = getByDisplayValue("initial-job-name");
    fireEvent.change(jobNameInput, { target: { value: "updated-job-name" } });

    expect(mockSetCopyJobState).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should handle empty job name input", () => {
    const mockContext = createMockContext({
      jobName: "existing-name",
    });

    const { getByDisplayValue } = render(
      <CopyJobContext.Provider value={mockContext}>
        <PreviewCopyJob />
      </CopyJobContext.Provider>,
    );

    const jobNameInput = getByDisplayValue("existing-name");
    fireEvent.change(jobNameInput, { target: { value: "" } });

    expect(mockSetCopyJobState).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should display proper field labels from ContainerCopyMessages", () => {
    const mockContext = createMockContext();

    const { getByText } = render(
      <CopyJobContext.Provider value={mockContext}>
        <PreviewCopyJob />
      </CopyJobContext.Provider>,
    );

    expect(getByText(/Job name/i)).toBeInTheDocument();
    expect(getByText(/Source subscription/i)).toBeInTheDocument();
    expect(getByText(/Source account/i)).toBeInTheDocument();
  });
});
