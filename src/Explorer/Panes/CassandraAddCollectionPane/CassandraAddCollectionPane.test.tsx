import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import Explorer from "../../Explorer";
import { CassandraAPIDataClient } from "../../Tables/TableDataClient";
import { CassandraAddCollectionPane } from "./CassandraAddCollectionPane";

describe("Cassandra add collection pane test", () => {
  const props = {
    explorer: new Explorer(),
    closePanel: (): void => undefined,
    cassandraApiClient: new CassandraAPIDataClient(),
  };

  beforeEach(() => render(<CassandraAddCollectionPane {...props} />));

  it("should render default properly", () => {
    expect(screen.getByRole("radio", { name: "Create new keyspace", checked: true })).toBeDefined();
    expect(screen.getByRole("checkbox", { name: "Provision shared throughput", checked: false })).toBeDefined();
  });

  it("click on use existing", () => {
    fireEvent.click(screen.getByRole("radio", { name: "Use existing keyspace" }));
    expect(screen.getByRole("combobox", { name: "Choose existing keyspace id" })).toBeDefined();
  });

  it("enter Keyspace name", () => {
    fireEvent.change(screen.getByRole("textbox", { name: "Keyspace id" }), { target: { value: "table1" } });
    expect(screen.getByText("CREATE TABLE table1.")).toBeDefined();
  });
});
