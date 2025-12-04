import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { CopyJobMigrationType } from "../../Enums/CopyJobEnums";
import { CopyJobContextState } from "../../Types/CopyJobTypes";
import { useCopyJobNavigation } from "./useCopyJobNavigation";

// Mock all dependencies
jest.mock("../../../../hooks/useSidePanel", () => ({
  useSidePanel: {
    getState: jest.fn(() => ({
      closeSidePanel: jest.fn(),
    })),
  },
}));

jest.mock("../../Actions/CopyJobActions", () => ({
  submitCreateCopyJob: jest.fn(),
}));

jest.mock("../../Context/CopyJobContext", () => ({
  useCopyJobContext: jest.fn(),
}));

jest.mock("./useCopyJobPrerequisitesCache", () => ({
  useCopyJobPrerequisitesCache: jest.fn(),
}));

jest.mock("./useCreateCopyJobScreensList", () => ({
  SCREEN_KEYS: {
    SelectAccount: "SelectAccount",
    AssignPermissions: "AssignPermissions",
    SelectSourceAndTargetContainers: "SelectSourceAndTargetContainers",
    CreateCollection: "CreateCollection",
    PreviewCopyJob: "PreviewCopyJob",
  },
  useCreateCopyJobScreensList: jest.fn(),
}));

jest.mock("../../CopyJobUtils", () => ({
  getContainerIdentifiers: jest.fn(),
  isIntraAccountCopy: jest.fn(),
}));

// Import mocked modules
import { useSidePanel } from "../../../../hooks/useSidePanel";
import { submitCreateCopyJob } from "../../Actions/CopyJobActions";
import { useCopyJobContext } from "../../Context/CopyJobContext";
import { getContainerIdentifiers, isIntraAccountCopy } from "../../CopyJobUtils";
import { useCopyJobPrerequisitesCache } from "./useCopyJobPrerequisitesCache";
import { SCREEN_KEYS, useCreateCopyJobScreensList } from "./useCreateCopyJobScreensList";

// Test wrapper component
const TestComponent: React.FC<{
  onHookResult?: (result: ReturnType<typeof useCopyJobNavigation>) => void;
}> = ({ onHookResult }) => {
  const hookResult = useCopyJobNavigation();

  React.useEffect(() => {
    onHookResult?.(hookResult);
  }, [hookResult, onHookResult]);

  return (
    <div>
      <div data-testid="current-screen">{hookResult.currentScreen?.key}</div>
      <div data-testid="primary-disabled">{hookResult.isPrimaryDisabled.toString()}</div>
      <div data-testid="previous-disabled">{hookResult.isPreviousDisabled.toString()}</div>
      <div data-testid="primary-btn-text">{hookResult.primaryBtnText}</div>
      <button data-testid="primary-btn" onClick={hookResult.handlePrimary} disabled={hookResult.isPrimaryDisabled}>
        {hookResult.primaryBtnText}
      </button>
      <button data-testid="previous-btn" onClick={hookResult.handlePrevious} disabled={hookResult.isPreviousDisabled}>
        Previous
      </button>
      <button data-testid="cancel-btn" onClick={hookResult.handleCancel}>
        Cancel
      </button>
      {hookResult.currentScreen?.key === SCREEN_KEYS.SelectSourceAndTargetContainers && (
        <button data-testid="add-collection-btn" onClick={hookResult.showAddCollectionPanel}>
          Show Collection Panel
        </button>
      )}
    </div>
  );
};

