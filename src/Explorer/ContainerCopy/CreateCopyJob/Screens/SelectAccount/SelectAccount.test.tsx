import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { apiType } from "UserContext";
import { DatabaseAccount, Subscription } from "../../../../../Contracts/DataModels";
import { useDatabaseAccounts } from "../../../../../hooks/useDatabaseAccounts";
import { useSubscriptions } from "../../../../../hooks/useSubscriptions";
import { CopyJobMigrationType } from "../../../Enums/CopyJobEnums";
import { CopyJobContextProviderType, CopyJobContextState } from "../../../Types/CopyJobTypes";
import SelectAccount from "./SelectAccount";

jest.mock("UserContext", () => ({
  apiType: jest.fn(),
}));

jest.mock("../../../../../hooks/useDatabaseAccounts");
jest.mock("../../../../../hooks/useSubscriptions");
jest.mock("../../../Context/CopyJobContext", () => ({
  useCopyJobContext: () => mockContextValue,
}));

jest.mock("./Utils/selectAccountUtils", () => ({
  useDropdownOptions: jest.fn(),
  useEventHandlers: jest.fn(),
}));

jest.mock("./Components/SubscriptionDropdown", () => ({
  SubscriptionDropdown: jest.fn(({ options, selectedKey, onChange, ...props }) => (
    <div data-testid="subscription-dropdown" data-selected={selectedKey} {...props}>
      {options?.map((option: any) => (
        <div
          key={option.key}
          data-testid={`subscription-option-${option.key}`}
          onClick={() => onChange?.(undefined, option)}
        >
          {option.text}
        </div>
      ))}
    </div>
  )),
}));

jest.mock("./Components/AccountDropdown", () => ({
  AccountDropdown: jest.fn(({ options, selectedKey, disabled, onChange, ...props }) => (
    <div data-testid="account-dropdown" data-selected={selectedKey} data-disabled={disabled} {...props}>
      {options?.map((option: any) => (
        <div
          key={option.key}
          data-testid={`account-option-${option.key}`}
          onClick={() => onChange?.(undefined, option)}
        >
          {option.text}
        </div>
      ))}
    </div>
  )),
}));

jest.mock("./Components/MigrationTypeCheckbox", () => ({
  MigrationTypeCheckbox: jest.fn(({ checked, onChange, ...props }) => (
    <div data-testid="migration-type-checkbox" data-checked={checked} {...props}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e, e.target.checked)}
        data-testid="migration-checkbox-input"
      />
    </div>
  )),
}));

jest.mock("../../../ContainerCopyMessages", () => ({
  selectAccountDescription: "Select your source account and subscription",
}));

const mockUseDatabaseAccounts = useDatabaseAccounts as jest.MockedFunction<typeof useDatabaseAccounts>;
const mockUseSubscriptions = useSubscriptions as jest.MockedFunction<typeof useSubscriptions>;
const mockApiType = apiType as jest.MockedFunction<typeof apiType>;

import { useDropdownOptions, useEventHandlers } from "./Utils/selectAccountUtils";
const mockUseDropdownOptions = useDropdownOptions as jest.MockedFunction<typeof useDropdownOptions>;
const mockUseEventHandlers = useEventHandlers as jest.MockedFunction<typeof useEventHandlers>;

const mockSubscriptions = [
  {
    subscriptionId: "sub-1",
    displayName: "Test Subscription 1",
    authorizationSource: "RoleBased",
    subscriptionPolicies: {
      quotaId: "quota-1",
      spendingLimit: "Off",
      locationPlacementId: "loc-1",
    },
  },
  {
    subscriptionId: "sub-2",
    displayName: "Test Subscription 2",
    authorizationSource: "RoleBased",
    subscriptionPolicies: {
      quotaId: "quota-2",
      spendingLimit: "On",
      locationPlacementId: "loc-2",
    },
  },
] as Subscription[];

