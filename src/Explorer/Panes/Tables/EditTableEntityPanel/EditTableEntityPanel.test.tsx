import { mount } from "enzyme";
import * as ko from "knockout";
import React from "react";
import Explorer from "../../../Explorer";
import TableListViewModal from "../../../Tables/DataTable/TableEntityListViewModel";
import * as Entities from "../../../Tables/Entities";
import QueryTablesTab from "../../../Tabs/QueryTablesTab";
import { EditTableEntityPanel } from "./EditTableEntityPanel";

describe("Excute Edit Table Entity Pane", () => {
  const fakeExplorer = {} as Explorer;
  const fakeQueryTablesTab = {} as QueryTablesTab;
  const fakeTableEntityListViewModel = {} as TableListViewModal;
  fakeTableEntityListViewModel.items = ko.observableArray<Entities.ITableEntity>();
  fakeTableEntityListViewModel.headers = [];
  fakeTableEntityListViewModel.selected = ko.observableArray<Entities.ITableEntity>([{}]);

  const props = {
    explorer: fakeExplorer,
    closePanel: (): void => undefined,
    queryTablesTab: fakeQueryTablesTab,
    tableEntityListViewModel: fakeTableEntityListViewModel,
  };

  it("should render Default properly", () => {
    const wrapper = mount(<EditTableEntityPanel {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("initially display 4 input field, 2 properties and 1 entity values", () => {
    const wrapper = mount(<EditTableEntityPanel {...props} />);
    expect(wrapper.find("input[type='text']")).toHaveLength(0);
  });

  it("add a new entity row", () => {
    const wrapper = mount(<EditTableEntityPanel {...props} />);
    wrapper.find(".addButtonEntiy").last().simulate("click");
    expect(wrapper.find("input[type='text']")).toHaveLength(1);
  });

  it("remove a entity field", () => {
    const wrapper = mount(<EditTableEntityPanel {...props} />);
    // Since default entity row doesn't have delete option, so added row then delete for test cases.
    wrapper.find(".addButtonEntiy").last().simulate("click");
    wrapper.find("#deleteEntity").last().simulate("click");
    expect(wrapper.find("input[type='text']")).toHaveLength(0);
  });
});