describe("useCopyJobNavigation", () => {
  // Test data factories
  const createMockCopyJobState = (overrides?: Partial<CopyJobContextState>): CopyJobContextState => ({
    jobName: "test-job",
    migrationType: CopyJobMigrationType.Offline,
    source: {
      subscription: { subscriptionId: "source-sub-id" } as any,
      account: { id: "source-account-id", name: "Account-1" } as any,
      databaseId: "source-db",
      containerId: "source-container",
    },
    target: {
      subscriptionId: "target-sub-id",
      account: { id: "target-account-id", name: "Account-2" } as any,
      databaseId: "target-db",
      containerId: "target-container",
    },
    ...overrides,
  });

  const createMockScreen = (key: string, validations: any[] = []) => ({
    key,
    component: <div>{key} Screen</div>,
    validations,
  });

  // Shared mocks
  const mockResetCopyJobState = jest.fn();
  const mockSetContextError = jest.fn();
  const mockCloseSidePanel = jest.fn();
  const mockCopyJobState = createMockCopyJobState();
  const mockValidationCache = new Map([
    ["validation1", true],
    ["validation2", true],
  ]);

  // Helper functions
  const setupMocks = (screensList: any[] = [], isIntraAccount = false) => {
    (useCopyJobContext as jest.Mock).mockReturnValue({
      copyJobState: mockCopyJobState,
      resetCopyJobState: mockResetCopyJobState,
      setContextError: mockSetContextError,
    });

    (useCopyJobPrerequisitesCache as unknown as jest.Mock).mockReturnValue({
      validationCache: mockValidationCache,
    });

    (useCreateCopyJobScreensList as jest.Mock).mockReturnValue(
      screensList.length > 0 ? screensList : [createMockScreen(SCREEN_KEYS.SelectAccount)],
    );

    (useSidePanel.getState as jest.Mock).mockReturnValue({
      closeSidePanel: mockCloseSidePanel,
    });

    (getContainerIdentifiers as jest.Mock).mockImplementation((container) => ({
      accountId: container.account?.id,
      databaseId: container.databaseId,
      containerId: container.containerId,
    }));

    (isIntraAccountCopy as jest.Mock).mockReturnValue(isIntraAccount);
  };

  const clickPrimaryButton = () => fireEvent.click(screen.getByTestId("primary-btn"));
  const clickPreviousButton = () => fireEvent.click(screen.getByTestId("previous-btn"));

  const expectScreen = (screenKey: string) => {
    expect(screen.getByTestId("current-screen")).toHaveTextContent(screenKey);
  };

  const expectPrimaryButtonText = (text: string) => {
    expect(screen.getByTestId("primary-btn-text")).toHaveTextContent(text);
  };

  const expectPrimaryDisabled = (disabled: boolean) => {
    expect(screen.getByTestId("primary-disabled")).toHaveTextContent(disabled.toString());
  };

  const navigateToScreen = (screenKey: string, clicks: number) => {
    for (let i = 0; i < clicks; i++) {
      clickPrimaryButton();
    }
    expectScreen(screenKey);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  describe("Initial state and navigation", () => {
    test("should start with SelectAccount screen and disable previous button", () => {
      render(<TestComponent />);

      expectScreen(SCREEN_KEYS.SelectAccount);
      expect(screen.getByTestId("previous-disabled")).toHaveTextContent("true");
    });

    test("should show Next button text by default", () => {
      render(<TestComponent />);
      expectPrimaryButtonText("Next");
    });

    test("should navigate through screens and show Create button for CreateCollection", () => {
      const screens = [
        createMockScreen(SCREEN_KEYS.SelectAccount),
        createMockScreen(SCREEN_KEYS.SelectSourceAndTargetContainers),
        createMockScreen(SCREEN_KEYS.CreateCollection),
      ];
      setupMocks(screens, true);

      render(<TestComponent />);

      // Initial screen
      expectScreen(SCREEN_KEYS.SelectAccount);
      clickPrimaryButton();

      // Container selection screen
      expectScreen(SCREEN_KEYS.SelectSourceAndTargetContainers);
      expectPrimaryButtonText("Next");

      // Navigate to Create Collection
      fireEvent.click(screen.getByTestId("add-collection-btn"));
      expectScreen(SCREEN_KEYS.CreateCollection);
      expectPrimaryButtonText("Create");

      // Go back
      clickPreviousButton();
      expectScreen(SCREEN_KEYS.SelectSourceAndTargetContainers);
      expectPrimaryButtonText("Next");
    });
  });

  describe("Validation logic", () => {
    test("should disable primary button when validations fail", () => {
      const invalidScreen = createMockScreen(SCREEN_KEYS.SelectAccount, [
        { validate: () => false, message: "Invalid state" },
      ]);
      setupMocks([invalidScreen]);

      render(<TestComponent />);
      expectPrimaryDisabled(true);
    });

    test("should enable primary button when all validations pass", () => {
      const validScreen = createMockScreen(SCREEN_KEYS.SelectAccount, [
        { validate: () => true, message: "Valid state" },
      ]);
      setupMocks([validScreen]);

      render(<TestComponent />);
      expectPrimaryDisabled(false);
    });

    test("should prevent navigation when source and target containers are identical", () => {
      const screens = [
        createMockScreen(SCREEN_KEYS.SelectAccount),
        createMockScreen(SCREEN_KEYS.SelectSourceAndTargetContainers, [
          { validate: () => true, message: "Valid containers" },
        ]),
      ];
      setupMocks(screens, true);

      (getContainerIdentifiers as jest.Mock).mockImplementation(() => ({
        accountId: "same-account",
        databaseId: "same-db",
        containerId: "same-container",
      }));

      render(<TestComponent />);

      navigateToScreen(SCREEN_KEYS.SelectSourceAndTargetContainers, 1);
      clickPrimaryButton();

      // Should stay on same screen
      expectScreen(SCREEN_KEYS.SelectSourceAndTargetContainers);
      expect(mockSetContextError).toHaveBeenCalledWith(
        "Source and destination containers cannot be the same. Please select different containers to proceed.",
      );
    });
  });

  describe("Copy job submission", () => {
    const setupToPreviewScreen = () => {
      const screens = [
        createMockScreen(SCREEN_KEYS.SelectAccount),
        createMockScreen(SCREEN_KEYS.SelectSourceAndTargetContainers),
        createMockScreen(SCREEN_KEYS.PreviewCopyJob),
      ];
      setupMocks(screens, true);

      render(<TestComponent />);
      navigateToScreen(SCREEN_KEYS.PreviewCopyJob, 2);
      clickPrimaryButton();
    };

    test("should handle successful copy job submission", async () => {
      (submitCreateCopyJob as jest.Mock).mockResolvedValue(undefined);

      setupToPreviewScreen();

      await waitFor(() => {
        expect(submitCreateCopyJob).toHaveBeenCalledWith(mockCopyJobState, expect.any(Function));
      });
    });

    test("should handle copy job submission error", async () => {
      const error = new Error("Submission failed");
      (submitCreateCopyJob as jest.Mock).mockRejectedValue(error);
      setupToPreviewScreen();

      await waitFor(() => {
        expect(mockSetContextError).toHaveBeenCalledWith("Submission failed");
      });
    });

    test("should handle unknown error during submission", async () => {
      (submitCreateCopyJob as jest.Mock).mockRejectedValue("Unknown error");

      setupToPreviewScreen();

      await waitFor(() => {
        expect(mockSetContextError).toHaveBeenCalledWith("Failed to create copy job. Please try again later.");
      });
    });

    test("should disable buttons during loading", async () => {
      let resolveSubmission: () => void;
      const submissionPromise = new Promise<void>((resolve) => {
        resolveSubmission = resolve;
      });
      (submitCreateCopyJob as jest.Mock).mockReturnValue(submissionPromise);

      setupToPreviewScreen();

      // Should be disabled during loading
      await waitFor(() => {
        expectPrimaryDisabled(true);
      });

      // Resolve the promise
      resolveSubmission!();

      await waitFor(() => {
        expectPrimaryDisabled(false);
      });
    });
  });
});
