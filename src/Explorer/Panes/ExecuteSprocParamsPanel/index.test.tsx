import { mount } from "enzyme";
import React from "react";
import Explorer from "../../Explorer";
import StoredProcedure from "../../Tree/StoredProcedure";
import { ExecuteSprocParamsPanel } from "./index";

describe("Excute Sproc Param Pane", () => {
  const fakeExplorer = {} as Explorer;
  const fakeSproc = {} as StoredProcedure;
  const props = {
    explorer: fakeExplorer,
    storedProcedure: fakeSproc,
    closePanel: (): void => undefined,
  };

  it("should render Default properly", () => {
    const wrapper = mount(<ExecuteSprocParamsPanel {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("initially display 2 input field, 1 partition and 1 parameter", () => {
    const wrapper = mount(<ExecuteSprocParamsPanel {...props} />);
    expect(wrapper.find("input[type='text']")).toHaveLength(2);
  });

  it("add a new parameter field", () => {
    const wrapper = mount(<ExecuteSprocParamsPanel {...props} />);
    wrapper.find("#addparam").last().simulate("click");
    expect(wrapper.find("input[type='text']")).toHaveLength(3);
  });

  it("remove a parameter field", () => {
    const wrapper = mount(<ExecuteSprocParamsPanel {...props} />);
    wrapper.find("#deleteparam").last().simulate("click");
    expect(wrapper.find("input[type='text']")).toHaveLength(1);
  });
});
