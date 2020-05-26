import React from "react";
import { shallow, mount } from "enzyme";
import { AccountSwitchComponent, AccountSwitchComponentProps } from "./AccountSwitchComponent";
import { AuthType } from "../../../AuthType";
import { DatabaseAccount, Subscription } from "../../../Contracts/DataModels";
import { AccountKind } from "../../../Common/Constants";

const createBlankProps = (): AccountSwitchComponentProps => {
  return {
    authType: null,
    displayText: "",
    accounts: [],
    selectedAccountName: null,
    isLoadingAccounts: false,
    onAccountChange: jest.fn(),
    subscriptions: [],
    selectedSubscriptionId: null,
    isLoadingSubscriptions: false,
    onSubscriptionChange: jest.fn()
  };
};

const createBlankAccount = (): DatabaseAccount => {
  return {
    id: "",
    kind: AccountKind.Default,
    name: "",
    properties: null,
    location: "",
    tags: null,
    type: ""
  };
};

const createBlankSubscription = (): Subscription => {
  return {
    subscriptionId: "",
    displayName: "",
    authorizationSource: "",
    state: "",
    subscriptionPolicies: null,
    tenantId: "",
    uniqueDisplayName: ""
  };
};

const createFullProps = (): AccountSwitchComponentProps => {
  const props = createBlankProps();
  props.authType = AuthType.AAD;
  const account1 = createBlankAccount();
  account1.name = "account1";
  const account2 = createBlankAccount();
  account2.name = "account2";
  const account3 = createBlankAccount();
  account3.name = "superlongaccountnamestringtest";
  props.accounts = [account1, account2, account3];
  props.selectedAccountName = "account2";

  const sub1 = createBlankSubscription();
  sub1.displayName = "sub1";
  sub1.subscriptionId = "a6062a74-5d53-4b20-9545-000b95f22297";
  const sub2 = createBlankSubscription();
  sub2.displayName = "subsubsubsubsubsubsub2";
  sub2.subscriptionId = "b20b3e93-0185-4326-8a9c-d44bac276b6b";
  props.subscriptions = [sub1, sub2];
  props.selectedSubscriptionId = "a6062a74-5d53-4b20-9545-000b95f22297";

  return props;
};

describe("test render", () => {
  it("renders no auth type -> handle error in code", () => {
    const props = createBlankProps();

    const wrapper = shallow(<AccountSwitchComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  // Encrypted Token
  it("renders auth security token, with selected account name", () => {
    const props = createBlankProps();
    props.authType = AuthType.EncryptedToken;
    props.selectedAccountName = "testaccount";

    const wrapper = shallow(<AccountSwitchComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  // AAD
  it("renders auth aad, with all information", () => {
    const props = createFullProps();
    const wrapper = shallow(<AccountSwitchComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders auth aad all dropdown menus", () => {
    const props = createFullProps();
    const wrapper = mount(<AccountSwitchComponent {...props} />);

    expect(wrapper.exists("div.accountSwitchContextualMenu")).toBe(false);
    wrapper.find("button.accountSwitchButton").simulate("click");
    expect(wrapper.exists("div.accountSwitchContextualMenu")).toBe(true);

    expect(wrapper.exists("div.accountSwitchSubscriptionDropdown")).toBe(true);
    wrapper.find("DropdownBase.accountSwitchSubscriptionDropdown").simulate("click");
    // Click will dismiss the first contextual menu in enzyme. Need to dig deeper to achieve below test

    // expect(wrapper.exists("div.accountSwitchSubscriptionDropdownMenu")).toBe(true);
    // expect(wrapper.find("button.ms-Dropdown-item").length).toBe(2);
    // wrapper.find("div.accountSwitchSubscriptionDropdown").simulate("click");
    // expect(wrapper.exists("div.accountSwitchSubscriptionDropdownMenu")).toBe(false);

    // expect(wrapper.exists("div.accountSwitchAccountDropdown")).toBe(true);
    // wrapper.find("div.accountSwitchAccountDropdown").simulate("click");
    // expect(wrapper.exists("div.accountSwitchAccountDropdownMenu")).toBe(true);
    // expect(wrapper.find("button.ms-Dropdown-item").length).toBe(3);
    // wrapper.find("div.accountSwitchAccountDropdown").simulate("click");
    // expect(wrapper.exists("div.accountSwitchAccountDropdownMenu")).toBe(false);

    // wrapper.find("button.accountSwitchButton").simulate("click");
    // expect(wrapper.exists("div.accountSwitchContextualMenu")).toBe(false);

    wrapper.unmount();
  });
});

// describe("test function", () => {
//   it("switch subscription function", () => {
//     const props = createFullProps();
//     const wrapper = mount(<AccountSwitchComponent {...props} />);

//     wrapper.find("button.accountSwitchButton").simulate("click");
//     wrapper.find("div.accountSwitchSubscriptionDropdown").simulate("click");
//     wrapper
//       .find("button.ms-Dropdown-item")
//       .at(1)
//       .simulate("click");
//     expect(props.onSubscriptionChange).toBeCalled();
//     expect(props.onSubscriptionChange).toHaveBeenCalled();

//     wrapper.unmount();
//   });

//   it("switch account", () => {
//     const props = createFullProps();
//     const wrapper = mount(<AccountSwitchComponent {...props} />);

//     wrapper.find("button.accountSwitchButton").simulate("click");
//     wrapper.find("div.accountSwitchAccountDropdown").simulate("click");
//     wrapper
//       .find("button.ms-Dropdown-item")
//       .at(0)
//       .simulate("click");
//     expect(props.onAccountChange).toBeCalled();
//     expect(props.onAccountChange).toHaveBeenCalled();

//     wrapper.unmount();
//   });
// });
