import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import useToggle from "./useToggle";

const TestToggleComponent: React.FC<{ initialState?: boolean }> = ({ initialState }) => {
  const [state, onToggle] = useToggle(initialState);

  return (
    <div>
      <span data-test="toggle-state">{state ? "true" : "false"}</span>
      <button data-test="toggle-button" onClick={() => onToggle(null, !state)}>
        Toggle
      </button>
      <button data-test="set-true-button" onClick={() => onToggle(null, true)}>
        Set True
      </button>
      <button data-test="set-false-button" onClick={() => onToggle(null, false)}>
        Set False
      </button>
    </div>
  );
};

describe("useToggle hook", () => {
  it("should initialize with false as default", () => {
    render(<TestToggleComponent />);

    const stateElement = screen.getByTestId("toggle-state");
    expect(stateElement.textContent).toBe("false");
  });

  it("should initialize with provided initial state", () => {
    render(<TestToggleComponent initialState={true} />);

    const stateElement = screen.getByTestId("toggle-state");
    expect(stateElement.textContent).toBe("true");
  });

  it("should toggle state when onToggle is called with opposite value", () => {
    render(<TestToggleComponent />);

    const stateElement = screen.getByTestId("toggle-state");
    const toggleButton = screen.getByTestId("toggle-button");

    expect(stateElement.textContent).toBe("false");

    fireEvent.click(toggleButton);
    expect(stateElement.textContent).toBe("true");

    fireEvent.click(toggleButton);
    expect(stateElement.textContent).toBe("false");
  });

  it("should handle undefined checked parameter gracefully", () => {
    const TestUndefinedComponent: React.FC = () => {
      const [state, onToggle] = useToggle(false);

      return (
        <div>
          <span data-test="toggle-state">{state ? "true" : "false"}</span>
          <button data-test="undefined-button" onClick={() => onToggle(null, undefined)}>
            Set Undefined
          </button>
        </div>
      );
    };

    render(<TestUndefinedComponent />);

    const stateElement = screen.getByTestId("toggle-state");
    const undefinedButton = screen.getByTestId("undefined-button");

    expect(stateElement.textContent).toBe("false");

    fireEvent.click(undefinedButton);
    expect(stateElement.textContent).toBe("false");
  });
});
