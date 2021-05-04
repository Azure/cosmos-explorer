import { shallow } from "enzyme";
import React from "react";
import { GitHubClient } from "../../../GitHub/GitHubClient";
import { JunoClient } from "../../../Juno/JunoClient";
import Explorer from "../../Explorer";
import { GitHubReposPanel } from "./GitHubReposPanel";
const props = {
  explorer: new Explorer(),
  closePanel: (): void => undefined,
  gitHubClientProp: new GitHubClient((): void => undefined),
  junoClientProp: new JunoClient(),
  openNotificationConsole: (): void => undefined,
};
describe("GitHub Repos Panel", () => {
  it("should render Default properly", () => {
    const wrapper = shallow(<GitHubReposPanel {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
