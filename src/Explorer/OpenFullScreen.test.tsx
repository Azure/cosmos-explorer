import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { OpenFullScreen } from "./OpenFullScreen";

it("renders the correct URLs", () => {
  render(<OpenFullScreen />);
  expect(screen.getByText("Open")).toBeDefined();
});
