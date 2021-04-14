import { mount } from "enzyme";
import { PrimaryButton } from "office-ui-fabric-react";
import React from "react";
import Explorer from "../../Explorer";
import { SetupNoteBooksPanel } from "./SetupNotebooksPanel";

describe("Setup Notebooks Panel", () => {
  it("should render Default properly", () => {
    const fakeExplorer = {} as Explorer;
    const props = {
      explorer: fakeExplorer,
      closePanel: (): void => undefined,
      panelTitle: "",
      panelDescription: "",
    };
    const wrapper = mount(<SetupNoteBooksPanel {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("should render button", () => {
    const fakeExplorer = {} as Explorer;
    const props = {
      explorer: fakeExplorer,
      closePanel: (): void => undefined,
      panelTitle: "",
      panelDescription: "",
    };
    const wrapper = mount(<SetupNoteBooksPanel {...props} />);
    const button = wrapper.find("PrimaryButton").first();
    expect(button).toBeDefined();
  });

  it("Button onClick should call onCompleteSetup", () => {
    const onCompleteSetupClick = jest.fn();
    const wrapper = mount(<PrimaryButton onClick={onCompleteSetupClick} />);
    wrapper.find("button").simulate("click");

    expect(onCompleteSetupClick).toHaveBeenCalled();
  });

  it("Button onKeyPress should call onCompleteSetupKeyPress", () => {
    const onCompleteSetupKeyPress = jest.fn();
    const wrapper = mount(<PrimaryButton onKeyPress={onCompleteSetupKeyPress} />);
    wrapper.find("button").simulate("keypress");

    expect(onCompleteSetupKeyPress).toHaveBeenCalled();
  });
});
