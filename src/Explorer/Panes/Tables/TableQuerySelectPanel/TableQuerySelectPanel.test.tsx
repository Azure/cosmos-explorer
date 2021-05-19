import { mount } from "enzyme";
import * as ko from "knockout";
import React from "react";
import Explorer from "../../../Explorer";
import QueryViewModel from "../../../Tables/QueryBuilder/QueryViewModel";
import { TableQuerySelectPanel } from "./TableQuerySelectPanel";

describe("Table query select Panel", () => {
  const fakeExplorer = {} as Explorer;
  const fakeQueryViewModal = {} as QueryViewModel;
  fakeQueryViewModal.columnOptions = ko.observableArray<string>([""]);

  const props = {
    explorer: fakeExplorer,
    closePanel: (): void => undefined,
    queryViewModel: fakeQueryViewModal,
  };

  it("should render Default properly", () => {
    const wrapper = mount(<TableQuerySelectPanel {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("Should exist availableCheckbox by default", () => {
    const wrapper = mount(<TableQuerySelectPanel {...props} />);
    expect(wrapper.exists("#availableCheckbox")).toBe(true);
  });

  it("Should checked availableCheckbox by default", () => {
    const wrapper = mount(<TableQuerySelectPanel {...props} />);
    expect(wrapper.find("#availableCheckbox").first().props()).toEqual({
      id: "availableCheckbox",
      label: "Available Columns",
      checked: true,
      onChange: expect.any(Function),
    });
  });
});
