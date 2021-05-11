import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import Explorer from "../../Explorer";
import { CassandraAPIDataClient } from "../../Tables/TableDataClient";
import { CassandraAddCollectionPaneF } from "./CassandraAddCollectionPaneF";
const props = {
  explorer: new Explorer(),
  closePanel: (): void => undefined,
  cassandraApiClient: new CassandraAPIDataClient(),
};

describe("CassandraAddCollectionPane  Pane", () => {
  beforeEach(() => render(<CassandraAddCollectionPaneF {...props} />));

  // it("should render Default properly", () => {
  //   const wrapper = shallow(<CassandraAddCollectionPaneF {...props} />);
  //   expect(wrapper).toMatchSnapshot();
  // });
  it("click on is Create new keyspace", () => {
    fireEvent.click(screen.getByLabelText("Create new keyspace"));
    expect(screen.getByLabelText("Provision keyspace throughput")).toBeDefined();
  });
  it("click on Use existing", () => {
    fireEvent.click(screen.getByLabelText("Use existing keyspace"));
  });
  it("click on Provision keyspace throughput ", () => {
    fireEvent.click(screen.getByLabelText("Provision keyspace throughput"));
    // expect(screen.getByLabelText("Table throughput")).toBeDefined();
  });

  it("Enter Keyspace name ", () => {
    fireEvent.change(screen.getByLabelText("Keyspace id"), { target: { value: "unittest1" } });
    expect(screen.getByLabelText("CREATE TABLE unittest1.")).toBeDefined();
  });
});
