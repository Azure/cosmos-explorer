import { shallow } from "enzyme";
import React from "react";
import Explorer from "../../Explorer";
import { CassandraAddCollectionPaneF } from "./CassandraAddCollectionPaneF";
const props = {
  explorer: new Explorer(),
  closePanel: (): void => undefined,
};
describe("CassandraAddCollectionPane  Pane", () => {
  it("should render Default properly", () => {
    const wrapper = shallow(<CassandraAddCollectionPaneF {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
