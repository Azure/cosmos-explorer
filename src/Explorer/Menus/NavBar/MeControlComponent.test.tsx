import React from "react";
import { shallow, mount } from "enzyme";
import { MeControlComponent, MeControlComponentProps } from "./MeControlComponent";

const createNotSignedInProps = (): MeControlComponentProps => {
  return {
    isUserSignedIn: false,
    user: null,
    onSignInClick: jest.fn(),
    onSignOutClick: jest.fn(),
    onSwitchDirectoryClick: jest.fn(),
  };
};

const createSignedInProps = (): MeControlComponentProps => {
  return {
    isUserSignedIn: true,
    user: {
      name: "Test User",
      email: "testuser@contoso.com",
      tenantName: "Contoso",
      imageUrl: "../../../../images/dotnet.png",
    },
    onSignInClick: jest.fn(),
    onSignOutClick: jest.fn(),
    onSwitchDirectoryClick: jest.fn(),
  };
};

describe("test render", () => {
  it("renders not signed in", () => {
    const props = createNotSignedInProps();

    const wrapper = shallow(<MeControlComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders signed in with full info", () => {
    const props = createSignedInProps();

    const wrapper = shallow(<MeControlComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("change not signed in to signed in", () => {
    const notSignInProps = createNotSignedInProps();

    const wrapper = mount(<MeControlComponent {...notSignInProps} />);
    expect(wrapper.exists(".mecontrolSigninButton")).toBe(true);
    expect(wrapper.exists(".mecontrolHeaderButton")).toBe(false);

    const signInProps = createSignedInProps();

    wrapper.setProps(signInProps);
    expect(wrapper.exists(".mecontrolSigninButton")).toBe(false);
    expect(wrapper.exists(".mecontrolHeaderButton")).toBe(true);

    wrapper.unmount;
  });

  it("render contextual menu", () => {
    const signInProps = createSignedInProps();
    const wrapper = mount(<MeControlComponent {...signInProps} />);

    wrapper.find("button.mecontrolHeaderButton").simulate("click");
    expect(wrapper.exists(".mecontrolContextualMenu")).toBe(true);

    wrapper.find("button.mecontrolHeaderButton").simulate("click");
    expect(wrapper.exists(".mecontrolContextualMenu")).toBe(false);

    wrapper.unmount;
  });
});

describe("test function got called", () => {
  it("sign in click", () => {
    const notSignInProps = createNotSignedInProps();
    const wrapper = mount(<MeControlComponent {...notSignInProps} />);

    wrapper.find("button.mecontrolSigninButton").simulate("click");
    expect(notSignInProps.onSignInClick).toBeCalled();
    expect(notSignInProps.onSignInClick).toHaveBeenCalled();
  });

  it("sign out click", () => {
    const signInProps = createSignedInProps();
    const wrapper = mount(<MeControlComponent {...signInProps} />);

    wrapper.find("button.mecontrolHeaderButton").simulate("click");
    expect(wrapper.exists(".mecontrolContextualMenu")).toBe(true);

    wrapper.find("div.signOutLink").simulate("click");
    expect(signInProps.onSignOutClick).toBeCalled();
    expect(signInProps.onSignOutClick).toHaveBeenCalled();
  });

  it("switch directory", () => {
    const signInProps = createSignedInProps();
    const wrapper = mount(<MeControlComponent {...signInProps} />);

    wrapper.find("button.mecontrolHeaderButton").simulate("click");
    expect(wrapper.exists(".mecontrolContextualMenu")).toBe(true);

    wrapper.find("div.switchDirectoryLink").simulate("click");
    expect(signInProps.onSwitchDirectoryClick).toBeCalled();
    expect(signInProps.onSwitchDirectoryClick).toHaveBeenCalled();
  });
});