const mockAccounts = [
  {
    id: "/subscriptions/sub-1/resourceGroups/rg-1/providers/Microsoft.DocumentDB/databaseAccounts/account-1",
    name: "test-cosmos-account-1",
    location: "East US",
    kind: "GlobalDocumentDB",
    properties: {
      documentEndpoint: "https://account-1.documents.azure.com/",
      capabilities: [],
      enableFreeTier: false,
    },
  },
  {
    id: "/subscriptions/sub-1/resourceGroups/rg-1/providers/Microsoft.DocumentDB/databaseAccounts/account-2",
    name: "test-cosmos-account-2",
    location: "West US",
    kind: "MongoDB",
    properties: {
      documentEndpoint: "https://account-2.documents.azure.com/",
      capabilities: [],
    },
  },
] as DatabaseAccount[];

const mockDropdownOptions = {
  subscriptionOptions: [
    { key: "sub-1", text: "Test Subscription 1", data: mockSubscriptions[0] },
    { key: "sub-2", text: "Test Subscription 2", data: mockSubscriptions[1] },
  ],
  accountOptions: [{ key: mockAccounts[0].id, text: mockAccounts[0].name, data: mockAccounts[0] }],
};

const mockEventHandlers = {
  handleSelectSourceAccount: jest.fn(),
  handleMigrationTypeChange: jest.fn(),
};

