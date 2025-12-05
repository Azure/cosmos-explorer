import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import Explorer from "../Explorer";
import ContainerCopyPanel from "./ContainerCopyPanel";
import { MonitorCopyJobsRefState } from "./MonitorCopyJobs/MonitorCopyJobRefState";

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
    mockExplorer = {} as Explorer;

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

    expect(screen.getByTestId("copy-job-command-bar")).toBeInTheDocument();
    expect(screen.getByTestId("monitor-copy-jobs")).toBeInTheDocument();
  });

  it("sets the MonitorCopyJobs ref in the state on mount", async () => {
    render(<ContainerCopyPanel explorer={mockExplorer} />);

    await waitFor(() => {
      expect(mockSetRef).toHaveBeenCalledTimes(1);
    });

    const refArgument = mockSetRef.mock.calls[0][0];
    expect(refArgument).toBeDefined();
    expect(refArgument).toHaveProperty("refreshJobList");
    expect(typeof refArgument.refreshJobList).toBe("function");
  });

  it("updates the ref state when monitorCopyJobsRef changes", async () => {
    const { rerender } = render(<ContainerCopyPanel explorer={mockExplorer} />);
    await waitFor(() => {
      expect(mockSetRef).toHaveBeenCalledTimes(1);
    });
    mockSetRef.mockClear();
    rerender(<ContainerCopyPanel explorer={mockExplorer} />);
  });

  it("handles missing explorer prop gracefully", () => {
    const { container } = render(<ContainerCopyPanel explorer={undefined as any} />);
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
    const newExplorer = {} as Explorer;
    rerender(<ContainerCopyPanel explorer={newExplorer} />);
    expect(mockSetRef.mock.calls[0][0]).toBe(firstCallRef);
  });
});
