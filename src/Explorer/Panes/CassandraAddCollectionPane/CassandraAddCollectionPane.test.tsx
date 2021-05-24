import { fireEvent, render, screen } from "@testing-library/react";
import { shallow } from "enzyme";
import React from "react";
import Explorer from "../../Explorer";
import { CassandraAPIDataClient } from "../../Tables/TableDataClient";
import { CassandraAddCollectionPane } from "./CassandraAddCollectionPane";
const props = {
  explorer: new Explorer(),
  closePanel: (): void => undefined,
  cassandraApiClient: new CassandraAPIDataClient(),
};

describe("CassandraAddCollectionPane  Pane", () => {
  beforeEach(() => render(<CassandraAddCollectionPane {...props} />));

  it("should render Default properly", () => {
    const wrapper = shallow(<CassandraAddCollectionPane {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
  it("click on is Create new keyspace", () => {
    fireEvent.click(screen.getByLabelText("Create new keyspace"));
    expect(screen.getByLabelText("Provision keyspace throughput")).toBeDefined();
  });
  it("click on Use existing", () => {
    fireEvent.click(screen.getByLabelText("Use existing keyspace"));
  });

  it("Enter Keyspace name ", () => {
    fireEvent.change(screen.getByLabelText("Keyspace id"), { target: { value: "unittest1" } });
    expect(screen.getByLabelText("CREATE TABLE unittest1.")).toBeDefined();
  });
});
