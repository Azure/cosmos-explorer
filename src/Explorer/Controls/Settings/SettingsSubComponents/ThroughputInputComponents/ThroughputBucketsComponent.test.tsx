import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { ThroughputBucketsComponent } from "./ThroughputBucketsComponent";

describe("ThroughputBucketsComponent", () => {
  const mockOnBucketsChange = jest.fn();
  const mockOnSaveableChange = jest.fn();
  const mockOnDiscardableChange = jest.fn();

  const defaultProps = {
    currentBuckets: [
      { id: 1, maxThroughputPercentage: 50 },
      { id: 2, maxThroughputPercentage: 60 },
    ],
    throughputBucketsBaseline: [
      { id: 1, maxThroughputPercentage: 40 },
      { id: 2, maxThroughputPercentage: 50 },
    ],
    onBucketsChange: mockOnBucketsChange,
    onSaveableChange: mockOnSaveableChange,
    onDiscardableChange: mockOnDiscardableChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders 5 buckets with default values when input buckets are missing", () => {
    render(<ThroughputBucketsComponent {...defaultProps} currentBuckets={[{ id: 1, maxThroughputPercentage: 50 }]} />);

    expect(screen.getAllByText(/Bucket \d+/)).toHaveLength(5);
    expect(screen.getByDisplayValue("50")).toBeInTheDocument();
    expect(screen.getAllByDisplayValue("100").length).toBe(4);
  });

  it("renders buckets in the correct order even if input is unordered", () => {
    const unorderedBuckets = [
      { id: 2, maxThroughputPercentage: 60 },
      { id: 1, maxThroughputPercentage: 50 },
    ];
    render(<ThroughputBucketsComponent {...defaultProps} currentBuckets={unorderedBuckets} />);

    const bucketLabels = screen.getAllByText(/Bucket \d+/).map((el) => el.textContent);
    expect(bucketLabels).toEqual(["Bucket 1", "Bucket 2", "Bucket 3", "Bucket 4", "Bucket 5"]);
    expect(screen.getByDisplayValue("50")).toBeInTheDocument();
    expect(screen.getByDisplayValue("60")).toBeInTheDocument();
    expect(screen.getAllByDisplayValue("100").length).toBe(3);
  });

  it("calls onBucketsChange when a bucket value changes", () => {
    render(<ThroughputBucketsComponent {...defaultProps} />);

    const input = screen.getByDisplayValue("50");
    fireEvent.change(input, { target: { value: "70" } });

    expect(mockOnBucketsChange).toHaveBeenCalledWith([
      { id: 1, maxThroughputPercentage: 70 },
      { id: 2, maxThroughputPercentage: 60 },
      { id: 3, maxThroughputPercentage: 100 },
      { id: 4, maxThroughputPercentage: 100 },
      { id: 5, maxThroughputPercentage: 100 },
    ]);
  });

  it("triggers onSaveableChange and onDiscardableChange when values change", () => {
    render(<ThroughputBucketsComponent {...defaultProps} />);

    const input = screen.getByDisplayValue("50");
    fireEvent.change(input, { target: { value: "80" } });

    expect(mockOnSaveableChange).toHaveBeenCalledWith(true);
    expect(mockOnDiscardableChange).toHaveBeenCalledWith(true);
  });

  it("ensures buckets revert to default when no buckets are provided", () => {
    render(<ThroughputBucketsComponent {...defaultProps} currentBuckets={[]} />);

    expect(screen.getAllByText(/Bucket \d+/)).toHaveLength(5);
    expect(screen.getAllByDisplayValue("100")).toHaveLength(5);
  });

  it("updates state consistently after multiple changes to different buckets", () => {
    render(<ThroughputBucketsComponent {...defaultProps} />);

    const input1 = screen.getByDisplayValue("50");
    fireEvent.change(input1, { target: { value: "70" } });

    const input2 = screen.getByDisplayValue("60");
    fireEvent.change(input2, { target: { value: "80" } });

    expect(mockOnBucketsChange).toHaveBeenCalledWith([
      { id: 1, maxThroughputPercentage: 70 },
      { id: 2, maxThroughputPercentage: 80 },
      { id: 3, maxThroughputPercentage: 100 },
      { id: 4, maxThroughputPercentage: 100 },
      { id: 5, maxThroughputPercentage: 100 },
    ]);
  });

  it("resets to baseline when currentBuckets are reset", () => {
    const { rerender } = render(<ThroughputBucketsComponent {...defaultProps} />);

    const input1 = screen.getByDisplayValue("50");
    fireEvent.change(input1, { target: { value: "70" } });

    expect(mockOnBucketsChange).toHaveBeenCalledWith([
      { id: 1, maxThroughputPercentage: 70 },
      { id: 2, maxThroughputPercentage: 60 },
      { id: 3, maxThroughputPercentage: 100 },
      { id: 4, maxThroughputPercentage: 100 },
      { id: 5, maxThroughputPercentage: 100 },
    ]);

    rerender(<ThroughputBucketsComponent {...defaultProps} currentBuckets={defaultProps.throughputBucketsBaseline} />);

    expect(screen.getByDisplayValue("40")).toBeInTheDocument();
    expect(screen.getByDisplayValue("50")).toBeInTheDocument();
  });

  it("does not call onBucketsChange when value remains unchanged", () => {
    render(<ThroughputBucketsComponent {...defaultProps} />);

    const input = screen.getByDisplayValue("50");
    fireEvent.change(input, { target: { value: "50" } });

    expect(mockOnBucketsChange).not.toHaveBeenCalled();
  });
});
