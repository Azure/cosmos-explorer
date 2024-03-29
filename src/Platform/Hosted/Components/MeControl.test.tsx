jest.mock("../../../hooks/useDirectories");
import { AccountInfo } from "@azure/msal-browser";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { MeControl } from "./MeControl";

it("renders", () => {
  const account = {} as AccountInfo;
  const logout = jest.fn();
  const openPanel = jest.fn();

  render(<MeControl graphToken="" account={account} logout={logout} openPanel={openPanel} />);
  fireEvent.click(screen.getByRole("button"));
  expect(screen.getByText("Switch Directory")).toBeDefined();
  expect(screen.getByText("Sign Out")).toBeDefined();
});
