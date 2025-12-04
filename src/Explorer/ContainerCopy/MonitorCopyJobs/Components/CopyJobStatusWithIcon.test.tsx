import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
import { CopyJobStatusType } from "../../Enums/CopyJobEnums";
import CopyJobStatusWithIcon from "./CopyJobStatusWithIcon";

jest.mock("@fluentui/react", () => ({
  ...jest.requireActual("@fluentui/react"),
  getTheme: () => ({
    semanticColors: {
      bodySubtext: "#666666",
      errorIcon: "#d13438",
      successIcon: "#107c10",
    },
    palette: {
      themePrimary: "#0078d4",
    },
  }),
  mergeStyles: (styles: any) => "mocked-styles",
  mergeStyleSets: (styleSet: any) => {
    const result: any = {};
    Object.keys(styleSet).forEach((key) => {
      result[key] = "mocked-style-" + key;
    });
    return result;
  },
}));

describe("CopyJobStatusWithIcon", () => {
  describe("Static Icon Status Types - Snapshot Tests", () => {
    const staticIconStatuses = [
      CopyJobStatusType.Pending,
      CopyJobStatusType.Paused,
      CopyJobStatusType.Skipped,
      CopyJobStatusType.Cancelled,
      CopyJobStatusType.Failed,
      CopyJobStatusType.Faulted,
      CopyJobStatusType.Completed,
    ];

    test.each(staticIconStatuses)("renders %s status correctly", (status) => {
      const { container } = render(<CopyJobStatusWithIcon status={status} />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("Spinner Status Types", () => {
    const spinnerStatuses = [CopyJobStatusType.Running, CopyJobStatusType.InProgress, CopyJobStatusType.Partitioning];

    test.each(spinnerStatuses)("renders %s with spinner and expected text", (status) => {
      const { container } = render(<CopyJobStatusWithIcon status={status} />);

      const spinner = container.querySelector('[class*="ms-Spinner"]');
      expect(spinner).toBeInTheDocument();
      expect(container).toHaveTextContent("In Progress");
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("PropTypes Validation", () => {
    it("has correct display name", () => {
      expect(CopyJobStatusWithIcon.displayName).toBe("CopyJobStatusWithIcon");
    });
    it("accepts all valid CopyJobStatusType values", () => {
      const allStatuses = Object.values(CopyJobStatusType);

      allStatuses.forEach((status) => {
        expect(() => {
          render(<CopyJobStatusWithIcon status={status} />);
        }).not.toThrow();
      });
    });
  });

  describe("Accessibility", () => {
    it("provides proper aria-label for icon elements", () => {
      const { container } = render(<CopyJobStatusWithIcon status={CopyJobStatusType.Failed} />);

      const icon = container.querySelector('[class*="ms-Icon"]');
      expect(icon).toHaveAttribute("aria-label", CopyJobStatusType.Failed);
    });

    it("provides meaningful text content for screen readers", () => {
      const { container } = render(<CopyJobStatusWithIcon status={CopyJobStatusType.InProgress} />);

      expect(container).toHaveTextContent("In Progress");
    });
  });

  describe("Icon and Status Mapping", () => {
    it("renders correct status text based on mapping", () => {
      const statusMappings = [
        { status: CopyJobStatusType.Pending, expectedText: "Pending" },
        { status: CopyJobStatusType.Paused, expectedText: "Paused" },
        { status: CopyJobStatusType.Failed, expectedText: "Failed" },
        { status: CopyJobStatusType.Completed, expectedText: "Completed" },
        { status: CopyJobStatusType.Running, expectedText: "In Progress" },
      ];

      statusMappings.forEach(({ status, expectedText }) => {
        const { container, unmount } = render(<CopyJobStatusWithIcon status={status} />);
        expect(container).toHaveTextContent(expectedText);
        unmount();
      });
    });

    it("renders icons for static status types", () => {
      const staticStatuses = [
        CopyJobStatusType.Pending,
        CopyJobStatusType.Paused,
        CopyJobStatusType.Failed,
        CopyJobStatusType.Completed,
      ];

      staticStatuses.forEach((status) => {
        const { container, unmount } = render(<CopyJobStatusWithIcon status={status} />);
        const icon = container.querySelector('[class*="ms-Icon"]');
        const spinner = container.querySelector('[class*="ms-Spinner"]');

        expect(icon).toBeInTheDocument();
        expect(spinner).not.toBeInTheDocument();

        unmount();
      });
    });

    it("renders spinners for progress status types", () => {
      const progressStatuses = [
        CopyJobStatusType.Running,
        CopyJobStatusType.InProgress,
        CopyJobStatusType.Partitioning,
      ];

      progressStatuses.forEach((status) => {
        const { container, unmount } = render(<CopyJobStatusWithIcon status={status} />);
        const icon = container.querySelector('[class*="ms-Icon"]');
        const spinner = container.querySelector('[class*="ms-Spinner"]');

        expect(spinner).toBeInTheDocument();
        expect(icon).not.toBeInTheDocument();

        unmount();
      });
    });
  });

  describe("Performance", () => {
    it("does not cause unnecessary re-renders with same props", () => {
      const renderSpy = jest.fn();
      const TestWrapper = ({ status }: { status: CopyJobStatusType }) => {
        renderSpy();
        return <CopyJobStatusWithIcon status={status} />;
      };

      const { rerender } = render(<TestWrapper status={CopyJobStatusType.Pending} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestWrapper status={CopyJobStatusType.Pending} />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });
});
