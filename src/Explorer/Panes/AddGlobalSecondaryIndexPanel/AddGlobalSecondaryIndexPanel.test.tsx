import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { Capability, DatabaseAccount } from "Contracts/DataModels";
import { shallow, ShallowWrapper } from "enzyme";
import Explorer from "Explorer/Explorer";
import * as AddCollectionPanelUtility from "Explorer/Panes/AddCollectionPanel/AddCollectionPanelUtility";
import {
  AddGlobalSecondaryIndexPanel,
  AddGlobalSecondaryIndexPanelProps,
} from "Explorer/Panes/AddGlobalSecondaryIndexPanel/AddGlobalSecondaryIndexPanel";
import React, { Component } from "react";
import { updateUserContext, userContext } from "UserContext";

const props: AddGlobalSecondaryIndexPanelProps = {
  explorer: new Explorer(),
};

describe("AddGlobalSecondaryIndexPanel", () => {
  it("render default panel", () => {
    const wrapper: ShallowWrapper<AddGlobalSecondaryIndexPanelProps, object, Component> = shallow(
      <AddGlobalSecondaryIndexPanel {...props} />,
    );
    expect(wrapper).toMatchSnapshot();
  });

  it("should render form", () => {
    const wrapper: ShallowWrapper<AddGlobalSecondaryIndexPanelProps, object, Component> = shallow(
      <AddGlobalSecondaryIndexPanel {...props} />,
    );
    const form = wrapper.find("form").first();
    expect(form).toBeDefined();
  });

  describe("analytical store visibility", () => {
    const originalContext = { databaseAccount: userContext.databaseAccount, apiType: userContext.apiType };
    const account: DatabaseAccount = {
      id: "account",
      name: "account",
      location: "East US",
      type: "Microsoft.DocumentDB/databaseAccounts",
      kind: "GlobalDocumentDB",
      properties: {},
    };
    const legacyCapabilities: Capability[] = [{ name: "EnableStorageAnalytics", description: "" }];

    beforeEach(() => {
      jest.spyOn(AddCollectionPanelUtility, "scrollToSection").mockImplementation(() => undefined);
    });

    afterEach(() => {
      updateUserContext(originalContext);
      jest.restoreAllMocks();
    });

    it("hides analytical store controls when Synapse Link is not enabled", () => {
      updateUserContext({ databaseAccount: { ...account, properties: { enableAnalyticalStorage: false } } });
      render(<AddGlobalSecondaryIndexPanel {...props} />);

      expect(screen.queryByRole("radio", { name: /analytical store/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Enable.*Synapse Link/i })).not.toBeInTheDocument();
    });

    it.each([
      { enableAnalyticalStorage: true, capabilities: [] },
      { enableAnalyticalStorage: false, capabilities: legacyCapabilities },
    ])("preserves analytical store controls for already-enabled accounts: %j", (properties) => {
      updateUserContext({ databaseAccount: { ...account, properties } });
      render(<AddGlobalSecondaryIndexPanel {...props} />);

      const enableRadio = screen.getByRole("radio", { name: "Enable analytical store" });
      expect(enableRadio).toBeEnabled();
      fireEvent.click(enableRadio);
      expect(enableRadio).toBeChecked();
      fireEvent.click(screen.getByRole("radio", { name: "Disable analytical store" }));
      expect(enableRadio).not.toBeChecked();
      expect(screen.queryByRole("button", { name: /Enable.*Synapse Link/i })).not.toBeInTheDocument();
    });
  });
});
