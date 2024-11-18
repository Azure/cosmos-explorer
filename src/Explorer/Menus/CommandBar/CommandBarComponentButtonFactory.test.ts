import * as ko from "knockout";
import { AuthType } from "../../../AuthType";
import { DatabaseAccount } from "../../../Contracts/DataModels";
import { CollectionBase } from "../../../Contracts/ViewModels";
import { updateUserContext } from "../../../UserContext";
import { useNotebook } from "../../Notebook/useNotebook";
import { useDatabases } from "../../useDatabases";
import { useSelectedNode } from "../../useSelectedNode";
import * as CommandBarComponentButtonFactory from "./CommandBarComponentButtonFactory";

describe("CommandBarComponentButtonFactory tests", () => {
  afterEach(() => useSelectedNode.getState().setSelectedNode(undefined));

  describe("Enable Azure Synapse Link Button", () => {
    const enableAzureSynapseLinkBtnLabel = "Enable Azure Synapse Link";
    const selectedNodeState = useSelectedNode.getState();

    beforeAll(() => {
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableMongo" }],
          },
        } as DatabaseAccount,
      });
    });

    it("Button should be visible", () => {
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(selectedNodeState);
      const enableAzureSynapseLinkBtn = buttons.find(
        (button) => button.commandButtonLabel === enableAzureSynapseLinkBtnLabel,
      );
      expect(enableAzureSynapseLinkBtn).toBeDefined();
    });

    it("Button should not be visible for Tables API", () => {
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableTable" }],
          },
        } as DatabaseAccount,
      });

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(selectedNodeState);
      const enableAzureSynapseLinkBtn = buttons.find(
        (button) => button.commandButtonLabel === enableAzureSynapseLinkBtnLabel,
      );
      expect(enableAzureSynapseLinkBtn).toBeUndefined();
    });

    it("Button should not be visible for Cassandra API", () => {
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableCassandra" }],
          },
        } as DatabaseAccount,
      });

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(selectedNodeState);
      const enableAzureSynapseLinkBtn = buttons.find(
        (button) => button.commandButtonLabel === enableAzureSynapseLinkBtnLabel,
      );
      expect(enableAzureSynapseLinkBtn).toBeUndefined();
    });
  });

  describe("Open Cassandra shell button", () => {
    const openCassandraShellBtnLabel = "Open Cassandra shell";
    const selectedNodeState = useSelectedNode.getState();

    beforeAll(() => {
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableTable" }],
          },
        } as DatabaseAccount,
      });
    });

    beforeEach(() => {
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableCassandra" }],
          },
        } as DatabaseAccount,
      });
    });

    afterEach(() => {
      useNotebook.getState().setIsNotebookEnabled(false);
      useNotebook.getState().setIsNotebooksEnabledForAccount(false);
    });

    it("Cassandra Api not available - button should be hidden", () => {
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableMongo" }],
          },
        } as DatabaseAccount,
      });
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(selectedNodeState);
      const openCassandraShellBtn = buttons.find((button) => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeUndefined();
    });

    it("Running on a national cloud - button should be hidden", () => {
      updateUserContext({
        portalEnv: "mooncake",
      });

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(selectedNodeState);
      const openCassandraShellBtn = buttons.find((button) => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeUndefined();
    });

    it("Notebooks is not enabled and is unavailable - button should be shown and disabled", () => {
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(selectedNodeState);
      const openCassandraShellBtn = buttons.find((button) => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeUndefined();
    });
  });

  describe("Open Postgres and vCore Mongo buttons", () => {
    const openPostgresShellButtonLabel = "Open PSQL shell";
    const openVCoreMongoShellButtonLabel = "Open MongoDB (vCore) shell";

    it("creates Postgres shell button", () => {
      const buttons = CommandBarComponentButtonFactory.createPostgreButtons();
      const openPostgresShellButton = buttons.find(
        (button) => button.commandButtonLabel === openPostgresShellButtonLabel,
      );
      expect(openPostgresShellButton).toBeDefined();
    });

    it("creates vCore Mongo shell button", () => {
      const buttons = CommandBarComponentButtonFactory.createVCoreMongoButtons();
      const openVCoreMongoShellButton = buttons.find(
        (button) => button.commandButtonLabel === openVCoreMongoShellButtonLabel,
      );
      expect(openVCoreMongoShellButton).toBeDefined();
    });
  });

  describe("Resource token", () => {
    const mockCollection = { id: ko.observable("test") } as CollectionBase;
    useSelectedNode.getState().setSelectedNode(mockCollection);
    useDatabases.setState({ resourceTokenCollection: mockCollection });
    const selectedNodeState = useSelectedNode.getState();

    beforeAll(() => {
      updateUserContext({
        authType: AuthType.ResourceToken,
      });
    });

    it("should only show New SQL Query and Open Query buttons", () => {
      updateUserContext({
        databaseAccount: {
          kind: "DocumentDB",
        } as DatabaseAccount,
      });
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(selectedNodeState);
      expect(buttons.length).toBe(2);
      expect(buttons[0].commandButtonLabel).toBe("New SQL Query");
      expect(buttons[0].disabled).toBe(false);
      expect(buttons[1].commandButtonLabel).toBe("Open Query");
      expect(buttons[1].disabled).toBe(false);
      expect(buttons[1].children).toBeDefined();
      expect(buttons[1].children.length).toBe(2);
    });
  });
});
