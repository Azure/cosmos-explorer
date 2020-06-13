import * as ko from "knockout";
import * as ViewModels from "../../../Contracts/ViewModels";
import { CommandBarComponentButtonFactory } from "./CommandBarComponentButtonFactory";
import { ExplorerStub } from "../../OpenActionsStubs";
import { GitHubOAuthService } from "../../../GitHub/GitHubOAuthService";

describe("CommandBarComponentButtonFactory tests", () => {
  let mockExplorer: ViewModels.Explorer;

  describe("Enable notebook button", () => {
    const enableNotebookBtnLabel = "Enable Notebooks (Preview)";

    beforeAll(() => {
      mockExplorer = new ExplorerStub();
      mockExplorer.addCollectionText = ko.observable("mockText");
      mockExplorer.isAuthWithResourceToken = ko.observable(false);
      mockExplorer.isPreferredApiTable = ko.computed(() => true);
      mockExplorer.isPreferredApiMongoDB = ko.computed<boolean>(() => false);
      mockExplorer.isPreferredApiCassandra = ko.computed<boolean>(() => false);
      mockExplorer.isSparkEnabled = ko.observable(true);
      mockExplorer.isGalleryEnabled = ko.computed<boolean>(() => false);
      mockExplorer.isGalleryPublishEnabled = ko.computed<boolean>(() => false);
      mockExplorer.hasAutoPilotV2FeatureFlag = ko.computed<boolean>(() => true);
      mockExplorer.isDatabaseNodeOrNoneSelected = () => true;
    });

    it("Notebooks is already enabled - button should be hidden", () => {
      mockExplorer.isNotebookEnabled = ko.observable(true);
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(true);
      mockExplorer.isRunningOnNationalCloud = ko.observable(false);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const enableNotebookBtn = buttons.find(button => button.commandButtonLabel === enableNotebookBtnLabel);
      expect(enableNotebookBtn).toBeUndefined();
    });

    it("Account is running on one of the national clouds - button should be hidden", () => {
      mockExplorer.isNotebookEnabled = ko.observable(false);
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(false);
      mockExplorer.isRunningOnNationalCloud = ko.observable(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const enableNotebookBtn = buttons.find(button => button.commandButtonLabel === enableNotebookBtnLabel);
      expect(enableNotebookBtn).toBeUndefined();
    });

    it("Notebooks is not enabled but is available - button should be shown and enabled", () => {
      mockExplorer.isNotebookEnabled = ko.observable(false);
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(true);
      mockExplorer.isRunningOnNationalCloud = ko.observable(false);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const enableNotebookBtn = buttons.find(button => button.commandButtonLabel === enableNotebookBtnLabel);
      expect(enableNotebookBtn).toBeDefined();
      expect(enableNotebookBtn.disabled).toBe(false);
      expect(enableNotebookBtn.tooltipText).toBe("");
    });

    it("Notebooks is not enabled and is unavailable - button should be shown and disabled", () => {
      mockExplorer.isNotebookEnabled = ko.observable(false);
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(false);
      mockExplorer.isRunningOnNationalCloud = ko.observable(false);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const enableNotebookBtn = buttons.find(button => button.commandButtonLabel === enableNotebookBtnLabel);
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
      mockExplorer = new ExplorerStub();
      mockExplorer.addCollectionText = ko.observable("mockText");
      mockExplorer.isAuthWithResourceToken = ko.observable(false);
      mockExplorer.isPreferredApiTable = ko.computed(() => true);
      mockExplorer.isPreferredApiCassandra = ko.computed<boolean>(() => false);
      mockExplorer.isSparkEnabled = ko.observable(true);
      mockExplorer.isGalleryEnabled = ko.computed<boolean>(() => false);
      mockExplorer.isGalleryPublishEnabled = ko.computed<boolean>(() => false);
      mockExplorer.hasAutoPilotV2FeatureFlag = ko.computed<boolean>(() => true);
      mockExplorer.isDatabaseNodeOrNoneSelected = () => true;
    });

    beforeEach(() => {
      mockExplorer.isPreferredApiMongoDB = ko.computed<boolean>(() => true);
      mockExplorer.isNotebookEnabled = ko.observable(false);
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(false);
      mockExplorer.isRunningOnNationalCloud = ko.observable(false);
    });

    it("Mongo Api not available - button should be hidden", () => {
      mockExplorer.isPreferredApiMongoDB = ko.computed<boolean>(() => false);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openMongoShellBtn = buttons.find(button => button.commandButtonLabel === openMongoShellBtnLabel);
      expect(openMongoShellBtn).toBeUndefined();
    });

    it("Running on a national cloud - button should be hidden", () => {
      mockExplorer.isRunningOnNationalCloud = ko.observable(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openMongoShellBtn = buttons.find(button => button.commandButtonLabel === openMongoShellBtnLabel);
      expect(openMongoShellBtn).toBeUndefined();
    });

    it("Notebooks is not enabled and is unavailable - button should be shown and disabled", () => {
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openMongoShellBtn = buttons.find(button => button.commandButtonLabel === openMongoShellBtnLabel);
      expect(openMongoShellBtn).toBeDefined();
      expect(openMongoShellBtn.disabled).toBe(true);
      expect(openMongoShellBtn.tooltipText).toBe(
        "This feature is not yet available in your account's region. View supported regions here: https://aka.ms/cosmos-enable-notebooks."
      );
    });

    it("Notebooks is not enabled and is available - button should be shown and enabled", () => {
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openMongoShellBtn = buttons.find(button => button.commandButtonLabel === openMongoShellBtnLabel);
      expect(openMongoShellBtn).toBeDefined();
      expect(openMongoShellBtn.disabled).toBe(false);
      expect(openMongoShellBtn.tooltipText).toBe("");
    });

    it("Notebooks is enabled and is unavailable - button should be shown and enabled", () => {
      mockExplorer.isNotebookEnabled = ko.observable(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openMongoShellBtn = buttons.find(button => button.commandButtonLabel === openMongoShellBtnLabel);
      expect(openMongoShellBtn).toBeDefined();
      expect(openMongoShellBtn.disabled).toBe(false);
      expect(openMongoShellBtn.tooltipText).toBe("");
    });

    it("Notebooks is enabled and is available - button should be shown and enabled", () => {
      mockExplorer.isNotebookEnabled = ko.observable(true);
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openMongoShellBtn = buttons.find(button => button.commandButtonLabel === openMongoShellBtnLabel);
      expect(openMongoShellBtn).toBeDefined();
      expect(openMongoShellBtn.disabled).toBe(false);
      expect(openMongoShellBtn.tooltipText).toBe("");
    });
  });

  describe("Open Cassandra Shell button", () => {
    const openCassandraShellBtnLabel = "Open Cassandra Shell";

    beforeAll(() => {
      mockExplorer = new ExplorerStub();
      mockExplorer.addCollectionText = ko.observable("mockText");
      mockExplorer.isAuthWithResourceToken = ko.observable(false);
      mockExplorer.isPreferredApiTable = ko.computed(() => true);
      mockExplorer.isPreferredApiMongoDB = ko.computed<boolean>(() => false);
      mockExplorer.isSparkEnabled = ko.observable(true);
      mockExplorer.isGalleryEnabled = ko.computed<boolean>(() => false);
      mockExplorer.isGalleryPublishEnabled = ko.computed<boolean>(() => false);
      mockExplorer.hasAutoPilotV2FeatureFlag = ko.computed<boolean>(() => true);
      mockExplorer.isDatabaseNodeOrNoneSelected = () => true;
    });

    beforeEach(() => {
      mockExplorer.isPreferredApiCassandra = ko.computed<boolean>(() => true);
      mockExplorer.isNotebookEnabled = ko.observable(false);
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(false);
      mockExplorer.isRunningOnNationalCloud = ko.observable(false);
    });

    it("Cassandra Api not available - button should be hidden", () => {
      mockExplorer.isPreferredApiCassandra = ko.computed<boolean>(() => false);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openCassandraShellBtn = buttons.find(button => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeUndefined();
    });

    it("Running on a national cloud - button should be hidden", () => {
      mockExplorer.isRunningOnNationalCloud = ko.observable(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openCassandraShellBtn = buttons.find(button => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeUndefined();
    });

    it("Notebooks is not enabled and is unavailable - button should be shown and disabled", () => {
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openCassandraShellBtn = buttons.find(button => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeDefined();
      expect(openCassandraShellBtn.disabled).toBe(true);
      expect(openCassandraShellBtn.tooltipText).toBe(
        "This feature is not yet available in your account's region. View supported regions here: https://aka.ms/cosmos-enable-notebooks."
      );
    });

    it("Notebooks is not enabled and is available - button should be shown and enabled", () => {
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openCassandraShellBtn = buttons.find(button => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeDefined();
      expect(openCassandraShellBtn.disabled).toBe(false);
      expect(openCassandraShellBtn.tooltipText).toBe("");
    });

    it("Notebooks is enabled and is unavailable - button should be shown and enabled", () => {
      mockExplorer.isNotebookEnabled = ko.observable(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openCassandraShellBtn = buttons.find(button => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeDefined();
      expect(openCassandraShellBtn.disabled).toBe(false);
      expect(openCassandraShellBtn.tooltipText).toBe("");
    });

    it("Notebooks is enabled and is available - button should be shown and enabled", () => {
      mockExplorer.isNotebookEnabled = ko.observable(true);
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const openCassandraShellBtn = buttons.find(button => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeDefined();
      expect(openCassandraShellBtn.disabled).toBe(false);
      expect(openCassandraShellBtn.tooltipText).toBe("");
    });
  });

  describe("GitHub buttons", () => {
    const connectToGitHubBtnLabel = "Connect to GitHub";
    const manageGitHubSettingsBtnLabel = "Manage GitHub settings";

    beforeAll(() => {
      mockExplorer = new ExplorerStub();
      mockExplorer.addCollectionText = ko.observable("mockText");
      mockExplorer.isAuthWithResourceToken = ko.observable(false);
      mockExplorer.isPreferredApiTable = ko.computed(() => true);
      mockExplorer.isPreferredApiMongoDB = ko.computed<boolean>(() => false);
      mockExplorer.isPreferredApiCassandra = ko.computed<boolean>(() => false);
      mockExplorer.hasAutoPilotV2FeatureFlag = ko.computed<boolean>(() => true);
      mockExplorer.isSparkEnabled = ko.observable(true);
      mockExplorer.isDatabaseNodeOrNoneSelected = () => true;
      mockExplorer.isNotebooksEnabledForAccount = ko.observable(false);
      mockExplorer.isRunningOnNationalCloud = ko.observable(false);
      mockExplorer.isGalleryEnabled = ko.computed<boolean>(() => false);
      mockExplorer.isGalleryPublishEnabled = ko.computed<boolean>(() => false);
      mockExplorer.gitHubOAuthService = new GitHubOAuthService(undefined);
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
      const connectToGitHubBtn = buttons.find(button => button.commandButtonLabel === connectToGitHubBtnLabel);
      expect(connectToGitHubBtn).toBeDefined();
    });

    it("Notebooks is enabled and GitHubOAuthService is logged in - manage github settings button should be visible", () => {
      mockExplorer.isNotebookEnabled = ko.observable(true);
      mockExplorer.gitHubOAuthService.isLoggedIn = jest.fn().mockReturnValue(true);

      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);
      const manageGitHubSettingsBtn = buttons.find(
        button => button.commandButtonLabel === manageGitHubSettingsBtnLabel
      );
      expect(manageGitHubSettingsBtn).toBeDefined();
    });

    it("Notebooks is not enabled - connect to github and manage github settings buttons should be hidden", () => {
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer);

      const connectToGitHubBtn = buttons.find(button => button.commandButtonLabel === connectToGitHubBtnLabel);
      expect(connectToGitHubBtn).toBeUndefined();

      const manageGitHubSettingsBtn = buttons.find(
        button => button.commandButtonLabel === manageGitHubSettingsBtnLabel
      );
      expect(manageGitHubSettingsBtn).toBeUndefined();
    });
  });

  describe("Resource token", () => {
    beforeAll(() => {
      mockExplorer = new ExplorerStub();
      mockExplorer.addCollectionText = ko.observable("mockText");
      mockExplorer.isAuthWithResourceToken = ko.observable(true);
      mockExplorer.isPreferredApiDocumentDB = ko.computed(() => true);
      mockExplorer.isDatabaseNodeOrNoneSelected = () => true;
      mockExplorer.hasAutoPilotV2FeatureFlag = ko.computed<boolean>(() => true);
      mockExplorer.isResourceTokenCollectionNodeSelected = ko.computed(() => true);
    });

    it("should only show New SQL Query and Open Query buttons", () => {
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