let mockContextValue = {
  copyJobState: {
    jobName: "",
    migrationType: CopyJobMigrationType.Offline,
    source: {
      subscription: null,
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
  } as CopyJobContextState,
  setCopyJobState: jest.fn(),
  flow: null,
  setFlow: jest.fn(),
  contextError: null,
  setContextError: jest.fn(),
  resetCopyJobState: jest.fn(),
  explorer: {} as any,
} as CopyJobContextProviderType;

describe("SelectAccount Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockContextValue = {
      copyJobState: {
        jobName: "",
        migrationType: CopyJobMigrationType.Offline,
        source: {
          subscription: null,
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
      } as CopyJobContextState,
      setCopyJobState: jest.fn(),
      flow: null,
      setFlow: jest.fn(),
      contextError: null,
      setContextError: jest.fn(),
      resetCopyJobState: jest.fn(),
      explorer: {} as any,
    };

    mockUseSubscriptions.mockReturnValue(mockSubscriptions);
    mockUseDatabaseAccounts.mockReturnValue(mockAccounts);
    mockApiType.mockReturnValue("SQL");
    mockUseDropdownOptions.mockReturnValue(mockDropdownOptions);
    mockUseEventHandlers.mockReturnValue(mockEventHandlers);
  });

  describe("Rendering", () => {
    it("should render component with default state", () => {
      const { container } = render(<SelectAccount />);

      expect(screen.getByText("Select your source account and subscription")).toBeInTheDocument();
      expect(screen.getByTestId("subscription-dropdown")).toBeInTheDocument();
      expect(screen.getByTestId("account-dropdown")).toBeInTheDocument();
      expect(screen.getByTestId("migration-type-checkbox")).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });

    it("should render with selected subscription", () => {
      mockContextValue.copyJobState.source.subscription = mockSubscriptions[0];

      const { container } = render(<SelectAccount />);

      expect(screen.getByTestId("subscription-dropdown")).toHaveAttribute("data-selected", "sub-1");
      expect(container).toMatchSnapshot();
    });

    it("should render with selected account", () => {
      mockContextValue.copyJobState.source.subscription = mockSubscriptions[0];
      mockContextValue.copyJobState.source.account = mockAccounts[0];

      const { container } = render(<SelectAccount />);

      expect(screen.getByTestId("account-dropdown")).toHaveAttribute("data-selected", mockAccounts[0].id);
      expect(container).toMatchSnapshot();
    });

    it("should render with offline migration type checked", () => {
      mockContextValue.copyJobState.migrationType = CopyJobMigrationType.Offline;

      const { container } = render(<SelectAccount />);

      expect(screen.getByTestId("migration-type-checkbox")).toHaveAttribute("data-checked", "true");
      expect(container).toMatchSnapshot();
    });

    it("should render with online migration type unchecked", () => {
      mockContextValue.copyJobState.migrationType = CopyJobMigrationType.Online;

      const { container } = render(<SelectAccount />);

      expect(screen.getByTestId("migration-type-checkbox")).toHaveAttribute("data-checked", "false");
      expect(container).toMatchSnapshot();
    });
  });

  describe("Hook Integration", () => {
    it("should call useSubscriptions hook", () => {
      render(<SelectAccount />);
      expect(mockUseSubscriptions).toHaveBeenCalledTimes(1);
    });

    it("should call useDatabaseAccounts with selected subscription ID", () => {
      mockContextValue.copyJobState.source.subscription = mockSubscriptions[0];
      render(<SelectAccount />);

      expect(mockUseDatabaseAccounts).toHaveBeenCalledWith("sub-1");
    });

    it("should call useDatabaseAccounts with undefined when no subscription selected", () => {
      render(<SelectAccount />);
      expect(mockUseDatabaseAccounts).toHaveBeenCalledWith(undefined);
    });

    it("should filter accounts to SQL API only", () => {
      mockApiType.mockReturnValueOnce("SQL").mockReturnValueOnce("Mongo");
      render(<SelectAccount />);

      expect(mockApiType).toHaveBeenCalledTimes(2);
      expect(mockApiType).toHaveBeenCalledWith(mockAccounts[0]);
      expect(mockApiType).toHaveBeenCalledWith(mockAccounts[1]);
    });

    it("should call useDropdownOptions with correct parameters", () => {
      const sqlOnlyAccounts = [mockAccounts[0]]; // Only SQL account
      mockApiType.mockImplementation((account) => (account === mockAccounts[0] ? "SQL" : "Mongo"));

      render(<SelectAccount />);

      expect(mockUseDropdownOptions).toHaveBeenCalledWith(mockSubscriptions, sqlOnlyAccounts);
    });

    it("should call useEventHandlers with setCopyJobState", () => {
      render(<SelectAccount />);
      expect(mockUseEventHandlers).toHaveBeenCalledWith(mockContextValue.setCopyJobState);
    });
  });

  describe("Event Handling", () => {
    it("should handle subscription selection", () => {
      render(<SelectAccount />);

      const subscriptionOption = screen.getByTestId("subscription-option-sub-1");
      fireEvent.click(subscriptionOption);

      expect(mockEventHandlers.handleSelectSourceAccount).toHaveBeenCalledWith("subscription", mockSubscriptions[0]);
    });

    it("should handle account selection", () => {
      render(<SelectAccount />);

      const accountOption = screen.getByTestId(`account-option-${mockAccounts[0].id}`);
      fireEvent.click(accountOption);

      expect(mockEventHandlers.handleSelectSourceAccount).toHaveBeenCalledWith("account", mockAccounts[0]);
    });

    it("should handle migration type change", () => {
      render(<SelectAccount />);
      const checkbox = screen.getByTestId("migration-checkbox-input");
      fireEvent.click(checkbox);

      expect(mockEventHandlers.handleMigrationTypeChange).toHaveBeenCalledWith(expect.any(Object), false);
    });
  });

  describe("Dropdown States", () => {
    it("should disable account dropdown when no subscription is selected", () => {
      render(<SelectAccount />);

      expect(screen.getByTestId("account-dropdown")).toHaveAttribute("data-disabled", "true");
    });

    it("should enable account dropdown when subscription is selected", () => {
      mockContextValue.copyJobState.source.subscription = mockSubscriptions[0];

      render(<SelectAccount />);

      expect(screen.getByTestId("account-dropdown")).toHaveAttribute("data-disabled", "false");
    });
  });

  describe("Component Props", () => {
    it("should pass correct props to SubscriptionDropdown", () => {
      render(<SelectAccount />);

      const dropdown = screen.getByTestId("subscription-dropdown");
      expect(dropdown).not.toHaveAttribute("data-selected");
    });

    it("should pass selected subscription ID to SubscriptionDropdown", () => {
      mockContextValue.copyJobState.source.subscription = mockSubscriptions[0];

      render(<SelectAccount />);

      const dropdown = screen.getByTestId("subscription-dropdown");
      expect(dropdown).toHaveAttribute("data-selected", "sub-1");
    });

    it("should pass correct props to AccountDropdown", () => {
      render(<SelectAccount />);

      const dropdown = screen.getByTestId("account-dropdown");
      expect(dropdown).not.toHaveAttribute("data-selected");
      expect(dropdown).toHaveAttribute("data-disabled", "true");
    });

    it("should pass selected account ID to AccountDropdown", () => {
      mockContextValue.copyJobState.source.account = mockAccounts[0];

      render(<SelectAccount />);

      const dropdown = screen.getByTestId("account-dropdown");
      expect(dropdown).toHaveAttribute("data-selected", mockAccounts[0].id);
    });

    it("should pass correct checked state to MigrationTypeCheckbox", () => {
      mockContextValue.copyJobState.migrationType = CopyJobMigrationType.Offline;

      render(<SelectAccount />);

      const checkbox = screen.getByTestId("migration-type-checkbox");
      expect(checkbox).toHaveAttribute("data-checked", "true");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty subscriptions array", () => {
      mockUseSubscriptions.mockReturnValue([]);
      mockUseDropdownOptions.mockReturnValue({
        subscriptionOptions: [],
        accountOptions: [],
      });

      const { container } = render(<SelectAccount />);
      expect(container).toMatchSnapshot();
    });

    it("should handle empty accounts array", () => {
      mockUseDatabaseAccounts.mockReturnValue([]);
      mockUseDropdownOptions.mockReturnValue({
        subscriptionOptions: mockDropdownOptions.subscriptionOptions,
        accountOptions: [],
      });

      const { container } = render(<SelectAccount />);
      expect(container).toMatchSnapshot();
    });

    it("should handle null subscription in context", () => {
      mockContextValue.copyJobState.source.subscription = null;

      const { container } = render(<SelectAccount />);
      expect(container).toMatchSnapshot();
    });

    it("should handle null account in context", () => {
      mockContextValue.copyJobState.source.account = null;

      const { container } = render(<SelectAccount />);
      expect(container).toMatchSnapshot();
    });

    it("should handle undefined subscriptions from hook", () => {
      mockUseSubscriptions.mockReturnValue(undefined as any);
      mockUseDropdownOptions.mockReturnValue({
        subscriptionOptions: [],
        accountOptions: [],
      });

      const { container } = render(<SelectAccount />);
      expect(container).toMatchSnapshot();
    });

    it("should handle undefined accounts from hook", () => {
      mockUseDatabaseAccounts.mockReturnValue(undefined as any);
      mockUseDropdownOptions.mockReturnValue({
        subscriptionOptions: mockDropdownOptions.subscriptionOptions,
        accountOptions: [],
      });

      const { container } = render(<SelectAccount />);
      expect(container).toMatchSnapshot();
    });

    it("should filter out non-SQL accounts correctly", () => {
      const mixedAccounts = [
        { ...mockAccounts[0], kind: "GlobalDocumentDB" },
        { ...mockAccounts[1], kind: "MongoDB" },
      ];

      mockUseDatabaseAccounts.mockReturnValue(mixedAccounts);
      mockApiType.mockImplementation((account) => (account.kind === "GlobalDocumentDB" ? "SQL" : "Mongo"));

      render(<SelectAccount />);
      expect(mockApiType).toHaveBeenCalledTimes(2);

      const sqlOnlyAccounts = mixedAccounts.filter((account) => apiType(account) === "SQL");
      expect(mockUseDropdownOptions).toHaveBeenCalledWith(mockSubscriptions, sqlOnlyAccounts);
    });
  });

  describe("Complete Workflow", () => {
    it("should render complete workflow with all selections", () => {
      mockContextValue.copyJobState.source.subscription = mockSubscriptions[0];
      mockContextValue.copyJobState.source.account = mockAccounts[0];
      mockContextValue.copyJobState.migrationType = CopyJobMigrationType.Online;

      const { container } = render(<SelectAccount />);

      expect(screen.getByTestId("subscription-dropdown")).toHaveAttribute("data-selected", "sub-1");
      expect(screen.getByTestId("account-dropdown")).toHaveAttribute("data-selected", mockAccounts[0].id);
      expect(screen.getByTestId("account-dropdown")).toHaveAttribute("data-disabled", "false");
      expect(screen.getByTestId("migration-type-checkbox")).toHaveAttribute("data-checked", "false");

      expect(container).toMatchSnapshot();
    });
  });
});
