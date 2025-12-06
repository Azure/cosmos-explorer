import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import React from "react";
import { useCopyJobPrerequisitesCache } from "./useCopyJobPrerequisitesCache";

describe("useCopyJobPrerequisitesCache", () => {
  let hookResult: any;

  const TestComponent = ({ onHookUpdate }: { onHookUpdate?: () => void }): JSX.Element => {
    hookResult = useCopyJobPrerequisitesCache();

    React.useEffect(() => {
      if (onHookUpdate) {
        onHookUpdate();
      }
    }, [onHookUpdate]);

    return (
      <div>
        <span data-testid="cache-size">{hookResult.validationCache.size}</span>
        <button
          data-testid="set-cache-button"
          onClick={() => {
            const testCache = new Map<string, boolean>();
            testCache.set("test-key", true);
            hookResult.setValidationCache(testCache);
          }}
        >
          Set Cache
        </button>
        <button
          data-testid="clear-cache-button"
          onClick={() => {
            hookResult.setValidationCache(new Map<string, boolean>());
          }}
        >
          Clear Cache
        </button>
      </div>
    );
  };

  afterEach(() => {
    if (hookResult) {
      act(() => {
        hookResult.setValidationCache(new Map<string, boolean>());
      });
    }
  });

  it("should initialize with an empty validation cache", () => {
    render(<TestComponent />);

    expect(hookResult.validationCache).toBeInstanceOf(Map);
    expect(hookResult.validationCache.size).toBe(0);
    expect(screen.getByTestId("cache-size")).toHaveTextContent("0");
  });

  it("should provide a setValidationCache function", () => {
    render(<TestComponent />);

    expect(typeof hookResult.setValidationCache).toBe("function");
  });

  it("should update validation cache when setValidationCache is called", () => {
    render(<TestComponent />);

    const testCache = new Map<string, boolean>();
    testCache.set("test-key", true);
    testCache.set("another-key", false);

    act(() => {
      hookResult.setValidationCache(testCache);
    });

    expect(hookResult.validationCache).toBe(testCache);
    expect(hookResult.validationCache.size).toBe(2);
    expect(hookResult.validationCache.get("test-key")).toBe(true);
    expect(hookResult.validationCache.get("another-key")).toBe(false);
    expect(screen.getByTestId("cache-size")).toHaveTextContent("2");
  });

  it("should replace the entire validation cache when setValidationCache is called", () => {
    render(<TestComponent />);

    const initialCache = new Map<string, boolean>();
    initialCache.set("initial-key", true);

    act(() => {
      hookResult.setValidationCache(initialCache);
    });

    expect(hookResult.validationCache.get("initial-key")).toBe(true);
    expect(screen.getByTestId("cache-size")).toHaveTextContent("1");

    const newCache = new Map<string, boolean>();
    newCache.set("new-key", false);

    act(() => {
      hookResult.setValidationCache(newCache);
    });

    expect(hookResult.validationCache.get("initial-key")).toBeUndefined();
    expect(hookResult.validationCache.get("new-key")).toBe(false);
    expect(hookResult.validationCache.size).toBe(1);
    expect(screen.getByTestId("cache-size")).toHaveTextContent("1");
  });

  it("should handle empty Map updates", () => {
    render(<TestComponent />);

    const initialCache = new Map<string, boolean>();
    initialCache.set("test-key", true);

    act(() => {
      hookResult.setValidationCache(initialCache);
    });

    expect(hookResult.validationCache.size).toBe(1);
    expect(screen.getByTestId("cache-size")).toHaveTextContent("1");

    act(() => {
      screen.getByTestId("clear-cache-button").click();
    });

    expect(hookResult.validationCache.size).toBe(0);
    expect(screen.getByTestId("cache-size")).toHaveTextContent("0");
  });

  it("should maintain state across multiple hook instances (global store behavior)", () => {
    let firstHookResult: any;
    let secondHookResult: any;

    const FirstComponent = (): JSX.Element => {
      firstHookResult = useCopyJobPrerequisitesCache();
      return <div data-testid="first-component">First</div>;
    };

    const SecondComponent = (): JSX.Element => {
      secondHookResult = useCopyJobPrerequisitesCache();
      return <div data-testid="second-component">Second</div>;
    };

    render(
      <div>
        <FirstComponent />
        <SecondComponent />
      </div>,
    );

    const testCache = new Map<string, boolean>();
    testCache.set("shared-key", true);

    act(() => {
      firstHookResult.setValidationCache(testCache);
    });

    expect(secondHookResult.validationCache.get("shared-key")).toBe(true);
    expect(secondHookResult.validationCache.size).toBe(1);
    expect(firstHookResult.validationCache.get("shared-key")).toBe(true);
    expect(firstHookResult.validationCache.size).toBe(1);
  });

  it("should allow updates from different hook instances", () => {
    let firstHookResult: any;
    let secondHookResult: any;

    const FirstComponent = (): JSX.Element => {
      firstHookResult = useCopyJobPrerequisitesCache();
      return (
        <button
          data-testid="first-update"
          onClick={() => {
            const testCache = new Map<string, boolean>();
            testCache.set("key-from-first", true);
            firstHookResult.setValidationCache(testCache);
          }}
        >
          Update from First
        </button>
      );
    };

    const SecondComponent = (): JSX.Element => {
      secondHookResult = useCopyJobPrerequisitesCache();
      return (
        <button
          data-testid="second-update"
          onClick={() => {
            const testCache = new Map<string, boolean>();
            testCache.set("key-from-second", false);
            secondHookResult.setValidationCache(testCache);
          }}
        >
          Update from Second
        </button>
      );
    };

    render(
      <div>
        <FirstComponent />
        <SecondComponent />
      </div>,
    );

    act(() => {
      screen.getByTestId("first-update").click();
    });

    expect(secondHookResult.validationCache.get("key-from-first")).toBe(true);

    act(() => {
      screen.getByTestId("second-update").click();
    });

    expect(firstHookResult.validationCache.get("key-from-second")).toBe(false);
    expect(firstHookResult.validationCache.get("key-from-first")).toBeUndefined();
  });

  it("should handle complex validation scenarios", () => {
    const ComplexTestComponent = (): JSX.Element => {
      hookResult = useCopyJobPrerequisitesCache();

      const handleComplexUpdate = () => {
        const complexCache = new Map<string, boolean>();
        complexCache.set("database-validation", true);
        complexCache.set("container-validation", true);
        complexCache.set("network-validation", false);
        complexCache.set("authentication-validation", true);
        complexCache.set("permission-validation", false);
        hookResult.setValidationCache(complexCache);
      };

      return (
        <button data-testid="complex-update" onClick={handleComplexUpdate}>
          Set Complex Cache
        </button>
      );
    };

    render(<ComplexTestComponent />);

    act(() => {
      screen.getByTestId("complex-update").click();
    });

    expect(hookResult.validationCache.size).toBe(5);
    expect(hookResult.validationCache.get("database-validation")).toBe(true);
    expect(hookResult.validationCache.get("container-validation")).toBe(true);
    expect(hookResult.validationCache.get("network-validation")).toBe(false);
    expect(hookResult.validationCache.get("authentication-validation")).toBe(true);
    expect(hookResult.validationCache.get("permission-validation")).toBe(false);
  });

  it("should handle edge case keys", () => {
    const EdgeCaseTestComponent = (): JSX.Element => {
      hookResult = useCopyJobPrerequisitesCache();

      const handleEdgeCaseUpdate = () => {
        const edgeCaseCache = new Map<string, boolean>();
        edgeCaseCache.set("", true);
        edgeCaseCache.set(" ", false);
        edgeCaseCache.set("special-chars!@#$%^&*()", true);
        edgeCaseCache.set("very-long-key-".repeat(10), false);
        edgeCaseCache.set("unicode-key-🔑", true);
        hookResult.setValidationCache(edgeCaseCache);
      };

      return (
        <button data-testid="edge-case-update" onClick={handleEdgeCaseUpdate}>
          Set Edge Case Cache
        </button>
      );
    };

    render(<EdgeCaseTestComponent />);

    act(() => {
      screen.getByTestId("edge-case-update").click();
    });

    expect(hookResult.validationCache.size).toBe(5);
    expect(hookResult.validationCache.get("")).toBe(true);
    expect(hookResult.validationCache.get(" ")).toBe(false);
    expect(hookResult.validationCache.get("special-chars!@#$%^&*()")).toBe(true);
    expect(hookResult.validationCache.get("very-long-key-".repeat(10))).toBe(false);
    expect(hookResult.validationCache.get("unicode-key-🔑")).toBe(true);
  });

  it("should handle setting the same cache reference without errors", () => {
    let testCache: Map<string, boolean>;

    const SameReferenceTestComponent = (): JSX.Element => {
      hookResult = useCopyJobPrerequisitesCache();

      const handleFirstUpdate = () => {
        testCache = new Map<string, boolean>();
        testCache.set("test-key", true);
        hookResult.setValidationCache(testCache);
      };

      const handleSecondUpdate = () => {
        hookResult.setValidationCache(testCache);
      };

      return (
        <div>
          <button data-testid="first-update" onClick={handleFirstUpdate}>
            First Update
          </button>
          <button data-testid="second-update" onClick={handleSecondUpdate}>
            Second Update (Same Reference)
          </button>
          <span data-testid="cache-content">{hookResult.validationCache.get("test-key")?.toString()}</span>
        </div>
      );
    };

    render(<SameReferenceTestComponent />);
    act(() => {
      screen.getByTestId("first-update").click();
    });
    expect(hookResult.validationCache.get("test-key")).toBe(true);
    expect(screen.getByTestId("cache-content")).toHaveTextContent("true");

    act(() => {
      screen.getByTestId("second-update").click();
    });
    expect(hookResult.validationCache).toBe(testCache);
    expect(hookResult.validationCache.get("test-key")).toBe(true);
    expect(screen.getByTestId("cache-content")).toHaveTextContent("true");
  });
});
