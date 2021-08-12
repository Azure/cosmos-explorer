import { mount } from "enzyme";
import * as ko from "knockout";
import React from "react";
import TableListViewModal from "../../Tables/DataTable/TableEntityListViewModel";
import * as Entities from "../../Tables/Entities";
import { CassandraAPIDataClient, TablesAPIDataClient } from "../../Tables/TableDataClient";
import QueryTablesTab from "../../Tabs/QueryTablesTab/QueryTablesTab";
import { AddTableEntityPanel } from "./AddTableEntityPanel";

describe("Excute Add Table Entity Pane", () => {
  const fakeQueryTablesTab = {} as QueryTablesTab;
  const fakeTableEntityListViewModel = {} as TableListViewModal;
  const fakeCassandraApiClient = {} as CassandraAPIDataClient;
  fakeTableEntityListViewModel.items = ko.observableArray<Entities.ITableEntity>();
  fakeTableEntityListViewModel.headers = [];
  const props = {
    tableDataClient: new TablesAPIDataClient(),
    queryTablesTab: fakeQueryTablesTab,
    tableEntityListViewModel: fakeTableEntityListViewModel,
    cassandraApiClient: fakeCassandraApiClient,
    reloadEntities: () => "{}",
    headerItems: ["email"],
  };

  it("should render Default properly", () => {
    const wrapper = mount(<AddTableEntityPanel {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("initially display 4 input field, 2 properties and 2 entity values", () => {
    const wrapper = mount(<AddTableEntityPanel {...props} />);
    expect(wrapper.find("input[type='text']")).toHaveLength(1);
  });

  it("add a new entity row", () => {
    const wrapper = mount(<AddTableEntityPanel {...props} />);
    wrapper.find(".addButtonEntiy").last().simulate("click");
    expect(wrapper.find("input[type='text']")).toHaveLength(2);
  });

  it("remove a entity field", () => {
    const wrapper = mount(<AddTableEntityPanel {...props} />);
    // Since default entity row doesn't have delete option, so added row then delete for test cases.
    wrapper.find(".addButtonEntiy").last().simulate("click");
    wrapper.find("#deleteEntity").last().simulate("click");
    expect(wrapper.find("input[type='text']")).toHaveLength(1);
  });
});
