import { mount } from "enzyme";
import * as ko from "knockout";
import React from "react";
import TableListViewModal from "../../Tables/DataTable/TableEntityListViewModel";
import * as Entities from "../../Tables/Entities";
import { CassandraAPIDataClient, TablesAPIDataClient } from "../../Tables/TableDataClient";
import QueryTablesTab from "../../Tabs/QueryTablesTab/QueryTablesTab";
import { EditTableEntityPanel } from "./EditTableEntityPanel";

describe("Excute Edit Table Entity Pane", () => {
  const fakeQueryTablesTab = {} as QueryTablesTab;
  const fakeTableEntityListViewModel = {} as TableListViewModal;
  fakeTableEntityListViewModel.items = ko.observableArray<Entities.ITableEntity>();
  const fakeCassandraApiClient = {} as CassandraAPIDataClient;
  fakeTableEntityListViewModel.headers = [];
  fakeTableEntityListViewModel.selected = ko.observableArray<Entities.ITableEntity>([{}]);

  const fakeSelectedItem = [{ PartitionKey: { _: "test", $: "String" } }];
  const props = {
    tableDataClient: new TablesAPIDataClient(),
    queryTablesTab: fakeQueryTablesTab,
    tableEntityListViewModel: fakeTableEntityListViewModel,
    cassandraApiClient: fakeCassandraApiClient,
    selectedEntity: fakeSelectedItem,
    reloadEntities: () => "{}",
  };

  it("should render Default properly", () => {
    const wrapper = mount(<EditTableEntityPanel {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("initially display 4 input field, 2 properties and 1 entity values", () => {
    const wrapper = mount(<EditTableEntityPanel {...props} />);
    expect(wrapper.find("input[type='text']")).toHaveLength(1);
  });

  it("add a new entity row", () => {
    const wrapper = mount(<EditTableEntityPanel {...props} />);
    wrapper.find(".addButtonEntiy").last().simulate("click");
    expect(wrapper.find("input[type='text']")).toHaveLength(2);
  });

  it("remove a entity field", () => {
    const wrapper = mount(<EditTableEntityPanel {...props} />);
    // Since default entity row doesn't have delete option, so added row then delete for test cases.
    wrapper.find(".addButtonEntiy").last().simulate("click");
    wrapper.find("#deleteEntity").last().simulate("click");
    expect(wrapper.find("input[type='text']")).toHaveLength(1);
  });
});
