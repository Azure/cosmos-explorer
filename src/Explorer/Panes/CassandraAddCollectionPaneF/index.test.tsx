import { shallow } from "enzyme";
import React from "react";
import { CassandraAddCollectionPaneF } from ".";
import Explorer from "../../Explorer";
const props = {
  explorer: new Explorer(),
  closePanel: (): void => undefined,
};
describe("CassandraAddCollectionPane  Pane", () => {
  it("should render Default properly", () => {
    const wrapper = shallow(<CassandraAddCollectionPaneF {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("should render create new and Use existing choice button", () => {});
});
