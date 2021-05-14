import * as ko from "knockout";
import { AuthType } from "../../../AuthType";
import { DatabaseAccount } from "../../../Contracts/DataModels";
import { GitHubOAuthService } from "../../../GitHub/GitHubOAuthService";
import { updateUserContext } from "../../../UserContext";
import Explorer from "../../Explorer";
import NotebookManager from "../../Notebook/NotebookManager";
import * as CommandBarComponentButtonFactory from "./CommandBarComponentButtonFactory";

describe("CommandBarComponentButtonFactory tests", () => {
  let mockExplorer: Explorer;

  describe("Enable Azure Synapse Link Button", () => {
    const enableAzureSynapseLinkBtnLabel = "Enable Azure Synapse Link";

    beforeAll(() => {
      mockExplorer = {} as Explorer;
      mockExplorer.addCollectionText = ko.observable("mockText");
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableTable" }],
          },
        } as DatabaseAccount,
      });
      mockExplorer.isSparkEnabled = ko.observable(true);
      mockExplorer.isSynapseLinkUpdating = ko.observable(false);

      mockExplorer.isDatabaseNodeOrNoneSelected = () => true;
      mockExplorer.isNotebookEnabled = ko.observable(false);
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(false);
      mockExplorer.isRunningOnNationalCloud = () => false;
    });

    it("Account is not serverless - button should be visible", () => {
      mockExplorer.isServerlessEnabled = ko.computed<boolean>(() => false);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const enableAzureSynapseLinkBtn = buttons.find(
        (button) => button.commandButtonLabel === enableAzureSynapseLinkBtnLabel
      );
      expect(enableAzureSynapseLinkBtn).toBeDefined();
    });

    it("Account is serverless - button should be hidden", () => {
      mockExplorer.isServerlessEnabled = ko.computed<boolean>(() => true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const enableAzureSynapseLinkBtn = buttons.find(
        (button) => button.commandButtonLabel === enableAzureSynapseLinkBtnLabel
      );
      expect(enableAzureSynapseLinkBtn).toBeUndefined();
    });
  });

  describe("Enable notebook button", () => {
    const enableNotebookBtnLabel = "Enable Notebooks (Preview)";

    beforeAll(() => {
      mockExplorer = {} as Explorer;
      mockExplorer.addCollectionText = ko.observable("mockText");
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableTable" }],
          },
        } as DatabaseAccount,
      });
      mockExplorer.isSynapseLinkUpdating = ko.observable(false);
      mockExplorer.isSparkEnabled = ko.observable(true);
      mockExplorer.isSynapseLinkUpdating = ko.observable(false);

      mockExplorer.isDatabaseNodeOrNoneSelected = () => true;
      mockExplorer.isServerlessEnabled = ko.computed<boolean>(() => false);
    });

    it("Notebooks is already enabled - button should be hidden", () => {
      mockExplorer.isNotebookEnabled = ko.observable(true);
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(true);
      mockExplorer.isRunningOnNationalCloud = ko.observable(false);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const enableNotebookBtn = buttons.find((button) => button.commandButtonLabel === enableNotebookBtnLabel);
      expect(enableNotebookBtn).toBeUndefined();
    });

    it("Account is running on one of the national clouds - button should be hidden", () => {
      mockExplorer.isNotebookEnabled = ko.observable(false);
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(false);
      mockExplorer.isRunningOnNationalCloud = ko.observable(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const enableNotebookBtn = buttons.find((button) => button.commandButtonLabel === enableNotebookBtnLabel);
      expect(enableNotebookBtn).toBeUndefined();
    });

    it("Notebooks is not enabled but is available - button should be shown and enabled", () => {
      mockExplorer.isNotebookEnabled = ko.observable(false);
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(true);
      mockExplorer.isRunningOnNationalCloud = ko.observable(false);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const enableNotebookBtn = buttons.find((button) => button.commandButtonLabel === enableNotebookBtnLabel);
      expect(enableNotebookBtn).toBeDefined();
      expect(enableNotebookBtn.disabled).toBe(false);
      expect(enableNotebookBtn.tooltipText).toBe("");
    });

    it("Notebooks is not enabled and is unavailable - button should be shown and disabled", () => {
      mockExplorer.isNotebookEnabled = ko.observable(false);
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(false);
      mockExplorer.isRunningOnNationalCloud = ko.observable(false);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const enableNotebookBtn = buttons.find((button) => button.commandButtonLabel === enableNotebookBtnLabel);
      expect(enableNotebookBtn).toBeDefined();
      expect(enableNotebookBtn.disabled).toBe(true);
      expect(enableNotebookBtn.tooltipText).toBe(
        "Notebooks are not yet available in your account's region. View supported regions here: https://aka.ms/cosmos-enable-notebooks."
      );
    });
  });

  describe("Open Mongo Shell button", () => {
    const openMongoShellBtnLabel = "Open Mongo Shell";

    beforeAll(() => {
      mockExplorer = {} as Explorer;
      mockExplorer.addCollectionText = ko.observable("mockText");
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableTable" }],
          },
        } as DatabaseAccount,
      });
      mockExplorer.isSparkEnabled = ko.observable(true);
      mockExplorer.isSynapseLinkUpdating = ko.observable(false);

      mockExplorer.isDatabaseNodeOrNoneSelected = () => true;
      mockExplorer.isServerlessEnabled = ko.computed<boolean>(() => false);
    });

    afterAll(() => {
      updateUserContext({
        apiType: "SQL",
      });
    });

    beforeEach(() => {
      updateUserContext({
        apiType: "Mongo",
      });
      mockExplorer.isNotebookEnabled = ko.observable(false);
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(false);
      mockExplorer.isRunningOnNationalCloud = ko.observable(false);
    });

    it("Mongo Api not available - button should be hidden", () => {
      updateUserContext({
        apiType: "SQL",
      });
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openMongoShellBtn = buttons.find((button) => button.commandButtonLabel === openMongoShellBtnLabel);
      expect(openMongoShellBtn).toBeUndefined();
    });

    it("Running on a national cloud - button should be hidden", () => {
      mockExplorer.isRunningOnNationalCloud = ko.observable(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openMongoShellBtn = buttons.find((button) => button.commandButtonLabel === openMongoShellBtnLabel);
      expect(openMongoShellBtn).toBeUndefined();
    });

    it("Notebooks is not enabled and is unavailable - button should be shown and disabled", () => {
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openMongoShellBtn = buttons.find((button) => button.commandButtonLabel === openMongoShellBtnLabel);
      expect(openMongoShellBtn).toBeDefined();
      expect(openMongoShellBtn.disabled).toBe(true);
      expect(openMongoShellBtn.tooltipText).toBe(
        "This feature is not yet available in your account's region. View supported regions here: https://aka.ms/cosmos-enable-notebooks."
      );
    });

    it("Notebooks is not enabled and is available - button should be shown and enabled", () => {
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openMongoShellBtn = buttons.find((button) => button.commandButtonLabel === openMongoShellBtnLabel);
      expect(openMongoShellBtn).toBeDefined();
      expect(openMongoShellBtn.disabled).toBe(false);
      expect(openMongoShellBtn.tooltipText).toBe("");
    });

    it("Notebooks is enabled and is unavailable - button should be shown and enabled", () => {
      mockExplorer.isNotebookEnabled = ko.observable(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openMongoShellBtn = buttons.find((button) => button.commandButtonLabel === openMongoShellBtnLabel);
      expect(openMongoShellBtn).toBeDefined();
      expect(openMongoShellBtn.disabled).toBe(false);
      expect(openMongoShellBtn.tooltipText).toBe("");
    });

    it("Notebooks is enabled and is available - button should be shown and enabled", () => {
      mockExplorer.isNotebookEnabled = ko.observable(true);
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openMongoShellBtn = buttons.find((button) => button.commandButtonLabel === openMongoShellBtnLabel);
      expect(openMongoShellBtn).toBeDefined();
      expect(openMongoShellBtn.disabled).toBe(false);
      expect(openMongoShellBtn.tooltipText).toBe("");
    });
  });

  describe("Open Cassandra Shell button", () => {
    const openCassandraShellBtnLabel = "Open Cassandra Shell";

    beforeAll(() => {
      mockExplorer = {} as Explorer;
      mockExplorer.addCollectionText = ko.observable("mockText");
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableTable" }],
          },
        } as DatabaseAccount,
      });
      mockExplorer.isSynapseLinkUpdating = ko.observable(false);
      mockExplorer.isSparkEnabled = ko.observable(true);

      mockExplorer.isDatabaseNodeOrNoneSelected = () => true;
      mockExplorer.isServerlessEnabled = ko.computed<boolean>(() => false);
    });

    beforeEach(() => {
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableCassandra" }],
          },
        } as DatabaseAccount,
      });
      mockExplorer.isNotebookEnabled = ko.observable(false);
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(false);
      mockExplorer.isRunningOnNationalCloud = ko.observable(false);
    });

    it("Cassandra Api not available - button should be hidden", () => {
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableMongo" }],
          },
        } as DatabaseAccount,
      });
      console.log(mockExplorer);
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openCassandraShellBtn = buttons.find((button) => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeUndefined();
    });

    it("Running on a national cloud - button should be hidden", () => {
      mockExplorer.isRunningOnNationalCloud = ko.observable(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openCassandraShellBtn = buttons.find((button) => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeUndefined();
    });

    it("Notebooks is not enabled and is unavailable - button should be shown and disabled", () => {
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openCassandraShellBtn = buttons.find((button) => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeDefined();
      expect(openCassandraShellBtn.disabled).toBe(true);
      expect(openCassandraShellBtn.tooltipText).toBe(
        "This feature is not yet available in your account's region. View supported regions here: https://aka.ms/cosmos-enable-notebooks."
      );
    });

    it("Notebooks is not enabled and is available - button should be shown and enabled", () => {
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openCassandraShellBtn = buttons.find((button) => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeDefined();
      expect(openCassandraShellBtn.disabled).toBe(false);
      expect(openCassandraShellBtn.tooltipText).toBe("");
    });

    it("Notebooks is enabled and is unavailable - button should be shown and enabled", () => {
      mockExplorer.isNotebookEnabled = ko.observable(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openCassandraShellBtn = buttons.find((button) => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeDefined();
      expect(openCassandraShellBtn.disabled).toBe(false);
      expect(openCassandraShellBtn.tooltipText).toBe("");
    });

    it("Notebooks is enabled and is available - button should be shown and enabled", () => {
      mockExplorer.isNotebookEnabled = ko.observable(true);
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openCassandraShellBtn = buttons.find((button) => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeDefined();
      expect(openCassandraShellBtn.disabled).toBe(false);
      expect(openCassandraShellBtn.tooltipText).toBe("");
    });
  });

  describe("GitHub buttons", () => {
    const connectToGitHubBtnLabel = "Connect to GitHub";
    const manageGitHubSettingsBtnLabel = "Manage GitHub settings";

    beforeAll(() => {
      mockExplorer = {} as Explorer;
      mockExplorer.addCollectionText = ko.observable("mockText");
      updateUserContext({
        databaseAccount: {
          properties: {
            capabilities: [{ name: "EnableTable" }],
          },
        } as DatabaseAccount,
      });

      mockExplorer.isSynapseLinkUpdating = ko.observable(false);
      mockExplorer.isSparkEnabled = ko.observable(true);
      mockExplorer.isDatabaseNodeOrNoneSelected = () => true;
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(false);
      mockExplorer.isRunningOnNationalCloud = ko.observable(false);
      mockExplorer.notebookManager = new NotebookManager();
      mockExplorer.notebookManager.gitHubOAuthService = new GitHubOAuthService(undefined);
      mockExplorer.isServerlessEnabled = ko.computed<boolean>(() => false);
    });

    beforeEach(() => {
      mockExplorer.isNotebookEnabled = ko.observable(false);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it("Notebooks is enabled and GitHubOAuthService is not logged in - connect to github button should be visible", () => {
      mockExplorer.isNotebookEnabled = ko.observable(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const connectToGitHubBtn = buttons.find((button) => button.commandButtonLabel === connectToGitHubBtnLabel);
      expect(connectToGitHubBtn).toBeDefined();
    });

    it("Notebooks is enabled and GitHubOAuthService is logged in - manage github settings button should be visible", () => {
      mockExplorer.isNotebookEnabled = ko.observable(true);
      mockExplorer.notebookManager.gitHubOAuthService.isLoggedIn = jest.fn().mockReturnValue(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const manageGitHubSettingsBtn = buttons.find(
        (button) => button.commandButtonLabel === manageGitHubSettingsBtnLabel
      );
      expect(manageGitHubSettingsBtn).toBeDefined();
    });

    it("Notebooks is not enabled - connect to github and manage github settings buttons should be hidden", () => {
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);

      const connectToGitHubBtn = buttons.find((button) => button.commandButtonLabel === connectToGitHubBtnLabel);
      expect(connectToGitHubBtn).toBeUndefined();

      const manageGitHubSettingsBtn = buttons.find(
        (button) => button.commandButtonLabel === manageGitHubSettingsBtnLabel
      );
      expect(manageGitHubSettingsBtn).toBeUndefined();
    });
  });

  describe("Resource token", () => {
    beforeAll(() => {
      mockExplorer = {} as Explorer;
      mockExplorer.addCollectionText = ko.observable("mockText");
      mockExplorer.isDatabaseNodeOrNoneSelected = () => true;
      mockExplorer.isResourceTokenCollectionNodeSelected = ko.computed(() => true);
      mockExplorer.isServerlessEnabled = ko.computed<boolean>(() => false);
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
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
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
