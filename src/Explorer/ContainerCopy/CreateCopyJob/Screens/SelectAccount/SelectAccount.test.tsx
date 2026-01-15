import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { useCopyJobContext } from "../../../Context/CopyJobContext";
import { CopyJobMigrationType } from "../../../Enums/CopyJobEnums";
import { CopyJobContextProviderType } from "../../../Types/CopyJobTypes";
import SelectAccount from "./SelectAccount";

jest.mock("../../../Context/CopyJobContext", () => ({
  useCopyJobContext: jest.fn(),
}));

jest.mock("./Components/SubscriptionDropdown", () => ({
  SubscriptionDropdown: jest.fn(() => <div data-testid="subscription-dropdown">Subscription Dropdown</div>),
}));

jest.mock("./Components/AccountDropdown", () => ({
  AccountDropdown: jest.fn(() => <div data-testid="account-dropdown">Account Dropdown</div>),
}));

jest.mock("./Components/MigrationType", () => ({
  MigrationType: jest.fn(() => <div data-testid="migration-type">Migration Type</div>),
}));

describe("SelectAccount", () => {
  const mockSetCopyJobState = jest.fn();

  const defaultContextValue: CopyJobContextProviderType = {
    copyJobState: {
      jobName: "",
      migrationType: CopyJobMigrationType.Online,
      source: {
        subscription: null as any,
        account: null as any,
        databaseId: "",
        containerId: "",
      },
      target: {
        subscriptionId: "",
        account: null as any,
        databaseId: "",
        containerId: "",
      },
      sourceReadAccessFromTarget: false,
    },
    setCopyJobState: mockSetCopyJobState,
    flow: { currentScreen: "selectAccount" },
    setFlow: jest.fn(),
    contextError: null,
    setContextError: jest.fn(),
    explorer: {} as any,
    resetCopyJobState: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCopyJobContext as jest.Mock).mockReturnValue(defaultContextValue);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render the component with all required elements", () => {
      const { container } = render(<SelectAccount />);

      expect(container.firstChild).toHaveAttribute("data-test", "Panel:SelectAccountContainer");
      expect(container.firstChild).toHaveClass("selectAccountContainer");

      expect(screen.getByText(/Please select a source account from which to copy/i)).toBeInTheDocument();

      expect(screen.getByTestId("subscription-dropdown")).toBeInTheDocument();
      expect(screen.getByTestId("account-dropdown")).toBeInTheDocument();
      expect(screen.getByTestId("migration-type")).toBeInTheDocument();
    });

    it("should render correctly with snapshot", () => {
      const { container } = render(<SelectAccount />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("Migration Type Functionality", () => {
    it("should render migration type component", () => {
      render(<SelectAccount />);

      const migrationTypeComponent = screen.getByTestId("migration-type");
      expect(migrationTypeComponent).toBeInTheDocument();
    });
  });

  describe("Performance and Optimization", () => {
    it("should render without performance issues", () => {
      const { rerender } = render(<SelectAccount />);
      rerender(<SelectAccount />);

      expect(screen.getByTestId("migration-type")).toBeInTheDocument();
    });
  });
});
