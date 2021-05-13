jest.mock("../hooks/useFullScreenURLs");
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { useFullScreenURLs } from "../hooks/useFullScreenURLs";
import { OpenFullScreen } from "./OpenFullScreen";

it("renders the correct URLs", () => {
  (useFullScreenURLs as jest.Mock).mockReturnValue({
    readWrite: "read and write url",
    read: "read only url",
  });

  render(<OpenFullScreen />);
  expect(screen.getByLabelText("Read and Write")).toHaveValue("https://cosmos.azure.com/?key=read and write url");
  expect(screen.getByLabelText("Read Only")).toHaveValue("https://cosmos.azure.com/?key=read only url");
});
