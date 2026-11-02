jest.mock("../../../Common/dataAccess/createDatabase");
jest.mock("../../../Shared/Telemetry/TelemetryProcessor");
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { updateUserContext } from "../../../UserContext";
import Explorer from "../../Explorer";
import { AddDatabasePanel } from "./AddDatabasePanel";

describe("AddDatabasePanel", () => {
  const props = {
    explorer: new Explorer(),
  };

  afterEach(() => {
    updateUserContext({ apiType: "SQL" });
  });

  it("programmatically associates the visible 'Database id' label with the input", () => {
    updateUserContext({ apiType: "SQL" });
    render(<AddDatabasePanel {...props} />);

    // getByRole resolves the accessible name via aria-labelledby, which must
    // point at the visible "Database id" label (regression guard for bug 4768133).
    expect(screen.getByRole("textbox", { name: "Database id" })).toBeInTheDocument();
  });

  it("uses 'Keyspace id' as the accessible name for Cassandra accounts", () => {
    updateUserContext({ apiType: "Cassandra" });
    render(<AddDatabasePanel {...props} />);

    expect(screen.getByRole("textbox", { name: "Keyspace id" })).toBeInTheDocument();
  });
});
