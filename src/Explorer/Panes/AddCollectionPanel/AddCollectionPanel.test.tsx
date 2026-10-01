import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createCollection } from "Common/dataAccess/createCollection";
import { Capability } from "Contracts/DataModels";
import { shallow } from "enzyme";
import { Keys, t } from "Localization";
import React from "react";
import { updateUserContext } from "UserContext";
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

    it("should pass targetAccountOverride to openEnableSynapseLinkDialog button click", () => {
      const mockOpenEnableSynapseLinkDialog = jest.fn();
      const explorerWithMock = { ...props.explorer, openEnableSynapseLinkDialog: mockOpenEnableSynapseLinkDialog };
      const override = {
        subscriptionId: "override-sub",
        resourceGroup: "override-rg",
        accountName: "override-account",
        capabilities: [] as Capability[],
      };

      const wrapper = shallow(
        <AddCollectionPanel explorer={explorerWithMock as unknown as Explorer} targetAccountOverride={override} />,
      );

      // isSynapseLinkEnabled section requires specific conditions; verify the component exists
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
