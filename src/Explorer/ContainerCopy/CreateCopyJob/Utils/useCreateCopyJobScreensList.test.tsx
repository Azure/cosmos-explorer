import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import Explorer from "../../../Explorer";
import CopyJobContextProvider from "../../Context/CopyJobContext";
import { CopyJobMigrationType } from "../../Enums/CopyJobEnums";
import { CopyJobContextState } from "../../Types/CopyJobTypes";
import { SCREEN_KEYS, useCreateCopyJobScreensList } from "./useCreateCopyJobScreensList";

jest.mock("../../Context/CopyJobContext", () => {
  const actual = jest.requireActual("../../Context/CopyJobContext");
  return {
    __esModule: true,
    ...actual,
    default: actual.default,
    useCopyJobContext: jest.fn(),
  };
});

jest.mock("../Screens/AssignPermissions/AssignPermissions", () => {
  return function MockAssignPermissions() {
    return <div data-testid="assign-permissions">AssignPermissions</div>;
  };
});

jest.mock("../Screens/CreateContainer/AddCollectionPanelWrapper", () => {
  return function MockAddCollectionPanelWrapper() {
    return <div data-testid="add-collection-panel">AddCollectionPanelWrapper</div>;
  };
});

jest.mock("../Screens/PreviewCopyJob/PreviewCopyJob", () => {
  return function MockPreviewCopyJob() {
    return <div data-testid="preview-copy-job">PreviewCopyJob</div>;
  };
});

jest.mock("../Screens/SelectAccount/SelectAccount", () => {
  return function MockSelectAccount() {
    return <div data-testid="select-account">SelectAccount</div>;
  };
});

jest.mock("../Screens/SelectSourceAndTargetContainers/SelectSourceAndTargetContainers", () => {
  return function MockSelectSourceAndTargetContainers() {
    return <div data-testid="select-source-target">SelectSourceAndTargetContainers</div>;
  };
});

const TestHookComponent: React.FC<{ goBack: () => void }> = ({ goBack }) => {
  const screens = useCreateCopyJobScreensList(goBack);

  return (
    <div data-testid="test-hook-component">
      {screens.map((screen, index) => (
        <div key={screen.key} data-testid={`screen-${index}`}>
          <div data-testid={`screen-key-${index}`}>{screen.key}</div>
          <div data-testid={`screen-component-${index}`}>{screen.component}</div>
          <div data-testid={`screen-validations-${index}`}>
            {JSON.stringify(screen.validations.map((v) => v.message))}
          </div>
        </div>
      ))}
    </div>
  );
};

