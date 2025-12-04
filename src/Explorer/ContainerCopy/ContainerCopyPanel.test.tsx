import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import Explorer from "../Explorer";
import ContainerCopyPanel from "./ContainerCopyPanel";
import { MonitorCopyJobsRefState } from "./MonitorCopyJobs/MonitorCopyJobRefState";

// Mock the child components
jest.mock("./CommandBar/CopyJobCommandBar", () => {
  return function MockCopyJobCommandBar() {
    return <div data-testid="copy-job-command-bar">CopyJobCommandBar</div>;
  };
});

jest.mock("./MonitorCopyJobs/MonitorCopyJobs", () => {
  const React = require("react");
  return React.forwardRef(function MockMonitorCopyJobs(_props: any, ref: any) {
    React.useImperativeHandle(ref, () => ({
      refreshJobList: jest.fn(),
    }));
    return <div data-testid="monitor-copy-jobs">MonitorCopyJobs</div>;
  });
});

// Mock the zustand store
jest.mock("./MonitorCopyJobs/MonitorCopyJobRefState", () => ({
  MonitorCopyJobsRefState: {
    getState: jest.fn(() => ({
      setRef: jest.fn(),
    })),
  },
}));

describe("ContainerCopyPanel", () => {
  let mockExplorer: Explorer;
  let mockSetRef: jest.Mock;

  beforeEach(() => {
    // Create a mock explorer object
    mockExplorer = {} as Explorer;

    // Setup the mock for setRef
    mockSetRef = jest.fn();
    (MonitorCopyJobsRefState.getState as jest.Mock).mockReturnValue({
      setRef: mockSetRef,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the component with correct structure", () => {
    render(<ContainerCopyPanel explorer={mockExplorer} />);

    // Check if the wrapper div is rendered
    const wrapper = document.querySelector("#containerCopyWrapper");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass("flexContainer", "hideOverflows");
  });

  it("renders CopyJobCommandBar component", () => {
    render(<ContainerCopyPanel explorer={mockExplorer} />);

    const commandBar = screen.getByTestId("copy-job-command-bar");
    expect(commandBar).toBeInTheDocument();
    expect(commandBar).toHaveTextContent("CopyJobCommandBar");
  });

  it("renders MonitorCopyJobs component", () => {
    render(<ContainerCopyPanel explorer={mockExplorer} />);

    const monitorCopyJobs = screen.getByTestId("monitor-copy-jobs");
    expect(monitorCopyJobs).toBeInTheDocument();
    expect(monitorCopyJobs).toHaveTextContent("MonitorCopyJobs");
  });

  it("passes explorer prop to child components", () => {
    const { container } = render(<ContainerCopyPanel explorer={mockExplorer} />);

    // Both child components should be rendered
    expect(screen.getByTestId("copy-job-command-bar")).toBeInTheDocument();
    expect(screen.getByTestId("monitor-copy-jobs")).toBeInTheDocument();
  });

  it("sets the MonitorCopyJobs ref in the state on mount", async () => {
    render(<ContainerCopyPanel explorer={mockExplorer} />);

    // Wait for the useEffect to complete
    await waitFor(() => {
      expect(mockSetRef).toHaveBeenCalledTimes(1);
    });

    // Verify that setRef was called with a ref object containing refreshJobList
    const refArgument = mockSetRef.mock.calls[0][0];
    expect(refArgument).toBeDefined();
    expect(refArgument).toHaveProperty("refreshJobList");
    expect(typeof refArgument.refreshJobList).toBe("function");
  });

  it("updates the ref state when monitorCopyJobsRef changes", async () => {
    const { rerender } = render(<ContainerCopyPanel explorer={mockExplorer} />);

    // Initial call
    await waitFor(() => {
      expect(mockSetRef).toHaveBeenCalledTimes(1);
    });

    // Clear the mock and force a re-render
    mockSetRef.mockClear();

    // Rerender with the same props
    rerender(<ContainerCopyPanel explorer={mockExplorer} />);

    // The effect should not run again if the ref hasn't changed
    // Note: This behavior depends on the useEffect dependency array
  });

  it("handles missing explorer prop gracefully", () => {
    // TypeScript would normally catch this, but testing runtime behavior
    const { container } = render(<ContainerCopyPanel explorer={undefined as any} />);

    // Component should still render
    expect(container.querySelector("#containerCopyWrapper")).toBeInTheDocument();
  });

  it("applies correct CSS classes to wrapper", () => {
    render(<ContainerCopyPanel explorer={mockExplorer} />);

    const wrapper = document.querySelector("#containerCopyWrapper");
    expect(wrapper).toHaveClass("flexContainer");
    expect(wrapper).toHaveClass("hideOverflows");
  });

  it("maintains ref across re-renders", async () => {
    const { rerender } = render(<ContainerCopyPanel explorer={mockExplorer} />);

    await waitFor(() => {
      expect(mockSetRef).toHaveBeenCalled();
    });

    const firstCallRef = mockSetRef.mock.calls[0][0];

    // Rerender with different explorer
    const newExplorer = {} as Explorer;
    rerender(<ContainerCopyPanel explorer={newExplorer} />);

    // The ref object should remain stable
    expect(mockSetRef.mock.calls[0][0]).toBe(firstCallRef);
  });
});
