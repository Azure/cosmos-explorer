import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
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

jest.mock("./Components/MigrationTypeCheckbox", () => ({
  MigrationTypeCheckbox: jest.fn(({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <div data-testid="migration-type-checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        data-testid="migration-checkbox-input"
        aria-label="Migration Type Checkbox"
      />
      Copy container in offline mode
    </div>
  )),
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
      expect(screen.getByTestId("migration-type-checkbox")).toBeInTheDocument();
    });

    it("should render correctly with snapshot", () => {
      const { container } = render(<SelectAccount />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("Migration Type Functionality", () => {
    it("should display migration type checkbox as unchecked when migrationType is Online", () => {
      (useCopyJobContext as jest.Mock).mockReturnValue({
        ...defaultContextValue,
        copyJobState: {
          ...defaultContextValue.copyJobState,
          migrationType: CopyJobMigrationType.Online,
        },
      });

      render(<SelectAccount />);

      const checkbox = screen.getByTestId("migration-checkbox-input");
      expect(checkbox).not.toBeChecked();
    });

    it("should display migration type checkbox as checked when migrationType is Offline", () => {
      (useCopyJobContext as jest.Mock).mockReturnValue({
        ...defaultContextValue,
        copyJobState: {
          ...defaultContextValue.copyJobState,
          migrationType: CopyJobMigrationType.Offline,
        },
      });

      render(<SelectAccount />);

      const checkbox = screen.getByTestId("migration-checkbox-input");
      expect(checkbox).toBeChecked();
    });

    it("should call setCopyJobState with Online migration type when checkbox is unchecked", () => {
      (useCopyJobContext as jest.Mock).mockReturnValue({
        ...defaultContextValue,
        copyJobState: {
          ...defaultContextValue.copyJobState,
          migrationType: CopyJobMigrationType.Offline,
        },
      });

      render(<SelectAccount />);

      const checkbox = screen.getByTestId("migration-checkbox-input");
      fireEvent.click(checkbox);

      expect(mockSetCopyJobState).toHaveBeenCalledWith(expect.any(Function));

      const updateFunction = mockSetCopyJobState.mock.calls[0][0];
      const previousState = {
        ...defaultContextValue.copyJobState,
        migrationType: CopyJobMigrationType.Offline,
      };
      const result = updateFunction(previousState);

      expect(result).toEqual({
        ...previousState,
        migrationType: CopyJobMigrationType.Online,
      });
    });
  });

  describe("Performance and Optimization", () => {
    it("should maintain referential equality of handler functions between renders", async () => {
      const { rerender } = render(<SelectAccount />);

      const migrationCheckbox = (await import("./Components/MigrationTypeCheckbox")).MigrationTypeCheckbox as jest.Mock;
      const firstRenderHandler = migrationCheckbox.mock.calls[migrationCheckbox.mock.calls.length - 1][0].onChange;

      rerender(<SelectAccount />);

      const secondRenderHandler = migrationCheckbox.mock.calls[migrationCheckbox.mock.calls.length - 1][0].onChange;

      expect(firstRenderHandler).toBe(secondRenderHandler);
    });
  });
});
