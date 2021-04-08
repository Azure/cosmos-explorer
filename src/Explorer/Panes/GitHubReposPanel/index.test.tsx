import { shallow } from "enzyme";
import React from "react";
import { GitHubReposPanel } from ".";
import { GitHubClient } from "../../../GitHub/GitHubClient";
import { JunoClient } from "../../../Juno/JunoClient";
import Explorer from "../../Explorer";
const props = {
  explorer: new Explorer(),
  closePanel: (): void => undefined,
  gitHubClientProp: new GitHubClient((): void => undefined),
  junoClientProp: new JunoClient(),
  panelTitle: "",
};
describe("GitHub Repos Panel", () => {
  it("should render Default properly", () => {
    const wrapper = shallow(<GitHubReposPanel {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
