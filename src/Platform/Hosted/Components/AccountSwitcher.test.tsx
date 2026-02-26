jest.mock("../../../hooks/useSubscriptions");
jest.mock("../../../hooks/useDatabaseAccounts");
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { DatabaseAccount, Subscription } from "../../../Contracts/DataModels";
import { useDatabaseAccounts } from "../../../hooks/useDatabaseAccounts";
import { useSubscriptions } from "../../../hooks/useSubscriptions";
import { AccountSwitcher } from "./AccountSwitcher";

it("calls setAccount from parent component", () => {
  const armToken = "fakeToken";
  const setDatabaseAccount = jest.fn();
  const subscriptions = [
    { subscriptionId: "testSub1", displayName: "Test Sub 1" },
    { subscriptionId: "testSub2", displayName: "Test Sub 2" },
  ] as Subscription[];
  (useSubscriptions as jest.Mock).mockReturnValue(subscriptions);
  const accounts = [{ name: "testAccount1" }, { name: "testAccount2" }] as DatabaseAccount[];
  (useDatabaseAccounts as jest.Mock).mockReturnValue(accounts);

  render(<AccountSwitcher armToken={armToken} setDatabaseAccount={setDatabaseAccount} />);

  fireEvent.click(screen.getByText("Select a Database Account"));
  expect(screen.getByLabelText("Subscription")).toHaveTextContent("Select a Subscription");
  fireEvent.click(screen.getByText("Select a Subscription"));
  fireEvent.click(screen.getByText(subscriptions[0].displayName));
  expect(screen.getByLabelText("Cosmos DB Account")).toHaveTextContent("Select an Account");
  fireEvent.click(screen.getByText("Select an Account"));
  fireEvent.click(screen.getByText(accounts[0].name));
  expect(setDatabaseAccount).toHaveBeenCalledWith(accounts[0]);
});

it("No subscriptions", () => {
  const armToken = "fakeToken";
  const setDatabaseAccount = jest.fn();
  const subscriptions = [] as Subscription[];
  (useSubscriptions as jest.Mock).mockReturnValue(subscriptions);
  const accounts = [] as DatabaseAccount[];
  (useDatabaseAccounts as jest.Mock).mockReturnValue(accounts);

  render(<AccountSwitcher armToken={armToken} setDatabaseAccount={setDatabaseAccount} />);

  fireEvent.click(screen.getByText("Select a Database Account"));
  expect(screen.getByLabelText("Subscription")).toHaveTextContent("No Subscriptions Found");
});
