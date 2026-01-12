import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { ThroughputBucketsComponent } from "./ThroughputBucketsComponent";

describe("ThroughputBucketsComponent", () => {
  const mockOnBucketsChange = jest.fn();
  const mockOnSaveableChange = jest.fn();

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
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the correct number of buckets", () => {
    render(<ThroughputBucketsComponent {...defaultProps} />);
    expect(screen.getAllByText(/Bucket \d+/)).toHaveLength(5);
  });

  it("renders buckets in the correct order even if input is unordered", () => {
    const unorderedBuckets = [
      { id: 2, maxThroughputPercentage: 60 },
      { id: 1, maxThroughputPercentage: 50 },
    ];
    render(<ThroughputBucketsComponent {...defaultProps} currentBuckets={unorderedBuckets} />);

    const bucketLabels = screen.getAllByText(/Bucket \d+/).map((el) => el.textContent);
    expect(bucketLabels).toEqual([
      "Bucket 1 (Data Explorer Query Bucket)",
      "Bucket 2",
      "Bucket 3",
      "Bucket 4",
      "Bucket 5",
    ]);
  });

  it("renders all provided buckets even if they exceed the max default bucket count", () => {
    const oversizedBuckets = [
      { id: 1, maxThroughputPercentage: 50 },
      { id: 2, maxThroughputPercentage: 60 },
      { id: 3, maxThroughputPercentage: 70 },
      { id: 4, maxThroughputPercentage: 80 },
      { id: 5, maxThroughputPercentage: 90 },
      { id: 6, maxThroughputPercentage: 100 },
      { id: 7, maxThroughputPercentage: 40 },
    ];

    render(<ThroughputBucketsComponent {...defaultProps} currentBuckets={oversizedBuckets} />);

    expect(screen.getAllByText(/Bucket \d+/)).toHaveLength(7);

    expect(screen.getByDisplayValue("50")).toBeInTheDocument();
    expect(screen.getByDisplayValue("60")).toBeInTheDocument();
    expect(screen.getByDisplayValue("70")).toBeInTheDocument();
    expect(screen.getByDisplayValue("80")).toBeInTheDocument();
    expect(screen.getByDisplayValue("90")).toBeInTheDocument();
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    expect(screen.getByDisplayValue("40")).toBeInTheDocument();
  });

  it("calls onBucketsChange when a bucket value changes", () => {
    render(<ThroughputBucketsComponent {...defaultProps} />);
    const input = screen.getByDisplayValue("50");
    fireEvent.change(input, { target: { value: "70" } });

    expect(mockOnBucketsChange).toHaveBeenCalledWith([
      { id: 1, maxThroughputPercentage: 70, isDefaultBucket: false },
      { id: 2, maxThroughputPercentage: 60, isDefaultBucket: false },
      { id: 3, maxThroughputPercentage: 100, isDefaultBucket: false },
      { id: 4, maxThroughputPercentage: 100, isDefaultBucket: false },
      { id: 5, maxThroughputPercentage: 100, isDefaultBucket: false },
    ]);
  });

  it("triggers onSaveableChange when values change", () => {
    render(<ThroughputBucketsComponent {...defaultProps} />);
    const input = screen.getByDisplayValue("50");
    fireEvent.change(input, { target: { value: "80" } });

    expect(mockOnSaveableChange).toHaveBeenCalledWith(true);
  });

  it("updates state consistently after multiple changes to different buckets", () => {
    render(<ThroughputBucketsComponent {...defaultProps} />);

    const input1 = screen.getByDisplayValue("50");
    fireEvent.change(input1, { target: { value: "70" } });

    const input2 = screen.getByDisplayValue("60");
    fireEvent.change(input2, { target: { value: "80" } });

    expect(mockOnBucketsChange).toHaveBeenCalledWith([
      { id: 1, maxThroughputPercentage: 70, isDefaultBucket: false },
      { id: 2, maxThroughputPercentage: 80, isDefaultBucket: false },
      { id: 3, maxThroughputPercentage: 100, isDefaultBucket: false },
      { id: 4, maxThroughputPercentage: 100, isDefaultBucket: false },
      { id: 5, maxThroughputPercentage: 100, isDefaultBucket: false },
    ]);
  });

  it("resets to baseline when currentBuckets are reset", () => {
    const { rerender } = render(<ThroughputBucketsComponent {...defaultProps} />);
    const input1 = screen.getByDisplayValue("50");
    fireEvent.change(input1, { target: { value: "70" } });

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

  it("disables input and slider when maxThroughputPercentage is 100", () => {
    render(
      <ThroughputBucketsComponent
        {...defaultProps}
        currentBuckets={[
          { id: 1, maxThroughputPercentage: 100, isDefaultBucket: false },
          { id: 2, maxThroughputPercentage: 50, isDefaultBucket: false },
        ]}
      />,
    );

    const disabledInputs = screen.getAllByDisplayValue("100");
    expect(disabledInputs.length).toBeGreaterThan(0);
    expect(disabledInputs[0]).toBeDisabled();

    const sliders = screen.getAllByRole("slider");
    expect(sliders.length).toBeGreaterThan(0);
    expect(sliders[0]).toHaveAttribute("aria-disabled", "true");
    expect(sliders[1]).toHaveAttribute("aria-disabled", "false");
  });

  it("toggles bucket value between 50 and 100 with switch", () => {
    render(<ThroughputBucketsComponent {...defaultProps} />);
    const toggles = screen.getAllByRole("switch");

    fireEvent.click(toggles[0]);

    expect(mockOnBucketsChange).toHaveBeenCalledWith([
      { id: 1, maxThroughputPercentage: 100, isDefaultBucket: false },
      { id: 2, maxThroughputPercentage: 60, isDefaultBucket: false },
      { id: 3, maxThroughputPercentage: 100, isDefaultBucket: false },
      { id: 4, maxThroughputPercentage: 100, isDefaultBucket: false },
      { id: 5, maxThroughputPercentage: 100, isDefaultBucket: false },
    ]);

    fireEvent.click(toggles[0]);

    expect(mockOnBucketsChange).toHaveBeenCalledWith([
      { id: 1, maxThroughputPercentage: 50, isDefaultBucket: false },
      { id: 2, maxThroughputPercentage: 60, isDefaultBucket: false },
      { id: 3, maxThroughputPercentage: 100, isDefaultBucket: false },
      { id: 4, maxThroughputPercentage: 100, isDefaultBucket: false },
      { id: 5, maxThroughputPercentage: 100, isDefaultBucket: false },
    ]);
  });

  it("ensures default buckets are used when no buckets are provided", () => {
    render(<ThroughputBucketsComponent {...defaultProps} currentBuckets={[]} />);
    expect(screen.getAllByText(/Bucket \d+/)).toHaveLength(5);
    expect(screen.getAllByDisplayValue("100")).toHaveLength(5);
  });
});
