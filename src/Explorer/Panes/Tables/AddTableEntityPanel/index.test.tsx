import { mount } from "enzyme";
import React from "react";
import Explorer from "../../../Explorer";
import QueryTablesTab from "../../../Tabs/QueryTablesTab";
import { AddTableEntityPanel } from "./index";

describe("Excute Add Table Entity Pane", () => {
  const fakeExplorer = {} as Explorer;
  const fakeQueryTablesTab = {} as QueryTablesTab;
  const props = {
    explorer: fakeExplorer,
    closePanel: (): void => undefined,
    queryTablesTab: fakeQueryTablesTab
  };

  it("should render Default properly", () => {
    const wrapper = mount(<AddTableEntityPanel {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("initially display 4 input field, 2 properties and 1 entity values", () => {
    const wrapper = mount(<AddTableEntityPanel {...props} />);
    expect(wrapper.find("input[type='text']")).toHaveLength(4);
  });


  it("add a new entity row", () => {
    const wrapper = mount(<AddTableEntityPanel {...props} />);
    wrapper.find(".addButtonEntiy").last().simulate("click");
    expect(wrapper.find("input[type='text']")).toHaveLength(6);
  });

  it("remove a entity field", () => {
    const wrapper = mount(<AddTableEntityPanel {...props} />);
    // Since default entity row doesn't have delete option, so added row then delete for test cases.
    wrapper.find(".addButtonEntiy").last().simulate("click");
    wrapper.find("#deleteEntity").last().simulate("click");
    expect(wrapper.find("input[type='text']")).toHaveLength(4);
  });
});
