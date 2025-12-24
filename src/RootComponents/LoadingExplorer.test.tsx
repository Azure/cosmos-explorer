import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import LoadingExplorer from "./LoadingExplorer";

jest.mock("../../images/HdeConnectCosmosDB.svg", () => "test-hde-connect-image.svg");

jest.mock("@fluentui/react-components", () => ({
  makeStyles: jest.fn(() => () => ({
    root: "mock-root-class",
  })),
}));

describe("LoadingExplorer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should render loading explorer component", () => {
    render(<LoadingExplorer />);

    const container = screen.getByRole("alert");
    expect(container).toBeInTheDocument();
    expect(container).toHaveTextContent("Connecting...");
  });

  test("should display welcome title", () => {
    render(<LoadingExplorer />);

    const title = screen.getByText("Welcome to Azure Cosmos DB");
    expect(title).toBeInTheDocument();
    expect(title).toHaveAttribute("id", "explorerLoadingStatusTitle");
  });

  test("should display connecting status text", () => {
    render(<LoadingExplorer />);

    const statusText = screen.getByText("Connecting...");
    expect(statusText).toBeInTheDocument();
    expect(statusText).toHaveAttribute("id", "explorerLoadingStatusText");
    expect(statusText).toHaveAttribute("role", "alert");
  });

  test("should render Azure Cosmos DB image", () => {
    render(<LoadingExplorer />);

    const image = screen.getByAltText("Azure Cosmos DB");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "test-hde-connect-image.svg");
  });

  test("should have correct class structure", () => {
    render(<LoadingExplorer />);

    const splashContainer = document.querySelector(".splashLoaderContainer");
    expect(splashContainer).toBeInTheDocument();

    const contentContainer = document.querySelector(".splashLoaderContentContainer");
    expect(contentContainer).toBeInTheDocument();

    const connectContent = document.querySelector(".connectExplorerContent");
    expect(connectContent).toBeInTheDocument();
  });

  test("should apply CSS classes correctly", () => {
    const { container } = render(<LoadingExplorer />);

    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv).toHaveClass("mock-root-class");
  });
});
