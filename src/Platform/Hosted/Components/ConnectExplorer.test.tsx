jest.mock("../../../hooks/useDirectories");
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { ConnectExplorer } from "./ConnectExplorer";

it("shows the connect form", () => {
  const connectionString = "fakeConnectionString";
  const login = jest.fn();
  const setConnectionString = jest.fn();
  const setEncryptedToken = jest.fn();
  const setAuthType = jest.fn();

  render(<ConnectExplorer {...{ login, setEncryptedToken, setAuthType, connectionString, setConnectionString }} />);
  expect(screen.queryByPlaceholderText("Please enter a connection string")).toBeNull();
  fireEvent.click(screen.getByText("Connect to your account with connection string"));
  expect(screen.queryByPlaceholderText("Please enter a connection string")).toBeDefined();
});
