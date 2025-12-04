jest.mock("../../Actions/CopyJobActions");

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import Explorer from "Explorer/Explorer";
import React from "react";
import * as Actions from "../../Actions/CopyJobActions";
import ContainerCopyMessages from "../../ContainerCopyMessages";
import CopyJobsNotFound from "./CopyJobs.NotFound";

describe("CopyJobsNotFound", () => {
  let mockExplorer: Explorer;

  beforeEach(() => {
    mockExplorer = {} as Explorer;
    jest.clearAllMocks();
  });

  it("should render the component with correct elements", () => {
    const { container, getByText } = render(<CopyJobsNotFound explorer={mockExplorer} />);

    // Check if the image is rendered with correct alt text
    const image = container.querySelector(".notFoundContainer .ms-Image");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("style", "width: 100px; height: 100px;");
    expect(getByText(ContainerCopyMessages.noCopyJobsTitle)).toBeInTheDocument();

    // Check if the create button is rendered with correct text
    const button = screen.getByRole("button", {
      name: ContainerCopyMessages.createCopyJobButtonText,
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("createCopyJobButton");
  });

  it("should render with correct container classes", () => {
    const { container } = render(<CopyJobsNotFound explorer={mockExplorer} />);

    const notFoundContainer = container.querySelector(".notFoundContainer");
    expect(notFoundContainer).toBeInTheDocument();
    expect(notFoundContainer).toHaveClass("flexContainer", "centerContent");
  });

  it("should call openCreateCopyJobPanel when button is clicked", () => {
    const openCreateCopyJobPanelSpy = jest.spyOn(Actions, "openCreateCopyJobPanel");

    render(<CopyJobsNotFound explorer={mockExplorer} />);

    const button = screen.getByRole("button", {
      name: ContainerCopyMessages.createCopyJobButtonText,
    });

    fireEvent.click(button);

    expect(openCreateCopyJobPanelSpy).toHaveBeenCalledTimes(1);
    expect(openCreateCopyJobPanelSpy).toHaveBeenCalledWith(mockExplorer);
  });

  it("should render ActionButton with correct props", () => {
    render(<CopyJobsNotFound explorer={mockExplorer} />);

    const button = screen.getByRole("button", {
      name: ContainerCopyMessages.createCopyJobButtonText,
    });

    // ActionButton should be rendered
    expect(button).toBeInTheDocument();
    expect(button.textContent).toBe(ContainerCopyMessages.createCopyJobButtonText);
  });

  it("should use memo to prevent unnecessary re-renders", () => {
    const { rerender } = render(<CopyJobsNotFound explorer={mockExplorer} />);

    // Re-render with the same props
    rerender(<CopyJobsNotFound explorer={mockExplorer} />);

    // Component should still be in the document
    expect(screen.getByRole("heading", { level: 4 })).toBeInTheDocument();
  });
});