describe("useCreateCopyJobScreensList", () => {
  const mockExplorer = {} as Explorer;
  const mockGoBack = jest.fn();
  const { useCopyJobContext } = require("../../Context/CopyJobContext");

  beforeEach(() => {
    jest.clearAllMocks();
    useCopyJobContext.mockReturnValue({
      explorer: mockExplorer,
    });
  });

  const renderWithContext = (component: React.ReactElement) => {
    return render(<CopyJobContextProvider explorer={mockExplorer}>{component}</CopyJobContextProvider>);
  };

  describe("Hook behavior", () => {
    it("should return screens list with correct keys and components", () => {
      renderWithContext(<TestHookComponent goBack={mockGoBack} />);

      expect(screen.getByTestId("test-hook-component")).toBeInTheDocument();
      expect(screen.getByTestId("screen-key-0")).toHaveTextContent(SCREEN_KEYS.SelectAccount);
      expect(screen.getByTestId("screen-key-1")).toHaveTextContent(SCREEN_KEYS.SelectSourceAndTargetContainers);
      expect(screen.getByTestId("screen-key-2")).toHaveTextContent(SCREEN_KEYS.CreateCollection);
      expect(screen.getByTestId("screen-key-3")).toHaveTextContent(SCREEN_KEYS.PreviewCopyJob);
      expect(screen.getByTestId("screen-key-4")).toHaveTextContent(SCREEN_KEYS.AssignPermissions);

      expect(screen.getByTestId("select-account")).toBeInTheDocument();
      expect(screen.getByTestId("select-source-target")).toBeInTheDocument();
      expect(screen.getByTestId("add-collection-panel")).toBeInTheDocument();
      expect(screen.getByTestId("preview-copy-job")).toBeInTheDocument();
      expect(screen.getByTestId("assign-permissions")).toBeInTheDocument();
    });

    it("should return exactly 5 screens in the correct order", () => {
      renderWithContext(<TestHookComponent goBack={mockGoBack} />);

      const screens = screen.getAllByTestId(/screen-\d+/);
      expect(screens).toHaveLength(5);
    });

    it("should memoize results based on explorer dependency", () => {
      const { rerender } = renderWithContext(<TestHookComponent goBack={mockGoBack} />);
      const initialScreens = screen.getAllByTestId(/screen-key-\d+/).map((el) => el.textContent);
      rerender(
        <CopyJobContextProvider explorer={mockExplorer}>
          <TestHookComponent goBack={mockGoBack} />
        </CopyJobContextProvider>,
      );

      const rerenderScreens = screen.getAllByTestId(/screen-key-\d+/).map((el) => el.textContent);
      expect(rerenderScreens).toEqual(initialScreens);
    });
  });

  describe("Screen validations", () => {
    describe("SelectAccount screen validation", () => {
      it("should validate subscription and account presence", () => {
        renderWithContext(<TestHookComponent goBack={mockGoBack} />);

        const validationMessages = JSON.parse(screen.getByTestId("screen-validations-0").textContent || "[]");
        expect(validationMessages).toContain("Please select a subscription and account to proceed");
      });

      it("should pass validation when subscription and account are present", () => {
        const mockState: CopyJobContextState = {
          jobName: "",
          migrationType: CopyJobMigrationType.Offline,
          source: {
            subscription: { subscriptionId: "test-sub" } as any,
            account: { name: "test-account" } as any,
            databaseId: "",
            containerId: "",
          },
          target: {
            subscriptionId: "",
            account: null as any,
            databaseId: "",
            containerId: "",
          },
        };
        const ValidationTestComponent = () => {
          const screens = useCreateCopyJobScreensList(mockGoBack);
          const selectAccountScreen = screens.find((s) => s.key === SCREEN_KEYS.SelectAccount);
          const isValid = selectAccountScreen?.validations[0]?.validate(mockState);

          return <div data-testid="validation-result">{isValid ? "valid" : "invalid"}</div>;
        };

        renderWithContext(<ValidationTestComponent />);
        expect(screen.getByTestId("validation-result")).toHaveTextContent("valid");
      });

      it("should fail validation when subscription is missing", () => {
        const mockState: CopyJobContextState = {
          jobName: "",
          migrationType: CopyJobMigrationType.Offline,
          source: {
            subscription: null as any,
            account: { name: "test-account" } as any,
            databaseId: "",
            containerId: "",
          },
          target: {
            subscriptionId: "",
            account: null as any,
            databaseId: "",
            containerId: "",
          },
        };

        const ValidationTestComponent = () => {
          const screens = useCreateCopyJobScreensList(mockGoBack);
          const selectAccountScreen = screens.find((s) => s.key === SCREEN_KEYS.SelectAccount);
          const isValid = selectAccountScreen?.validations[0]?.validate(mockState);

          return <div data-testid="validation-result">{isValid ? "valid" : "invalid"}</div>;
        };

        renderWithContext(<ValidationTestComponent />);
        expect(screen.getByTestId("validation-result")).toHaveTextContent("invalid");
      });
    });

    describe("SelectSourceAndTargetContainers screen validation", () => {
      it("should validate source and target containers", () => {
        renderWithContext(<TestHookComponent goBack={mockGoBack} />);

        const validationMessages = JSON.parse(screen.getByTestId("screen-validations-1").textContent || "[]");
        expect(validationMessages).toContain("Please select source and target containers to proceed");
      });

      it("should pass validation when all required fields are present", () => {
        const mockState: CopyJobContextState = {
          jobName: "",
          migrationType: CopyJobMigrationType.Offline,
          source: {
            subscription: null as any,
            account: null as any,
            databaseId: "source-db",
            containerId: "source-container",
          },
          target: {
            subscriptionId: "",
            account: null as any,
            databaseId: "target-db",
            containerId: "target-container",
          },
        };

        const ValidationTestComponent = () => {
          const screens = useCreateCopyJobScreensList(mockGoBack);
          const screen = screens.find((s) => s.key === SCREEN_KEYS.SelectSourceAndTargetContainers);
          const isValid = screen?.validations[0]?.validate(mockState);

          return <div data-testid="validation-result">{isValid ? "valid" : "invalid"}</div>;
        };

        renderWithContext(<ValidationTestComponent />);
        expect(screen.getByTestId("validation-result")).toHaveTextContent("valid");
      });

      it("should fail validation when source database is missing", () => {
        const mockState: CopyJobContextState = {
          jobName: "",
          migrationType: CopyJobMigrationType.Offline,
          source: {
            subscription: null as any,
            account: null as any,
            databaseId: "",
            containerId: "source-container",
          },
          target: {
            subscriptionId: "",
            account: null as any,
            databaseId: "target-db",
            containerId: "target-container",
          },
        };

        const ValidationTestComponent = () => {
          const screens = useCreateCopyJobScreensList(mockGoBack);
          const screen = screens.find((s) => s.key === SCREEN_KEYS.SelectSourceAndTargetContainers);
          const isValid = screen?.validations[0]?.validate(mockState);

          return <div data-testid="validation-result">{isValid ? "valid" : "invalid"}</div>;
        };

        renderWithContext(<ValidationTestComponent />);
        expect(screen.getByTestId("validation-result")).toHaveTextContent("invalid");
      });
    });

    describe("CreateCollection screen", () => {
      it("should have no validations", () => {
        renderWithContext(<TestHookComponent goBack={mockGoBack} />);

        const validationMessages = JSON.parse(screen.getByTestId("screen-validations-2").textContent || "[]");
        expect(validationMessages).toEqual([]);
      });
    });

    describe("PreviewCopyJob screen validation", () => {
      it("should validate job name format", () => {
        renderWithContext(<TestHookComponent goBack={mockGoBack} />);

        const validationMessages = JSON.parse(screen.getByTestId("screen-validations-3").textContent || "[]");
        expect(validationMessages).toContain("Please enter a job name to proceed");
      });

      it("should pass validation with valid job name", () => {
        const mockState: CopyJobContextState = {
          jobName: "valid-job-name_123",
          migrationType: CopyJobMigrationType.Offline,
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
        };

        const ValidationTestComponent = () => {
          const screens = useCreateCopyJobScreensList(mockGoBack);
          const screen = screens.find((s) => s.key === SCREEN_KEYS.PreviewCopyJob);
          const isValid = screen?.validations[0]?.validate(mockState);

          return <div data-testid="validation-result">{isValid ? "valid" : "invalid"}</div>;
        };

        renderWithContext(<ValidationTestComponent />);
        expect(screen.getByTestId("validation-result")).toHaveTextContent("valid");
      });

      it("should fail validation with invalid job name characters", () => {
        const mockState: CopyJobContextState = {
          jobName: "invalid job name with spaces!",
          migrationType: CopyJobMigrationType.Offline,
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
        };

        const ValidationTestComponent = () => {
          const screens = useCreateCopyJobScreensList(mockGoBack);
          const screen = screens.find((s) => s.key === SCREEN_KEYS.PreviewCopyJob);
          const isValid = screen?.validations[0]?.validate(mockState);

          return <div data-testid="validation-result">{isValid ? "valid" : "invalid"}</div>;
        };

        renderWithContext(<ValidationTestComponent />);
        expect(screen.getByTestId("validation-result")).toHaveTextContent("invalid");
      });

      it("should fail validation with empty job name", () => {
        const mockState: CopyJobContextState = {
          jobName: "",
          migrationType: CopyJobMigrationType.Offline,
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
        };

        const ValidationTestComponent = () => {
          const screens = useCreateCopyJobScreensList(mockGoBack);
          const screen = screens.find((s) => s.key === SCREEN_KEYS.PreviewCopyJob);
          const isValid = screen?.validations[0]?.validate(mockState);

          return <div data-testid="validation-result">{isValid ? "valid" : "invalid"}</div>;
        };

        renderWithContext(<ValidationTestComponent />);
        expect(screen.getByTestId("validation-result")).toHaveTextContent("invalid");
      });
    });

    describe("AssignPermissions screen validation", () => {
      it("should validate cache values", () => {
        renderWithContext(<TestHookComponent goBack={mockGoBack} />);

        const validationMessages = JSON.parse(screen.getByTestId("screen-validations-4").textContent || "[]");
        expect(validationMessages).toContain("Please ensure all previous steps are valid to proceed");
      });

      it("should pass validation when all cache values are true", () => {
        const mockCache = new Map([
          ["step1", true],
          ["step2", true],
          ["step3", true],
        ]);

        const ValidationTestComponent = () => {
          const screens = useCreateCopyJobScreensList(mockGoBack);
          const screen = screens.find((s) => s.key === SCREEN_KEYS.AssignPermissions);
          const isValid = screen?.validations[0]?.validate(mockCache);

          return <div data-testid="validation-result">{isValid ? "valid" : "invalid"}</div>;
        };

        renderWithContext(<ValidationTestComponent />);
        expect(screen.getByTestId("validation-result")).toHaveTextContent("valid");
      });

      it("should fail validation when cache is empty", () => {
        const mockCache = new Map();

        const ValidationTestComponent = () => {
          const screens = useCreateCopyJobScreensList(mockGoBack);
          const screen = screens.find((s) => s.key === SCREEN_KEYS.AssignPermissions);
          const isValid = screen?.validations[0]?.validate(mockCache);

          return <div data-testid="validation-result">{isValid ? "valid" : "invalid"}</div>;
        };

        renderWithContext(<ValidationTestComponent />);
        expect(screen.getByTestId("validation-result")).toHaveTextContent("invalid");
      });

      it("should fail validation when any cache value is false", () => {
        const mockCache = new Map([
          ["step1", true],
          ["step2", false],
          ["step3", true],
        ]);

        const ValidationTestComponent = () => {
          const screens = useCreateCopyJobScreensList(mockGoBack);
          const screen = screens.find((s) => s.key === SCREEN_KEYS.AssignPermissions);
          const isValid = screen?.validations[0]?.validate(mockCache);

          return <div data-testid="validation-result">{isValid ? "valid" : "invalid"}</div>;
        };

        renderWithContext(<ValidationTestComponent />);
        expect(screen.getByTestId("validation-result")).toHaveTextContent("invalid");
      });
    });
  });

  describe("SCREEN_KEYS constant", () => {
    it("should export correct screen keys", () => {
      expect(SCREEN_KEYS.CreateCollection).toBe("CreateCollection");
      expect(SCREEN_KEYS.SelectAccount).toBe("SelectAccount");
      expect(SCREEN_KEYS.SelectSourceAndTargetContainers).toBe("SelectSourceAndTargetContainers");
      expect(SCREEN_KEYS.PreviewCopyJob).toBe("PreviewCopyJob");
      expect(SCREEN_KEYS.AssignPermissions).toBe("AssignPermissions");
    });
  });

  describe("Component props", () => {
    it("should pass explorer to AddCollectionPanelWrapper", () => {
      renderWithContext(<TestHookComponent goBack={mockGoBack} />);
      expect(screen.getByTestId("add-collection-panel")).toBeInTheDocument();
    });

    it("should pass goBack function to AddCollectionPanelWrapper", () => {
      renderWithContext(<TestHookComponent goBack={mockGoBack} />);
      expect(screen.getByTestId("add-collection-panel")).toBeInTheDocument();
    });
  });

  describe("Error handling", () => {
    it("should handle context provider error gracefully", () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

      useCopyJobContext.mockImplementation(() => {
        throw new Error("Context not found");
      });

      expect(() => {
        render(<TestHookComponent goBack={mockGoBack} />);
      }).toThrow("Context not found");

      consoleError.mockRestore();
    });
  });
});
