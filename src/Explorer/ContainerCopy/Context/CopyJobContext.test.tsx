import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import React from "react";
import Explorer from "../../Explorer";
import { CopyJobMigrationType } from "../Enums/CopyJobEnums";
import CopyJobContextProvider, { CopyJobContext, useCopyJobContext } from "./CopyJobContext";

jest.mock("UserContext", () => ({
  userContext: {
    subscriptionId: "test-subscription-id",
    databaseAccount: {
      id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.DocumentDB/databaseAccounts/test-account",
      name: "test-account",
      location: "East US",
      kind: "GlobalDocumentDB",
    },
  },
}));

describe("CopyJobContext", () => {
  let mockExplorer: Explorer;

  beforeEach(() => {
    mockExplorer = {} as Explorer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("CopyJobContextProvider", () => {
    it("should render children correctly", () => {
      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <div data-test="test-child">Test Child</div>
        </CopyJobContextProvider>,
      );

      expect(screen.getByTestId("test-child")).toBeInTheDocument();
      expect(screen.getByTestId("test-child")).toHaveTextContent("Test Child");
    });

    it("should initialize with default state", () => {
      let contextValue: any;

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <CopyJobContext.Consumer>
            {(value) => {
              contextValue = value;
              return null;
            }}
          </CopyJobContext.Consumer>
        </CopyJobContextProvider>,
      );

      expect(contextValue).toBeDefined();
      expect(contextValue.copyJobState).toEqual({
        jobName: "",
        migrationType: CopyJobMigrationType.Offline,
        source: {
          subscription: {
            subscriptionId: "test-subscription-id",
          },
          account: {
            id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.DocumentDB/databaseAccounts/test-account",
            name: "test-account",
            location: "East US",
            kind: "GlobalDocumentDB",
          },
          databaseId: "",
          containerId: "",
        },
        target: {
          subscriptionId: "test-subscription-id",
          account: {
            id: "/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.DocumentDB/databaseAccounts/test-account",
            name: "test-account",
            location: "East US",
            kind: "GlobalDocumentDB",
          },
          databaseId: "",
          containerId: "",
        },
        sourceReadAccessFromTarget: false,
      });
      expect(contextValue.flow).toBeNull();
      expect(contextValue.contextError).toBeNull();
      expect(contextValue.explorer).toBe(mockExplorer);
    });

    it("should provide setCopyJobState function", () => {
      let contextValue: any;

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <CopyJobContext.Consumer>
            {(value) => {
              contextValue = value;
              return null;
            }}
          </CopyJobContext.Consumer>
        </CopyJobContextProvider>,
      );

      expect(contextValue.setCopyJobState).toBeDefined();
      expect(typeof contextValue.setCopyJobState).toBe("function");
    });

    it("should provide setFlow function", () => {
      let contextValue: any;

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <CopyJobContext.Consumer>
            {(value) => {
              contextValue = value;
              return null;
            }}
          </CopyJobContext.Consumer>
        </CopyJobContextProvider>,
      );

      expect(contextValue.setFlow).toBeDefined();
      expect(typeof contextValue.setFlow).toBe("function");
    });

    it("should provide setContextError function", () => {
      let contextValue: any;

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <CopyJobContext.Consumer>
            {(value) => {
              contextValue = value;
              return null;
            }}
          </CopyJobContext.Consumer>
        </CopyJobContextProvider>,
      );

      expect(contextValue.setContextError).toBeDefined();
      expect(typeof contextValue.setContextError).toBe("function");
    });

    it("should provide resetCopyJobState function", () => {
      let contextValue: any;

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <CopyJobContext.Consumer>
            {(value) => {
              contextValue = value;
              return null;
            }}
          </CopyJobContext.Consumer>
        </CopyJobContextProvider>,
      );

      expect(contextValue.resetCopyJobState).toBeDefined();
      expect(typeof contextValue.resetCopyJobState).toBe("function");
    });

    it("should update copyJobState when setCopyJobState is called", () => {
      let contextValue: any;

      const TestComponent = (): JSX.Element => {
        const context = useCopyJobContext();
        contextValue = context;

        return (
          <button
            onClick={() =>
              context.setCopyJobState({
                ...context.copyJobState,
                jobName: "test-job",
                migrationType: CopyJobMigrationType.Online,
              })
            }
          >
            Update Job
          </button>
        );
      };

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <TestComponent />
        </CopyJobContextProvider>,
      );

      const button = screen.getByText("Update Job");
      act(() => {
        button.click();
      });

      expect(contextValue.copyJobState.jobName).toBe("test-job");
      expect(contextValue.copyJobState.migrationType).toBe(CopyJobMigrationType.Online);
    });

    it("should update flow when setFlow is called", () => {
      let contextValue: any;

      const TestComponent = (): JSX.Element => {
        const context = useCopyJobContext();
        contextValue = context;

        const handleSetFlow = (): void => {
          context.setFlow({ currentScreen: "source-selection" });
        };

        return <button onClick={handleSetFlow}>Set Flow</button>;
      };

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <TestComponent />
        </CopyJobContextProvider>,
      );

      expect(contextValue.flow).toBeNull();

      const button = screen.getByText("Set Flow");
      act(() => {
        button.click();
      });

      expect(contextValue.flow).toEqual({ currentScreen: "source-selection" });
    });

    it("should update contextError when setContextError is called", () => {
      let contextValue: any;

      const TestComponent = (): JSX.Element => {
        const context = useCopyJobContext();
        contextValue = context;

        return <button onClick={() => context.setContextError("Test error message")}>Set Error</button>;
      };

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <TestComponent />
        </CopyJobContextProvider>,
      );

      expect(contextValue.contextError).toBeNull();

      const button = screen.getByText("Set Error");
      act(() => {
        button.click();
      });

      expect(contextValue.contextError).toBe("Test error message");
    });

    it("should reset copyJobState when resetCopyJobState is called", () => {
      let contextValue: any;

      const TestComponent = (): JSX.Element => {
        const context = useCopyJobContext();
        contextValue = context;

        const handleUpdate = (): void => {
          context.setCopyJobState({
            ...context.copyJobState,
            jobName: "modified-job",
            migrationType: CopyJobMigrationType.Online,
            source: {
              ...context.copyJobState.source,
              databaseId: "test-db",
              containerId: "test-container",
            },
          });
        };

        return (
          <>
            <button onClick={handleUpdate}>Update</button>
            <button onClick={context.resetCopyJobState}>Reset</button>
          </>
        );
      };

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <TestComponent />
        </CopyJobContextProvider>,
      );

      const updateButton = screen.getByText("Update");
      act(() => {
        updateButton.click();
      });

      expect(contextValue.copyJobState.jobName).toBe("modified-job");
      expect(contextValue.copyJobState.migrationType).toBe(CopyJobMigrationType.Online);
      expect(contextValue.copyJobState.source.databaseId).toBe("test-db");

      const resetButton = screen.getByText("Reset");
      act(() => {
        resetButton.click();
      });

      expect(contextValue.copyJobState.jobName).toBe("");
      expect(contextValue.copyJobState.migrationType).toBe(CopyJobMigrationType.Offline);
      expect(contextValue.copyJobState.source.databaseId).toBe("");
      expect(contextValue.copyJobState.source.containerId).toBe("");
    });

    it("should maintain explorer reference", () => {
      let contextValue: any;

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <CopyJobContext.Consumer>
            {(value) => {
              contextValue = value;
              return null;
            }}
          </CopyJobContext.Consumer>
        </CopyJobContextProvider>,
      );

      expect(contextValue.explorer).toBe(mockExplorer);
    });

    it("should handle multiple state updates correctly", () => {
      let contextValue: any;

      const TestComponent = (): JSX.Element => {
        const context = useCopyJobContext();
        contextValue = context;

        return (
          <>
            <button onClick={() => context.setCopyJobState({ ...context.copyJobState, jobName: "job-1" })}>
              Update 1
            </button>
            <button onClick={() => context.setFlow({ currentScreen: "screen-1" })}>Flow 1</button>
            <button onClick={() => context.setContextError("error-1")}>Error 1</button>
          </>
        );
      };

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <TestComponent />
        </CopyJobContextProvider>,
      );

      act(() => {
        screen.getByText("Update 1").click();
      });
      expect(contextValue.copyJobState.jobName).toBe("job-1");

      act(() => {
        screen.getByText("Flow 1").click();
      });
      expect(contextValue.flow).toEqual({ currentScreen: "screen-1" });

      act(() => {
        screen.getByText("Error 1").click();
      });
      expect(contextValue.contextError).toBe("error-1");
    });

    it("should handle partial state updates", () => {
      let contextValue: any;

      const TestComponent = (): JSX.Element => {
        const context = useCopyJobContext();
        contextValue = context;

        const handlePartialUpdate = (): void => {
          context.setCopyJobState((prev) => ({
            ...prev,
            jobName: "partial-update",
          }));
        };

        return <button onClick={handlePartialUpdate}>Partial Update</button>;
      };

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <TestComponent />
        </CopyJobContextProvider>,
      );

      const initialState = { ...contextValue.copyJobState };

      act(() => {
        screen.getByText("Partial Update").click();
      });

      expect(contextValue.copyJobState.jobName).toBe("partial-update");
      expect(contextValue.copyJobState.migrationType).toBe(initialState.migrationType);
      expect(contextValue.copyJobState.source).toEqual(initialState.source);
      expect(contextValue.copyJobState.target).toEqual(initialState.target);
    });
  });

  describe("useCopyJobContext", () => {
    it("should return context value when used within provider", () => {
      let contextValue: any;

      const TestComponent = (): null => {
        const context = useCopyJobContext();
        contextValue = context;
        return null;
      };

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <TestComponent />
        </CopyJobContextProvider>,
      );

      expect(contextValue).toBeDefined();
      expect(contextValue.copyJobState).toBeDefined();
      expect(contextValue.setCopyJobState).toBeDefined();
      expect(contextValue.flow).toBeNull();
      expect(contextValue.setFlow).toBeDefined();
      expect(contextValue.contextError).toBeNull();
      expect(contextValue.setContextError).toBeDefined();
      expect(contextValue.resetCopyJobState).toBeDefined();
      expect(contextValue.explorer).toBe(mockExplorer);
    });

    it("should throw error when used outside provider", () => {
      const originalError = console.error;
      console.error = jest.fn();

      const TestComponent = (): null => {
        useCopyJobContext();
        return null;
      };

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useCopyJobContext must be used within a CopyJobContextProvider");

      console.error = originalError;
    });

    it("should allow updating state through hook", () => {
      let contextValue: any;

      const TestComponent = (): JSX.Element => {
        const context = useCopyJobContext();
        contextValue = context;

        return (
          <button
            onClick={() =>
              context.setCopyJobState({
                ...context.copyJobState,
                jobName: "hook-test-job",
              })
            }
          >
            Update
          </button>
        );
      };

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <TestComponent />
        </CopyJobContextProvider>,
      );

      act(() => {
        screen.getByText("Update").click();
      });

      expect(contextValue.copyJobState.jobName).toBe("hook-test-job");
    });

    it("should allow resetting state through hook", () => {
      let contextValue: any;

      const TestComponent = (): JSX.Element => {
        const context = useCopyJobContext();
        contextValue = context;

        return (
          <>
            <button
              onClick={() =>
                context.setCopyJobState({
                  ...context.copyJobState,
                  jobName: "modified",
                  source: {
                    ...context.copyJobState.source,
                    databaseId: "modified-db",
                  },
                })
              }
            >
              Modify
            </button>
            <button onClick={() => context.resetCopyJobState()}>Reset</button>
          </>
        );
      };

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <TestComponent />
        </CopyJobContextProvider>,
      );

      act(() => {
        screen.getByText("Modify").click();
      });

      expect(contextValue.copyJobState.jobName).toBe("modified");
      expect(contextValue.copyJobState.source.databaseId).toBe("modified-db");

      act(() => {
        screen.getByText("Reset").click();
      });

      expect(contextValue.copyJobState.jobName).toBe("");
      expect(contextValue.copyJobState.source.databaseId).toBe("");
    });

    it("should maintain state consistency across multiple components", () => {
      let contextValue1: any;
      let contextValue2: any;

      const TestComponent1 = (): JSX.Element => {
        const context = useCopyJobContext();
        contextValue1 = context;

        return (
          <button
            onClick={() =>
              context.setCopyJobState({
                ...context.copyJobState,
                jobName: "shared-job",
              })
            }
          >
            Update From Component 1
          </button>
        );
      };

      const TestComponent2 = (): JSX.Element => {
        const context = useCopyJobContext();
        contextValue2 = context;
        return <div data-test="component-2">Component 2</div>;
      };

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <TestComponent1 />
          <TestComponent2 />
        </CopyJobContextProvider>,
      );

      expect(contextValue1.copyJobState).toEqual(contextValue2.copyJobState);

      act(() => {
        screen.getByText("Update From Component 1").click();
      });

      expect(contextValue1.copyJobState.jobName).toBe("shared-job");
      expect(contextValue2.copyJobState.jobName).toBe("shared-job");
    });
  });

  describe("Initial State", () => {
    it("should initialize with offline migration type", () => {
      let contextValue: any;

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <CopyJobContext.Consumer>
            {(value) => {
              contextValue = value;
              return null;
            }}
          </CopyJobContext.Consumer>
        </CopyJobContextProvider>,
      );

      expect(contextValue.copyJobState.migrationType).toBe(CopyJobMigrationType.Offline);
    });

    it("should initialize source with userContext values", () => {
      let contextValue: any;

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <CopyJobContext.Consumer>
            {(value) => {
              contextValue = value;
              return null;
            }}
          </CopyJobContext.Consumer>
        </CopyJobContextProvider>,
      );

      expect(contextValue.copyJobState.source.subscription.subscriptionId).toBe("test-subscription-id");
      expect(contextValue.copyJobState.source.account.name).toBe("test-account");
    });

    it("should initialize target with userContext values", () => {
      let contextValue: any;

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <CopyJobContext.Consumer>
            {(value) => {
              contextValue = value;
              return null;
            }}
          </CopyJobContext.Consumer>
        </CopyJobContextProvider>,
      );

      expect(contextValue.copyJobState.target.subscriptionId).toBe("test-subscription-id");
      expect(contextValue.copyJobState.target.account.name).toBe("test-account");
    });

    it("should initialize sourceReadAccessFromTarget as false", () => {
      let contextValue: any;

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <CopyJobContext.Consumer>
            {(value) => {
              contextValue = value;
              return null;
            }}
          </CopyJobContext.Consumer>
        </CopyJobContextProvider>,
      );

      expect(contextValue.copyJobState.sourceReadAccessFromTarget).toBe(false);
    });

    it("should initialize with empty database and container ids", () => {
      let contextValue: any;

      render(
        <CopyJobContextProvider explorer={mockExplorer}>
          <CopyJobContext.Consumer>
            {(value) => {
              contextValue = value;
              return null;
            }}
          </CopyJobContext.Consumer>
        </CopyJobContextProvider>,
      );

      expect(contextValue.copyJobState.source.databaseId).toBe("");
      expect(contextValue.copyJobState.source.containerId).toBe("");
      expect(contextValue.copyJobState.target.databaseId).toBe("");
      expect(contextValue.copyJobState.target.containerId).toBe("");
    });
  });
});
