import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createCollection } from "Common/dataAccess/createCollection";
import { AccountOverride, Capability, DatabaseAccount } from "Contracts/DataModels";
import { shallow } from "enzyme";
import { Keys, t } from "Localization";
import React from "react";
import { updateUserContext, userContext } from "UserContext";
import Explorer from "../../Explorer";
import { AddCollectionPanel } from "./AddCollectionPanel";
import * as AddCollectionPanelUtility from "./AddCollectionPanelUtility";

jest.mock("Common/dataAccess/createCollection", () => ({ createCollection: jest.fn() }));
jest.mock("Explorer/Controls/ThroughputInput/ThroughputInput", () => ({ ThroughputInput: () => null }));

const props = {
  explorer: new Explorer(),
};

describe("AddCollectionPanel", () => {
  it("should render Default properly", () => {
    const wrapper = shallow(<AddCollectionPanel {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  describe("targetAccountOverride prop", () => {
    it("should render with targetAccountOverride prop set", () => {
      const override = {
        subscriptionId: "override-sub",
        resourceGroup: "override-rg",
        accountName: "override-account",
        capabilities: [] as Capability[],
      };
      const wrapper = shallow(<AddCollectionPanel {...props} targetAccountOverride={override} />);
      expect(wrapper).toBeDefined();
    });
  });

  describe("externalDatabaseOptions prop", () => {
    it("should accept externalDatabaseOptions without error", () => {
      const externalOptions = [
        { key: "db1", text: "Database One" },
        { key: "db2", text: "Database Two" },
      ];
      const wrapper = shallow(<AddCollectionPanel {...props} externalDatabaseOptions={externalOptions} />);
      expect(wrapper).toBeDefined();
    });
  });

  describe("isCopyJobFlow prop", () => {
    it("should render with isCopyJobFlow=true", () => {
      const wrapper = shallow(<AddCollectionPanel {...props} isCopyJobFlow={true} />);
      expect(wrapper).toBeDefined();
    });

    it("should render with isCopyJobFlow=false (default behaviour)", () => {
      const wrapper = shallow(<AddCollectionPanel {...props} isCopyJobFlow={false} />);
      expect(wrapper).toBeDefined();
    });
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

    afterEach(() => updateUserContext(originalContext));

    it("hides analytical store controls when Synapse Link is not enabled", () => {
      updateUserContext({ databaseAccount: { ...account, properties: { enableAnalyticalStorage: false } } });
      render(<AddCollectionPanel {...props} />);

      expect(screen.queryByRole("radio", { name: /analytical store/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Enable.*Synapse Link/i })).not.toBeInTheDocument();
    });

    it.each([
      { enableAnalyticalStorage: true, capabilities: [] },
      { enableAnalyticalStorage: false, capabilities: legacyCapabilities },
    ])("preserves analytical store controls for already-enabled accounts: %j", (properties) => {
      updateUserContext({ databaseAccount: { ...account, properties } });
      render(<AddCollectionPanel {...props} />);

      const enableRadio = screen.getByRole("radio", { name: t(Keys.panes.addCollection.enableAnalyticalStore) });
      expect(enableRadio).toBeEnabled();
      fireEvent.click(enableRadio);
      expect(enableRadio).toBeChecked();
      fireEvent.click(screen.getByRole("radio", { name: t(Keys.panes.addCollection.disableAnalyticalStore) }));
      expect(enableRadio).not.toBeChecked();
      expect(screen.queryByRole("button", { name: /Enable.*Synapse Link/i })).not.toBeInTheDocument();
    });

    it.each([
      { currentEnabled: true, targetEnabled: false, legacyTarget: false, visible: false },
      { currentEnabled: false, targetEnabled: true, legacyTarget: false, visible: true },
      { currentEnabled: false, targetEnabled: false, legacyTarget: true, visible: true },
    ])(
      "uses the copy destination rather than the current account: %j",
      ({ currentEnabled, targetEnabled, legacyTarget, visible }) => {
        updateUserContext({
          databaseAccount: { ...account, properties: { enableAnalyticalStorage: currentEnabled } },
        });
        const targetAccountOverride: AccountOverride = {
          subscriptionId: "target-subscription",
          resourceGroup: "target-resource-group",
          accountName: "target-account",
          enableAnalyticalStorage: targetEnabled,
          capabilities: legacyTarget ? legacyCapabilities : [],
        };
        render(<AddCollectionPanel {...props} isCopyJobFlow targetAccountOverride={targetAccountOverride} />);

        expect(
          screen.queryAllByRole("radio", { name: t(Keys.panes.addCollection.enableAnalyticalStore) }),
        ).toHaveLength(visible ? 1 : 0);
      },
    );
  });

  describe("full-text creation validation", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      updateUserContext({ apiType: "SQL" });
      jest.mocked(createCollection).mockResolvedValue(undefined);
      jest.spyOn(AddCollectionPanelUtility, "scrollToSection").mockImplementation(() => undefined);
      jest.spyOn(props.explorer, "refreshAllDatabases").mockResolvedValue(undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    it.each([false, true])(
      "blocks invalid stopwords and allows correction with vector capability %s",
      async (vector) => {
        const { container } = render(
          <AddCollectionPanel
            {...props}
            targetAccountOverride={{
              subscriptionId: "subscription",
              resourceGroup: "group",
              accountName: "account",
              capabilities: [
                { name: "EnableNoSQLFullTextSearchPreviewFeatures", description: "" },
                ...(vector ? [{ name: "EnableNoSQLVectorSearch", description: "" }] : []),
              ],
            }}
          />,
        );
        fireEvent.change(screen.getByPlaceholderText("Type a new database id"), { target: { value: "database" } });
        fireEvent.change(screen.getByPlaceholderText("e.g., Container1"), { target: { value: "container" } });
        fireEvent.change(screen.getByPlaceholderText(/first partition key/), { target: { value: "/pk" } });
        fireEvent.click(screen.getByRole("button", { name: "Container Full Text Search Policy" }));
        fireEvent.click(screen.getByLabelText("Customize stopwords with standard analysis"));
        fireEvent.click(screen.getByRole("button", { name: "Add full text path" }));
        fireEvent.change(screen.getByLabelText("Path"), { target: { value: "/text" } });
        const words = within(screen.getByRole("group", { name: "Default stopwords" })).getByRole("textbox", {
          name: "Additional stopwords",
        });
        fireEvent.change(words, { target: { value: "two words" } });
        const form = container.querySelector("form")!;
        await act(async () => {
          fireEvent.submit(form);
        });
        expect(createCollection).not.toHaveBeenCalled();
        expect(screen.getByText(t(Keys.panes.addCollection.fullTextSearchPolicyError))).toBeVisible();
        fireEvent.change(words, { target: { value: "cosmos" } });
        await act(async () => {
          fireEvent.submit(form);
        });
        expect(createCollection).toHaveBeenCalledTimes(1);
        expect(createCollection).toHaveBeenCalledWith(
          expect.objectContaining({
            fullTextPolicy: expect.objectContaining({
              defaultSpec: expect.objectContaining({ addStopWords: ["cosmos"] }),
              fullTextPaths: [{ path: "/text" }],
            }),
          }),
        );
      },
      10000,
    );
  });
});
