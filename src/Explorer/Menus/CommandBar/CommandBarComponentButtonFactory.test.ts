import * as ko from "knockout";
import { AuthType } from "../../../AuthType";
import { DatabaseAccount } from "../../../Contracts/DataModels";
import { CollectionBase } from "../../../Contracts/ViewModels";
import { GitHubOAuthService } from "../../../GitHub/GitHubOAuthService";
import { updateUserContext } from "../../../UserContext";
import Explorer from "../../Explorer";
import NotebookManager from "../../Notebook/NotebookManager";
import { useNotebook } from "../../Notebook/useNotebook";
import { useDatabases } from "../../useDatabases";
import { useSelectedNode } from "../../useSelectedNode";
import * as CommandBarComponentButtonFactory from "./CommandBarComponentButtonFactory";

describe("CommandBarComponentButtonFactory tests", () => {
  let mockExplorer: Explorer;

  afterEach(() => useSelectedNode.getState().setSelectedNode(undefined));

  describe("Enable Azure Synapse Link Button", () => {
    const enableAzureSynapseLinkBtnLabel = "Enable Azure Synapse Link";
    const selectedNodeState = useSelectedNode.getState();

    beforeAll(() => {
      mockExplorer = {} as Explorer;
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableMongo" }],
          },
        } as DatabaseAccount,
      });
    });

    it("Button should be visible", () => {
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
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

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
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

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const enableAzureSynapseLinkBtn = buttons.find(
        (button) => button.commandButtonLabel === enableAzureSynapseLinkBtnLabel,
      );
      expect(enableAzureSynapseLinkBtn).toBeUndefined();
    });
  });

  describe("Enable notebook button", () => {
    const enableNotebookBtnLabel = "Enable Notebooks (Preview)";
    const selectedNodeState = useSelectedNode.getState();

    beforeAll(() => {
      mockExplorer = {} as Explorer;
      updateUserContext({
        portalEnv: "prod",
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableTable" }],
          },
        } as DatabaseAccount,
      });
    });

    afterEach(() => {
      updateUserContext({
        portalEnv: "prod",
      });
      useNotebook.getState().setIsNotebookEnabled(false);
      useNotebook.getState().setIsNotebooksEnabledForAccount(false);
    });

    it("Notebooks is already enabled - button should be hidden", () => {
      useNotebook.getState().setIsNotebookEnabled(true);
      useNotebook.getState().setIsNotebooksEnabledForAccount(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const enableNotebookBtn = buttons.find((button) => button.commandButtonLabel === enableNotebookBtnLabel);
      expect(enableNotebookBtn).toBeUndefined();
    });

    it("Account is running on one of the national clouds - button should be hidden", () => {
      updateUserContext({
        portalEnv: "mooncake",
      });

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const enableNotebookBtn = buttons.find((button) => button.commandButtonLabel === enableNotebookBtnLabel);
      expect(enableNotebookBtn).toBeUndefined();
    });

    it("Notebooks is not enabled but is available - button should be shown and enabled", () => {
      useNotebook.getState().setIsNotebooksEnabledForAccount(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const enableNotebookBtn = buttons.find((button) => button.commandButtonLabel === enableNotebookBtnLabel);

      //TODO: modify once notebooks are available
      expect(enableNotebookBtn).toBeUndefined();
      //expect(enableNotebookBtn).toBeDefined();
      //expect(enableNotebookBtn.disabled).toBe(false);
      //expect(enableNotebookBtn.tooltipText).toBe("");
    });

    it("Notebooks is not enabled and is unavailable - button should be shown and disabled", () => {
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const enableNotebookBtn = buttons.find((button) => button.commandButtonLabel === enableNotebookBtnLabel);

      //TODO: modify once notebooks are available
      expect(enableNotebookBtn).toBeUndefined();
      //expect(enableNotebookBtn).toBeDefined();
      //expect(enableNotebookBtn.disabled).toBe(true);
      //expect(enableNotebookBtn.tooltipText).toBe(
      //  "Notebooks are not yet available in your account's region. View supported regions here: https://aka.ms/cosmos-enable-notebooks."
      //);
    });
  });

  describe("Open Mongo shell button", () => {
    const openMongoShellBtnLabel = "Open Mongo shell";
    const selectedNodeState = useSelectedNode.getState();

    beforeAll(() => {
      mockExplorer = {} as Explorer;
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableTable" }],
          },
        } as DatabaseAccount,
      });
    });

    afterAll(() => {
      updateUserContext({
        apiType: "SQL",
      });
      useNotebook.getState().setIsShellEnabled(false);
    });

    beforeEach(() => {
      updateUserContext({
        apiType: "Mongo",
      });
      useNotebook.getState().setIsShellEnabled(true);
    });

    afterEach(() => {
      useNotebook.getState().setIsNotebookEnabled(false);
      useNotebook.getState().setIsNotebooksEnabledForAccount(false);
    });

    it("Mongo Api not available - button should be hidden", () => {
      updateUserContext({
        apiType: "SQL",
      });
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const openMongoShellBtn = buttons.find((button) => button.commandButtonLabel === openMongoShellBtnLabel);
      expect(openMongoShellBtn).toBeUndefined();
    });

    it("Running on a national cloud - button should be hidden", () => {
      updateUserContext({
        portalEnv: "mooncake",
      });

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const openMongoShellBtn = buttons.find((button) => button.commandButtonLabel === openMongoShellBtnLabel);
      expect(openMongoShellBtn).toBeUndefined();
    });

    it("Notebooks is not enabled and is unavailable - button should be hidden", () => {
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const openMongoShellBtn = buttons.find((button) => button.commandButtonLabel === openMongoShellBtnLabel);
      expect(openMongoShellBtn).toBeUndefined();
    });

    it("Notebooks is not enabled and is available - button should be hidden", () => {
      useNotebook.getState().setIsNotebooksEnabledForAccount(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const openMongoShellBtn = buttons.find((button) => button.commandButtonLabel === openMongoShellBtnLabel);
      expect(openMongoShellBtn).toBeUndefined();
    });

    it("Notebooks is enabled and is unavailable - button should be shown and enabled", () => {
      useNotebook.getState().setIsNotebookEnabled(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const openMongoShellBtn = buttons.find((button) => button.commandButtonLabel === openMongoShellBtnLabel);
      expect(openMongoShellBtn).toBeDefined();

      //TODO: modify once notebooks are available
      expect(openMongoShellBtn.disabled).toBe(true);
      //expect(openMongoShellBtn.disabled).toBe(false);
      //expect(openMongoShellBtn.tooltipText).toBe("");
    });

    it("Notebooks is enabled and is available - button should be shown and enabled", () => {
      useNotebook.getState().setIsNotebookEnabled(true);
      useNotebook.getState().setIsNotebooksEnabledForAccount(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const openMongoShellBtn = buttons.find((button) => button.commandButtonLabel === openMongoShellBtnLabel);
      expect(openMongoShellBtn).toBeDefined();

      //TODO: modify once notebooks are available
      expect(openMongoShellBtn.disabled).toBe(true);
      //expect(openMongoShellBtn.disabled).toBe(false);
      //expect(openMongoShellBtn.tooltipText).toBe("");
    });

    it("Notebooks is enabled and is available, terminal is unavailable due to ipRules - button should be hidden", () => {
      useNotebook.getState().setIsNotebookEnabled(true);
      useNotebook.getState().setIsNotebooksEnabledForAccount(true);
      useNotebook.getState().setIsShellEnabled(false);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const openMongoShellBtn = buttons.find((button) => button.commandButtonLabel === openMongoShellBtnLabel);
      expect(openMongoShellBtn).toBeUndefined();
    });
  });

  describe("Open Cassandra shell button", () => {
    const openCassandraShellBtnLabel = "Open Cassandra shell";
    const selectedNodeState = useSelectedNode.getState();

    beforeAll(() => {
      mockExplorer = {} as Explorer;
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
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const openCassandraShellBtn = buttons.find((button) => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeUndefined();
    });

    it("Running on a national cloud - button should be hidden", () => {
      updateUserContext({
        portalEnv: "mooncake",
      });

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const openCassandraShellBtn = buttons.find((button) => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeUndefined();
    });

    it("Notebooks is not enabled and is unavailable - button should be shown and disabled", () => {
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const openCassandraShellBtn = buttons.find((button) => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeUndefined();
    });

    it("Notebooks is not enabled and is available - button should be shown and enabled", () => {
      useNotebook.getState().setIsNotebooksEnabledForAccount(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const openCassandraShellBtn = buttons.find((button) => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeUndefined();
    });

    it("Notebooks is enabled and is unavailable - button should be shown and enabled", () => {
      useNotebook.getState().setIsNotebookEnabled(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const openCassandraShellBtn = buttons.find((button) => button.commandButtonLabel === openCassandraShellBtnLabel);

      expect(openCassandraShellBtn).toBeDefined();

      //TODO: modify once notebooks are available
      expect(openCassandraShellBtn.disabled).toBe(true);
      //expect(openCassandraShellBtn.disabled).toBe(false);
      //expect(openCassandraShellBtn.tooltipText).toBe("");
    });

    it("Notebooks is enabled and is available - button should be shown and enabled", () => {
      useNotebook.getState().setIsNotebookEnabled(true);
      useNotebook.getState().setIsNotebooksEnabledForAccount(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const openCassandraShellBtn = buttons.find((button) => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeDefined();

      //TODO: modify once notebooks are available
      expect(openCassandraShellBtn.disabled).toBe(true);
      //expect(openCassandraShellBtn.disabled).toBe(false);
      //expect(openCassandraShellBtn.tooltipText).toBe("");
    });
  });

  describe("Open Postgres and vCore Mongo buttons", () => {
    const openPostgresShellButtonLabel = "Open PSQL shell";
    const openVCoreMongoShellButtonLabel = "Open MongoDB (vCore) shell";

    beforeAll(() => {
      mockExplorer = {} as Explorer;
    });

    it("creates Postgres shell button", () => {
      const buttons = CommandBarComponentButtonFactory.createPostgreButtons(mockExplorer);
      const openPostgresShellButton = buttons.find(
        (button) => button.commandButtonLabel === openPostgresShellButtonLabel,
      );
      expect(openPostgresShellButton).toBeDefined();
    });

    it("creates vCore Mongo shell button", () => {
      const buttons = CommandBarComponentButtonFactory.createVCoreMongoButtons(mockExplorer);
      const openVCoreMongoShellButton = buttons.find(
        (button) => button.commandButtonLabel === openVCoreMongoShellButtonLabel,
      );
      expect(openVCoreMongoShellButton).toBeDefined();
    });
  });

  describe("GitHub buttons", () => {
    const connectToGitHubBtnLabel = "Connect to GitHub";
    const manageGitHubSettingsBtnLabel = "Manage GitHub settings";
    const selectedNodeState = useSelectedNode.getState();

    beforeAll(() => {
      mockExplorer = {} as Explorer;
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableTable" }],
          },
        } as DatabaseAccount,
      });

      mockExplorer.notebookManager = new NotebookManager();
      mockExplorer.notebookManager.gitHubOAuthService = new GitHubOAuthService(undefined);
    });

    afterEach(() => {
      jest.resetAllMocks();
      useNotebook.getState().setIsNotebookEnabled(false);
    });

    it("Notebooks is enabled and GitHubOAuthService is not logged in - connect to github button should be visible", () => {
      useNotebook.getState().setIsNotebookEnabled(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const connectToGitHubBtn = buttons.find((button) => button.commandButtonLabel === connectToGitHubBtnLabel);
      expect(connectToGitHubBtn).toBeDefined();
    });

    it("Notebooks is enabled and GitHubOAuthService is logged in - manage github settings button should be visible", () => {
      useNotebook.getState().setIsNotebookEnabled(true);
      mockExplorer.notebookManager.gitHubOAuthService.isLoggedIn = jest.fn().mockReturnValue(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const manageGitHubSettingsBtn = buttons.find(
        (button) => button.commandButtonLabel === manageGitHubSettingsBtnLabel,
      );
      expect(manageGitHubSettingsBtn).toBeDefined();
    });

    it("Notebooks is not enabled - connect to github and manage github settings buttons should be hidden", () => {
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);

      const connectToGitHubBtn = buttons.find((button) => button.commandButtonLabel === connectToGitHubBtnLabel);
      expect(connectToGitHubBtn).toBeUndefined();

      const manageGitHubSettingsBtn = buttons.find(
        (button) => button.commandButtonLabel === manageGitHubSettingsBtnLabel,
      );
      expect(manageGitHubSettingsBtn).toBeUndefined();
    });
  });

  describe("Resource token", () => {
    const mockCollection = { id: ko.observable("test") } as CollectionBase;
    useSelectedNode.getState().setSelectedNode(mockCollection);
    useDatabases.setState({ resourceTokenCollection: mockCollection });
    const selectedNodeState = useSelectedNode.getState();

    beforeAll(() => {
      mockExplorer = {} as Explorer;

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
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
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
