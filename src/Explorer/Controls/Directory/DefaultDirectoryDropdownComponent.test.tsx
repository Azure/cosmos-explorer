import React from "react";
import { shallow, mount } from "enzyme";
import { DefaultDirectoryDropdownComponent, DefaultDirectoryDropdownProps } from "./DefaultDirectoryDropdownComponent";
import { Tenant } from "../../../Contracts/DataModels";

const createBlankProps = (): DefaultDirectoryDropdownProps => {
  return {
    defaultDirectoryId: "",
    directories: [],
    onDefaultDirectoryChange: jest.fn()
  };
};

const createBlankDirectory = (): Tenant => {
  return {
    countryCode: "",
    displayName: "",
    domains: [],
    id: "",
    tenantId: ""
  };
};

describe("test render", () => {
  it("renders with no directories", () => {
    const props = createBlankProps();

    const wrapper = shallow(<DefaultDirectoryDropdownComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders with directories but no default", () => {
    const props = createBlankProps();
    const tenant1 = createBlankDirectory();
    tenant1.displayName = "Microsoft";
    tenant1.tenantId = "asdfghjklzxcvbnm1234567890";
    const tenant2 = createBlankDirectory();
    tenant1.displayName = "Macrohard";
    tenant1.tenantId = "asdfghjklzxcvbnm9876543210";
    props.directories = [tenant1, tenant2];

    const wrapper = shallow(<DefaultDirectoryDropdownComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders with directories and default", () => {
    const props = createBlankProps();
    const tenant1 = createBlankDirectory();
    tenant1.displayName = "Microsoft";
    tenant1.tenantId = "asdfghjklzxcvbnm1234567890";
    const tenant2 = createBlankDirectory();
    tenant1.displayName = "Macrohard";
    tenant1.tenantId = "asdfghjklzxcvbnm9876543210";
    props.directories = [tenant1, tenant2];

    props.defaultDirectoryId = "asdfghjklzxcvbnm9876543210";

    const wrapper = shallow(<DefaultDirectoryDropdownComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders with directories and last visit default", () => {
    const props = createBlankProps();
    const tenant1 = createBlankDirectory();
    tenant1.displayName = "Microsoft";
    tenant1.tenantId = "asdfghjklzxcvbnm1234567890";
    const tenant2 = createBlankDirectory();
    tenant1.displayName = "Macrohard";
    tenant1.tenantId = "asdfghjklzxcvbnm9876543210";
    props.directories = [tenant1, tenant2];

    props.defaultDirectoryId = "lastVisited";

    const wrapper = shallow(<DefaultDirectoryDropdownComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});

describe("test function", () => {
  it("on default directory change", () => {
    const props = createBlankProps();
    const tenant1 = createBlankDirectory();
    tenant1.displayName = "Microsoft";
    tenant1.tenantId = "asdfghjklzxcvbnm1234567890";
    const tenant2 = createBlankDirectory();
    tenant1.displayName = "Macrohard";
    tenant1.tenantId = "asdfghjklzxcvbnm9876543210";
    props.directories = [tenant1, tenant2];
    props.defaultDirectoryId = "lastVisited";

    const wrapper = mount(<DefaultDirectoryDropdownComponent {...props} />);

    wrapper
      .find("div.defaultDirectoryDropdown")
      .find("div.ms-Dropdown")
      .simulate("click");
    expect(wrapper.exists("div.ms-Callout-main")).toBe(true);
    wrapper
      .find("button.ms-Dropdown-item")
      .at(1)
      .simulate("click");
    expect(props.onDefaultDirectoryChange).toBeCalled();
    expect(props.onDefaultDirectoryChange).toHaveBeenCalled();

    wrapper
      .find("div.defaultDirectoryDropdown")
      .find("div.ms-Dropdown")
      .simulate("click");
    expect(wrapper.exists("div.ms-Callout-main")).toBe(true);
    wrapper
      .find("button.ms-Dropdown-item")
      .at(0)
      .simulate("click");
    expect(props.onDefaultDirectoryChange).toBeCalled();
    expect(props.onDefaultDirectoryChange).toHaveBeenCalled();
  });
});
