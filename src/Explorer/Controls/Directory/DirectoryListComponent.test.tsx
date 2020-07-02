import React from "react";
import { shallow, mount } from "enzyme";
import { DirectoryListComponent, DirectoryListProps } from "./DirectoryListComponent";
import { Tenant } from "../../../Contracts/DataModels";

const createBlankProps = (): DirectoryListProps => {
  return {
    selectedDirectoryId: undefined,
    directories: [],
    onNewDirectorySelected: jest.fn(),
  };
};

const createBlankDirectory = (): Tenant => {
  return {
    countryCode: undefined,
    displayName: undefined,
    domains: [],
    id: undefined,
    tenantId: undefined,
  };
};

describe("test render", () => {
  it("renders with no directories", () => {
    const props = createBlankProps();

    const wrapper = shallow(<DirectoryListComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders with directories and selected", () => {
    const props = createBlankProps();
    const tenant1 = createBlankDirectory();
    tenant1.displayName = "Microsoft";
    tenant1.tenantId = "asdfghjklzxcvbnm1234567890";
    const tenant2 = createBlankDirectory();
    tenant1.displayName = "Macrohard";
    tenant1.tenantId = "asdfghjklzxcvbnm9876543210";
    props.directories = [tenant1, tenant2];

    props.selectedDirectoryId = "asdfghjklzxcvbnm9876543210";

    const wrapper = shallow(<DirectoryListComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders with filters", () => {
    const props = createBlankProps();
    const tenant1 = createBlankDirectory();
    tenant1.displayName = "Microsoft";
    tenant1.tenantId = "1234567890";
    const tenant2 = createBlankDirectory();
    tenant1.displayName = "Macrohard";
    tenant1.tenantId = "9876543210";
    props.directories = [tenant1, tenant2];
    props.selectedDirectoryId = "9876543210";

    const wrapper = mount(<DirectoryListComponent {...props} />);
    wrapper.find("input.ms-TextField-field").simulate("change", { target: { value: "Macro" } });
    expect(wrapper).toMatchSnapshot();
  });
});

describe("test function", () => {
  it("on new directory selected", () => {
    const props = createBlankProps();
    const tenant1 = createBlankDirectory();
    tenant1.displayName = "Microsoft";
    tenant1.tenantId = "asdfghjklzxcvbnm1234567890";
    props.directories = [tenant1];

    const wrapper = mount(<DirectoryListComponent {...props} />);
    wrapper.find("button.directoryListButton").simulate("click");
    expect(props.onNewDirectorySelected).toBeCalled();
    expect(props.onNewDirectorySelected).toHaveBeenCalled();
  });
});
