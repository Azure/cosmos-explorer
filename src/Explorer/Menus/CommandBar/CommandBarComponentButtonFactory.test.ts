import * as ko from "knockout";
import { CosmosDbArtifactType, FABRIC_RPC_VERSION } from "Contracts/FabricMessagesContract";
import { extractFeatures } from "Platform/Hosted/extractFeatures";
import { AuthType } from "../../../AuthType";
import { configContext, Platform, updateConfigContext } from "../../../ConfigContext";
import { DatabaseAccount } from "../../../Contracts/DataModels";
import { CollectionBase, TerminalKind } from "../../../Contracts/ViewModels";
import { ApiType, updateUserContext, userContext } from "../../../UserContext";
import Explorer from "../../Explorer";
import { useDatabases } from "../../useDatabases";
import { useSelectedNode } from "../../useSelectedNode";
import * as CommandBarComponentButtonFactory from "./CommandBarComponentButtonFactory";

describe("CommandBarComponentButtonFactory tests", () => {
  let mockExplorer: Explorer;

  afterEach(() => useSelectedNode.getState().setSelectedNode(undefined));

  describe("Open Cassandra Shell button", () => {
    const openCassandraShellBtnLabel = "Open Cassandra Shell";
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

    it("Cloud Shell is unavailable - button should be hidden", () => {
      const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, selectedNodeState);
      const openCassandraShellBtn = buttons.find((button) => button.commandButtonLabel === openCassandraShellBtnLabel);
      expect(openCassandraShellBtn).toBeUndefined();
    });
  });

  describe("Open Postgres and vCore Mongo buttons", () => {
    const openPostgresShellButtonLabel = "Open PSQL Shell";
    const openVCoreMongoShellButtonLabel = "Open MongoDB (DocumentDB) Shell";

    beforeAll(() => {
      mockExplorer = {} as Explorer;
    });

    it("creates Postgres Shell button", () => {
      const buttons = CommandBarComponentButtonFactory.createPostgreButtons(mockExplorer);
      const openPostgresShellButton = buttons.find(
        (button) => button.commandButtonLabel === openPostgresShellButtonLabel,
      );
      expect(openPostgresShellButton).toBeDefined();
    });

    it("creates vCore Mongo Shell button", () => {
      const buttons = CommandBarComponentButtonFactory.createVCoreMongoButtons(mockExplorer);
      const openVCoreMongoShellButton = buttons.find(
        (button) => button.commandButtonLabel === openVCoreMongoShellButtonLabel,
      );
      expect(openVCoreMongoShellButton).toBeDefined();
    });
  });

  describe("Open Cosmos DB Shell button", () => {
    let originalUserContext: typeof userContext;
    let originalPlatform: Platform;

    beforeEach(() => {
      originalUserContext = { ...userContext };
      originalPlatform = configContext.platform;
      updateConfigContext({ platform: Platform.Hosted });
      mockExplorer = { openNotebookTerminal: jest.fn() } as unknown as Explorer;
      updateUserContext({
        authType: AuthType.AAD,
        databaseAccount: { kind: "DocumentDB", properties: { capabilities: [] } } as DatabaseAccount,
        features: extractFeatures(new URLSearchParams()),
      });
    });

    afterEach(() => {
      updateUserContext(originalUserContext);
      updateConfigContext({ platform: originalPlatform });
    });

    const getShellButton = () =>
      CommandBarComponentButtonFactory.createStaticCommandBarButtons(mockExplorer, useSelectedNode.getState()).find(
        (button) => button.commandButtonLabel === "Open Cosmos DB Shell",
      );

    it("shows and opens the shell with default features", () => {
      const button = getShellButton();
      expect(button).toBeDefined();
      expect(button.disabled).toBe(false);
      button.onCommandClick(new KeyboardEvent("keydown", { key: "Enter" }));
      expect(mockExplorer.openNotebookTerminal).toHaveBeenCalledWith(TerminalKind.CosmosDB);
    });

    it("hides the shell when explicitly disabled by the feature flag", () => {
      updateUserContext({
        features: extractFeatures(new URLSearchParams({ "feature.enableCosmosDBShell": "false" })),
      });
      expect(getShellButton()).toBeUndefined();
    });

    it("hides the shell when Cloud Shell is unavailable", () => {
      updateUserContext({ features: { ...userContext.features, enableCloudShell: false } });
      expect(getShellButton()).toBeUndefined();
    });

    it.each([false, true])("hides the shell for Fabric Native artifacts (read-only: %s)", (isReadOnly) => {
      updateConfigContext({ platform: Platform.Fabric });
      updateUserContext({
        fabricContext: {
          fabricClientRpcVersion: FABRIC_RPC_VERSION,
          isReadOnly,
          isVisible: true,
          databaseName: "test",
          artifactType: CosmosDbArtifactType.NATIVE,
          artifactInfo: undefined,
        },
      });

      expect(getShellButton()).toBeUndefined();
    });

    it.each([Platform.Portal, Platform.Hosted])("shows the shell on %s", (platform) => {
      updateConfigContext({ platform });
      expect(getShellButton()).toBeDefined();
    });

    it("preserves the shell for Fabric mirrored AAD artifacts", () => {
      updateConfigContext({ platform: Platform.Fabric });
      updateUserContext({
        fabricContext: {
          fabricClientRpcVersion: FABRIC_RPC_VERSION,
          isReadOnly: true,
          isVisible: true,
          databaseName: "test",
          artifactType: CosmosDbArtifactType.MIRRORED_AAD,
          artifactInfo: undefined,
        },
      });

      expect(getShellButton()).toBeDefined();
    });

    it.each<ApiType>(["Mongo", "Cassandra", "Gremlin", "Tables", "Postgres", "VCoreMongo"])(
      "hides the shell for the %s API",
      (apiType) => {
        updateUserContext({ apiType });
        expect(getShellButton()).toBeUndefined();
      },
    );

    it("hides the shell for resource token authentication", () => {
      updateUserContext({ authType: AuthType.ResourceToken });
      expect(getShellButton()).toBeUndefined();
    });
  });

  describe("Enable Azure Synapse Link command", () => {
    let originalUserContext: typeof userContext;
    let originalPlatform: Platform;

    beforeEach(() => {
      originalUserContext = { ...userContext };
      originalPlatform = configContext.platform;
      mockExplorer = {} as Explorer;
      updateUserContext({
        authType: AuthType.AAD,
        databaseAccount: {
          id: "account",
          name: "account",
          location: "East US",
          type: "Microsoft.DocumentDB/databaseAccounts",
          kind: "GlobalDocumentDB",
          properties: {
            enableAnalyticalStorage: false,
            capabilities: [],
          },
        },
        features: extractFeatures(new URLSearchParams()),
      });
    });

    afterEach(() => {
      updateUserContext(originalUserContext);
      updateConfigContext({ platform: originalPlatform });
    });

    it.each([Platform.Portal, Platform.Hosted])(
      "does not return the command for an otherwise eligible account on %s",
      (platform) => {
        updateConfigContext({ platform });

        const buttons = CommandBarComponentButtonFactory.createStaticCommandBarButtons(
          mockExplorer,
          useSelectedNode.getState(),
        );
        const labels = buttons.map((button) => button.commandButtonLabel);

        expect(labels).toContain("Visual Studio Code");
        expect(labels).not.toContain("Enable Azure Synapse Link");
      },
    );
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
